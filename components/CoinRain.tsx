import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CoinProps {
  delay: number;
  startX: number;
  endX: number;
  duration: number;
  size: number;
  rotation: number;
}

function Coin({ delay, startX, endX, duration, size, rotation }: CoinProps) {
  const progress = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { 
        duration, 
        easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
      })
    );
    
    spin.value = withDelay(
      delay,
      withTiming(rotation, { duration, easing: Easing.linear })
    );
  }, []);

  const coinStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 0.3, 1],
      [-100, SCREEN_HEIGHT * 0.3, SCREEN_HEIGHT + 100]
    );
    
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [startX, endX]
    );
    
    const scale = interpolate(
      progress.value,
      [0, 0.2, 0.8, 1],
      [0.5, 1, 1, 0.8]
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${spin.value}deg` },
        { scale },
      ],
      opacity: interpolate(progress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    };
  });

  return (
    <Animated.View style={[styles.coin, { width: size, height: size }, coinStyle]}>
      <Text style={[styles.coinEmoji, { fontSize: size * 0.8 }]}>🪙</Text>
    </Animated.View>
  );
}

interface CoinRainProps {
  count?: number;
  isCorrect: boolean;
}

export function CoinRain({ count = 30, isCorrect }: CoinRainProps) {
  const coins = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: Math.random() * 400,
      startX: Math.random() * SCREEN_WIDTH - SCREEN_WIDTH / 2,
      endX: (Math.random() - 0.5) * 100 + (Math.random() * SCREEN_WIDTH - SCREEN_WIDTH / 2),
      duration: 1200 + Math.random() * 800,
      size: 24 + Math.random() * 20,
      rotation: Math.random() * 720 - 360,
    }));
  }, [count]);

  if (!isCorrect) return null;

  return (
    <View style={[styles.container, { pointerEvents: 'none' }]}>
      {coins.map((coin) => (
        <Coin key={coin.id} {...coin} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    overflow: 'hidden',
  },
  coin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinEmoji: {
    fontSize: 28,
  },
});
