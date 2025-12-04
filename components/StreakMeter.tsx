import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { COMBO_THRESHOLDS } from '../lib/rewards';

interface StreakMeterProps {
  currentStreak: number;
  bestStreak: number;
  lastDeadStreak?: number | null;
  daysSinceDeath?: number;
  onPress?: () => void;
}

const CRACK_DURATION_DAYS = 7;

// Get the current and next threshold based on streak
function getStreakProgress(streak: number) {
  let currentThreshold = { streak: 0, multiplier: 1, name: '', color: '#71717a' };
  let nextThreshold = COMBO_THRESHOLDS[0];
  
  for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
    if (streak >= COMBO_THRESHOLDS[i].streak) {
      currentThreshold = COMBO_THRESHOLDS[i];
      nextThreshold = COMBO_THRESHOLDS[i + 1] || null;
      break;
    }
  }
  
  // Calculate progress to next threshold
  let progress = 0;
  if (nextThreshold) {
    const start = currentThreshold.streak;
    const end = nextThreshold.streak;
    progress = (streak - start) / (end - start);
  } else if (streak >= COMBO_THRESHOLDS[COMBO_THRESHOLDS.length - 1].streak) {
    progress = 1; // Max level reached
  } else {
    progress = streak / COMBO_THRESHOLDS[0].streak;
  }
  
  return { currentThreshold, nextThreshold, progress: Math.min(1, Math.max(0, progress)) };
}

