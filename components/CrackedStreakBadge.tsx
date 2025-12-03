import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { COLORS } from '../lib/constants';

interface CrackedStreakBadgeProps {
  currentStreak: number;
  lastDeadStreak: number | null; // The streak that died (shown cracked)
  daysSinceDeath: number; // Days since streak death (0-7)
  onPress?: () => void;
}

const CRACK_DURATION_DAYS = 7;

export function CrackedStreakBadge({ 
  currentStreak, 
  lastDeadStreak, 
  daysSinceDeath,
  onPress,
}: CrackedStreakBadgeProps) {
  const showCracked = lastDeadStreak !== null && daysSinceDeath < CRACK_DURATION_DAYS;
  
  // Animation values
  const wobble = useSharedValue(0);
  const crackGlow = useSharedValue(0);
  const ghostOpacity = useSharedValue(0);

  useEffect(() => {
    if (showCracked) {
      // Subtle wobble animation
      wobble.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 1000 }),
          withTiming(2, { duration: 1000 })
        ),
        -1,
        true
      );
      
      // Crack glow pulse
      crackGlow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      );
      
      // Ghost streak fades in/out
      ghostOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 2000 }),
          withTiming(0.1, { duration: 2000 })
        ),
        -1,
        true
      );
    }
  }, [showCracked]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value}deg` }],
  }));

  const crackStyle = useAnimatedStyle(() => ({
    opacity: crackGlow.value,
  }));

  const ghostStyle = useAnimatedStyle(() => ({
    opacity: ghostOpacity.value,
  }));

  // Calculate healing progress
  const healingProgress = Math.min(1, daysSinceDeath / CRACK_DURATION_DAYS);
  const daysRemaining = CRACK_DURATION_DAYS - daysSinceDeath;

  if (!showCracked) {
    // Normal streak badge
    return (
      <Pressable onPress={onPress} style={styles.container}>
        <View style={styles.normalBadge}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
        </View>
      </Pressable>
    );
  }

  // Cracked badge with shame
  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.container, badgeStyle]}>
        <View style={styles.crackedBadge}>
          {/* Ghost of dead streak */}
          <Animated.View style={[styles.ghostContainer, ghostStyle]}>
            <Text style={styles.ghostNumber}>{lastDeadStreak}</Text>
          </Animated.View>
          
          {/* Crack overlay */}
          <Animated.View style={[styles.crackOverlay, crackStyle]}>
            <View style={styles.crackLine1} />
            <View style={styles.crackLine2} />
            <View style={styles.crackLine3} />
          </Animated.View>
          
          {/* Current streak (small) */}
          <View style={styles.currentStreakContainer}>
            <Text style={styles.brokenFireEmoji}>🔥</Text>
            <Text style={styles.currentStreakNumber}>{currentStreak}</Text>
          </View>
          
          {/* Healing progress bar */}
          <View style={styles.healingBarContainer}>
            <View style={[styles.healingBarFill, { width: `${healingProgress * 100}%` }]} />
          </View>
          
          {/* Days remaining tooltip */}
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipText}>
              💔 {daysRemaining}d until healed
            </Text>
          </View>
        </View>
        
        {/* RIP marker */}
        <View style={styles.ripMarker}>
          <Text style={styles.ripText}>RIP</Text>
          <Text style={styles.ripStreak}>{lastDeadStreak}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// Compact inline version for header
export function CrackedStreakBadgeCompact({ 
  currentStreak, 
  lastDeadStreak, 
  daysSinceDeath,
}: Omit<CrackedStreakBadgeProps, 'onPress'>) {
  const showCracked = lastDeadStreak !== null && daysSinceDeath < CRACK_DURATION_DAYS;
  const daysRemaining = CRACK_DURATION_DAYS - daysSinceDeath;
  
  const wobble = useSharedValue(0);

  useEffect(() => {
    if (showCracked) {
      wobble.value = withRepeat(
        withSequence(
          withTiming(-1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [showCracked]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value}deg` }],
  }));

  if (!showCracked) {
    return (
      <View style={compactStyles.badge}>
        <Text style={compactStyles.fire}>🔥</Text>
        <Text style={compactStyles.number}>{currentStreak}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[compactStyles.crackedBadge, badgeStyle]}>
      <Text style={compactStyles.brokenFire}>💔</Text>
      <Text style={compactStyles.crackedNumber}>{currentStreak}</Text>
      <View style={compactStyles.ghostBadge}>
        <Text style={compactStyles.ghostText}>{lastDeadStreak}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  normalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  fireEmoji: {
    fontSize: 20,
  },
  streakNumber: {
    fontSize: 20,
    fontFamily: 'Righteous_400Regular',
    color: '#F59E0B',
  },
  crackedBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(127, 29, 29, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(220, 38, 38, 0.5)',
    position: 'relative',
    minWidth: 100,
  },
  ghostContainer: {
    position: 'absolute',
    top: -30,
    opacity: 0.3,
  },
  ghostNumber: {
    fontSize: 48,
    fontFamily: 'Righteous_400Regular',
    color: '#DC2626',
  },
  crackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  crackLine1: {
    position: 'absolute',
    top: '20%',
    left: '30%',
    width: 2,
    height: '60%',
    backgroundColor: '#DC2626',
    transform: [{ rotate: '25deg' }],
  },
  crackLine2: {
    position: 'absolute',
    top: '40%',
    left: '40%',
    width: 2,
    height: '40%',
    backgroundColor: '#DC2626',
    transform: [{ rotate: '-15deg' }],
  },
  crackLine3: {
    position: 'absolute',
    top: '30%',
    right: '30%',
    width: 2,
    height: '50%',
    backgroundColor: '#DC2626',
    transform: [{ rotate: '10deg' }],
  },
  currentStreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  brokenFireEmoji: {
    fontSize: 18,
    opacity: 0.6,
  },
  currentStreakNumber: {
    fontSize: 24,
    fontFamily: 'Righteous_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  healingBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  healingBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  tooltipContainer: {
    marginTop: 6,
  },
  tooltipText: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  ripMarker: {
    position: 'absolute',
    top: -15,
    right: -15,
    backgroundColor: '#18181b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    transform: [{ rotate: '15deg' }],
  },
  ripText: {
    fontSize: 8,
    fontFamily: 'Righteous_400Regular',
    color: '#DC2626',
    textAlign: 'center',
  },
  ripStreak: {
    fontSize: 10,
    fontFamily: 'Righteous_400Regular',
    color: '#DC2626',
    textAlign: 'center',
  },
});

const compactStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fire: {
    fontSize: 14,
  },
  number: {
    fontSize: 14,
    fontFamily: 'Righteous_400Regular',
    color: '#F59E0B',
  },
  crackedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  brokenFire: {
    fontSize: 14,
  },
  crackedNumber: {
    fontSize: 14,
    fontFamily: 'Righteous_400Regular',
    color: 'rgba(220, 38, 38, 0.8)',
  },
  ghostBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  ghostText: {
    fontSize: 8,
    fontFamily: 'Righteous_400Regular',
    color: '#DC2626',
  },
});

