import React, { forwardRef, useImperativeHandle, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ConfettiCannon } from './ConfettiCannon';
import { COLORS } from '../lib/constants';
import type { VoteResult, VoteChoice } from '../types';

// ═══════════════════════════════════════════════════════════════
// RESULT MESSAGES - Crystal clear win/lose feedback
// ═══════════════════════════════════════════════════════════════
const WIN_MESSAGES = [
  "NAILED IT",
  "PSYCHIC",
  "BIG BRAIN",
  "HIVEMIND",
  "LEGEND",
  "GOAT",
];

const LOSE_MESSAGES = [
  "RARE TAKE",
  "SOLO MISSION",
  "BUILT DIFFERENT",
  "UNIQUE",
  "CONTRARIAN",
  "REBEL",
];

function getResultMessage(won: boolean): string {
  const pool = won ? WIN_MESSAGES : LOSE_MESSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
export interface AnswerMorphRevealRef {
  reveal: (
    result: VoteResult,
    userChoice: VoteChoice,
    options?: {
      inHyperstreak?: boolean;
      doubleDownActive?: boolean;
    }
  ) => void;
  dismiss: () => void;
}

interface AnswerMorphRevealProps {
  optionA: string;
  optionB: string;
  onComplete: () => void;
}

interface RevealState {
  active: boolean;
  result: VoteResult | null;
  userChoice: VoteChoice | null;
  inHyperstreak: boolean;
  doubleDownActive: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export const AnswerMorphReveal = forwardRef<AnswerMorphRevealRef, AnswerMorphRevealProps>(
  ({ optionA, optionB, onComplete }, ref) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    
    const [state, setState] = useState<RevealState>({
      active: false,
      result: null,
      userChoice: null,
      inHyperstreak: false,
      doubleDownActive: false,
    });
    
    const [resultMessage, setResultMessage] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    
    // Animation values
    const containerOpacity = useSharedValue(0);
    const resultScale = useSharedValue(0);
    const resultRotation = useSharedValue(0);
    const barAFill = useSharedValue(0);
    const barBFill = useSharedValue(0);
    const percentA = useSharedValue(0);
    const percentB = useSharedValue(0);
    const messageOpacity = useSharedValue(0);
    const messageY = useSharedValue(30);
    const pulseScale = useSharedValue(1);
    const hyperBadgeScale = useSharedValue(0);
    
    // Responsive sizing
    const barHeight = screenHeight < 700 ? 60 : screenHeight > 900 ? 80 : 70;
    const fontSize = screenHeight < 700 ? 28 : screenHeight > 900 ? 36 : 32;
    const labelSize = screenHeight < 700 ? 12 : 14;
    const resultEmojiSize = screenHeight < 700 ? 80 : screenHeight > 900 ? 120 : 100;
    const resultTextSize = screenHeight < 700 ? 48 : screenHeight > 900 ? 72 : 60;

    // Imperative API
    useImperativeHandle(ref, () => ({
      reveal: (result, userChoice, options = {}) => {
        // Reset animations
        containerOpacity.value = 0;
        resultScale.value = 0;
        resultRotation.value = -15;
        barAFill.value = 0;
        barBFill.value = 0;
        percentA.value = 0;
        percentB.value = 0;
        messageOpacity.value = 0;
        messageY.value = 30;
        pulseScale.value = 1;
        hyperBadgeScale.value = 0;
        
        setResultMessage(getResultMessage(result.won));
        setShowConfetti(false);
        
        setState({
          active: true,
          result,
          userChoice,
          inHyperstreak: options.inHyperstreak ?? false,
          doubleDownActive: options.doubleDownActive ?? false,
        });
        
        // ═══════════════════════════════════════════════════════════
        // ANIMATION TIMELINE - Dramatic reveal
        // ═══════════════════════════════════════════════════════════
        
        // 0ms: Heavy haptic + show container with color
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        containerOpacity.value = withTiming(1, { duration: 150 });
        
        // 0-300ms: Big result emoji/text slam in with rotation
        resultScale.value = withDelay(50, withSequence(
          withSpring(1.4, { damping: 6, stiffness: 400 }),
          withSpring(1, { damping: 10 })
        ));
        resultRotation.value = withDelay(50, withSpring(0, { damping: 12, stiffness: 200 }));
        
        // 200ms: Start pulse animation for result (win only)
        if (result.won) {
          setTimeout(() => {
            pulseScale.value = withRepeat(
              withSequence(
                withTiming(1.05, { duration: 400 }),
                withTiming(1, { duration: 400 })
              ),
              3,
              true
            );
          }, 300);
        }
        
        // 400-900ms: Bars fill up
        barAFill.value = withDelay(400, withTiming(result.percentage_a / 100, {
          duration: 500,
          easing: Easing.out(Easing.exp),
        }));
        barBFill.value = withDelay(400, withTiming(result.percentage_b / 100, {
          duration: 500,
          easing: Easing.out(Easing.exp),
        }));
        percentA.value = withDelay(400, withTiming(result.percentage_a, {
          duration: 500,
          easing: Easing.out(Easing.exp),
        }));
        percentB.value = withDelay(400, withTiming(result.percentage_b, {
          duration: 500,
          easing: Easing.out(Easing.exp),
        }));
        
        // 600ms: Message slide up
        messageOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
        messageY.value = withDelay(600, withSpring(0, { damping: 15 }));
        
        // 500ms: Confetti (win only) or shake (lose)
        setTimeout(() => {
          if (result.won) {
            setShowConfetti(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }, 500);
        
        // Hyperstreak badge
        if (options.inHyperstreak) {
          hyperBadgeScale.value = withDelay(700, withSequence(
            withSpring(1.2, { damping: 8 }),
            withSpring(1, { damping: 10 })
          ));
        }
        
        // 2500ms: Auto-dismiss
        setTimeout(() => {
          containerOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
            if (finished) {
              runOnJS(handleDismiss)();
            }
          });
        }, 2500);
      },
      
      dismiss: () => {
        containerOpacity.value = withTiming(0, { duration: 200 });
        setTimeout(() => {
          setState(s => ({ ...s, active: false }));
        }, 200);
      },
    }));
    
    const handleDismiss = useCallback(() => {
      setState(s => ({ ...s, active: false }));
      setShowConfetti(false);
      cancelAnimation(pulseScale);
      onComplete();
    }, [onComplete]);
    
    // ═══════════════════════════════════════════════════════════════
    // ANIMATED STYLES
    // ═══════════════════════════════════════════════════════════════
    
    const containerStyle = useAnimatedStyle(() => ({
      opacity: containerOpacity.value,
    }));
    
    const resultStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: resultScale.value * pulseScale.value },
        { rotate: `${resultRotation.value}deg` },
      ],
    }));
    
    const barAStyle = useAnimatedStyle(() => ({
      height: barHeight,
    }));
    
    const barBStyle = useAnimatedStyle(() => ({
      height: barHeight,
    }));
    
    const fillAStyle = useAnimatedStyle(() => ({
      width: `${barAFill.value * 100}%`,
      height: '100%',
    }));
    
    const fillBStyle = useAnimatedStyle(() => ({
      width: `${barBFill.value * 100}%`,
      height: '100%',
    }));
    
    const messageStyle = useAnimatedStyle(() => ({
      opacity: messageOpacity.value,
      transform: [{ translateY: messageY.value }],
    }));
    
    const hyperBadgeStyle = useAnimatedStyle(() => ({
      transform: [{ scale: hyperBadgeScale.value }],
      opacity: hyperBadgeScale.value,
    }));
    
    // Derived values
    const { result, userChoice, inHyperstreak, active } = state;
    
    if (!active || !result) return null;
    
    const winnerIsA = result.percentage_a >= result.percentage_b;
    const userChoseA = userChoice === 'a';
    const userWon = result.won;
    const userPercent = userChoseA ? result.percentage_a : result.percentage_b;
    
    // Colors based on win/lose
    const backdropColor = userWon 
      ? 'rgba(0, 40, 30, 0.97)' // Dark green tint
      : 'rgba(40, 10, 20, 0.97)'; // Dark red tint
    
    const resultColor = userWon ? '#00FFBD' : '#FF3B6E';
    const resultEmoji = userWon ? '✓' : '✗';
    const resultLabel = userWon ? 'SAME!' : 'NOPE';
    
    return (
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Background overlay with win/lose color */}
        <View style={[styles.backdrop, { backgroundColor: backdropColor }]} />
        
        {/* Glow effect */}
        <View style={[
          styles.glowOverlay,
          { backgroundColor: userWon ? 'rgba(0, 255, 189, 0.1)' : 'rgba(255, 59, 110, 0.1)' }
        ]} />
        
        {/* BIG Result indicator */}
        <Animated.View style={[styles.resultContainer, resultStyle]}>
          <Text style={[
            styles.resultEmoji,
            { 
              fontSize: resultEmojiSize,
              color: resultColor,
              textShadowColor: resultColor,
            }
          ]}>
            {resultEmoji}
          </Text>
          <Text style={[
            styles.resultLabel,
            { 
              fontSize: resultTextSize,
              color: resultColor,
              textShadowColor: resultColor,
            }
          ]}>
            {resultLabel}
          </Text>
        </Animated.View>
        
        {/* Your percentage */}
        <Animated.View style={[styles.yourResultContainer, messageStyle]}>
          <Text style={[styles.yourResultText, { color: resultColor }]}>
            You: {userPercent}%
          </Text>
          <Text style={styles.resultMessageText}>{resultMessage}</Text>
        </Animated.View>
        
        {/* Hyperstreak Badge */}
        {inHyperstreak && (
          <Animated.View style={[styles.hyperBadge, hyperBadgeStyle]}>
            <Text style={styles.hyperBadgeText}>⚡ 2X POINTS ⚡</Text>
          </Animated.View>
        )}
        
        {/* Compact Bars */}
        <View style={styles.barsContainer}>
          {/* Bar A */}
          <Animated.View style={[
            styles.bar,
            barAStyle,
            userChoseA && styles.userChoiceBar,
          ]}>
            <View style={styles.barBackground}>
              <Animated.View style={[styles.barFill, fillAStyle]}>
                <LinearGradient
                  colors={winnerIsA ? ['#00FFBD', '#00FFA3'] : ['#FF3B6E', '#FF5C8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            
            <View style={styles.barContent}>
              <AnimatedPercent value={percentA} fontSize={fontSize} />
              <Text style={[styles.barLabel, { fontSize: labelSize }]} numberOfLines={1}>
                {optionA}
                {userChoseA && ' ← YOU'}
              </Text>
            </View>
          </Animated.View>
          
          {/* Bar B */}
          <Animated.View style={[
            styles.bar,
            barBStyle,
            !userChoseA && styles.userChoiceBar,
          ]}>
            <View style={styles.barBackground}>
              <Animated.View style={[styles.barFill, fillBStyle]}>
                <LinearGradient
                  colors={!winnerIsA ? ['#00FFBD', '#00FFA3'] : ['#FF3B6E', '#FF5C8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            
            <View style={styles.barContent}>
              <AnimatedPercent value={percentB} fontSize={fontSize} />
              <Text style={[styles.barLabel, { fontSize: labelSize }]} numberOfLines={1}>
                {optionB}
                {!userChoseA && ' ← YOU'}
              </Text>
            </View>
          </Animated.View>
        </View>
        
        {/* Confetti - only on wins */}
        {showConfetti && userWon && (
          <ConfettiCannon
            shoot={true}
            variant={inHyperstreak ? 'milestone' : 'correct'}
            onComplete={() => setShowConfetti(false)}
          />
        )}
      </Animated.View>
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// ANIMATED PERCENT COUNTER
// ═══════════════════════════════════════════════════════════════
function AnimatedPercent({ value, fontSize }: { value: Animated.SharedValue<number>; fontSize: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue(Math.round(value.value));
    }, 16);
    
    return () => clearInterval(interval);
  }, [value]);
  
  return (
    <Text style={[styles.percentText, { fontSize }]}>
      {displayValue}%
    </Text>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultEmoji: {
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  resultLabel: {
    fontFamily: 'Righteous_400Regular',
    letterSpacing: 8,
    marginTop: -10,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  yourResultContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  yourResultText: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 2,
  },
  resultMessageText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    letterSpacing: 3,
  },
  hyperBadge: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: '#00FFBD',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#00FFBD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  hyperBadgeText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Righteous_400Regular',
    letterSpacing: 2,
  },
  barsContainer: {
    width: '100%',
    gap: 8,
    paddingHorizontal: 8,
  },
  bar: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  barContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  percentText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  barLabel: {
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userChoiceBar: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});

AnswerMorphReveal.displayName = 'AnswerMorphReveal';
