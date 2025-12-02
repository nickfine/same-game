import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  useSharedValue,
  runOnJS,
  SlideInRight,
  SlideOutLeft,
  FadeIn,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import type { Question, VoteResult } from '../types';

const { width } = Dimensions.get('window');

interface QuestionCardProps {
  question: Question;
  voteResult: VoteResult | null;
  onAnimationComplete?: () => void;
}

export function QuestionCard({ question, voteResult, onAnimationComplete }: QuestionCardProps) {
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (voteResult && onAnimationComplete) {
      // After showing result, slide out
      const timer = setTimeout(() => {
        translateX.value = withTiming(-width, { duration: 300 }, () => {
          runOnJS(onAnimationComplete)();
        });
        opacity.value = withTiming(0, { duration: 300 });
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [voteResult, onAnimationComplete]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View 
      entering={SlideInRight.springify().damping(20)}
      style={cardStyle}
      className="flex-1 mx-4 my-2"
    >
      <View 
        className="flex-1 bg-white rounded-3xl shadow-lg justify-center items-center p-8"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Question Text */}
        <Text 
          className="text-3xl text-center text-text leading-tight"
          style={{ fontFamily: 'Righteous_400Regular' }}
        >
          {question.text}
        </Text>

        {/* Vote Result Overlay */}
        {voteResult && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            className="absolute inset-0 rounded-3xl justify-center items-center"
            style={{ 
              backgroundColor: voteResult.won ? 'rgba(0, 224, 84, 0.95)' : 'rgba(255, 0, 85, 0.95)',
            }}
          >
            {/* Result Text */}
            <Text 
              className="text-6xl text-white mb-8"
              style={{ fontFamily: 'Righteous_400Regular', letterSpacing: 4 }}
            >
              {voteResult.won ? 'SAME!' : 'NOPE'}
            </Text>
            
            {/* Percentage Bars */}
            <View className="w-full px-8">
              <View className="flex-row justify-between mb-2">
                <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {question.option_a}
                </Text>
                <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {voteResult.percentage_a}%
                </Text>
              </View>
              <View className="h-4 bg-white/30 rounded-full overflow-hidden mb-4">
                <Animated.View 
                  className="h-full bg-white rounded-full"
                  style={{ width: `${voteResult.percentage_a}%` }}
                />
              </View>
              
              <View className="flex-row justify-between mb-2">
                <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {question.option_b}
                </Text>
                <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {voteResult.percentage_b}%
                </Text>
              </View>
              <View className="h-4 bg-white/30 rounded-full overflow-hidden">
                <Animated.View 
                  className="h-full bg-white rounded-full"
                  style={{ width: `${voteResult.percentage_b}%` }}
                />
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

