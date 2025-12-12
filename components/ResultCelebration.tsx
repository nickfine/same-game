import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { ExplosiveText } from './ExplosiveText';
import { CoinRain } from './CoinRain';
import { ConfettiExplosion } from './ConfettiExplosion';
import { PercentageBar } from './PercentageBar';
import { SassyCommentary } from './SassyCommentary';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  optionA: '#6366F1',
  optionB: '#F59E0B',
  correct: '#00FFBD',
  wrong: '#FF3B6E',
};

interface ResultCelebrationProps {
  visible: boolean;
  isCorrect: boolean;
  userChoice: 'a' | 'b';
  optionALabel: string;
  optionBLabel: string;
  percentageA: number;
  percentageB: number;
  pointsEarned: number;
  multiplier?: number;
  onComplete: () => void;
}

export function ResultCelebration({
  visible,
  isCorrect,
  userChoice,
  optionALabel,
  optionBLabel,
  percentageA,
  percentageB,
  pointsEarned,
  multiplier = 1,
  onComplete,
}: ResultCelebrationProps) {
  const [phase, setPhase] = useState<'flash' | 'explosion' | 'results' | 'done'>('flash');
  
  const flashOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const resultsOpacity = useSharedValue(0);
  const pointsBounce = useSharedValue(0);

  const winnerChoice = percentageA >= percentageB ? 'a' : 'b';
  const winnerLabel = winnerChoice === 'a' ? optionALabel : optionBLabel;
  const loserLabel = winnerChoice === 'a' ? optionBLabel : optionALabel;
  const winnerPercent = winnerChoice === 'a' ? percentageA : percentageB;
  const loserPercent = winnerChoice === 'a' ? percentageB : percentageA;

  const triggerHaptics = useCallback(async (correct: boolean) => {
    if (correct) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setPhase('flash');
      return;
    }

    containerOpacity.value = withTiming(1, { duration: 50 });
    flashOpacity.value = withSequence(
      withTiming(0.5, { duration: 80 }),
      withTiming(0, { duration: 200 })
    );

    triggerHaptics(isCorrect);

    setTimeout(() => setPhase('explosion'), 150);

    setTimeout(() => {
      setPhase('results');
      resultsOpacity.value = withTiming(1, { duration: 400 });
    }, 1500);

    setTimeout(() => {
      pointsBounce.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withTiming(1, { duration: 200, easing: Easing.elastic(1.5) })
      );
    }, 2000);

  }, [visible, isCorrect]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: isCorrect ? '#00FFBD' : '#FF3B6E',
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const resultsStyle = useAnimatedStyle(() => ({
    opacity: resultsOpacity.value,
  }));

  const pointsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pointsBounce.value || 1 }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={[styles.background, { backgroundColor: isCorrect ? '#0F172A' : '#1E1028' }]} />
      
      <Animated.View style={[styles.flash, flashStyle]} />

      {phase !== 'flash' && (
        <ConfettiExplosion isCorrect={isCorrect} count={isCorrect ? 80 : 40} />
      )}

      {phase !== 'flash' && isCorrect && (
        <CoinRain count={40} isCorrect={isCorrect} />
      )}

      <View style={styles.content}>
        {phase !== 'flash' && (
          <View style={styles.textSection}>
            <ExplosiveText isCorrect={isCorrect} />
            
            {isCorrect && pointsEarned > 0 && (
              <Animated.View style={[styles.pointsContainer, pointsStyle]}>
                <Text style={styles.pointsText}>
                  +{pointsEarned * multiplier} {multiplier > 1 ? `(${multiplier}x!)` : ''}
                </Text>
              </Animated.View>
            )}
          </View>
        )}

        {phase === 'results' && (
          <Animated.View style={[styles.resultsSection, resultsStyle]}>
            <View style={styles.barsContainer}>
              <PercentageBar
                percentage={winnerPercent}
                label={winnerLabel}
                isWinner={true}
                isUserChoice={
                  (winnerChoice === 'a' && userChoice === 'a') ||
                  (winnerChoice === 'b' && userChoice === 'b')
                }
                delay={0}
                color={winnerChoice === 'a' ? COLORS.optionA : COLORS.optionB}
                index={0}
              />
              <PercentageBar
                percentage={loserPercent}
                label={loserLabel}
                isWinner={false}
                isUserChoice={
                  (winnerChoice === 'a' && userChoice === 'b') ||
                  (winnerChoice === 'b' && userChoice === 'a')
                }
                delay={150}
                color={winnerChoice === 'a' ? COLORS.optionB : COLORS.optionA}
                index={1}
              />
            </View>

            <SassyCommentary
              isCorrect={isCorrect}
              winnerLabel={winnerLabel}
              loserLabel={loserLabel}
              winnerPercent={winnerPercent}
              loserPercent={loserPercent}
              userChoice={userChoice === winnerChoice ? 'winner' : 'loser'}
              delay={400}
            />
          </Animated.View>
        )}
      </View>

      {phase === 'results' && (
        <Animated.View style={[styles.buttonContainer, resultsStyle]}>
          <Pressable 
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueButton,
              { 
                backgroundColor: isCorrect ? '#00FFBD' : '#FF3B6E',
                transform: [{ scale: pressed ? 0.95 : 1 }],
              }
            ]}
          >
            <Text style={styles.continueText}>NEXT</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pointsContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 24,
    color: '#FFD700',
  },
  resultsSection: {
    paddingTop: 20,
  },
  barsContainer: {
    gap: 8,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  continueButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 20,
    color: '#000000',
    letterSpacing: 2,
  },
});
