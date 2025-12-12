// ═══════════════════════════════════════════════════════════════
// HYPERSTREAK ACTIVATION - Full-Screen Dopamine Bomb
// 1.2s sequence: warp → glitch text → serpent morph → confetti → haptic
// "This is what snorting pure dopamine feels like"
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';

import { ConfettiCannon } from './ConfettiCannon';
import { HYPER } from '../lib/hyperstreakLogic';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HyperstreakActivationProps {
  visible: boolean;
  onComplete: () => void;
}

// Double Serpent Flame SVG - morphs from single flame
function DoubleSerpentFlame({ progress }: { progress: number }) {
  // Interpolate between single flame and double serpent
  const scale = 1 + progress * 0.3;
  const spread = progress * 20;
  
  return (
    <Svg width={120} height={140} viewBox="0 0 120 140">
      <Defs>
        <LinearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor="#FF6B6B" />
          <Stop offset="50%" stopColor="#FF8E53" />
          <Stop offset="100%" stopColor="#FFD93D" />
        </LinearGradient>
        <LinearGradient id="emeraldGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor="#00FFBD" />
          <Stop offset="50%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#6EE7B7" />
        </LinearGradient>
      </Defs>
      
      {/* Left serpent flame */}
      <G transform={`translate(${60 - spread}, 70) scale(${scale})`}>
        <Path
          d="M0 50 Q-15 30 -10 10 Q-5 -10 5 -30 Q10 -15 5 0 Q15 -20 20 -40 Q25 -20 20 0 Q30 10 25 30 Q20 45 10 50 Z"
          fill="url(#emeraldGradient)"
          opacity={0.9}
        />
      </G>
      
      {/* Right serpent flame */}
      <G transform={`translate(${60 + spread}, 70) scale(${scale})`}>
        <Path
          d="M0 50 Q15 30 10 10 Q5 -10 -5 -30 Q-10 -15 -5 0 Q-15 -20 -20 -40 Q-25 -20 -20 0 Q-30 10 -25 30 Q-20 45 -10 50 Z"
          fill="url(#emeraldGradient)"
          opacity={0.9}
        />
      </G>
      
      {/* Center core flame */}
      <G transform={`translate(60, 80) scale(${1 - progress * 0.3})`}>
        <Path
          d="M0 40 Q-20 20 -15 0 Q-10 -15 0 -35 Q10 -15 15 0 Q20 20 0 40 Z"
          fill="url(#flameGradient)"
          opacity={1 - progress * 0.7}
        />
      </G>
    </Svg>
  );
}

// Glitch Text Effect
function GlitchText({ text, active }: { text: string; active: boolean }) {
  const glitchX = useSharedValue(0);
  const glitchOpacity = useSharedValue(1);
  const redOffset = useSharedValue(0);
  const cyanOffset = useSharedValue(0);
  
  useEffect(() => {
    if (active) {
      // Rapid glitch jitter
      glitchX.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 30 }),
          withTiming(4, { duration: 30 }),
          withTiming(-2, { duration: 30 }),
          withTiming(2, { duration: 30 }),
          withTiming(0, { duration: 30 })
        ),
        6,
        false
      );
      
      // RGB split effect
      redOffset.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 50 }),
          withTiming(3, { duration: 50 }),
          withTiming(0, { duration: 50 })
        ),
        4,
        false
      );
      
      cyanOffset.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 50 }),
          withTiming(-3, { duration: 50 }),
          withTiming(0, { duration: 50 })
        ),
        4,
        false
      );
    }
  }, [active]);
  
  const mainStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glitchX.value }],
  }));
  
  const redStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: redOffset.value }],
    opacity: 0.7,
  }));
  
  const cyanStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cyanOffset.value }],
    opacity: 0.7,
  }));
  
  return (
    <View style={styles.glitchContainer}>
      {/* Red ghost */}
      <Animated.Text style={[styles.glitchText, styles.redGhost, redStyle]}>
        {text}
      </Animated.Text>
      
      {/* Cyan ghost */}
      <Animated.Text style={[styles.glitchText, styles.cyanGhost, cyanStyle]}>
        {text}
      </Animated.Text>
      
      {/* Main text */}
      <Animated.Text style={[styles.glitchText, mainStyle]}>
        {text}
      </Animated.Text>
    </View>
  );
}

// Need this for withRepeat
import { withRepeat } from 'react-native-reanimated';

