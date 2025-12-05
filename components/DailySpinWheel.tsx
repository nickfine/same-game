import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { COLORS } from '../lib/constants';
import { 
  ANIMATION_TIMING, 
  SPIN_SEGMENTS, 
  calculateSpinResult, 
  REWARDS,
  type Reward 
} from '../lib/rewards';

interface DailySpinWheelProps {
  visible: boolean;
  onClose: () => void;
  onRewardClaimed: (reward: Reward) => void;
}

const WHEEL_SIZE = 280;
const SEGMENT_COUNT = SPIN_SEGMENTS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

// Segment colors alternating
const SEGMENT_COLORS = [
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#9CA3AF', // Gray
  '#3B82F6', // Blue
  '#EF4444', // Red
];

type SpinState = 'ready' | 'spinning' | 'slowing' | 'stopped';

export function DailySpinWheel({ visible, onClose, onRewardClaimed }: DailySpinWheelProps) {
  const [spinState, setSpinState] = useState<SpinState>('ready');
  const [result, setResult] = useState<ReturnType<typeof calculateSpinResult> | null>(null);
  const [showNearMissText, setShowNearMissText] = useState(false);
  
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);
  const pointerBounce = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  
  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      setSpinState('ready');
      setResult(null);
      setShowNearMissText(false);
      rotation.value = 0;
      
      // Entrance animation
      backgroundOpacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    } else {
      scale.value = 0;
      backgroundOpacity.value = 0;
      
      if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
      }
    }
  }, [visible]);

  const triggerTickHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSpin = useCallback(() => {
    if (spinState !== 'ready') return;
    
    setSpinState('spinning');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Calculate result
    const spinResult = calculateSpinResult();
    setResult(spinResult);
    
    // Calculate final rotation
    // We need to land on the correct segment
    // Segment 0 is at top (0°), each segment is 45° (360/8)
    const targetAngle = spinResult.segmentIndex * SEGMENT_ANGLE + spinResult.extraRotation;
    // Spin multiple full rotations plus the target angle
    // Subtract from 360 because wheel spins clockwise but we measure counterclockwise
    const finalRotation = 360 * 5 + (360 - targetAngle);
    
    // Start haptic ticks (simulates wheel notches)
    let tickCount = 0;
    hapticIntervalRef.current = setInterval(() => {
      tickCount++;
      // Slow down ticks as wheel slows
      if (tickCount < 20) {
        triggerTickHaptic();
      } else if (tickCount % 2 === 0 && tickCount < 40) {
        triggerTickHaptic();
      } else if (tickCount % 4 === 0) {
        triggerTickHaptic();
      }
    }, 80);
    
    // Pointer bounce animation
    pointerBounce.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 60 }),
        withTiming(0, { duration: 60 })
      ),
      -1,
      false
    );
    
    // Spinning animation with easing
    rotation.value = withTiming(
      finalRotation,
      {
        duration: ANIMATION_TIMING.SPIN_DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth deceleration
      },
      (finished) => {
        if (finished) {
          runOnJS(onSpinComplete)(spinResult);
        }
      }
    );
    
    // Transition to slowing state
    setTimeout(() => {
      setSpinState('slowing');
    }, ANIMATION_TIMING.SPIN_DURATION * 0.6);
    
  }, [spinState]);

  const onSpinComplete = useCallback((spinResult: ReturnType<typeof calculateSpinResult>) => {
    setSpinState('stopped');
    
    // Stop haptic ticks
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
    }
    
    // Stop pointer bounce
    pointerBounce.value = withTiming(0, { duration: 100 });
    
    // Show near-miss text if applicable
    if (spinResult.isNearMiss) {
      setShowNearMissText(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      // Sad trombone haptic pattern
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 100);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 250);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Glow effect on result
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0.5, { duration: 300 })
    );
  }, []);

  const handleClaim = useCallback(() => {
    if (spinState !== 'stopped' || !result) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    scale.value = withTiming(0, { duration: 200 });
    backgroundOpacity.value = withTiming(0, { duration: 200 });
    
    setTimeout(() => {
      onRewardClaimed(result.reward);
      onClose();
    }, 200);
  }, [spinState, result, onRewardClaimed, onClose]);

  // Create wheel segments using Views
  const renderWheelSegments = () => {
    return SPIN_SEGMENTS.map((segment, i) => {
      const rewardInfo = REWARDS[segment.type];
      const rotation = i * SEGMENT_ANGLE;
      
      return (
        <View 
          key={i}
          style={[
            styles.segment,
            {
              backgroundColor: SEGMENT_COLORS[i],
              transform: [
                { rotate: `${rotation}deg` },
              ],
            }
          ]}
        >
          <View style={styles.segmentContent}>
            <Text style={styles.segmentIcon}>{rewardInfo.icon}</Text>
          </View>
        </View>
      );
    });
  };

  // Animated styles
  const wheelStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pointerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pointerBounce.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, backgroundStyle]}>
        <Animated.View style={[styles.container, containerStyle]}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>🎰 Daily Spin!</Text>
            <Text style={styles.subtitle}>
              {spinState === 'ready' && 'Tap the wheel to spin!'}
              {spinState === 'spinning' && 'Spinning...'}
              {spinState === 'slowing' && 'Almost there...'}
              {spinState === 'stopped' && (showNearMissText ? 'So close!' : 'You won!')}
            </Text>
          </View>

          {/* Wheel container */}
          <View style={styles.wheelContainer}>
            {/* Glow effect */}
            <Animated.View style={[styles.wheelGlow, glowStyle]} />
            
            {/* Pointer */}
            <Animated.View style={[styles.pointer, pointerStyle]}>
              <View style={styles.pointerTriangle} />
            </Animated.View>

            {/* Wheel */}
            <Pressable onPress={handleSpin} disabled={spinState !== 'ready'}>
              <Animated.View style={[styles.wheel, wheelStyle]}>
                {renderWheelSegments()}
                {/* Center circle */}
                <View style={styles.centerCircle}>
                  <Text style={styles.centerText}>SPIN</Text>
                </View>
              </Animated.View>
            </Pressable>
          </View>

          {/* Result display */}
          {spinState === 'stopped' && result && (
            <View style={styles.resultContainer}>
              <View style={[styles.resultBadge, { backgroundColor: result.reward.color + '20', borderColor: result.reward.color }]}>
                <Text style={styles.resultIcon}>{result.reward.icon}</Text>
              </View>
              <Text style={styles.resultName}>{result.reward.displayName}</Text>
              {result.reward.value > 0 && (
                <Text style={[styles.resultValue, { color: result.reward.color }]}>
                  {result.reward.type === 'points' ? `+${result.reward.value}` : `x${result.reward.value}`}
                </Text>
              )}
              
              {showNearMissText && (
                <Text style={styles.nearMissText}>
                  You almost hit the jackpot! 😅
                </Text>
              )}

              <Pressable style={styles.claimButton} onPress={handleClaim}>
                <Text style={styles.claimButtonText}>
                  {result.reward.type === 'nothing' ? 'Try Again Tomorrow' : 'Claim!'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Close button (only when ready or stopped) */}
          {(spinState === 'ready' || spinState === 'stopped') && (
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    width: '100%',
  },
  titleContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  wheelContainer: {
    position: 'relative',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelGlow: {
    position: 'absolute',
    width: WHEEL_SIZE + 40,
    height: WHEEL_SIZE + 40,
    borderRadius: (WHEEL_SIZE + 40) / 2,
    backgroundColor: '#F59E0B',
    opacity: 0,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    backgroundColor: '#18181b',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#fff',
  },
  segment: {
    position: 'absolute',
    width: WHEEL_SIZE / 2,
    height: WHEEL_SIZE / 2,
    left: WHEEL_SIZE / 4,
    top: 0,
    transformOrigin: 'bottom center',
  },
  segmentContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  segmentIcon: {
    fontSize: 24,
  },
  centerCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#18181b',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    left: WHEEL_SIZE / 2 - 30,
    top: WHEEL_SIZE / 2 - 30,
    zIndex: 10,
  },
  centerText: {
    fontSize: 12,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
  },
  pointer: {
    position: 'absolute',
    top: -20,
    zIndex: 10,
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  resultContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  resultBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 12,
  },
  resultIcon: {
    fontSize: 36,
  },
  resultName: {
    fontSize: 20,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
  },
  resultValue: {
    fontSize: 28,
    fontFamily: 'Righteous_400Regular',
    marginTop: 4,
  },
  nearMissText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#F59E0B',
    marginTop: 8,
  },
  claimButton: {
    marginTop: 20,
    backgroundColor: '#22C55E',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  claimButtonText: {
    fontSize: 16,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
  },
});