export function StreakMeter({ 
  currentStreak, 
  bestStreak,
  lastDeadStreak,
  daysSinceDeath = Infinity,
  onPress,
}: StreakMeterProps) {
  const { currentThreshold, nextThreshold, progress } = getStreakProgress(currentStreak);
  const showCracked = lastDeadStreak !== null && lastDeadStreak !== undefined && daysSinceDeath < CRACK_DURATION_DAYS;
  const hasStreak = currentStreak > 0;
  const isMaxLevel = !nextThreshold && currentStreak >= COMBO_THRESHOLDS[COMBO_THRESHOLDS.length - 1].streak;
  
  // Animation values
  const flameScale = useSharedValue(1);
  const flameRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const crackWobble = useSharedValue(0);
  const numberScale = useSharedValue(1);
  
  // Previous streak for animation
  const prevStreak = useRef(currentStreak);

  useEffect(() => {
    // Animate progress bar
    progressWidth.value = withSpring(progress * 100, { damping: 15, stiffness: 100 });
    
    // Streak number bounce when it changes
    if (currentStreak !== prevStreak.current) {
      numberScale.value = withSequence(
        withTiming(1.4, { duration: 100 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      prevStreak.current = currentStreak;
    }
  }, [currentStreak, progress]);

  useEffect(() => {
    if (hasStreak) {
      // Flame dance animation
      flameRotate.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(8, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(-5, { duration: 150, easing: Easing.inOut(Easing.ease) }),
          withTiming(5, { duration: 150, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 100 })
        ),
        -1,
        false
      );
      
      // Flame scale pulse
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 300 }),
          withTiming(0.95, { duration: 300 }),
          withTiming(1.05, { duration: 200 }),
          withTiming(1, { duration: 200 })
        ),
        -1,
        false
      );
      
      // Glow effect for higher streaks
      if (currentStreak >= 3) {
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: 800 }),
            withTiming(0.2, { duration: 800 })
          ),
          -1,
          true
        );
      }
      
      // Pulse for max level
      if (isMaxLevel) {
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 500 }),
            withTiming(1, { duration: 500 })
          ),
          -1,
          true
        );
      }
    } else {
      flameRotate.value = 0;
      flameScale.value = 1;
      glowOpacity.value = 0;
      pulseScale.value = 1;
    }
  }, [hasStreak, currentStreak, isMaxLevel]);

  // Cracked state animation
  useEffect(() => {
    if (showCracked) {
      crackWobble.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 1500 }),
          withTiming(2, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      crackWobble.value = 0;
    }
  }, [showCracked]);

  // Animated styles
  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: flameScale.value },
      { rotate: `${flameRotate.value}deg` },
    ],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseScale.value },
      { rotate: `${crackWobble.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    backgroundColor: currentThreshold.color || '#F59E0B',
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  // Get flame emoji based on streak level
  const getFlameEmoji = () => {
    if (showCracked) return '💔';
    if (!hasStreak) return '🔥';
    if (isMaxLevel) return '🌟';
    if (currentStreak >= 7) return '🔥';
    if (currentStreak >= 5) return '🔥';
    if (currentStreak >= 3) return '🔥';
    return '🔥';
  };

  // Get flame size based on streak
  const getFlameSize = () => {
    if (currentStreak >= 10) return 32;
    if (currentStreak >= 7) return 28;
    if (currentStreak >= 5) return 26;
    if (currentStreak >= 3) return 24;
    return 22;
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Glow effect */}
        {hasStreak && currentStreak >= 3 && (
          <Animated.View style={[styles.glow, glowStyle]} />
        )}

        {/* Main content */}
        <View style={[
          styles.content,
          showCracked && styles.contentCracked,
          isMaxLevel && styles.contentMaxLevel,
        ]}>
          {/* Flame icon */}
          <Animated.View style={flameStyle}>
            <Text style={[styles.flame, { fontSize: getFlameSize() }]}>
              {getFlameEmoji()}
            </Text>
          </Animated.View>

          {/* Streak number */}
          <Animated.View style={numberStyle}>
            <Text style={[
              styles.streakNumber,
              showCracked && styles.streakNumberCracked,
              { color: currentThreshold.color || '#18181b' },
            ]}>
              {currentStreak}
            </Text>
          </Animated.View>

          {/* Progress bar to next level */}
          {nextThreshold && !showCracked && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    progressBarStyle,
                    { backgroundColor: nextThreshold.color },
                  ]} 
                />
              </View>
              <Text style={styles.progressLabel}>
                {nextThreshold.streak - currentStreak} to {nextThreshold.name}
              </Text>
            </View>
          )}

          {/* Max level indicator */}
          {isMaxLevel && (
            <View style={styles.maxLevelBadge}>
              <Text style={styles.maxLevelText}>MAX</Text>
            </View>
          )}

          {/* Cracked state indicator */}
          {showCracked && lastDeadStreak && (
            <View style={styles.crackedInfo}>
              <Text style={styles.crackedText}>
                Lost {lastDeadStreak} 💀
              </Text>
              <Text style={styles.healingText}>
                {CRACK_DURATION_DAYS - daysSinceDeath}d to heal
              </Text>
            </View>
          )}
        </View>

        {/* Multiplier badge */}
        {currentThreshold.multiplier > 1 && !showCracked && (
          <View style={[styles.multiplierBadge, { backgroundColor: currentThreshold.color }]}>
            <Text style={styles.multiplierText}>{currentThreshold.multiplier}x</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// Compact version for header
export function StreakMeterCompact({ 
  currentStreak, 
  lastDeadStreak,
  daysSinceDeath = Infinity,
  onPress,
}: Omit<StreakMeterProps, 'bestStreak'>) {
  const { currentThreshold } = getStreakProgress(currentStreak);
  const showCracked = lastDeadStreak !== null && lastDeadStreak !== undefined && daysSinceDeath < CRACK_DURATION_DAYS;
  const hasStreak = currentStreak > 0;
  
  const flameRotate = useSharedValue(0);
  const numberScale = useSharedValue(1);
  const prevStreak = useRef(currentStreak);

  useEffect(() => {
    if (currentStreak !== prevStreak.current) {
      numberScale.value = withSequence(
        withTiming(1.3, { duration: 80 }),
        withSpring(1, { damping: 10 })
      );
      prevStreak.current = currentStreak;
    }
  }, [currentStreak]);

  useEffect(() => {
    if (hasStreak && !showCracked) {
      flameRotate.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 200 }),
          withTiming(6, { duration: 200 }),
          withTiming(0, { duration: 100 })
        ),
        -1,
        false
      );
    } else {
      flameRotate.value = 0;
    }
  }, [hasStreak, showCracked]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flameRotate.value}deg` }],
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} style={compactStyles.container}>
      <View style={[
        compactStyles.badge,
        showCracked && compactStyles.badgeCracked,
        currentStreak >= 3 && { borderColor: currentThreshold.color },
      ]}>
        <Animated.Text style={[compactStyles.flame, flameStyle]}>
          {showCracked ? '💔' : '🔥'}
        </Animated.Text>
        <Animated.Text style={[
          compactStyles.number,
          numberStyle,
          { color: showCracked ? '#DC2626' : (currentThreshold.color || '#F59E0B') },
        ]}>
          {currentStreak}
        </Animated.Text>
        
        {/* Ghost of dead streak */}
        {showCracked && lastDeadStreak && (
          <View style={compactStyles.ghostBadge}>
            <Text style={compactStyles.ghostText}>{lastDeadStreak}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 100,
    height: 60,
    borderRadius: 30,
    opacity: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contentCracked: {
    backgroundColor: 'rgba(254, 226, 226, 0.95)',
    borderColor: '#DC2626',
  },
  contentMaxLevel: {
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    borderColor: '#F59E0B',
  },
  flame: {
    fontSize: 24,
  },
  streakNumber: {
    fontSize: 28,
    fontFamily: 'Righteous_400Regular',
  },
  streakNumberCracked: {
    color: '#DC2626',
    opacity: 0.7,
  },
  progressContainer: {
    marginLeft: 8,
    alignItems: 'flex-start',
  },
  progressBackground: {
    width: 60,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 9,
    fontFamily: 'Poppins_500Medium',
    color: '#71717a',
    marginTop: 2,
  },
  maxLevelBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  maxLevelText: {
    fontSize: 10,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
  },
  crackedInfo: {
    marginLeft: 8,
    alignItems: 'flex-start',
  },
  crackedText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#DC2626',
  },
  healingText: {
    fontSize: 9,
    fontFamily: 'Poppins_400Regular',
    color: '#71717a',
  },
  multiplierBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  multiplierText: {
    fontSize: 12,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
  },
});

const compactStyles = StyleSheet.create({
  container: {
    
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  badgeCracked: {
    backgroundColor: 'rgba(254, 226, 226, 0.95)',
    borderColor: '#DC2626',
  },
  flame: {
    fontSize: 16,
  },
  number: {
    fontSize: 16,
    fontFamily: 'Righteous_400Regular',
  },
  ghostBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  ghostText: {
    fontSize: 9,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
  },
});

