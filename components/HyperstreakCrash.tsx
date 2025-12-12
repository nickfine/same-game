// ═══════════════════════════════════════════════════════════════
// HYPERSTREAK CRASH - The Painful Exit Animation
// 1.0s sequence: red flash → shake → ash explosion → chain to streak death
// Make them FEEL the loss
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { AshParticles } from './AshParticles';
import { HYPER } from '../lib/hyperstreakLogic';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HyperstreakCrashProps {
  visible: boolean;
  onComplete: () => void;
  chainToStreakDeath?: boolean; // If streak also died, chain to that animation
}

export function HyperstreakCrash({
  visible,
  onComplete,
  chainToStreakDeath = false,
}: HyperstreakCrashProps) {
  const [showAsh, setShowAsh] = useState(false);
  
  // Animation values
  const containerOpacity = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.8);
  const shakeX = useSharedValue(0);
  const crackOpacity = useSharedValue(0);
  
  const triggerErrorHaptic = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);
  
  const triggerHeavyHaptic = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);
  
  const complete = useCallback(() => {
    onComplete();
  }, [onComplete]);
  
  useEffect(() => {
    if (visible) {
      // Reset states
      setShowAsh(false);
      
      // ═══════════════════════════════════════════════════════════════
      // CRASH SEQUENCE - 1.0s of loss aversion
      // ═══════════════════════════════════════════════════════════════
      
      // 0ms: Container fades in
      containerOpacity.value = withTiming(1, { duration: 50 });
      
      // 0-100ms: Red flash
      flashOpacity.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(0.3, { duration: 200 })
      );
      
      // 0ms: Error haptic
      runOnJS(triggerErrorHaptic)();
      
      // 100-300ms: Text appears with violent shake
      setTimeout(() => {
        textOpacity.value = withTiming(1, { duration: 100 });
        textScale.value = withSequence(
          withTiming(1.3, { duration: 100 }),
          withTiming(1, { duration: 200, easing: Easing.elastic(1) })
        );
        
        // Violent shake
        shakeX.value = withRepeat(
          withSequence(
            withTiming(-12, { duration: 30 }),
            withTiming(12, { duration: 30 }),
            withTiming(-8, { duration: 30 }),
            withTiming(8, { duration: 30 }),
            withTiming(-4, { duration: 30 }),
            withTiming(4, { duration: 30 }),
            withTiming(0, { duration: 30 })
          ),
          2,
          false
        );
        
        runOnJS(triggerHeavyHaptic)();
      }, 100);
      
      // 300ms: Cracks appear
      setTimeout(() => {
        crackOpacity.value = withTiming(0.8, { duration: 200 });
      }, 300);
      
      // 300-1000ms: Ash particles fall
      setTimeout(() => {
        setShowAsh(true);
      }, 300);
      
      // 500ms: Additional haptic for impact
      setTimeout(() => {
        runOnJS(triggerHeavyHaptic)();
      }, 500);
      
      // Chain timing based on whether streak also died
      const completeDelay = chainToStreakDeath ? 700 : 1200;
      
      setTimeout(() => {
        runOnJS(complete)();
      }, completeDelay);
    } else {
      // Reset on hide
      containerOpacity.value = 0;
      flashOpacity.value = 0;
      textOpacity.value = 0;
      textScale.value = 0.8;
      shakeX.value = 0;
      crackOpacity.value = 0;
    }
  }, [visible, chainToStreakDeath]);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));
  
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));
  
  const textContainerStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      { scale: textScale.value },
      { translateX: shakeX.value },
    ],
  }));
  
  const crackStyle = useAnimatedStyle(() => ({
    opacity: crackOpacity.value,
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
        {/* Dark gradient background */}
        <LinearGradient
          colors={['#1E0A0A', '#0F0F1A', '#1A0F33']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Red flash overlay */}
        <Animated.View style={[styles.flash, flashStyle]} />
        
        {/* Crack lines */}
        <Animated.View style={[styles.cracks, crackStyle]}>
          <View style={[styles.crackLine, { transform: [{ rotate: '45deg' }] }]} />
          <View style={[styles.crackLine, { transform: [{ rotate: '-45deg' }] }]} />
          <View style={[styles.crackLine, { transform: [{ rotate: '15deg' }] }]} />
          <View style={[styles.crackLine, { transform: [{ rotate: '-70deg' }] }]} />
          <View style={[styles.crackLine, { transform: [{ rotate: '80deg' }] }]} />
        </Animated.View>
        
        {/* Content */}
        <View style={styles.content}>
          {/* Crashed text */}
          <Animated.View style={textContainerStyle}>
            <Text style={styles.crashedEmoji}>💥</Text>
            <Text style={styles.hyperText}>HYPERSTREAK</Text>
            <Text style={styles.crashedText}>CRASHED</Text>
          </Animated.View>
          
          {/* Sub text */}
          <Text style={styles.subText}>
            {chainToStreakDeath 
              ? 'Your streak also died...'
              : 'Back to charging...'}
          </Text>
        </View>
        
        {/* Ash particles */}
        <AshParticles active={showAsh} count={60} duration={2000} />
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
    backgroundColor: HYPER.COLOR_CRASH,
  },
  cracks: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  crackLine: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.5,
    height: 2,
    backgroundColor: 'rgba(255, 59, 110, 0.5)',
  },
  content: {
    alignItems: 'center',
    gap: 8,
  },
  crashedEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  hyperText: {
    fontSize: 28,
    fontFamily: 'Righteous_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 4,
  },
  crashedText: {
    fontSize: 56,
    fontFamily: 'Righteous_400Regular',
    color: HYPER.COLOR_CRASH,
    letterSpacing: 8,
    textShadowColor: HYPER.COLOR_CRASH,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  subText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 24,
  },
});

