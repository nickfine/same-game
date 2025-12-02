import React from 'react';
import { Pressable, Text, Share, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Question, VoteResult } from '../types';

interface ShareButtonProps {
  question: Question;
  result: VoteResult;
  style?: object;
}

export function ShareButton({ question, result, style }: ShareButtonProps) {
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const resultEmoji = result.won ? '✅' : '❌';
    const resultText = result.won ? 'SAME!' : 'NOPE';
    const myChoice = result.choice === 'a' ? question.option_a : question.option_b;
    const myPercentage = result.choice === 'a' ? result.percentage_a : result.percentage_b;

    const message = `${resultEmoji} ${resultText}\n\n"${question.text}"\n\nI picked: ${myChoice} (${myPercentage}%)\n\n${question.option_a}: ${result.percentage_a}%\n${question.option_b}: ${result.percentage_b}%\n\nPlay SAME and predict what the majority thinks! 🎮`;

    try {
      await Share.share({
        message,
        title: 'SAME - Predict the Majority',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <Pressable
      onPress={handleShare}
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.2)',
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.5)',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: '#ffffff',
          fontSize: 16,
          fontFamily: 'Righteous_400Regular',
          textAlign: 'center',
        }}
      >
        Share 📤
      </Text>
    </Pressable>
  );
}

