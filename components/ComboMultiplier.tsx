import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../lib/constants';
import { ANIMATION_TIMING, getComboInfo, COMBO_THRESHOLDS } from '../lib/rewards';

interface ComboMultiplierProps {
  streak: number;
  isActive: boolean; // True when combo is active (draining)
  onComboExpired?: () => void;
}

export function ComboMultiplier({ streak, isActive, onComboExpired }: ComboMultiplierProps) {
  const comboInfo = getComboInfo(streak);
  
  // Animation values
  const drainProgress = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const flameOffset = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const barHeight = useSharedValue(0);
  
  const drainIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isExpiredRef = useRef(false);

  // Only show if streak >= first threshold
  const shouldShow = streak >= 1;
  const hasCombo = streak >= COMBO_THRESHOLDS[0].streak;

  useEffect(() => {
    if (!shouldShow) {
      barHeight.value = withTiming(0, { duration: 200 });
      return;
    }

    // Show bar with animation
    barHeight.value = withSpring(60, { damping: 15, stiffness: 120 });

    if (hasCombo) {
      // Pulse animation for active combo
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );

      // Flame animation
      flameOffset.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 150 }),
          withTiming(-5, { duration: 150 })
        ),
        -1,
        true
      );

      // Glow effect
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 500 }),
          withTiming(0.4, { duration: 500 })
        ),
        -1,
        true
      );
    }

    return () => {
      pulseScale.value = 1;
      flameOffset.value = 0;
      glowOpacity.value = 0;
    };
  }, [shouldShow, hasCombo]);

  // Drain timer effect
  useEffect(() => {
    if (isActive && hasCombo) {
      isExpiredRef.current = false;
      drainProgress.value = 1;

      // Start draining
      const startTime = Date.now();
      drainIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = 1 - (elapsed / ANIMATION_TIMING.COMBO_DRAIN_DURATION);
        
        if (remaining <= 0 && !isExpiredRef.current) {
          isExpiredRef.current = true;
          if (drainIntervalRef.current) {
            clearInterval(drainIntervalRef.current);
          }
          
          // Shake animation when expired
          shakeX.value = withSequence(
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(0, { duration: 50 })
          );
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onComboExpired?.();
        } else {
          drainProgress.value = withTiming(Math.max(0, remaining), { 
            duration: 100,
            easing: Easing.linear,
          });
          
          // Warning haptic at low progress
          if (remaining < 0.2 && remaining > 0.15) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      }, 100);

      return () => {
        if (drainIntervalRef.current) {
          clearInterval(drainIntervalRef.current);
        }
      };
    } else {
      // Reset drain when not active
      drainProgress.value = withTiming(1, { duration: ANIMATION_TIMING.COMBO_FILL_ANIMATION });
    }
  }, [isActive, hasCombo, onComboExpired]);

  // Refill animation when streak increases
  useEffect(() => {
    if (hasCombo) {
      drainProgress.value = withTiming(1, { duration: ANIMATION_TIMING.COMBO_FILL_ANIMATION });
      
      // Small bounce on refill
      pulseScale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withSpring(1.05, { damping: 10 })
      );
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [streak]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
    opacity: interpolate(barHeight.value, [0, 30, 60], [0, 0.5, 1]),
    transform: [
      { translateX: shakeX.value },
      { scale: pulseScale.value },
    ],
  }));

  const fillStyle = useAnimatedStyle(() => {
    const progress = drainProgress.value;
    const lowColor = '#EF4444'; // Red
    const midColor = '#F59E0B'; // Amber  
    const highColor = comboInfo.color || '#22C55E'; // Green or combo color
    
    return {
      width: `${progress * 100}%`,
      backgroundColor: progress < 0.3 
        ? lowColor 
        : progress < 0.6 
          ? midColor 
          : highColor,
    };
  });

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: flameOffset.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!shouldShow) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Glow effect */}
      {hasCombo && (
        <Animated.View 
          style={[
            styles.glow, 
            glowStyle,
            { backgroundColor: comboInfo.color || COLORS.optionB }
          ]} 
        />
      )}

      {/* Main bar */}
      <View style={styles.barContainer}>
        {/* Background */}
        <View style={styles.barBackground} />
        
        {/* Fill */}
        <Animated.View style={[styles.barFill, fillStyle]}>
          {/* Liquid effect gradient overlay */}
          <View style={styles.liquidOverlay}>
            <View style={styles.liquidHighlight} />
          </View>
        </Animated.View>

        {/* Notches for thresholds */}
        {COMBO_THRESHOLDS.map((threshold, index) => {
          const position = (threshold.streak / COMBO_THRESHOLDS[COMBO_THRESHOLDS.length - 1].streak) * 100;
          const isReached = streak >= threshold.streak;
          return (
            <View 
              key={threshold.streak}
              style={[
                styles.notch, 
                { left: `${position}%` },
                isReached && { backgroundColor: threshold.color }
              ]} 
            />
          );
        })}
      </View>

      {/* Labels */}
      <View style={styles.labelContainer}>
        {/* Streak count */}
        <View style={styles.streakBadge}>
          <Animated.Text style={flameStyle}>
            <Text style={styles.flameEmoji}>🔥</Text>
          </Animated.Text>
          <Text style={styles.streakCount}>{streak}</Text>
        </View>

        {/* Combo name */}
        {comboInfo.name && (
          <View style={[styles.comboBadge, { backgroundColor: comboInfo.color + '30' }]}>
            <Text style={[styles.comboName, { color: comboInfo.color }]}>
              {comboInfo.name}
            </Text>
          </View>
        )}

        {/* Multiplier */}
        {comboInfo.multiplier > 1 && (
          <View style={styles.multiplierBadge}>
            <Text style={[styles.multiplierText, { color: comboInfo.color }]}>
              {comboInfo.multiplier}x
            </Text>
          </View>
        )}
      </View>

      {/* Progress to next threshold */}
      {comboInfo.nextThreshold && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {comboInfo.nextThreshold - streak} more to {COMBO_THRESHOLDS.find(t => t.streak === comboInfo.nextThreshold)?.name}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    bottom: -10,
    borderRadius: 20,
    opacity: 0,
  },
  barContainer: {
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  liquidOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  liquidHighlight: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  notch: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginLeft: -1.5,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flameEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  streakCount: {
    fontSize: 14,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
  },
  comboBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comboName: {
    fontSize: 12,
    fontFamily: 'Righteous_400Regular',
  },
  multiplierBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  multiplierText: {
    fontSize: 16,
    fontFamily: 'Righteous_400Regular',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
});

