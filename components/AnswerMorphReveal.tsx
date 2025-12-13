import React, { forwardRef, useImperativeHandle, useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
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
  interpolateColor,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ConfettiCannon } from './ConfettiCannon';
import { COLORS, GRADIENTS } from '../lib/constants';
import type { VoteResult, VoteChoice } from '../types';

// ═══════════════════════════════════════════════════════════════
// SASSY COMMENTARY - Randomized dopamine lines
// ═══════════════════════════════════════════════════════════════
const SASSY_WIN_LINES = [
  "The {percent}% are built different",
  "Psychic energy confirmed",
  "Hivemind connection: STRONG",
  "Main character energy",
  "Living rent-free in the majority",
  "You ARE the algorithm",
  "Galaxy brain moment",
  "Normie-core excellence",
  "Peak groupthink achieved",
  "The people have spoken (correctly)",
  "Touch grass? Nah, touch W's",
  "Basic? More like BASED",
];

const SASSY_LOSE_LINES = [
  "The {percent}% walk alone",
  "Psycho energy detected",
  "Built different (clinically)",
  "Main villain arc unlocked",
  "Contrarian excellence",
  "Too unique for this planet",
  "Sigma grindset confirmed",
  "Society isn't ready for you",
  "Ahead of the curve (or behind)",
  "The people are wrong anyway",
  "Not like other voters",
  "Misunderstood genius vibes",
];

