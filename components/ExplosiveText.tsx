import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

// Winning phrases - randomized for dopamine variety
const WINNING_PHRASES = [
  'SAME!',
  'TOO POWERFUL',
  'PSYCHIC ERA',
  'MAIN CHARACTER',
  'YOU ARE THE MAJORITY',
  'LEGENDARY',
  'UNMATCHED',
  'GALAXY BRAIN',
];

const LOSING_PHRASES = [
  'NAH',
  'WRONGGG',
  'THE MINORITY',
  'PLOT TWIST',
  'CHAOS AGENT',
  'VILLAIN ARC',
  'DIFFERENT BREED',
];

interface ExplosiveTextProps {
  isCorrect: boolean;
  onAnimationComplete?: () => void;
}

export function ExplosiveText({ isCorrect, onAnimationComplete }: ExplosiveTextProps) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-15);
  const opacity = useSharedValue(0);
  const glowPulse = useSharedValue(0);
  
  // Pick random phrase
  const phrases = isCorrect ? WINNING_PHRASES : LOSING_PHRASES;
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  useEffect(() => {
    // Explosive entrance
    opacity.value = withTiming(1, { duration: 100 });
    
    scale.value = withSequence(
      withSpring(1.3, { 
        damping: 4, 
        stiffness: 300,
        mass: 0.8,
      }),
      withSpring(1, { 
        damping: 8, 
        stiffness: 200,
      })
    );
    
    rotate.value = withSequence(
      withSpring(8, { damping: 3, stiffness: 400 }),
      withSpring(-5, { damping: 5, stiffness: 300 }),
      withSpring(0, { damping: 10, stiffness: 200 })
    );
    
    // Glow pulse
    glowPulse.value = withDelay(
      200,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.5, { duration: 300 }),
        withTiming(0.8, { duration: 200 })
      )
    );

    // Callback after animation
    const timeout = setTimeout(() => {
      onAnimationComplete?.();
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
    transform: [{ scale: 1 + glowPulse.value * 0.1 }],
  }));

  const colors = isCorrect
    ? { main: '#FFFFFF', glow: '#8B5CF6' }
    : { main: '#FFFFFF', glow: '#FF3B6E' };

  return (
    <View style={styles.container}>
      {/* Glow layer */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <Text style={[styles.glowText, { 
          color: colors.glow,
          textShadowColor: colors.glow,
        }]}>
          {phrase}
        </Text>
      </Animated.View>
      
      {/* Main text */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={[styles.mainText, {
          textShadowColor: colors.glow,
        }]}>
          {phrase}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  textContainer: {
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  mainText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 56,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    letterSpacing: 2,
  },
  glowText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 56,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
    letterSpacing: 2,
  },
});
