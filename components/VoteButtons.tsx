import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { playSoundGlobal } from '../hooks/useSound';
import { COLORS, GRADIENTS, TEXT_GLOW, ORB_ANIMATION } from '../lib/constants';
import { OrbEmoji } from './OrbEmoji';
import type { VoteChoice } from '../types';

// ═══════════════════════════════════════════════════════════════
// VOTE BUTTONS - Screenshot Gold Edition
// Every tap feels like thunder. Every pixel is intentional.
// ═══════════════════════════════════════════════════════════════

interface PeekData {
  percentage_a: number;
  percentage_b: number;
  leading: 'a' | 'b' | 'tie';
}

interface VoteButtonsProps {
  optionA: string;
  optionB: string;
  emojiA: string;
  emojiB: string;
  onVote: (choice: VoteChoice) => void;
  disabled?: boolean;
  hidden?: boolean;
  inHyperstreak?: boolean;
  peekData?: PeekData | null;
  doubleDownActive?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function VoteButtons({
  optionA,
  optionB,
  emojiA,
  emojiB,
  onVote,
  disabled,
  hidden,
  inHyperstreak = false,
  peekData,
  doubleDownActive,
}: VoteButtonsProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth <= 375;
  
  // Text sizing based on screen width
  const textSize = isSmallScreen ? 48 : 56;
  
  // Press states for orb animations
  const [isPressedA, setIsPressedA] = useState(false);
  const [isPressedB, setIsPressedB] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════
  // BUTTON ANIMATION VALUES
  // ═══════════════════════════════════════════════════════════════
  
  // Button transforms
  const scaleA = useSharedValue(0.95);
  const scaleB = useSharedValue(0.95);
  const translateYA = useSharedValue(100);
  const translateYB = useSharedValue(100);
  
  // Subtle idle pulse
  const pulseA = useSharedValue(1);
  const pulseB = useSharedValue(1);
  
  // Glow burst on press
  const glowBurstA = useSharedValue(0);
  const glowBurstB = useSharedValue(0);

  // ═══════════════════════════════════════════════════════════════
  // ENTRANCE ANIMATION
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!hidden) {
      // Staggered slide-up with overshoot
      translateYA.value = withDelay(0, withSpring(0, { damping: 18, stiffness: 180 }));
      scaleA.value = withDelay(0, withSequence(
        withSpring(1.03, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15 })
      ));
      
