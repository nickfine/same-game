import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DuotoneMenu } from './icons';
import { COLORS } from '../lib/constants';

interface AppHeaderProps {
  level?: number;
  rank?: number | null;
  canSpin?: boolean;
  onMenuPress: () => void;
  onLevelPress?: () => void;
  onSpinPress?: () => void;
}

export function AppHeader({ 
  level = 1, 
  rank,
  canSpin = false,
  onMenuPress, 
  onLevelPress,
  onSpinPress,
}: AppHeaderProps) {
  const spinPulse = useSharedValue(1);

  // Animate spin button when available
  useEffect(() => {
    if (canSpin) {
      spinPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      spinPulse.value = 1;
    }
  }, [canSpin]);

  const animatedSpinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: spinPulse.value }],
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

        {/* Right side: Spin + Menu */}
        <View style={styles.rightContainer}>
          {/* Daily Spin Button */}
          {canSpin && (
            <Pressable onPress={onSpinPress}>
              <Animated.View style={[styles.spinBadge, animatedSpinStyle]}>
                <Text style={styles.spinEmoji}>🎰</Text>
              </Animated.View>
            </Pressable>
          )}

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
  spinBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  spinEmoji: {
    fontSize: 16,
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
