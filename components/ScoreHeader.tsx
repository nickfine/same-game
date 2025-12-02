import React from 'react';
import { View, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface ScoreHeaderProps {
  score: number;
}

export function ScoreHeader({ score }: ScoreHeaderProps) {
  const scale = useSharedValue(1);
  const previousScore = useSharedValue(score);

  useEffect(() => {
    if (score !== previousScore.value) {
      // Animate scale on score change
      scale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      previousScore.value = score;
    }
  }, [score]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="py-4 px-6 items-center">
      <Animated.View style={animatedStyle}>
        <Text 
          className="text-2xl tracking-widest text-text"
          style={{ fontFamily: 'Poppins_900Black' }}
        >
          {score} {score === 1 ? 'POINT' : 'POINTS'}
        </Text>
      </Animated.View>
    </View>
  );
}

