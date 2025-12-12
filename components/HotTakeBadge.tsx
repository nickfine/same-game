import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../lib/constants';

interface HotTakeBadgeProps {
  visible?: boolean;
  size?: 'small' | 'large';
}

export function HotTakeBadge({ visible = true, size = 'small' }: HotTakeBadgeProps) {
  const glowOpacity = useSharedValue(0.5);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Pulsing glow
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );

      // Subtle scale pulse
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );

      // Slight wiggle on mount
      rotation.value = withSequence(
        withTiming(-3, { duration: 100 }),
        withTiming(3, { duration: 100 }),
        withTiming(-2, { duration: 100 }),
        withTiming(2, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    }
  }, [visible]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  if (!visible) return null;

  const isSmall = size === 'small';

  return (
    <Animated.View style={[styles.container, badgeStyle]}>
      {/* Glow effect */}
      <Animated.View 
        style={[
          styles.glow, 
          glowStyle,
          isSmall ? styles.glowSmall : styles.glowLarge,
        ]} 
      />
      
      {/* Badge body */}
      <LinearGradient
        colors={GRADIENTS.coral}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          isSmall ? styles.badgeSmall : styles.badgeLarge,
        ]}
      >
        <Text style={styles.fireEmoji}>🔥</Text>
        <Text style={[
          styles.text,
          isSmall ? styles.textSmall : styles.textLarge,
        ]}>
          HOT TAKE
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
  },
  glowSmall: {
    width: 100,
    height: 40,
  },
  glowLarge: {
    width: 160,
    height: 60,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  badgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  badgeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  fireEmoji: {
    fontSize: 16,
  },
  text: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  textSmall: {
    fontSize: 11,
  },
  textLarge: {
    fontSize: 14,
  },
});


