import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '../lib/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ScreenFlashProps {
  visible: boolean;
  variant: 'correct' | 'wrong';
  onComplete?: () => void;
}

export function ScreenFlash({ visible, variant, onComplete }: ScreenFlashProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const color = variant === 'correct' ? COLORS.accent : COLORS.secondary;

  useEffect(() => {
    if (visible) {
      // easeOutExpo timing function approximation
      opacity.value = withSequence(
        withTiming(0.7, { 
          duration: 100, 
          easing: Easing.out(Easing.cubic) 
        }),
        withTiming(0, { 
          duration: 500, 
          easing: Easing.out(Easing.exp) 
        }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        })
      );

      // Subtle scale pulse
      scale.value = withSequence(
        withTiming(1.02, { duration: 100 }),
        withTiming(1, { duration: 500, easing: Easing.out(Easing.exp) })
      );
    }
  }, [visible, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: color,
          zIndex: 100,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}