      translateYB.value = withDelay(80, withSpring(0, { damping: 18, stiffness: 180 }));
      scaleB.value = withDelay(80, withSequence(
        withSpring(1.03, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15 })
      ));
    } else {
      translateYA.value = 100;
      translateYB.value = 100;
      scaleA.value = 0.95;
      scaleB.value = 0.95;
    }
  }, [hidden, optionA, optionB]);

  // ═══════════════════════════════════════════════════════════════
  // CONTINUOUS PULSE (faster in hyperstreak)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const duration = inHyperstreak ? 250 : 500;
    
    pulseA.value = withRepeat(
      withSequence(
        withTiming(1.012, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    pulseB.value = withDelay(duration / 2, withRepeat(
      withSequence(
        withTiming(1.012, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));
    
    return () => {
      cancelAnimation(pulseA);
      cancelAnimation(pulseB);
    };
  }, [inHyperstreak]);

  // ═══════════════════════════════════════════════════════════════
  // PRESS HANDLERS - Thunder Haptics
  // ═══════════════════════════════════════════════════════════════
  const handlePressIn = (option: 'a' | 'b') => {
    if (disabled) return;
    
    // Heavy haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    if (option === 'a') {
      setIsPressedA(true);
      scaleA.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      glowBurstA.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );
    } else {
      setIsPressedB(true);
      scaleB.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      glowBurstB.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );
    }
  };

  const handlePressOut = (option: 'a' | 'b') => {
    if (option === 'a') {
      setIsPressedA(false);
      scaleA.value = withSpring(1.0, { damping: 12 });
    } else {
      setIsPressedB(false);
      scaleB.value = withSpring(1.0, { damping: 12 });
    }
  };

  const handlePress = (choice: VoteChoice) => {
    if (disabled) return;
    
    // THUNDER haptic on commit
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    playSoundGlobal('tap');
    onVote(choice);
  };

  // ═══════════════════════════════════════════════════════════════
  // ANIMATED STYLES
  // ═══════════════════════════════════════════════════════════════
  const animatedStyleA = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateYA.value },
      { scale: scaleA.value * pulseA.value },
    ],
    opacity: hidden ? 0 : 1,
  }));

  const animatedStyleB = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateYB.value },
      { scale: scaleB.value * pulseB.value },
    ],
    opacity: hidden ? 0 : 1,
  }));
  
  // Glow burst overlay styles
  const glowBurstStyleA = useAnimatedStyle(() => ({
    opacity: glowBurstA.value * 0.4,
  }));
  
  const glowBurstStyleB = useAnimatedStyle(() => ({
    opacity: glowBurstB.value * 0.4,
  }));

  // ═══════════════════════════════════════════════════════════════
  // TEXT SHADOW - The Secret Sauce
  // Multi-layer glow stack for that screenshot gold effect
  // ═══════════════════════════════════════════════════════════════
  const getTextShadowStyle = (variant: 'top' | 'bottom') => {
    const isWeb = Platform.OS === 'web';
    
    if (isWeb) {
      // Web: Use CSS text-shadow property
      const shadowStack = inHyperstreak
        ? (variant === 'top' ? TEXT_GLOW.TOP_BUTTON_HYPER : TEXT_GLOW.BOTTOM_BUTTON_HYPER)
        : (variant === 'top' ? TEXT_GLOW.TOP_BUTTON : TEXT_GLOW.BOTTOM_BUTTON);
      
      return {
        textShadow: shadowStack,
      } as any;
    }
    
    // Native: Use React Native shadow properties (limited but works)
    return {
      textShadowColor: 'rgba(0, 0, 0, 0.4)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 12,
    };
  };

  return (
    <View style={[styles.container, hidden && styles.hidden]}>
      {/* Double Down Banner */}
      {doubleDownActive && (
        <Animated.View style={styles.doubleDownBanner}>
          <Text style={styles.doubleDownText}>🎲 2X ACTIVE</Text>
        </Animated.View>
      )}
      
      {/* ═══════════════════════════════════════════════════════════
          OPTION A - Top Button (Purple Gradient)
      ═══════════════════════════════════════════════════════════ */}
      <AnimatedPressable
        style={[
          styles.buttonWrapper,
          styles.buttonTop,
          animatedStyleA,
          inHyperstreak && styles.hyperGlow,
        ]}
        onPressIn={() => handlePressIn('a')}
        onPressOut={() => handlePressOut('a')}
        onPress={() => handlePress('a')}
        disabled={disabled || hidden}
        accessibilityRole="button"
        accessibilityLabel={`Vote for ${optionA}`}
      >
        <LinearGradient
          colors={GRADIENTS.purple}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          {/* Glow burst overlay */}
          <Animated.View style={[styles.glowBurstOverlay, styles.glowBurstPurple, glowBurstStyleA]} />
          
          {/* Peek Badge */}
          {peekData && (
            <View style={[
              styles.peekBadge,
              peekData.leading === 'a' && styles.peekBadgeLeading,
            ]}>
              <Text style={styles.peekText}>
                {peekData.percentage_a}%{peekData.leading === 'a' && ' 👑'}
              </Text>
            </View>
          )}
          
          {/* Content: Orb Emoji Left + Text Right */}
          <View style={styles.buttonContent}>
            <View style={styles.emojiContainer}>
              <OrbEmoji
                emoji={emojiA}
                variant="top"
                isPressed={isPressedA}
                isHyperstreak={inHyperstreak}
                hidden={hidden ?? false}
                entranceDelay={ORB_ANIMATION.ENTRANCE_STAGGER}
              />
            </View>
            <Text
              style={[
                styles.buttonText,
                { fontSize: textSize },
                getTextShadowStyle('top'),
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {optionA.toUpperCase()}?
            </Text>
          </View>
        </LinearGradient>
      </AnimatedPressable>

      {/* ═══════════════════════════════════════════════════════════
          OPTION B - Bottom Button (Coral Gradient)
      ═══════════════════════════════════════════════════════════ */}
      <AnimatedPressable
        style={[
          styles.buttonWrapper,
          styles.buttonBottom,
          animatedStyleB,
          inHyperstreak && styles.hyperGlow,
        ]}
        onPressIn={() => handlePressIn('b')}
        onPressOut={() => handlePressOut('b')}
        onPress={() => handlePress('b')}
        disabled={disabled || hidden}
        accessibilityRole="button"
        accessibilityLabel={`Vote for ${optionB}`}
      >
        <LinearGradient
          colors={GRADIENTS.coral}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          {/* Glow burst overlay */}
          <Animated.View style={[styles.glowBurstOverlay, styles.glowBurstCoral, glowBurstStyleB]} />
          
          {/* Peek Badge */}
          {peekData && (
            <View style={[
              styles.peekBadge,
              peekData.leading === 'b' && styles.peekBadgeLeading,
            ]}>
              <Text style={styles.peekText}>
                {peekData.percentage_b}%{peekData.leading === 'b' && ' 👑'}
              </Text>
            </View>
          )}
          
          {/* Content: Orb Emoji Left + Text Right */}
          <View style={styles.buttonContent}>
            <View style={styles.emojiContainer}>
              <OrbEmoji
                emoji={emojiB}
                variant="bottom"
                isPressed={isPressedB}
                isHyperstreak={inHyperstreak}
                hidden={hidden ?? false}
                entranceDelay={ORB_ANIMATION.ENTRANCE_STAGGER * 2}
              />
            </View>
            <Text
              style={[
                styles.buttonText,
                { fontSize: textSize },
                getTextShadowStyle('bottom'),
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {optionB.toUpperCase()}?
            </Text>
          </View>
        </LinearGradient>
      </AnimatedPressable>
      
      {/* Hyperstreak Glow Border Overlay */}
      {inHyperstreak && !hidden && (
        <View style={styles.hyperOverlay} pointerEvents="none">
          <View style={styles.hyperBorder} />
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES - Screenshot Gold
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 0,
    gap: 4, // Small gap for shadow visibility
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  doubleDownBanner: {
    position: 'absolute',
    top: -36,
    alignSelf: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  doubleDownText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  buttonWrapper: {
    flex: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  buttonTop: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  buttonBottom: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: ORB_ANIMATION.LEFT_OFFSET,
    paddingRight: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emojiContainer: {
    width: ORB_ANIMATION.SIZE_LARGE + 20, // Extra space for animations
    height: ORB_ANIMATION.SIZE_LARGE + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk_700Bold', // Space Grotesk Bold (closest to Black/900)
    letterSpacing: -0.8, // -1.5% approximation
    textAlign: 'right',
    // Native fallback shadows (Web uses CSS text-shadow via getTextShadowStyle)
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  // Glow burst overlays
  glowBurstOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  glowBurstPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  glowBurstCoral: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  // Peek badge
  peekBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  peekBadgeLeading: {
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
  },
  peekText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  // Hyperstreak styles
  hyperGlow: {
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  hyperOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  hyperBorder: {
    flex: 1,
    borderWidth: 4,
    borderColor: COLORS.accent,
    borderRadius: 28,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 28,
  },
});
