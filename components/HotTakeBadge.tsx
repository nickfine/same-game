import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../lib/constants';

// ═══════════════════════════════════════════════════════════════
// HOT TAKE BADGE - Glowing coral badge for daily hot take questions
// "This is THE question of the day. Everyone answers the same one."
// ═══════════════════════════════════════════════════════════════

interface HotTakeBadgeProps {
  visible?: boolean;
  size?: 'small' | 'large';
}

export function HotTakeBadge({ visible = true, size = 'small' }: HotTakeBadgeProps) {
  const glowOpacity = useSharedValue(0.4);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(-5);
  const pulseScale = useSharedValue(1);
  const fireScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Entrance: scale in with spring
      scale.value = withDelay(100, withSpring(1, { 
        damping: 8, 
        stiffness: 200,
      }));
      
      // Wiggle on entrance
      rotation.value = withDelay(100, withSequence(
        withTiming(-5, { duration: 80 }),
        withTiming(5, { duration: 80 }),
        withTiming(-3, { duration: 80 }),
        withTiming(3, { duration: 80 }),
        withTiming(0, { duration: 80 })
      ));
      
      // Pulsing glow (continuous)
      glowOpacity.value = withDelay(400, withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      ));

      // Subtle scale pulse (continuous)
      pulseScale.value = withDelay(500, withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      ));
      
      // Fire emoji bounce
      fireScale.value = withDelay(600, withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 400, easing: Easing.in(Easing.quad) })
        ),
        -1,
        true
      ));
    } else {
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value * 1.3 }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pulseScale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));
  
  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  if (!visible) return null;

  const isSmall = size === 'small';

  return (
    <Animated.View style={[styles.container, badgeStyle]}>
      {/* Outer glow effect */}
      <Animated.View 
        style={[
          styles.glow, 
          glowStyle,
          isSmall ? styles.glowSmall : styles.glowLarge,
        ]} 
      />
      
      {/* Badge body with gradient */}
      <LinearGradient
        colors={GRADIENTS.coral}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          isSmall ? styles.badgeSmall : styles.badgeLarge,
        ]}
      >
        {/* Fire emoji with animation */}
        <Animated.Text style={[styles.fireEmoji, fireStyle]}>🔥</Animated.Text>
        
        {/* HOT TAKE text */}
        <Text style={[
          styles.text,
          isSmall ? styles.textSmall : styles.textLarge,
        ]}>
          HOT TAKE
        </Text>
        
        {/* Second fire for balance */}
        <Animated.Text style={[styles.fireEmoji, fireStyle]}>🔥</Animated.Text>
      </LinearGradient>
      
      {/* Sparkle effects */}
      <View style={[styles.sparkle, styles.sparkle1]} />
      <View style={[styles.sparkle, styles.sparkle2]} />
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
    borderRadius: 24,
    ...Platform.select({
      web: {
        boxShadow: `0 0 30px ${COLORS.secondary}, 0 0 60px ${COLORS.secondary}60`,
      },
      default: {
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
      },
    }),
  },
  glowSmall: {
    width: 120,
    height: 44,
  },
  glowLarge: {
    width: 180,
    height: 64,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      default: {
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 10,
      },
    }),
  },
  badgeSmall: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  badgeLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 10,
  },
  fireEmoji: {
    fontSize: 16,
  },
  text: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  textSmall: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 16,
  },
  // Sparkle accents
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    opacity: 0.8,
  },
  sparkle1: {
    top: -4,
    right: 10,
  },
  sparkle2: {
    bottom: -4,
    left: 15,
  },
});
