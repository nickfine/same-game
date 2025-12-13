import React, { useEffect, useCallback } from 'react';
import { Text, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { ORB_ANIMATION, COLORS } from '../lib/constants';

// ═══════════════════════════════════════════════════════════════
// ORB EMOJI - Premium Animated Emoji Component
// Visual crack for the main game screen
// ═══════════════════════════════════════════════════════════════

interface OrbEmojiProps {
  emoji: string;
  variant: 'top' | 'bottom';
  isPressed: boolean;
  isHyperstreak: boolean;
  hidden: boolean;
  entranceDelay?: number;
  // External shared values for coordination
  pressScale?: SharedValue<number>;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export function OrbEmoji({
  emoji,
  variant,
  isPressed,
  isHyperstreak,
  hidden,
  entranceDelay = 0,
}: OrbEmojiProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth <= 375;
  const emojiSize = isSmallScreen ? ORB_ANIMATION.SIZE_SMALL : ORB_ANIMATION.SIZE_LARGE;
  
  // ═══════════════════════════════════════════════════════════════
  // ANIMATION VALUES
  // ═══════════════════════════════════════════════════════════════
  
  // Entrance pop-in (scale 0 → 1.3 → 1)
  const entranceScale = useSharedValue(0);
  
  // Idle breathe pulse (scale 1 → 1.05 → 1)
  const breatheScale = useSharedValue(1);
  
  // Press interaction
  const pressScaleValue = useSharedValue(1);
  const squashX = useSharedValue(1);
  
  // Glow burst on press
  const glowOpacity = useSharedValue(0);
  
  // Hyperstreak orbit rotation
  const orbitAngle = useSharedValue(0);
  
  // Particle trail (for hyperstreak)
  const particleOpacity = useSharedValue(0);
  
  // ═══════════════════════════════════════════════════════════════
  // ENTRANCE ANIMATION
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!hidden) {
      // Reset
      entranceScale.value = 0;
      
      // Pop-in: 0 → 1.3 → 1 with spring
      entranceScale.value = withDelay(
        entranceDelay,
        withSequence(
          withSpring(ORB_ANIMATION.ENTRANCE_OVERSHOOT, { 
            damping: 6, 
            stiffness: 400,
            mass: 0.8,
          }),
          withSpring(1, { damping: 10, stiffness: 200 })
        )
      );
    } else {
      entranceScale.value = 0;
    }
  }, [hidden, emoji, entranceDelay]);

  // ═══════════════════════════════════════════════════════════════
  // IDLE BREATHE PULSE (continuous)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!hidden) {
      // Subtle breathe: 1 → 1.05 → 1 every 3 seconds
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(ORB_ANIMATION.BREATHE_SCALE, { 
            duration: ORB_ANIMATION.BREATHE_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { 
            duration: ORB_ANIMATION.BREATHE_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    }
    
    return () => {
      cancelAnimation(breatheScale);
    };
  }, [hidden]);

  // ═══════════════════════════════════════════════════════════════
  // PRESS INTERACTION
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isPressed) {
      // Immediate scale up
      pressScaleValue.value = withSpring(ORB_ANIMATION.PRESS_SCALE, { 
        damping: 8, 
        stiffness: 500,
      });
      
      // Squash/stretch: scaleX 1 → 1.15 → 0.95 → 1
      squashX.value = withSequence(
        withTiming(ORB_ANIMATION.SQUASH_SCALE_X, { duration: ORB_ANIMATION.SQUASH_DURATION / 2 }),
        withTiming(ORB_ANIMATION.STRETCH_SCALE_X, { duration: ORB_ANIMATION.SQUASH_DURATION / 2 }),
        withSpring(1, { damping: 12 })
      );
      
      // Glow burst
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );
    } else {
      // Spring back
      pressScaleValue.value = withSpring(1, { damping: 10 });
      squashX.value = withSpring(1, { damping: 12 });
    }
  }, [isPressed]);

  // ═══════════════════════════════════════════════════════════════
  // HYPERSTREAK ORBIT + PARTICLES
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isHyperstreak && !hidden) {
      // Slow orbit: 360deg over 8 seconds
      orbitAngle.value = withRepeat(
        withTiming(Math.PI * 2, { 
          duration: ORB_ANIMATION.ORBIT_DURATION,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      
      // Particle trail pulse
      particleOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 400 }),
          withTiming(0.2, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      orbitAngle.value = withTiming(0, { duration: 300 });
      particleOpacity.value = withTiming(0, { duration: 200 });
    }
    
    return () => {
      cancelAnimation(orbitAngle);
      cancelAnimation(particleOpacity);
    };
  }, [isHyperstreak, hidden]);

  // ═══════════════════════════════════════════════════════════════
  // ANIMATED STYLES
  // ═══════════════════════════════════════════════════════════════
  const orbStyle = useAnimatedStyle(() => {
    // Orbit offset (only in hyperstreak)
    const orbitX = isHyperstreak 
      ? Math.sin(orbitAngle.value) * ORB_ANIMATION.ORBIT_RADIUS 
      : 0;
    const orbitY = isHyperstreak 
      ? Math.cos(orbitAngle.value) * ORB_ANIMATION.ORBIT_RADIUS 
      : 0;
    
    // Combine all scale factors
    const totalScale = entranceScale.value * breatheScale.value * pressScaleValue.value;
    
    // Shadow/glow based on state
    const baseShadowRadius = isHyperstreak ? 16 : 8;
    const pressShadowBoost = interpolate(glowOpacity.value, [0, 1], [0, 20]);
    
    return {
      transform: [
        { scale: totalScale },
        { scaleX: squashX.value },
        { translateX: orbitX },
        { translateY: orbitY },
      ],
      textShadowColor: isHyperstreak 
        ? COLORS.accent  // Emerald #00FFBD
        : 'rgba(0, 0, 0, 0.4)',
      textShadowOffset: { width: 0, height: isHyperstreak ? 0 : 4 },
      textShadowRadius: baseShadowRadius + pressShadowBoost,
    };
  });
  
  // Glow burst overlay style
  const glowBurstStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  // Particle trail style (hyperstreak only)
  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
    transform: [
      { scale: interpolate(particleOpacity.value, [0.2, 0.6], [0.8, 1.2]) },
    ],
  }));

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  const glowColor = variant === 'top' 
    ? 'rgba(110, 12, 255, 0.5)'   // Violet
    : 'rgba(255, 59, 110, 0.5)';  // Coral

  return (
    <View style={styles.container}>
      {/* Hyperstreak particle trail */}
      {isHyperstreak && (
        <Animated.View style={[styles.particleTrail, particleStyle]}>
          <View style={[styles.particle, { backgroundColor: COLORS.accent }]} />
          <View style={[styles.particle, styles.particleSmall, { backgroundColor: COLORS.accent }]} />
        </Animated.View>
      )}
      
      {/* Glow burst on press */}
      <Animated.View style={[styles.glowBurst, glowBurstStyle, { 
        shadowColor: glowColor,
        backgroundColor: glowColor,
      }]} />
      
      {/* Hyperstreak emerald ring */}
      {isHyperstreak && (
        <View style={styles.hyperRing} />
      )}
      
      {/* Main emoji */}
      <AnimatedText 
        style={[
          styles.emoji, 
          { fontSize: emojiSize, lineHeight: emojiSize * 1.2 },
          orbStyle,
        ]}
      >
        {emoji}
      </AnimatedText>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    // Base styling - animations handle the rest
  },
  glowBurst: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  hyperRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  particleTrail: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 8,
  },
  particle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  particleSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: -4,
    marginTop: 6,
  },
});

