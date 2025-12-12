import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withSequence,
  useSharedValue,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { playSoundGlobal } from '../hooks/useSound';
import { COLORS } from '../lib/constants';
import type { Question, VoteResult } from '../types';

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
}

export function QuestionCard({ 
  question, 
  voteResult, 
  peekData,
  doubleDownActive,
}: QuestionCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(100);
  const scale = useSharedValue(0.9);
  const peekPulse = useSharedValue(0);

  // Entrance animation
  useEffect(() => {
    // Slide up + scale entrance
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [question.id]);

  useEffect(() => {
    if (voteResult) {
      // Play sound based on result
      playSoundGlobal(voteResult.won ? 'win' : 'lose');
    }
  }, [voteResult]);

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
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const peekOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(peekPulse.value, [0, 0.8, 1], [0, 1, 1]),
    transform: [{ scale: interpolate(peekPulse.value, [0, 1], [0.9, 1]) }],
  }));

  return (
    <Animated.View style={[cardStyle, styles.container]}>
      <View style={styles.card}>
        {/* Double Down Active Badge */}
        {doubleDownActive && !voteResult && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.doubleDownBadge}
          >
            <Text style={styles.doubleDownEmoji}>🎲</Text>
            <Text style={styles.doubleDownText}>2x</Text>
          </Animated.View>
        )}

        {/* Question Text */}
        <Text style={styles.questionText}>
          {question.text}
        </Text>

        {/* Peek Overlay - Shows majority before voting */}
        {peekData && !voteResult && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={[styles.peekOverlay, peekOverlayStyle]}
          >
            <View style={styles.peekHeader}>
              <Text style={styles.peekEmoji}>👁️</Text>
              <Text style={styles.peekTitle}>PEEK ACTIVE</Text>
            </View>

            {/* Option A */}
            <View style={styles.peekOption}>
              <View style={styles.peekOptionHeader}>
                <Text style={styles.peekOptionLabel}>{question.option_a}</Text>
                <Text style={styles.peekPercentage}>
                  {peekData.percentage_a}%
                  {peekData.leading === 'a' && ' 👑'}
                </Text>
              </View>
              <View style={styles.peekBarBackground}>
                <View 
                  style={[
                    styles.peekBarFill,
                    { 
                      width: `${peekData.percentage_a}%`,
                      backgroundColor: peekData.leading === 'a' ? '#FFD700' : '#fff',
                    }
                  ]}
                />
              </View>
            </View>

            {/* Option B */}
            <View style={styles.peekOption}>
              <View style={styles.peekOptionHeader}>
                <Text style={styles.peekOptionLabel}>{question.option_b}</Text>
                <Text style={styles.peekPercentage}>
                  {peekData.percentage_b}%
                  {peekData.leading === 'b' && ' 👑'}
                </Text>
              </View>
              <View style={styles.peekBarBackground}>
                <View 
                  style={[
                    styles.peekBarFill,
                    { 
                      width: `${peekData.percentage_b}%`,
                      backgroundColor: peekData.leading === 'b' ? '#FFD700' : '#fff',
                    }
                  ]}
                />
              </View>
            </View>

            {peekData.leading === 'tie' && (
              <Text style={styles.peekTieText}>⚖️ It's a tie! You decide!</Text>
            )}
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  doubleDownBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doubleDownEmoji: {
    fontSize: 14,
  },
  doubleDownText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  questionText: {
    fontSize: 28,
    textAlign: 'center',
    color: COLORS.background,
    lineHeight: 36,
    fontFamily: 'Righteous_400Regular',
    letterSpacing: -0.5,
  },
  peekOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    borderRadius: 16,
    padding: 16,
  },
  peekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  peekEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  peekTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  peekOption: {
    marginBottom: 8,
  },
  peekOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  peekOptionLabel: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  peekPercentage: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  peekBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  peekBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  peekTieText: {
    color: '#FFD700',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginTop: 8,
  },
});
