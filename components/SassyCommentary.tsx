import React, { useEffect, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const WINNER_TEMPLATES = [
  "{percent}% chose {choice}… legends recognize legends",
  "{percent}% agree with you. Main character energy confirmed",
  "Only {loserPercent}% picked {loserChoice}. We don't talk about them",
  "{percent}% chose {choice}… the people have spoken",
  "You and {percent}% of players understood the assignment",
  "{percent}% picked {choice}. The hive mind is strong",
  "{loserPercent}% chose {loserChoice}… bless their hearts",
  "The {percent}% majority chose {choice}. Taste",
];

const LOSER_TEMPLATES = [
  "Only {percent}% chose {choice}… you chaotic gremlin",
  "{percent}% picked {choice}. We respect the audacity",
  "The {winnerPercent}% majority disagrees but you're built different",
  "{percent}% chose {choice}. Contrarian icon behavior",
  "You're in the {percent}% minority. Underground legend status",
  "{percent}% picked {choice}. Society wasn't ready for you",
  "Only {percent}%? You're basically a unicorn",
];

interface SassyCommentaryProps {
  isCorrect: boolean;
  winnerLabel: string;
  loserLabel: string;
  winnerPercent: number;
  loserPercent: number;
  userChoice: 'winner' | 'loser';
  delay?: number;
}

export function SassyCommentary({
  isCorrect,
  winnerLabel,
  loserLabel,
  winnerPercent,
  loserPercent,
  userChoice,
  delay = 0,
}: SassyCommentaryProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const comment = useMemo(() => {
    const templates = isCorrect ? WINNER_TEMPLATES : LOSER_TEMPLATES;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const userChoiceLabel = userChoice === 'winner' ? winnerLabel : loserLabel;
    const userPercent = userChoice === 'winner' ? winnerPercent : loserPercent;
    
    return template
      .replace('{percent}', String(userPercent))
      .replace('{choice}', userChoiceLabel)
      .replace('{loserPercent}', String(loserPercent))
      .replace('{loserChoice}', loserLabel)
      .replace('{winnerPercent}', String(winnerPercent))
      .replace('{winnerChoice}', winnerLabel);
  }, [isCorrect, winnerLabel, loserLabel, winnerPercent, loserPercent, userChoice]);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.comment}>{comment}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
    marginTop: 16,
  },
  comment: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
