import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WIN_COLORS = ['#00FFBD', '#8B5CF6', '#FF6B6B', '#FFD700', '#00D4FF', '#FF00FF'];
const LOSE_COLORS = ['#FF3B6E', '#FF6B6B', '#FFB6C1', '#FF69B4', '#DC143C'];

interface ConfettiPieceProps {
  delay: number;
  startX: number;
  startY: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  shape: 'square' | 'circle' | 'rectangle';
}

function ConfettiPiece({ 
  delay, 
  startX, 
  startY, 
  color, 
  size, 
  rotation,
  velocityX,
  velocityY,
  shape,
}: ConfettiPieceProps) {
  const progress = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) })
    );
    
    spin.value = withDelay(
      delay,
      withTiming(rotation, { duration: 2000, easing: Easing.linear })
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const time = progress.value * 2;
    const gravity = 400;
    
    const translateX = startX + velocityX * time;
    const translateY = startY + velocityY * time + 0.5 * gravity * time * time;
    
    const opacity = interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 1, 1, 0]);
    const scale = interpolate(progress.value, [0, 0.1, 1], [0, 1, 0.5]);

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${spin.value}deg` },
        { scale },
      ],
      opacity,
    };
  });

  const shapeStyle = {
    width: shape === 'rectangle' ? size * 2 : size,
    height: size,
    borderRadius: shape === 'circle' ? size / 2 : 2,
    backgroundColor: color,
  };

  return (
    <Animated.View style={[styles.confetti, shapeStyle, style]} />
  );
}

interface ConfettiExplosionProps {
  isCorrect: boolean;
  count?: number;
}

export function ConfettiExplosion({ isCorrect, count = 60 }: ConfettiExplosionProps) {
  const colors = isCorrect ? WIN_COLORS : LOSE_COLORS;
  
  const pieces = useMemo(() => {
    const shapes: ('square' | 'circle' | 'rectangle')[] = ['square', 'circle', 'rectangle'];
    
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 200 + Math.random() * 400;
      
      return {
        id: i,
        delay: Math.random() * 100,
        startX: SCREEN_WIDTH / 2 - 5,
        startY: SCREEN_HEIGHT * 0.35,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 10,
        rotation: Math.random() * 1080,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed - 300,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      };
    });
  }, [count, isCorrect]);

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} {...piece} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
  },
});
