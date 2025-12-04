import React, { useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withSequence,
  useSharedValue,
  runOnJS,
  SlideInRight,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { ShareButton } from './ShareButton';
import { playSoundGlobal } from '../hooks/useSound';
import { COLORS } from '../lib/constants';
import type { Question, VoteResult } from '../types';

const { width } = Dimensions.get('window');
const RESULT_DISPLAY_TIME = 2500; // Show result for 2.5 seconds to allow sharing

interface PeekData {
  percentage_a: number;
  percentage_b: number;
  leading: 'a' | 'b' | 'tie';
}

interface QuestionCardProps {
  question: Question;
  voteResult: VoteResult | null;
  peekData?: PeekData | null; // Data shown when peek is active
  doubleDownActive?: boolean; // Show 2x indicator
  onAnimationComplete?: () => void;
}

export function QuestionCard({ 
  question, 
  voteResult, 
  peekData,
  doubleDownActive,
  onAnimationComplete,
}: QuestionCardProps) {
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const peekPulse = useSharedValue(0);

  useEffect(() => {
    if (voteResult && onAnimationComplete) {
      // Play sound based on result
      playSoundGlobal(voteResult.won ? 'win' : 'lose');
      
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

  // Peek pulse animation
  useEffect(() => {
    if (peekData) {
      peekPulse.value = withSequence(
        withTiming(1, { duration: 300 }),
        withSpring(0.8, { damping: 10 })
      );
    } else {
      peekPulse.value = 0;
    }
  }, [peekData]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const peekOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(peekPulse.value, [0, 0.8, 1], [0, 1, 1]),
    transform: [{ scale: interpolate(peekPulse.value, [0, 1], [0.9, 1]) }],
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
        {/* Double Down Active Badge */}
        {doubleDownActive && !voteResult && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: '#EC4899',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 14 }}>🎲</Text>
            <Text style={{ 
              color: '#fff', 
              fontSize: 12, 
              fontFamily: 'Poppins_700Bold' 
            }}>
              2x
            </Text>
          </Animated.View>
        )}

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

        {/* Peek Overlay - Shows majority before voting */}
        {peekData && !voteResult && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={[
              {
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                backgroundColor: 'rgba(16, 185, 129, 0.95)',
                borderRadius: 16,
                padding: 16,
              },
              peekOverlayStyle,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>👁️</Text>
              <Text style={{ 
                color: '#fff', 
                fontSize: 14, 
                fontFamily: 'Poppins_700Bold' 
              }}>
                PEEK ACTIVE
              </Text>
            </View>

            {/* Option A */}
            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' }}>
                  {question.option_a}
                </Text>
                <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold' }}>
                  {peekData.percentage_a}%
                  {peekData.leading === 'a' && ' 👑'}
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' }}>
                <View 
                  style={{ 
                    height: '100%', 
                    backgroundColor: peekData.leading === 'a' ? '#FFD700' : '#fff',
                    borderRadius: 4, 
                    width: `${peekData.percentage_a}%`,
                  }}
                />
              </View>
            </View>

            {/* Option B */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' }}>
                  {question.option_b}
                </Text>
                <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold' }}>
                  {peekData.percentage_b}%
                  {peekData.leading === 'b' && ' 👑'}
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' }}>
                <View 
                  style={{ 
                    height: '100%', 
                    backgroundColor: peekData.leading === 'b' ? '#FFD700' : '#fff',
                    borderRadius: 4, 
                    width: `${peekData.percentage_b}%`,
                  }}
                />
              </View>
            </View>

            {peekData.leading === 'tie' && (
              <Text style={{ 
                color: '#FFD700', 
                fontSize: 12, 
                fontFamily: 'Poppins_600SemiBold',
                textAlign: 'center',
                marginTop: 8,
              }}>
                ⚖️ It's a tie! You decide!
              </Text>
            )}
          </Animated.View>
        )}

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