function getSassyLine(won: boolean, percent: number): string {
  const pool = won ? SASSY_WIN_LINES : SASSY_LOSE_LINES;
  const line = pool[Math.floor(Math.random() * pool.length)];
  return line.replace('{percent}', String(percent));
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
  emojiA?: string;
  emojiB?: string;
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
// ANIMATED PERCENTAGE COUNTER
// ═══════════════════════════════════════════════════════════════
function AnimatedPercent({ 
  value, 
  fontSize,
  color,
}: { 
  value: SharedValue<number>; 
  fontSize: number;
  color: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue(Math.round(value.value));
    }, 16);
    
    return () => clearInterval(interval);
  }, [value]);
  
  return (
    <Text style={[styles.percentText, { fontSize, color }]}>
      {displayValue}%
    </Text>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT - In-Place Morph Reveal
// ═══════════════════════════════════════════════════════════════
export const AnswerMorphReveal = forwardRef<AnswerMorphRevealRef, AnswerMorphRevealProps>(
  ({ optionA, optionB, emojiA, emojiB, onComplete }, ref) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const isSmallScreen = screenWidth <= 375;
    
    // Responsive sizing
    const barHeight = isSmallScreen ? 70 : 80;
    const percentFontSize = isSmallScreen ? 36 : 44;
    const labelFontSize = isSmallScreen ? 14 : 16;
    const crownFontSize = isSmallScreen ? 24 : 28;
    const sassyFontSize = isSmallScreen ? 13 : 15;
    
    const [state, setState] = useState<RevealState>({
      active: false,
      result: null,
      userChoice: null,
      inHyperstreak: false,
      doubleDownActive: false,
    });
    
    const [sassyLine, setSassyLine] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const [showDoubleConfetti, setShowDoubleConfetti] = useState(false);
    
    // ═══════════════════════════════════════════════════════════
    // ANIMATION VALUES
    // ═══════════════════════════════════════════════════════════
    
    // Container & layout
    const containerOpacity = useSharedValue(0);
    const morphProgress = useSharedValue(0); // 0 = buttons, 1 = bars
    
    // Bar fills (0-1)
    const barAFill = useSharedValue(0);
    const barBFill = useSharedValue(0);
    
    // Percentage counters
    const percentA = useSharedValue(0);
    const percentB = useSharedValue(0);
    
    // Winner crown & text
    const crownScale = useSharedValue(0);
    const crownY = useSharedValue(-20);
    
    // Sassy line
    const sassyOpacity = useSharedValue(0);
    const sassyY = useSharedValue(20);
    
    // Winning bar pulse
    const winnerPulse = useSharedValue(1);
    
    // Losing orb shrink
    const loserOrbScale = useSharedValue(1);
    const loserOrbOpacity = useSharedValue(1);
    
    // Winner orb explode
    const winnerOrbScale = useSharedValue(1);
    
    // Hyper badge
    const hyperBadgeScale = useSharedValue(0);
    
    // ═══════════════════════════════════════════════════════════
    // IMPERATIVE API
    // ═══════════════════════════════════════════════════════════
    useImperativeHandle(ref, () => ({
      reveal: (result, userChoice, options = {}) => {
        // Reset all animations
        containerOpacity.value = 0;
        morphProgress.value = 0;
        barAFill.value = 0;
        barBFill.value = 0;
        percentA.value = 0;
        percentB.value = 0;
        crownScale.value = 0;
        crownY.value = -20;
        sassyOpacity.value = 0;
        sassyY.value = 20;
        winnerPulse.value = 1;
        loserOrbScale.value = 1;
        loserOrbOpacity.value = 1;
        winnerOrbScale.value = 1;
        hyperBadgeScale.value = 0;
        
        // Set state
        const userPercent = userChoice === 'a' ? result.percentage_a : result.percentage_b;
        setSassyLine(getSassyLine(result.won, userPercent));
        setShowConfetti(false);
        setShowDoubleConfetti(false);
        
        setState({
          active: true,
          result,
          userChoice,
          inHyperstreak: options.inHyperstreak ?? false,
          doubleDownActive: options.doubleDownActive ?? false,
        });
        
        // ═══════════════════════════════════════════════════════
        // ANIMATION TIMELINE - The Dopamine Bomb
        // ═══════════════════════════════════════════════════════
        
        // 0ms: Heavy haptic + show container
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        containerOpacity.value = withTiming(1, { duration: 100 });
        
        // 0-150ms: Morph buttons to bars (rotate + layout shift)
        morphProgress.value = withTiming(1, { 
          duration: 150,
          easing: Easing.out(Easing.cubic),
        });
        
        // 150-750ms: Bars fill with liquid animation
        const fillDuration = 600;
        const fillEasing = Easing.out(Easing.exp);
        
        barAFill.value = withDelay(150, withTiming(result.percentage_a / 100, {
          duration: fillDuration,
          easing: fillEasing,
        }));
        barBFill.value = withDelay(150, withTiming(result.percentage_b / 100, {
          duration: fillDuration,
          easing: fillEasing,
        }));
        
        // 150-750ms: Numbers count up
        percentA.value = withDelay(150, withTiming(result.percentage_a, {
          duration: fillDuration,
          easing: fillEasing,
        }));
        percentB.value = withDelay(150, withTiming(result.percentage_b, {
          duration: fillDuration,
          easing: fillEasing,
        }));
        
        // 400ms: Loser orb shrinks + grays
        const loserChoice = result.percentage_a >= result.percentage_b ? 'b' : 'a';
        setTimeout(() => {
          loserOrbScale.value = withTiming(0.6, { duration: 300 });
          loserOrbOpacity.value = withTiming(0.4, { duration: 300 });
        }, 400);
        
        // 500ms: Winner effects
        setTimeout(() => {
          // Winner orb explodes (triggers confetti)
          winnerOrbScale.value = withSequence(
            withTiming(1.3, { duration: 100 }),
            withTiming(1.1, { duration: 200 })
          );
          
          // Confetti!
          if (result.won) {
            setShowConfetti(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            // Double confetti for hyperstreak
            if (options.inHyperstreak) {
              setTimeout(() => setShowDoubleConfetti(true), 100);
            }
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }, 500);
        
        // 600ms: Crown slams in above winner
        crownScale.value = withDelay(600, withSequence(
          withSpring(1.4, { damping: 6, stiffness: 400 }),
          withSpring(1, { damping: 10 })
        ));
        crownY.value = withDelay(600, withSpring(0, { damping: 12, stiffness: 200 }));
        
        // 700ms: Winner bar pulse
        setTimeout(() => {
          if (result.won) {
            winnerPulse.value = withRepeat(
              withSequence(
                withTiming(1.02, { duration: 300 }),
                withTiming(1, { duration: 300 })
              ),
              3,
              true
            );
          }
        }, 700);
        
        // 800ms: Sassy line slides up
        sassyOpacity.value = withDelay(800, withTiming(1, { duration: 250 }));
        sassyY.value = withDelay(800, withSpring(0, { damping: 15 }));
        
        // 900ms: Hyper badge (if applicable)
        if (options.inHyperstreak) {
          hyperBadgeScale.value = withDelay(900, withSequence(
            withSpring(1.3, { damping: 6 }),
            withSpring(1, { damping: 10 })
          ));
        }
        
        // 2200ms: Auto-dismiss
        setTimeout(() => {
          containerOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
            if (finished) {
              runOnJS(handleDismiss)();
            }
          });
        }, 2200);
      },
      
      dismiss: () => {
        containerOpacity.value = withTiming(0, { duration: 150 });
        setTimeout(() => {
          setState(s => ({ ...s, active: false }));
        }, 150);
      },
    }));
    
    const handleDismiss = useCallback(() => {
      setState(s => ({ ...s, active: false }));
      setShowConfetti(false);
      setShowDoubleConfetti(false);
      cancelAnimation(winnerPulse);
      onComplete();
    }, [onComplete]);
    
    // ═══════════════════════════════════════════════════════════
    // ANIMATED STYLES
    // ═══════════════════════════════════════════════════════════
    
    const containerStyle = useAnimatedStyle(() => ({
      opacity: containerOpacity.value,
      pointerEvents: containerOpacity.value > 0 ? 'box-none' : 'none',
    }));
    
    // Derive values from state
    const { result, userChoice, inHyperstreak, active } = state;
    
    if (!active || !result) return null;
    
    const winnerIsA = result.percentage_a >= result.percentage_b;
    const userChoseA = userChoice === 'a';
    const userWon = result.won;
    const userPercent = userChoseA ? result.percentage_a : result.percentage_b;
    
    return (
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Semi-transparent backdrop with win/lose tint */}
        <View style={[
          styles.backdrop,
          { backgroundColor: userWon 
            ? 'rgba(0, 40, 30, 0.95)' 
            : 'rgba(40, 10, 20, 0.95)' 
          }
        ]} />
        
        {/* Main content area */}
        <View style={styles.content}>
          {/* Crown + "XX% SAME" header */}
          <CrownHeader 
            won={userWon}
            percent={userPercent}
            crownScale={crownScale}
            crownY={crownY}
            fontSize={crownFontSize}
            inHyperstreak={inHyperstreak}
            hyperBadgeScale={hyperBadgeScale}
          />
          
          {/* Morphed bars */}
          <View style={styles.barsContainer}>
            {/* Bar A */}
            <MorphBar
              label={optionA}
              emoji={emojiA}
              percentValue={percentA}
              fillValue={barAFill}
              isWinner={winnerIsA}
              isUserChoice={userChoseA}
              barHeight={barHeight}
              percentFontSize={percentFontSize}
              labelFontSize={labelFontSize}
              winnerPulse={winnerIsA ? winnerPulse : undefined}
              orbScale={winnerIsA ? winnerOrbScale : loserOrbScale}
              orbOpacity={winnerIsA ? undefined : loserOrbOpacity}
            />
            
            {/* Bar B */}
            <MorphBar
              label={optionB}
              emoji={emojiB}
              percentValue={percentB}
              fillValue={barBFill}
              isWinner={!winnerIsA}
              isUserChoice={!userChoseA}
              barHeight={barHeight}
              percentFontSize={percentFontSize}
              labelFontSize={labelFontSize}
              winnerPulse={!winnerIsA ? winnerPulse : undefined}
              orbScale={!winnerIsA ? winnerOrbScale : loserOrbScale}
              orbOpacity={!winnerIsA ? undefined : loserOrbOpacity}
            />
          </View>
          
          {/* Sassy commentary */}
          <SassyLine 
            line={sassyLine}
            opacity={sassyOpacity}
            translateY={sassyY}
            fontSize={sassyFontSize}
            won={userWon}
          />
        </View>
        
        {/* Confetti cannons */}
        {showConfetti && (
          <ConfettiCannon
            shoot={true}
            variant={inHyperstreak ? 'milestone' : 'correct'}
            onComplete={() => setShowConfetti(false)}
          />
        )}
        {showDoubleConfetti && (
          <ConfettiCannon
            shoot={true}
            variant="milestone"
            onComplete={() => setShowDoubleConfetti(false)}
          />
        )}
      </Animated.View>
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function CrownHeader({
  won,
  percent,
  crownScale,
  crownY,
  fontSize,
  inHyperstreak,
  hyperBadgeScale,
}: {
  won: boolean;
  percent: number;
  crownScale: SharedValue<number>;
  crownY: SharedValue<number>;
  fontSize: number;
  inHyperstreak: boolean;
  hyperBadgeScale: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: crownScale.value },
      { translateY: crownY.value },
    ],
  }));
  
  const hyperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hyperBadgeScale.value }],
    opacity: hyperBadgeScale.value,
  }));
  
  const color = won ? COLORS.accent : COLORS.secondary;
  const text = won ? `${percent}% SAME!` : `${percent}% NOPE`;
  const emoji = won ? '👑' : '💀';
  
  return (
    <View style={styles.crownContainer}>
      <Animated.View style={[styles.crownContent, style]}>
        <Text style={[styles.crownEmoji, { fontSize: fontSize * 1.5 }]}>{emoji}</Text>
        <Text style={[styles.crownText, { fontSize, color }]}>{text}</Text>
      </Animated.View>
      
      {/* Hyper 2X Badge */}
      {inHyperstreak && (
        <Animated.View style={[styles.hyperBadge, hyperStyle]}>
          <Text style={styles.hyperBadgeText}>⚡ 2X BLAST ⚡</Text>
        </Animated.View>
      )}
    </View>
  );
}

