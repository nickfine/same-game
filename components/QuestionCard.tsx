import React, { useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  useSharedValue,
  runOnJS,
  SlideInRight,
  FadeIn,
} from 'react-native-reanimated';
import { ShareButton } from './ShareButton';
import type { Question, VoteResult } from '../types';

const { width } = Dimensions.get('window');
const RESULT_DISPLAY_TIME = 2500; // Show result for 2.5 seconds to allow sharing

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
      // After showing result, slide out (longer time to allow sharing)
      const timer = setTimeout(() => {
        translateX.value = withTiming(-width, { duration: 300 }, () => {
          runOnJS(onAnimationComplete)();
        });
        opacity.value = withTiming(0, { duration: 300 });
      }, RESULT_DISPLAY_TIME);
      
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
      style={[cardStyle, { marginHorizontal: 16, marginVertical: 8 }]}
    >
      <View 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 24,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
          minHeight: 300,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Question Text */}
        <Text 
          style={{ 
            fontSize: 28, 
            textAlign: 'center', 
            color: '#18181b',
            lineHeight: 36,
            fontFamily: 'Righteous_400Regular' 
          }}
        >
          {question.text}
        </Text>

        {/* Vote Result Overlay */}
        {voteResult && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 24,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: voteResult.won ? 'rgba(0, 224, 84, 0.95)' : 'rgba(255, 0, 85, 0.95)',
            }}
          >
            {/* Result Text */}
            <Text 
              style={{ 
                fontSize: 56, 
                color: '#ffffff', 
                marginBottom: 32,
                fontFamily: 'Righteous_400Regular', 
                letterSpacing: 4 
              }}
            >
              {voteResult.won ? 'SAME!' : 'NOPE'}
            </Text>
            
            {/* Percentage Bars */}
            <View style={{ width: '100%', paddingHorizontal: 32 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#ffffff', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>
                  {question.option_a}
                </Text>
                <Text style={{ color: '#ffffff', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>
                  {voteResult.percentage_a}%
                </Text>
              </View>
              <View style={{ height: 16, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                <Animated.View 
                  style={{ height: '100%', backgroundColor: '#ffffff', borderRadius: 8, width: `${voteResult.percentage_a}%` }}
                />
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#ffffff', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>
                  {question.option_b}
                </Text>
                <Text style={{ color: '#ffffff', fontSize: 16, fontFamily: 'Poppins_700Bold' }}>
                  {voteResult.percentage_b}%
                </Text>
              </View>
              <View style={{ height: 16, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8, overflow: 'hidden' }}>
                <Animated.View 
                  style={{ height: '100%', backgroundColor: '#ffffff', borderRadius: 8, width: `${voteResult.percentage_b}%` }}
                />
              </View>
            </View>

            {/* Share Button */}
            <ShareButton 
              question={question} 
              result={voteResult} 
              style={{ marginTop: 24 }}
            />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

