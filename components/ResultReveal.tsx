import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../lib/constants';
import { getSassyCommentary } from '../lib/spicyQuestions';
import type { Question, VoteResult } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ResultRevealProps {
  visible: boolean;
  question: Question;
  result: VoteResult;
  onComplete?: () => void;
}

export function ResultReveal({ visible, question, result, onComplete }: ResultRevealProps) {
  const barAWidth = useSharedValue(0);
  const barBWidth = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  const winningOption = result.percentage_a > result.percentage_b 
    ? question.option_a 
    : question.option_b;
  const winningPercentage = Math.max(result.percentage_a, result.percentage_b);
  const sassyComment = getSassyCommentary(winningOption, winningPercentage);

  useEffect(() => {
    if (visible) {
      // Card entrance - scale up and fade in (NO translateY - stays in place)
      cardScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      cardOpacity.value = withTiming(1, { duration: 150 });

      // Animate bars with delay
      barAWidth.value = withDelay(
        200,
        withTiming(result.percentage_a, { 
          duration: 800, 
          easing: Easing.out(Easing.cubic) 
        })
      );
      barBWidth.value = withDelay(
        300,
        withTiming(result.percentage_b, { 
          duration: 800, 
          easing: Easing.out(Easing.cubic) 
        })
      );

      // Fade in sassy text
      textOpacity.value = withDelay(
        800,
        withTiming(1, { duration: 400 })
      );

      // Call onComplete after showing result
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2500);
      
      return () => clearTimeout(timer);
    } else {
      // Reset
      barAWidth.value = 0;
      barBWidth.value = 0;
      textOpacity.value = 0;
      cardScale.value = 0.9;
      cardOpacity.value = 0;
    }
  }, [visible, result]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
    ],
    opacity: cardOpacity.value,
  }));

  const barAStyle = useAnimatedStyle(() => ({
    width: `${barAWidth.value}%`,
  }));

  const barBStyle = useAnimatedStyle(() => ({
    width: `${barBWidth.value}%`,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  if (!visible) return null;

  const userChoseA = result.choice === 'a';
  const userWon = result.won;

  return (
    <Animated.View style={[styles.container, cardStyle]}>
      <View style={styles.card}>
        {/* Result header */}
        <View style={styles.header}>
          <Text style={[
            styles.resultTitle,
            { color: userWon ? COLORS.accent : COLORS.secondary }
          ]}>
            {userWon ? 'SAME!' : 'NOPE'}
          </Text>
          <Text style={styles.resultEmoji}>
            {userWon ? '🎯' : '😬'}
          </Text>
        </View>

        {/* Option A bar */}
        <View style={styles.optionContainer}>
          <View style={styles.optionHeader}>
            <Text style={[
              styles.optionLabel,
              userChoseA && styles.optionLabelChosen
            ]}>
              {question.option_a}
              {userChoseA && ' (you)'}
            </Text>
            <Text style={styles.percentageText}>{result.percentage_a}%</Text>
          </View>
          <View style={styles.barBackground}>
            <Animated.View style={[styles.barFillA, barAStyle]}>
              <LinearGradient
                colors={GRADIENTS.purple}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </View>

        {/* Option B bar */}
        <View style={styles.optionContainer}>
          <View style={styles.optionHeader}>
            <Text style={[
              styles.optionLabel,
              !userChoseA && styles.optionLabelChosen
            ]}>
              {question.option_b}
              {!userChoseA && ' (you)'}
            </Text>
            <Text style={styles.percentageText}>{result.percentage_b}%</Text>
          </View>
          <View style={styles.barBackground}>
            <Animated.View style={[styles.barFillB, barBStyle]}>
              <LinearGradient
                colors={GRADIENTS.coral}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </View>

        {/* Sassy commentary */}
        <Animated.View style={[styles.commentaryContainer, textStyle]}>
          <Text style={styles.commentaryText}>{sassyComment}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  resultTitle: {
    fontSize: 32,
    fontFamily: 'Righteous_400Regular',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  resultEmoji: {
    fontSize: 28,
  },
  optionContainer: {
    marginBottom: 20,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textMuted,
  },
  optionLabelChosen: {
    color: COLORS.text,
  },
  percentageText: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: COLORS.text,
  },
  barBackground: {
    height: 16,
    backgroundColor: COLORS.muted,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFillA: {
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFillB: {
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  commentaryContainer: {
    marginTop: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  commentaryText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});


