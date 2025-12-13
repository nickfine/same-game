import React, { useEffect, useCallback } from 'react';
import { Text, StyleSheet, useWindowDimensions, View, Platform } from 'react-native';
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
// Now with enhanced Hyperstreak orbit, particle trail, and emerald glow
// ═══════════════════════════════════════════════════════════════

interface OrbEmojiProps {
  emoji: string;
  variant: 'top' | 'bottom';
  isPressed: boolean;
  isHyperstreak: boolean;
  hidden: boolean;
  entranceDelay?: number;
  pressScale?: SharedValue<number>;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

// Particle component for emerald trail
function EmeraldParticle({ 
  index, 
  orbitAngle, 
  baseOpacity,
  isActive,
}: { 
  index: number;
  orbitAngle: SharedValue<number>;
  baseOpacity: SharedValue<number>;
  isActive: boolean;
}) {
  const particleStyle = useAnimatedStyle(() => {
    if (!isActive) return { opacity: 0 };
    
    // Each particle is offset behind the main orb in the orbit
    const angleOffset = (index * 0.15); // Stagger particles
    const adjustedAngle = orbitAngle.value - angleOffset;
    
    // Particles trail behind, so they're at slightly smaller radius
    const radius = ORB_ANIMATION.ORBIT_RADIUS * (1 - index * 0.15);
    const x = Math.sin(adjustedAngle) * radius * 3;
    const y = Math.cos(adjustedAngle) * radius * 3;
    
    // Fade out as they get further back in trail
    const fadeMultiplier = 1 - (index * 0.25);
    
    return {
      opacity: baseOpacity.value * fadeMultiplier,
      transform: [
        { translateX: x - 20 }, // Offset from center
        { translateY: y },
        { scale: 1 - (index * 0.15) },
      ],
    };
  });
  
  const size = 8 - index * 1.5;
  
  return (
    <Animated.View style={[
      styles.emeraldParticle,
      { width: size, height: size, borderRadius: size / 2 },
      particleStyle,
    ]} />
  );
}

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
  
  // Hyperstreak orbit rotation (360deg over 8s)
  const orbitAngle = useSharedValue(0);
  
  // Particle trail opacity
  const particleOpacity = useSharedValue(0);
  
  // Emerald ring pulse (for hyperstreak)
  const ringPulse = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  
  // ═══════════════════════════════════════════════════════════════
  // ENTRANCE ANIMATION
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!hidden) {
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
      pressScaleValue.value = withSpring(ORB_ANIMATION.PRESS_SCALE, { 
        damping: 8, 
        stiffness: 500,
      });
      
      squashX.value = withSequence(
        withTiming(ORB_ANIMATION.SQUASH_SCALE_X, { duration: ORB_ANIMATION.SQUASH_DURATION / 2 }),
        withTiming(ORB_ANIMATION.STRETCH_SCALE_X, { duration: ORB_ANIMATION.SQUASH_DURATION / 2 }),
        withSpring(1, { damping: 12 })
      );
      
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );
    } else {
      pressScaleValue.value = withSpring(1, { damping: 10 });
      squashX.value = withSpring(1, { damping: 12 });
    }
  }, [isPressed]);

  // ═══════════════════════════════════════════════════════════════
  // HYPERSTREAK ORBIT + PARTICLES + RING PULSE
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isHyperstreak && !hidden) {
      // Slow orbit: 360deg over 8 seconds (smooth continuous)
      orbitAngle.value = withRepeat(
        withTiming(Math.PI * 2, { 
          duration: ORB_ANIMATION.ORBIT_DURATION,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      
      // Particle trail fades in and pulses
      particleOpacity.value = withSequence(
        withTiming(0.8, { duration: 300 }),
        withRepeat(
          withSequence(
            withTiming(0.9, { duration: 600 }),
            withTiming(0.5, { duration: 600 })
          ),
          -1,
          true
        )
      );
      
      // Emerald ring appears and pulses
      ringOpacity.value = withTiming(1, { duration: 300 });
      ringPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      // Fade out smoothly
      orbitAngle.value = withTiming(0, { duration: 500 });
      particleOpacity.value = withTiming(0, { duration: 300 });
      ringOpacity.value = withTiming(0, { duration: 300 });
      ringPulse.value = withTiming(1, { duration: 300 });
    }
    
    return () => {
      cancelAnimation(orbitAngle);
      cancelAnimation(particleOpacity);
      cancelAnimation(ringPulse);
      cancelAnimation(ringOpacity);
    };
  }, [isHyperstreak, hidden]);

  // ═══════════════════════════════════════════════════════════════
  // ANIMATED STYLES
  // ═══════════════════════════════════════════════════════════════
  const orbStyle = useAnimatedStyle(() => {
    // Orbit offset (only in hyperstreak)
    const orbitRadius = ORB_ANIMATION.ORBIT_RADIUS;
    const orbitX = isHyperstreak 
      ? Math.sin(orbitAngle.value) * orbitRadius 
      : 0;
    const orbitY = isHyperstreak 
      ? Math.cos(orbitAngle.value) * orbitRadius 
      : 0;
    
    // Combine all scale factors
    const totalScale = entranceScale.value * breatheScale.value * pressScaleValue.value;
    
    // Shadow/glow based on state
    const baseShadowRadius = isHyperstreak ? 24 : 8;
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
  
  // Emerald ring style (hyperstreak only)
  const emeraldRingStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringPulse.value }],
  }));
  
  // Inner glow for hyperstreak
  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value * 0.6,
    transform: [{ scale: ringPulse.value * 0.9 }],
  }));

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  const glowColor = variant === 'top' 
    ? 'rgba(110, 12, 255, 0.5)'   // Violet
    : 'rgba(255, 59, 110, 0.5)';  // Coral

  return (
    <View style={styles.container}>
      {/* Hyperstreak particle trail (multiple particles) */}
      {isHyperstreak && (
        <View style={styles.particleContainer}>
          {[0, 1, 2, 3, 4].map((index) => (
            <EmeraldParticle
              key={index}
              index={index}
              orbitAngle={orbitAngle}
              baseOpacity={particleOpacity}
              isActive={isHyperstreak}
            />
          ))}
        </View>
      )}
      
      {/* Glow burst on press */}
      <Animated.View style={[styles.glowBurst, glowBurstStyle, { 
        shadowColor: glowColor,
        backgroundColor: glowColor,
      }]} />
      
      {/* Hyperstreak outer emerald ring */}
      {isHyperstreak && (
        <Animated.View style={[styles.emeraldRingOuter, emeraldRingStyle]} />
      )}
      
      {/* Hyperstreak inner glow */}
      {isHyperstreak && (
        <Animated.View style={[styles.emeraldGlowInner, innerGlowStyle]} />
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
  // Hyperstreak emerald ring - outer
  emeraldRingOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    ...Platform.select({
      web: {
        boxShadow: `0 0 24px ${COLORS.accent}, 0 0 48px ${COLORS.accent}40`,
      },
    }),
  },
  // Inner glow effect
  emeraldGlowInner: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 255, 189, 0.15)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  // Particle container
  particleContainer: {
    position: 'absolute',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Individual emerald particle
  emeraldParticle: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});