export function HyperstreakActivation({
  visible,
  onComplete,
}: HyperstreakActivationProps) {
  const [showConfetti1, setShowConfetti1] = useState(false);
  const [showConfetti2, setShowConfetti2] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [serpentProgress, setSerpentProgress] = useState(0);
  
  // Animation values
  const screenScale = useSharedValue(1);
  const hueRotate = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.5);
  const subTextOpacity = useSharedValue(0);
  const flameScale = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  
  const triggerHapticBurst = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);
  
  const complete = useCallback(() => {
    onComplete();
  }, [onComplete]);
  
  useEffect(() => {
    if (visible) {
      // Reset states
      setShowConfetti1(false);
      setShowConfetti2(false);
      setGlitchActive(false);
      setSerpentProgress(0);
      
      // ═══════════════════════════════════════════════════════════════
      // ACTIVATION SEQUENCE - 1.2s of pure dopamine
      // ═══════════════════════════════════════════════════════════════
      
      // 0ms: Container fades in, screen starts warping
      containerOpacity.value = withTiming(1, { duration: 100 });
      
      // 0-200ms: Screen warp (scale up, hue rotate)
      screenScale.value = withSequence(
        withTiming(1.1, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 200, easing: Easing.in(Easing.cubic) })
      );
      
      hueRotate.value = withSequence(
        withTiming(180, { duration: 300 }),
        withTiming(0, { duration: 300 })
      );
      
      // Initial flash
      flashOpacity.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(0, { duration: 200 })
      );
      
      // 200ms: "HYPERSTREAK" slams in with glitch
      setTimeout(() => {
        textOpacity.value = withTiming(1, { duration: 100 });
        textScale.value = withSpring(1, { damping: 8, stiffness: 200 });
        setGlitchActive(true);
        runOnJS(triggerHapticBurst)();
      }, 200);
      
      // 400ms: "ACTIVATED" fades in
      setTimeout(() => {
        subTextOpacity.value = withTiming(1, { duration: 200 });
      }, 400);
      
      // 500ms: Flame morphs to double serpent
      setTimeout(() => {
        flameScale.value = withSpring(1, { damping: 6, stiffness: 100 });
        // Animate serpent progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 0.1;
          setSerpentProgress(Math.min(1, progress));
          if (progress >= 1) clearInterval(interval);
        }, 50);
      }, 500);
      
      // 600ms: First confetti burst
      setTimeout(() => {
        setShowConfetti1(true);
      }, 600);
      
      // 700ms: First haptic
      setTimeout(() => {
        runOnJS(triggerHapticBurst)();
      }, 700);
      
      // 800ms: Second confetti burst
      setTimeout(() => {
        setShowConfetti2(true);
      }, 800);
      
      // 900ms: Second haptic
      setTimeout(() => {
        runOnJS(triggerHapticBurst)();
      }, 900);
      
      // 1100ms: Third haptic
      setTimeout(() => {
        runOnJS(triggerHapticBurst)();
      }, 1100);
      
      // 1200ms: Complete (but hold for visual impact)
      setTimeout(() => {
        runOnJS(complete)();
      }, 1500);
    } else {
      // Reset on hide
      containerOpacity.value = 0;
      screenScale.value = 1;
      hueRotate.value = 0;
      textOpacity.value = 0;
      textScale.value = 0.5;
      subTextOpacity.value = 0;
      flameScale.value = 0;
      flashOpacity.value = 0;
    }
  }, [visible]);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: screenScale.value }],
  }));
  
  const textContainerStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));
  
  const subTextStyle = useAnimatedStyle(() => ({
    opacity: subTextOpacity.value,
  }));
  
  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));
  
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Background gradient */}
        <ExpoGradient
          colors={['#0F0F1A', '#1A0F33', '#2D1B4E']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Flash overlay */}
        <Animated.View style={[styles.flash, flashStyle]} />
        
        {/* Content */}
        <View style={styles.content}>
          {/* Double Serpent Flame */}
          <Animated.View style={[styles.flameContainer, flameStyle]}>
            <DoubleSerpentFlame progress={serpentProgress} />
          </Animated.View>
          
          {/* Main text */}
          <Animated.View style={textContainerStyle}>
            <GlitchText text="HYPERSTREAK" active={glitchActive} />
          </Animated.View>
          
          {/* Sub text */}
          <Animated.View style={subTextStyle}>
            <Text style={styles.activatedText}>ACTIVATED</Text>
            <Text style={styles.bonusText}>2x COINS • 2x XP • 2x POWER-UPS</Text>
          </Animated.View>
        </View>
        
        {/* Confetti cannons */}
        <ConfettiCannon shoot={showConfetti1} variant="milestone" />
        <ConfettiCannon shoot={showConfetti2} variant="correct" />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: HYPER.COLOR_ACTIVE,
  },
  content: {
    alignItems: 'center',
    gap: 20,
  },
  flameContainer: {
    marginBottom: 20,
  },
  glitchContainer: {
    position: 'relative',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glitchText: {
    fontSize: 52,
    fontFamily: 'Righteous_400Regular',
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: HYPER.COLOR_ACTIVE,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  redGhost: {
    position: 'absolute',
    color: '#FF3B6E',
  },
  cyanGhost: {
    position: 'absolute',
    color: '#00FFFF',
  },
  activatedText: {
    fontSize: 36,
    fontFamily: 'Righteous_400Regular',
    color: HYPER.COLOR_ACTIVE,
    letterSpacing: 8,
    textAlign: 'center',
  },
  bonusText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 1,
  },
});

