// ═══════════════════════════════════════════════════════════════
// HYPERBAR RING - SVG Circular Progress Ring
// Violet stroke while filling → Emerald glow when active
// Pulses at 8+ progress for "almost there" anticipation
// ═══════════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  useAnimatedStyle,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { HYPER } from '../lib/hyperstreakLogic';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface HyperBarRingProps {
  progress: number; // 0-1
  isActive: boolean; // in_hyperstreak
  shouldPulse: boolean; // 8+ bar
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function HyperBarRing({
  progress,
  isActive,
  shouldPulse,
  size = 48,
  strokeWidth = 3,
  children,
}: HyperBarRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animated values
  const strokeDashoffset = useSharedValue(circumference);
  const glowOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);
  
  // Animate progress fill
  useEffect(() => {
    const targetOffset = circumference * (1 - progress);
    strokeDashoffset.value = withTiming(targetOffset, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, circumference]);
  
  // Glow effect when active
  useEffect(() => {
    if (isActive) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(glowOpacity);
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
    
    return () => {
      cancelAnimation(glowOpacity);
    };
  }, [isActive]);
  
  // Pulse animation at 8+ progress (almost there!)
  useEffect(() => {
    if (shouldPulse && !isActive) {
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(ringScale);
      ringScale.value = withTiming(1, { duration: 200 });
    }
    
    return () => {
      cancelAnimation(ringScale);
    };
  }, [shouldPulse, isActive]);
  
  // Animated props for progress ring
  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));
  
  // Animated style for glow
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1.2 }],
  }));
  
  // Animated style for container (pulse)
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));
  
  const ringColor = isActive ? HYPER.COLOR_ACTIVE : HYPER.COLOR_CHARGING;
  const trackColor = isActive 
    ? 'rgba(0, 255, 189, 0.15)' 
    : 'rgba(110, 12, 255, 0.15)';
  
  return (
    <Animated.View style={[styles.container, { width: size, height: size }, containerStyle]}>
      {/* Glow effect layer */}
      <Animated.View style={[styles.glow, { width: size, height: size }, glowStyle]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth * 3}
            fill="none"
            opacity={0.5}
          />
        </Svg>
      </Animated.View>
      
      {/* Main ring */}
      <Svg width={size} height={size} style={styles.ring}>
        <Defs>
          <LinearGradient id="hyperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={isActive ? '#00FFBD' : '#6E0CFF'} />
            <Stop offset="100%" stopColor={isActive ? '#10B981' : '#8B5CF6'} />
          </LinearGradient>
        </Defs>
        
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#hyperGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      
      {/* Children (flame icon) */}
      <View style={styles.children}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
  },
  children: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});


