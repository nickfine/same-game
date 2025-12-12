import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AshParticle {
  id: number;
  startX: number;
  startY: number;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  drift: number;
}

interface AshParticlesProps {
  active: boolean;
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

// Single ash particle component
function Ash({ 
  startX, 
  startY, 
  size, 
  delay, 
  duration, 
  rotation, 
  drift 
}: Omit<AshParticle, 'id'>) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in quickly, then start falling
    opacity.value = withDelay(delay, withTiming(0.8, { duration: 100 }));
    
    progress.value = withDelay(
      delay,
      withTiming(1, { 
        duration, 
        easing: Easing.out(Easing.quad) 
      })
    );
  }, []);

  const ashStyle = useAnimatedStyle(() => {
    // Gentle swaying motion as it falls
    const swayX = Math.sin(progress.value * Math.PI * 3) * 20;
    const translateY = interpolate(progress.value, [0, 1], [startY, SCREEN_HEIGHT + 50]);
    const translateX = startX + drift * progress.value + swayX;
    const rotate = rotation + progress.value * 180;
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 0.8, 0.4]);
    const fadeOut = interpolate(progress.value, [0, 0.7, 1], [0.8, 0.6, 0]);

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotate}deg` },
        { scale },
      ],
      opacity: opacity.value * fadeOut,
    };
  });

  return (
    <Animated.View 
      style={[
        styles.ash, 
        ashStyle,
        { 
          width: size, 
          height: size,
          borderRadius: size / 4,
        }
      ]} 
    />
  );
}

// Ember/spark particle for dramatic effect
function Ember({ 
  startX, 
  startY, 
  delay 
}: { startX: number; startY: number; delay: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const targetY = startY + Math.random() * 200 + 100;
  const targetX = startX + (Math.random() - 0.5) * 150;

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 50 }));
    progress.value = withDelay(
      delay,
      withTiming(1, { 
        duration: 600 + Math.random() * 400, 
        easing: Easing.out(Easing.cubic) 
      })
    );
  }, []);

  const emberStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [startY, targetY]);
    const translateX = interpolate(progress.value, [0, 1], [startX, targetX]);
    const scale = interpolate(progress.value, [0, 0.3, 1], [1.5, 1, 0]);
    const fadeOut = interpolate(progress.value, [0, 0.6, 1], [1, 0.8, 0]);

    return {
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
      opacity: opacity.value * fadeOut,
    };
  });

  return (
    <Animated.View style={[styles.ember, emberStyle]} />
  );
}

export function AshParticles({ 
  active, 
  count = 60, 
  duration = 2500,
  onComplete 
}: AshParticlesProps) {
  // Generate ash particles
  const particles = useMemo(() => {
    if (!active) return [];
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      // Start from center-ish area (explosion origin)
      startX: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 200,
      startY: SCREEN_HEIGHT * 0.25 + (Math.random() - 0.5) * 100,
      size: 4 + Math.random() * 12, // Varying ash sizes
      delay: Math.random() * 300, // Stagger the fall
      duration: duration + Math.random() * 800,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 100, // Horizontal drift
    }));
  }, [active, count, duration]);

  // Generate embers (glowing bits)
  const embers = useMemo(() => {
    if (!active) return [];
    
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      startX: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 100,
      startY: SCREEN_HEIGHT * 0.25 + (Math.random() - 0.5) * 50,
      delay: i * 15, // Quick burst
    }));
  }, [active]);

  useEffect(() => {
    if (active && onComplete) {
      const timer = setTimeout(onComplete, duration + 800);
      return () => clearTimeout(timer);
    }
  }, [active, duration, onComplete]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Embers (glowing orange bits) */}
      {embers.map(ember => (
        <Ember
          key={`ember-${ember.id}`}
          startX={ember.startX}
          startY={ember.startY}
          delay={ember.delay}
        />
      ))}
      
      {/* Ash particles */}
      {particles.map(particle => (
        <Ash
          key={`ash-${particle.id}`}
          startX={particle.startX}
          startY={particle.startY}
          size={particle.size}
          delay={particle.delay}
          duration={particle.duration}
          rotation={particle.rotation}
          drift={particle.drift}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ash: {
    position: 'absolute',
    backgroundColor: '#2A2A2A',
    // Irregular shape via border radius
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  ember: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
});

