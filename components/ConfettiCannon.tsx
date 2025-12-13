import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ConfettiCannonLib from 'react-native-confetti-cannon';
import { COLORS } from '../lib/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiCannonProps {
  shoot: boolean;
  onComplete?: () => void;
  variant?: 'correct' | 'celebration' | 'milestone';
}

export function ConfettiCannon({ shoot, onComplete, variant = 'correct' }: ConfettiCannonProps) {
  const confettiRef = useRef<any>(null);

  // Color schemes for different variants
  const colorSchemes = {
    correct: [
      COLORS.accent,           // Emerald
      '#FFD700',               // Gold
      COLORS.primary,          // Violet
      '#FFFFFF',               // White
    ],
    celebration: [
      COLORS.primary,          // Violet
      COLORS.secondary,        // Coral
      COLORS.accent,           // Emerald
      '#FFD700',               // Gold
      '#D946EF',               // Pink
    ],
    milestone: [
      '#FFD700',               // Gold
      '#FFA500',               // Orange
      COLORS.secondary,        // Coral
      COLORS.primary,          // Violet
      COLORS.accent,           // Emerald
      '#FF69B4',               // Hot pink
    ],
  };

  useEffect(() => {
    if (shoot && confettiRef.current) {
      confettiRef.current.start();
    }
  }, [shoot]);

  if (!shoot) return null;

  const colors = colorSchemes[variant];
  const count = variant === 'milestone' ? 300 : variant === 'celebration' ? 200 : 150;
  const explosionSpeed = variant === 'milestone' ? 500 : 350;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <ConfettiCannonLib
        ref={confettiRef}
        count={count}
        origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
        explosionSpeed={explosionSpeed}
        fallSpeed={3000}
        fadeOut
        colors={colors}
        autoStart={true}
        onAnimationEnd={onComplete}
      />
    </View>
  );
}


