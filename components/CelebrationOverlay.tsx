import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../lib/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CelebrationOverlayProps {
  visible: boolean;
  onComplete?: () => void;
}

// Single coin component with spin animation
function FallingCoin({ delay, startX }: { delay: number; startX: number }) {
  const translateY = useSharedValue(-60);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.8 + Math.random() * 0.4);

  useEffect(() => {
    // Animate coin falling with physics
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, { 
        duration: 1500 + Math.random() * 800,
        easing: Easing.in(Easing.quad),
      })
    );
    
    // Slight horizontal drift with wobble
    translateX.value = withDelay(
      delay,
      withTiming(startX + (Math.random() - 0.5) * 120, { 
        duration: 1500 + Math.random() * 800,
      })
    );
    
    // Rotation
    rotate.value = withDelay(
      delay,
      withTiming(720 + Math.random() * 720, { 
        duration: 1500 + Math.random() * 800,
        easing: Easing.linear,
      })
    );

    // Fade out near bottom
    opacity.value = withDelay(
      delay + 1200,
      withTiming(0, { duration: 400 })
    );
  }, []);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.coin, coinStyle]}>
      <Text style={styles.coinEmoji}>🪙</Text>
    </Animated.View>
  );
}

// Sparkle particle
function Sparkle({ delay, startX, startY, color }: { delay: number; startX: number; startY: number; color: string }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.5, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) })
      )
    );
    
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 500 })
      )
    );

    rotation.value = withDelay(
      delay,
      withTiming(180, { duration: 600 })
    );
  }, []);

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[
        styles.sparkle, 
        sparkleStyle,
        { left: startX, top: startY }
      ]}
    >
      <Text style={[styles.sparkleText, { color }]}>✦</Text>
    </Animated.View>
  );
}

export function CelebrationOverlay({ visible, onComplete }: CelebrationOverlayProps) {
  const flashOpacity = useSharedValue(0);

  // Generate random coins
  const coins = useMemo(() => {
    if (!visible) return [];
    const count = 18 + Math.floor(Math.random() * 8); // 18-25 coins
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: Math.random() * 400,
      startX: Math.random() * SCREEN_WIDTH,
    }));
  }, [visible]);

  // Generate sparkles
  const sparkles = useMemo(() => {
    if (!visible) return [];
    const colors = [COLORS.accent, '#FFD700', COLORS.primary, '#FFFFFF'];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 600,
      startX: Math.random() * SCREEN_WIDTH,
      startY: Math.random() * SCREEN_HEIGHT * 0.6,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // Emerald flash animation - easeOutExpo
      flashOpacity.value = withSequence(
        withTiming(0.65, { duration: 100, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 500, easing: Easing.out(Easing.exp) }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        })
      );
    }
  }, [visible]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Emerald flash overlay */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFill,
          styles.flash,
          flashStyle,
        ]} 
      />

      {/* Sparkles */}
      {sparkles.map(sparkle => (
        <Sparkle 
          key={sparkle.id} 
          delay={sparkle.delay} 
          startX={sparkle.startX}
          startY={sparkle.startY}
          color={sparkle.color}
        />
      ))}

      {/* Coin rain */}
      {coins.map(coin => (
        <FallingCoin 
          key={coin.id} 
          delay={coin.delay} 
          startX={coin.startX} 
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flash: {
    backgroundColor: COLORS.accent,
    zIndex: 100,
  },
  coin: {
    position: 'absolute',
    top: -50,
    zIndex: 99,
  },
  coinEmoji: {
    fontSize: 40,
  },
  sparkle: {
    position: 'absolute',
    zIndex: 98,
  },
  sparkleText: {
    fontSize: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});



