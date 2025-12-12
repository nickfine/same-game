import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DuotoneFlame, DuotoneMenu } from './icons';
import { COLORS, GRADIENTS } from '../lib/constants';

interface AppHeaderProps {
  score: number;
  level?: number;
  xp?: number;
  streak?: number;
  rank?: number | null;
  onMenuPress: () => void;
  onLevelPress?: () => void;
}

export function AppHeader({ 
  score, 
  level = 1, 
  xp = 0, 
  streak = 0,
  rank,
  onMenuPress, 
  onLevelPress 
}: AppHeaderProps) {
  const scoreScale = useSharedValue(1);
  const previousScore = useSharedValue(score);
  const flameScale = useSharedValue(1);
  const flameRotation = useSharedValue(0);

  useEffect(() => {
    if (score !== previousScore.value) {
      scoreScale.value = withSequence(
        withTiming(1.3, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      previousScore.value = score;
    }
  }, [score]);

  // Animate flame when streak is hot
  useEffect(() => {
    if (streak >= 3) {
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        true
      );
      flameRotation.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 150 }),
          withTiming(5, { duration: 150 })
        ),
        -1,
        true
      );
    } else {
      flameScale.value = 1;
      flameRotation.value = 0;
    }
  }, [streak]);

  const animatedScoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const animatedFlameStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: flameScale.value },
      { rotate: `${flameRotation.value}deg` },
    ],
  }));

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMenuPress();
  };

  return (
    <View style={styles.container}>
      {/* Glass morphism background */}
      <View style={styles.glassBackground} />
      
      <View style={styles.content}>
        {/* Left: Logo */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.logoGradient}
        >
          <Text style={styles.logoText}>SAME</Text>
        </LinearGradient>

        {/* Center: Rank + Level together */}
        <View style={styles.statsContainer}>
          {/* Rank Badge */}
          <Pressable style={styles.statBadge}>
            <Text style={styles.statLabel}>RANK</Text>
            <Text style={styles.statValue}>#{rank ?? '-'}</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.statDivider} />

          {/* Level Badge */}
          <Pressable style={styles.statBadge} onPress={onLevelPress}>
            <Text style={styles.statLabel}>LEVEL</Text>
            <Text style={styles.statValue}>{level}</Text>
          </Pressable>
        </View>

        {/* Right side: Streak + Score + Menu */}
        <View style={styles.rightContainer}>
          {/* Streak indicator */}
          {streak > 0 && (
            <Animated.View style={[styles.streakBadge, animatedFlameStyle]}>
              <DuotoneFlame 
                size={16} 
                primaryColor={streak >= 5 ? COLORS.secondary : COLORS.gradientCoralStart}
                accentColor={COLORS.gradientCoralEnd}
              />
              <Text style={styles.streakText}>{streak}</Text>
            </Animated.View>
          )}

          {/* Score Badge */}
          <Animated.View style={[animatedScoreStyle, styles.scoreBadge]}>
            <Text style={styles.scoreText}>{score}</Text>
          </Animated.View>

          {/* Menu Button */}
          <Pressable onPress={handleMenuPress} style={styles.menuButton}>
            <DuotoneMenu size={20} primaryColor={COLORS.text} accentColor={COLORS.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.glassBackground,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  logoGradient: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 20,
    color: '#fff',
    letterSpacing: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  statBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 1,
  },
  statValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    color: COLORS.text,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.glassBorder,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  streakText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: COLORS.secondary,
  },
  scoreBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  scoreText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    color: COLORS.primaryForeground,
  },
  menuButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 17,
    backgroundColor: COLORS.muted,
  },
});
