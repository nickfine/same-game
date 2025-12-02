import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
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
      scaleA.value = withSpring(1, { damping: 15 });
    } else {
      scaleB.value = withSpring(1, { damping: 15 });
    }
  };

  const handlePress = (choice: VoteChoice) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onVote(choice);
  };

  const animatedStyleA = useAnimatedStyle(() => ({
    transform: [{ scale: scaleA.value }],
  }));

  const animatedStyleB = useAnimatedStyle(() => ({
    transform: [{ scale: scaleB.value }],
  }));

  if (hidden) {
    return null;
  }

  return (
    <Animated.View 
      exiting={FadeOut.duration(200)}
      style={{ 
        flexDirection: 'row', 
        height: 120, 
        marginHorizontal: 16, 
        marginBottom: 16,
        gap: 12,
      }}
    >
      {/* Option A - Left */}
      <AnimatedPressable
        style={[
          animatedStyleA, 
          { 
            backgroundColor: '#6366F1',
            flex: 1,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }
        ]}
        onPressIn={() => handlePressIn('a')}
        onPressOut={() => handlePressOut('a')}
        onPress={() => handlePress('a')}
        disabled={disabled}
      >
        <Text 
          style={{ 
            color: 'white', 
            fontSize: 20, 
            fontFamily: 'Poppins_700Bold',
            textAlign: 'center',
            paddingHorizontal: 16,
          }}
          numberOfLines={2}
        >
          {optionA}
        </Text>
      </AnimatedPressable>

      {/* Option B - Right */}
      <AnimatedPressable
        style={[
          animatedStyleB, 
          { 
            backgroundColor: '#F59E0B',
            flex: 1,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }
        ]}
        onPressIn={() => handlePressIn('b')}
        onPressOut={() => handlePressOut('b')}
        onPress={() => handlePress('b')}
        disabled={disabled}
      >
        <Text 
          style={{ 
            color: 'white', 
            fontSize: 20, 
            fontFamily: 'Poppins_700Bold',
            textAlign: 'center',
            paddingHorizontal: 16,
          }}
          numberOfLines={2}
        >
          {optionB}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

