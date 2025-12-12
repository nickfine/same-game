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
  FadeIn,
  SlideInDown,
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
  onVote: (choice: VoteChoice) => void;
  disabled?: boolean;
  hidden?: boolean;
  inHyperstreak?: boolean;
  peekData?: PeekData | null;
  doubleDownActive?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ═══════════════════════════════════════════════════════════════
// ICON HEURISTICS - Smart icon selection based on option text
// ═══════════════════════════════════════════════════════════════
function getIconForOption(option: string): string {
  const lower = option.toLowerCase();
  
  // Transportation
  if (lower.includes('electric') || lower.includes('tesla') || lower.includes('ev')) return '⚡';
  if (lower.includes('gas') || lower.includes('petrol') || lower.includes('diesel')) return '⛽';
  if (lower.includes('car') || lower.includes('drive')) return '🚗';
  if (lower.includes('plane') || lower.includes('fly')) return '✈️';
  if (lower.includes('train')) return '🚂';
  if (lower.includes('bike') || lower.includes('cycle')) return '🚴';
  
  // Food
  if (lower.includes('pizza')) return '🍕';
  if (lower.includes('burger')) return '🍔';
  if (lower.includes('coffee')) return '☕';
  if (lower.includes('tea')) return '🍵';
  if (lower.includes('beer') || lower.includes('drink')) return '🍺';
  if (lower.includes('wine')) return '🍷';
  if (lower.includes('taco')) return '🌮';
  if (lower.includes('sushi')) return '🍣';
  
  // Tech
  if (lower.includes('iphone') || lower.includes('apple')) return '🍎';
  if (lower.includes('android') || lower.includes('samsung')) return '🤖';
  if (lower.includes('mac') || lower.includes('laptop')) return '💻';
  if (lower.includes('game') || lower.includes('play')) return '🎮';
  
  // Entertainment
  if (lower.includes('movie') || lower.includes('film')) return '🎬';
  if (lower.includes('music') || lower.includes('song')) return '🎵';
  if (lower.includes('netflix')) return '📺';
  if (lower.includes('book') || lower.includes('read')) return '📚';
  
  // Social
  if (lower.includes('instagram') || lower.includes('insta')) return '📸';
  if (lower.includes('twitter') || lower.includes('x')) return '🐦';
  if (lower.includes('tiktok')) return '🎵';
  
  // Activities
  if (lower.includes('gym') || lower.includes('workout')) return '💪';
  if (lower.includes('beach')) return '🏖️';
  if (lower.includes('mountain') || lower.includes('hike')) return '⛰️';
  if (lower.includes('sleep') || lower.includes('nap')) return '😴';
  if (lower.includes('party')) return '🎉';
  
  // Time
  if (lower.includes('morning')) return '🌅';
  if (lower.includes('night') || lower.includes('evening')) return '🌙';
  if (lower.includes('weekend')) return '🎊';
  
  // Emotions/Concepts
  if (lower.includes('yes') || lower.includes('agree')) return '✅';
  if (lower.includes('no') || lower.includes('disagree')) return '❌';
  if (lower.includes('love')) return '❤️';
  if (lower.includes('money') || lower.includes('rich')) return '💰';
  if (lower.includes('hot') || lower.includes('fire')) return '🔥';
  if (lower.includes('cold') || lower.includes('ice')) return '❄️';
  
  // Default fallback based on position (will be overridden)
  return '';
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export function VoteButtons({
  optionA,
  optionB,
  onVote,
  disabled,
  hidden,
  inHyperstreak = false,
  peekData,
  doubleDownActive,
}: VoteButtonsProps) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  
  // Animation values
  const scaleA = useSharedValue(0.95);
  const scaleB = useSharedValue(0.95);
  const translateYA = useSharedValue(100);
  const translateYB = useSharedValue(100);
  const pulseA = useSharedValue(1);
  const pulseB = useSharedValue(1);
  const pressedA = useSharedValue(false);
  const pressedB = useSharedValue(false);
  
  // Responsive sizing
  const fontSize = screenHeight < 700 ? 40 : screenHeight > 900 ? 52 : 48;
  const iconSize = screenHeight < 700 ? 32 : screenHeight > 900 ? 44 : 38;
  const buttonHeight = (screenHeight * 0.65) / 2 - 8; // 65% of screen, split by 2, minus gap
  
  // Get icons
  const iconA = getIconForOption(optionA) || '🟣';
  const iconB = getIconForOption(optionB) || '🟠';

  // ═══════════════════════════════════════════════════════════════
  // ENTRANCE ANIMATION
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!hidden) {
      // Staggered slide-up + overshoot scale
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
    } else {
      translateYA.value = 100;
      translateYB.value = 100;
      scaleA.value = 0.95;
      scaleB.value = 0.95;
    }
  }, [hidden]);

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
    
    return () => {
      cancelAnimation(pulseA);
      cancelAnimation(pulseB);
    };
  }, [inHyperstreak]);

  // ═══════════════════════════════════════════════════════════════
  // PRESS HANDLERS
  // ═══════════════════════════════════════════════════════════════
  const handlePressIn = (option: 'a' | 'b') => {
    if (disabled) return;
    
    if (option === 'a') {
      scaleA.value = withSpring(0.96, { damping: 15, stiffness: 300 });
      pressedA.value = true;
    } else {
      scaleB.value = withSpring(0.96, { damping: 15, stiffness: 300 });
      pressedB.value = true;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = (option: 'a' | 'b') => {
    if (option === 'a') {
      scaleA.value = withSpring(1.0, { damping: 15 });
      pressedA.value = false;
    } else {
      scaleB.value = withSpring(1.0, { damping: 15 });
      pressedB.value = false;
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

  return (
    <View style={[styles.container, hidden && styles.hidden]}>
      {/* Double Down Active Indicator */}
      {doubleDownActive && (
        <Animated.View 
          entering={FadeIn.duration(200)}
          style={styles.doubleDownBanner}
        >
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
            <Text style={[styles.buttonIcon, { fontSize: iconSize }]}>{iconA}</Text>
            <Text
              style={[styles.buttonText, { fontSize }]}
              numberOfLines={2}
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
            <Text style={[styles.buttonIcon, { fontSize: iconSize }]}>{iconB}</Text>
            <Text
              style={[styles.buttonText, { fontSize }]}
              numberOfLines={2}
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
    gap: 16,
  },
  buttonIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonText: {
    color: COLORS.white,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 1,
    flex: 1,
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