function MorphBar({
  label,
  emoji,
  percentValue,
  fillValue,
  isWinner,
  isUserChoice,
  barHeight,
  percentFontSize,
  labelFontSize,
  winnerPulse,
  orbScale,
  orbOpacity,
}: {
  label: string;
  emoji?: string;
  percentValue: SharedValue<number>;
  fillValue: SharedValue<number>;
  isWinner: boolean;
  isUserChoice: boolean;
  barHeight: number;
  percentFontSize: number;
  labelFontSize: number;
  winnerPulse?: SharedValue<number>;
  orbScale: SharedValue<number>;
  orbOpacity?: SharedValue<number>;
}) {
  const barStyle = useAnimatedStyle(() => {
    const pulse = winnerPulse?.value ?? 1;
    return {
      height: barHeight,
      transform: [{ scale: pulse }],
    };
  });
  
  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillValue.value * 100}%`,
    height: '100%',
  }));
  
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity?.value ?? 1,
  }));
  
  const fillColors: readonly [string, string, ...string[]] = isWinner 
    ? ['#00FFBD', '#00FFA3'] // Emerald gradient
    : ['#FF3B6E', '#FF5C8A']; // Coral gradient
  
  const percentColor = isWinner ? '#00FFBD' : '#FF3B6E';
  
  return (
    <Animated.View style={[
      styles.bar,
      barStyle,
      isUserChoice && styles.userChoiceBar,
    ]}>
      {/* Background track */}
      <View style={styles.barBackground}>
        {/* Animated fill */}
        <Animated.View style={[styles.barFill, fillStyle]}>
          <LinearGradient
            colors={fillColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      
      {/* Content overlay */}
      <View style={styles.barContent}>
        {/* Emoji orb */}
        {emoji && (
          <Animated.View style={[styles.barEmoji, orbStyle]}>
            <Text style={styles.emojiText}>{emoji}</Text>
          </Animated.View>
        )}
        
        {/* Percentage */}
        <AnimatedPercent 
          value={percentValue} 
          fontSize={percentFontSize}
          color={percentColor}
        />
        
        {/* Label + user indicator */}
        <View style={styles.labelContainer}>
          <Text style={[styles.barLabel, { fontSize: labelFontSize }]} numberOfLines={1}>
            {label.toUpperCase()}
          </Text>
          {isUserChoice && (
            <Text style={styles.youIndicator}>← YOU</Text>
          )}
        </View>
      </View>
      
      {/* Winner glow */}
      {isWinner && (
        <View style={[styles.winnerGlow, { 
          shadowColor: '#00FFBD',
        }]} />
      )}
    </Animated.View>
  );
}

function SassyLine({
  line,
  opacity,
  translateY,
  fontSize,
  won,
}: {
  line: string;
  opacity: SharedValue<number>;
  translateY: SharedValue<number>;
  fontSize: number;
  won: boolean;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return (
    <Animated.View style={[styles.sassyContainer, style]}>
      <Text style={[
        styles.sassyText,
        { fontSize, color: won ? 'rgba(0, 255, 189, 0.8)' : 'rgba(255, 59, 110, 0.8)' }
      ]}>
        {line}
      </Text>
    </Animated.View>
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
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  
  // Crown header
  crownContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  crownContent: {
    alignItems: 'center',
  },
  crownEmoji: {
    marginBottom: 8,
  },
  crownText: {
    fontFamily: 'Righteous_400Regular',
    letterSpacing: 4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  hyperBadge: {
    marginTop: 12,
    backgroundColor: '#00FFBD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#00FFBD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  hyperBadgeText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Righteous_400Regular',
    letterSpacing: 2,
  },
  
  // Bars
  barsContainer: {
    gap: 12,
    paddingHorizontal: 8,
  },
  bar: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  barContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  barEmoji: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 32,
  },
  percentText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    minWidth: 80,
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barLabel: {
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1,
  },
  youIndicator: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  userChoiceBar: {
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.6)',
  },
  winnerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    pointerEvents: 'none',
  },
  
  // Sassy line
  sassyContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  sassyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

AnswerMorphReveal.displayName = 'AnswerMorphReveal';
