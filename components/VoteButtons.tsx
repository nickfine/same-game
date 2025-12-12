import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { playSoundGlobal } from '../hooks/useSound';
import { COLORS, GRADIENTS } from '../lib/constants';
import type { VoteChoice } from '../types';

// ═══════════════════════════════════════════════════════════════
// TYPES
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
const AnimatedText = Animated.createAnimatedComponent(Text);

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
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
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  
  // Button animation values
  const scaleA = useSharedValue(0.95);
  const scaleB = useSharedValue(0.95);
  const translateYA = useSharedValue(100);
  const translateYB = useSharedValue(100);
  const pulseA = useSharedValue(1);
  const pulseB = useSharedValue(1);
  
  // Emoji pop-in animation values (scale 0 → 1.3 → 1)
  const emojiScaleA = useSharedValue(0);
  const emojiScaleB = useSharedValue(0);
  
  // Hyperstreak emoji glow pulse
  const emojiGlowRadius = useSharedValue(8);
  
  // Responsive sizing - optimized for emoji-first design
  const emojiSize = 48; // Fixed 48pt as specified
  const textSize = 56;  // Fixed 56pt bold as specified
  const buttonHeight = (screenHeight * 0.70) / 2 - 8; // 70% of screen, split by 2, minus gap

  // ═══════════════════════════════════════════════════════════════
  // ENTRANCE ANIMATION + EMOJI POP-IN
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!hidden) {
      // Reset emoji scales
      emojiScaleA.value = 0;
      emojiScaleB.value = 0;
      
      // Staggered slide-up + overshoot scale for buttons
      translateYA.value = withDelay(0, withSpring(0, { damping: 18, stiffness: 180 }));
      scaleA.value = withDelay(0, withSequence(
        withSpring(1.05, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15 })
      ));
      
      translateYB.value = withDelay(100, withSpring(0, { damping: 18, stiffness: 180 }));
      scaleB.value = withDelay(100, withSequence(
        withSpring(1.05, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15 })
      ));
      
      // Emoji pop-in: scale 0 → 1.3 → 1 with micro-delay
      emojiScaleA.value = withDelay(150, withSequence(
        withSpring(1.3, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12 })
      ));
      emojiScaleB.value = withDelay(230, withSequence( // 80ms stagger
        withSpring(1.3, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12 })
      ));
    } else {
      translateYA.value = 100;
      translateYB.value = 100;
      scaleA.value = 0.95;
      scaleB.value = 0.95;
      emojiScaleA.value = 0;
      emojiScaleB.value = 0;
    }
  }, [hidden, optionA, optionB]); // Re-trigger on question change

  // ═══════════════════════════════════════════════════════════════
  // CONTINUOUS PULSE ANIMATION (2x speed in Hyperstreak)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const duration = inHyperstreak ? 350 : 700;
    
    pulseA.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    pulseB.value = withDelay(duration / 2, withRepeat(
      withSequence(
        withTiming(1.02, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));
    
    // Hyperstreak emoji glow pulse
    if (inHyperstreak) {
      emojiGlowRadius.value = withRepeat(
        withSequence(
          withTiming(20, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(8, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      emojiGlowRadius.value = 8;
    }
    
    return () => {
      cancelAnimation(pulseA);
      cancelAnimation(pulseB);
      cancelAnimation(emojiGlowRadius);
    };
  }, [inHyperstreak]);

  // ═══════════════════════════════════════════════════════════════
  // PRESS HANDLERS
  // ═══════════════════════════════════════════════════════════════
  const handlePressIn = (option: 'a' | 'b') => {
    if (disabled) return;
    
    if (option === 'a') {
      scaleA.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    } else {
      scaleB.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = (option: 'a' | 'b') => {
    if (option === 'a') {
      scaleA.value = withSpring(1.0, { damping: 15 });
    } else {
      scaleB.value = withSpring(1.0, { damping: 15 });
    }
  };

  const handlePress = (choice: VoteChoice) => {
    if (disabled) return;
    
    // THUNDER haptic on vote
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
  
  // Emoji animated styles with pop-in and hyperstreak glow
  const emojiStyleA = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScaleA.value }],
    textShadowColor: inHyperstreak ? '#00FFBD' : 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: inHyperstreak ? 0 : 2 },
    textShadowRadius: inHyperstreak ? emojiGlowRadius.value : 4,
  }));
  
  const emojiStyleB = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScaleB.value }],
    textShadowColor: inHyperstreak ? '#00FFBD' : 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: inHyperstreak ? 0 : 2 },
    textShadowRadius: inHyperstreak ? emojiGlowRadius.value : 4,
  }));

  return (
    <View style={[styles.container, hidden && styles.hidden]}>
      {/* Double Down Active Indicator */}
      {doubleDownActive && (
        <Animated.View style={styles.doubleDownBanner}>
          <Text style={styles.doubleDownText}>🎲 2X POINTS ACTIVE</Text>
        </Animated.View>
      )}
      
      {/* Option A - Top Button (Purple Gradient) */}
      <AnimatedPressable
        style={[
          styles.buttonWrapper,
          styles.buttonTop,
          { height: buttonHeight },
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
          {/* Peek Badge */}
          {peekData && (
            <View style={[
              styles.peekBadge,
              peekData.leading === 'a' && styles.peekBadgeLeading,
            ]}>
              <Text style={styles.peekText}>
                {peekData.percentage_a}%
                {peekData.leading === 'a' && ' 👑'}
              </Text>
            </View>
          )}
          
          <View style={styles.buttonContent}>
            {/* Emoji 48pt left */}
            <AnimatedText style={[styles.buttonEmoji, { fontSize: emojiSize }, emojiStyleA]}>
              {emojiA}
            </AnimatedText>
            {/* Text 56pt bold right */}
            <Text
              style={[styles.buttonText, { fontSize: textSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {optionA.toUpperCase()}?
            </Text>
          </View>
        </LinearGradient>
      </AnimatedPressable>

      {/* Option B - Bottom Button (Coral Gradient) */}
      <AnimatedPressable
        style={[
          styles.buttonWrapper,
          styles.buttonBottom,
          { height: buttonHeight },
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
          {/* Peek Badge */}
          {peekData && (
            <View style={[
              styles.peekBadge,
              peekData.leading === 'b' && styles.peekBadgeLeading,
            ]}>
              <Text style={styles.peekText}>
                {peekData.percentage_b}%
                {peekData.leading === 'b' && ' 👑'}
              </Text>
            </View>
          )}
          
          <View style={styles.buttonContent}>
            {/* Emoji 48pt left */}
            <AnimatedText style={[styles.buttonEmoji, { fontSize: emojiSize }, emojiStyleB]}>
              {emojiB}
            </AnimatedText>
            {/* Text 56pt bold right */}
            <Text
              style={[styles.buttonText, { fontSize: textSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {optionB.toUpperCase()}?
            </Text>
          </View>
        </LinearGradient>
      </AnimatedPressable>
      
      {/* Hyperstreak Glow Overlay */}
      {inHyperstreak && !hidden && (
        <View style={styles.hyperOverlay} pointerEvents="none">
          <View style={styles.hyperBorder} />
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 0, // Edge-to-edge
    gap: 0, // No gap between buttons
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  doubleDownBanner: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  doubleDownText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
  },
  buttonWrapper: {
    flex: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonTop: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  buttonBottom: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  buttonEmoji: {
    // Emoji styling - will be animated
  },
  buttonText: {
    color: COLORS.white,
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 2,
    flexShrink: 1,
  },
  peekBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  peekBadgeLeading: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
  },
  peekText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  hyperGlow: {
    borderWidth: 3,
    borderColor: '#00FFBD',
  },
  hyperOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  hyperBorder: {
    flex: 1,
    borderWidth: 4,
    borderColor: '#00FFBD',
    borderRadius: 32,
    shadowColor: '#00FFBD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
});
