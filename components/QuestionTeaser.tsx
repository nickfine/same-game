import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { COLORS } from '../lib/constants';

interface QuestionTeaserProps {
  text: string;
  visible?: boolean;
}

export function QuestionTeaser({ text, visible = true }: QuestionTeaserProps) {
  const { height } = useWindowDimensions();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);
  const glowPulse = useSharedValue(0.6);

  // Responsive font size
  const fontSize = height < 700 ? 28 : height > 900 ? 36 : 32;

  useEffect(() => {
    if (visible) {
      opacity.value = withDelay(100, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
      translateY.value = withDelay(100, withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.2)) }));
      
      // Continuous glow pulse
      glowPulse.value = withTiming(1, { duration: 1500 }, () => {
        glowPulse.value = withTiming(0.6, { duration: 1500 });
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(-20, { duration: 200 });
    }
  }, [visible, text]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    textShadowRadius: 20 + (glowPulse.value * 15),
    textShadowColor: `rgba(139, 92, 246, ${0.4 + glowPulse.value * 0.3})`,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.text,
          { fontSize },
          animatedStyle,
          glowStyle,
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {text}
      </Animated.Text>
      
      {/* Subtle gradient underline */}
      <Animated.View style={[styles.underline, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  text: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    // Base glow effect
    textShadowColor: 'rgba(139, 92, 246, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  underline: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: 12,
    opacity: 0.6,
  },
});

