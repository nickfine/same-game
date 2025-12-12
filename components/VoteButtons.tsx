import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { playSoundGlobal } from '../hooks/useSound';
import { COLORS, GRADIENTS } from '../lib/constants';
import type { VoteChoice } from '../types';

interface VoteButtonsProps {
  optionA: string;
  optionB: string;
  onVote: (choice: VoteChoice) => void;
  disabled?: boolean;
  hidden?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function VoteButtons({ optionA, optionB, onVote, disabled, hidden }: VoteButtonsProps) {
  const scaleA = useSharedValue(1);
  const scaleB = useSharedValue(1);

  const handlePressIn = (option: 'a' | 'b') => {
    if (option === 'a') {
      scaleA.value = withSpring(0.95, { damping: 15 });
    } else {
      scaleB.value = withSpring(0.95, { damping: 15 });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = (option: 'a' | 'b') => {
    if (option === 'a') {
      scaleA.value = withSpring(1.0, { damping: 15 });
    } else {
      scaleB.value = withSpring(1.0, { damping: 15 });
    }
  };

  const handlePress = (choice: VoteChoice) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSoundGlobal('tap');
    onVote(choice);
  };

  const animatedStyleA = useAnimatedStyle(() => ({
    transform: [{ scale: scaleA.value }],
  }));

  const animatedStyleB = useAnimatedStyle(() => ({
    transform: [{ scale: scaleB.value }],
  }));

  return (
    <Animated.View 
      style={[styles.container, hidden && styles.hidden]}
    >
      {/* Option A - Top Button (Purple Gradient) */}
      <AnimatedPressable
        style={[animatedStyleA, styles.buttonWrapper]}
        onPressIn={() => handlePressIn('a')}
        onPressOut={() => handlePressOut('a')}
        onPress={() => handlePress('a')}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Vote for ${optionA}`}
      >
        <LinearGradient
          colors={GRADIENTS.purple}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text 
            style={styles.buttonText}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {optionA}
          </Text>
        </LinearGradient>
      </AnimatedPressable>

      {/* Option B - Bottom Button (Coral Gradient) */}
      <AnimatedPressable
        style={[animatedStyleB, styles.buttonWrapper]}
        onPressIn={() => handlePressIn('b')}
        onPressOut={() => handlePressOut('b')}
        onPress={() => handlePress('b')}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Vote for ${optionB}`}
      >
        <LinearGradient
          colors={GRADIENTS.coral}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text 
            style={styles.buttonText}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {optionB}
          </Text>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  buttonWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderRadius: 32,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
