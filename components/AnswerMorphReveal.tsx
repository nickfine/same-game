import React, { forwardRef, useImperativeHandle, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
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
// SASSY COMMENTARY - Randomized dopamine text
// ═══════════════════════════════════════════════════════════════
const SASSY_LINES = {
  winner_landslide: [
    "{loser} fans in shambles",
    "The {loserPercent}% are built different",
    "{winner} supremacy confirmed",
    "Not even close tbh",
    "Unanimous energy",
  ],
  winner_close: [
    "That was TIGHT",
    "Photo finish energy",
    "{loserPercent}% almost had it",
    "Neck and neck fr",
    "Could've gone either way",
  ],
  user_won: [
    "You're literally psychic",
    "Main character behavior",
    "The algorithm fears you",
    "Built different",
    "Same energy as everyone",
  ],
  user_lost: [
    "Contrarian detected",
    "Bold take, wrong crowd",
    "You zigged when they zagged",
    "Rare opinion unlocked",
    "Not like other voters",
  ],
};

function getSassyLine(
  userWon: boolean,
  winnerPercent: number,
  winner: string,
  loser: string,
  loserPercent: number
): string {
  let pool: string[];
  
  if (userWon) {
    pool = SASSY_LINES.user_won;
  } else {
    pool = SASSY_LINES.user_lost;
  }
  
  // Add context-based lines
  if (winnerPercent >= 70) {
    pool = [...pool, ...SASSY_LINES.winner_landslide];
  } else if (winnerPercent <= 55) {
    pool = [...pool, ...SASSY_LINES.winner_close];
  }
  
  const line = pool[Math.floor(Math.random() * pool.length)];
  
  return line
    .replace('{winner}', winner)
    .replace('{loser}', loser)
    .replace('{loserPercent}', loserPercent.toString())
    .replace('{winnerPercent}', winnerPercent.toString());
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
    
    const [sassyLine, setSassyLine] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    
    // Animation values
    const containerOpacity = useSharedValue(0);
    const layoutProgress = useSharedValue(0); // 0 = vertical, 1 = horizontal
    const barAFill = useSharedValue(0);
    const barBFill = useSharedValue(0);
    const percentA = useSharedValue(0);
    const percentB = useSharedValue(0);
    const crownScale = useSharedValue(0);
    const crownY = useSharedValue(-50);
    const sassyOpacity = useSharedValue(0);
    const hyperBadgeScale = useSharedValue(0);
    
    // Responsive sizing
    const barHeight = screenHeight < 700 ? 70 : screenHeight > 900 ? 90 : 80;
    const fontSize = screenHeight < 700 ? 32 : screenHeight > 900 ? 44 : 38;
    const labelSize = screenHeight < 700 ? 14 : 16;

    // Imperative API
    useImperativeHandle(ref, () => ({
      reveal: (result, userChoice, options = {}) => {
        // Reset animations
        containerOpacity.value = 0;
        layoutProgress.value = 0;
        barAFill.value = 0;
        barBFill.value = 0;
        percentA.value = 0;
        percentB.value = 0;
        crownScale.value = 0;
        crownY.value = -50;
        sassyOpacity.value = 0;
        hyperBadgeScale.value = 0;
        
        // Determine winner and generate sassy line
        const winnerIsA = result.percentage_a >= result.percentage_b;
        const winner = winnerIsA ? optionA : optionB;
        const loser = winnerIsA ? optionB : optionA;
        const winnerPercent = Math.max(result.percentage_a, result.percentage_b);
        const loserPercent = Math.min(result.percentage_a, result.percentage_b);
        
        setSassyLine(getSassyLine(result.won, winnerPercent, winner, loser, loserPercent));
        setShowConfetti(false);
        
        setState({
          active: true,
          result,
          userChoice,
          inHyperstreak: options.inHyperstreak ?? false,
          doubleDownActive: options.doubleDownActive ?? false,
        });
        
        // ═══════════════════════════════════════════════════════════
        // ANIMATION TIMELINE - 0.9s core sequence
        // ═══════════════════════════════════════════════════════════
        
        // 0ms: Heavy haptic + show container
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        containerOpacity.value = withTiming(1, { duration: 100 });
        
        // 0-150ms: Layout morph (vertical → horizontal)
        layoutProgress.value = withTiming(1, {
          duration: 150,
          easing: Easing.out(Easing.cubic),
        });
        
        // 150-750ms: Liquid fill + number count-up
        barAFill.value = withDelay(150, withTiming(result.percentage_a / 100, {
          duration: 600,
          easing: Easing.out(Easing.exp),
        }));
        barBFill.value = withDelay(150, withTiming(result.percentage_b / 100, {
          duration: 600,
          easing: Easing.out(Easing.exp),
        }));
        percentA.value = withDelay(150, withTiming(result.percentage_a, {
          duration: 600,
          easing: Easing.out(Easing.exp),
        }));
        percentB.value = withDelay(150, withTiming(result.percentage_b, {
          duration: 600,
          easing: Easing.out(Easing.exp),
        }));
        
        // 600ms: Crown + text slam
        crownScale.value = withDelay(600, withSequence(
          withSpring(1.3, { damping: 8, stiffness: 300 }),
          withSpring(1, { damping: 12 })
        ));
        crownY.value = withDelay(600, withSpring(0, { damping: 12, stiffness: 200 }));
        
        // 700ms: Confetti + sassy line
        setTimeout(() => {
          setShowConfetti(true);
          Haptics.notificationAsync(
            result.won 
              ? Haptics.NotificationFeedbackType.Success 
              : Haptics.NotificationFeedbackType.Warning
          );
        }, 700);
        
        sassyOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
        
        // Hyperstreak badge
        if (options.inHyperstreak) {
          hyperBadgeScale.value = withDelay(500, withSequence(
            withSpring(1.2, { damping: 8 }),
            withSpring(1, { damping: 10 })
          ));
        }
        
        // 2200ms: Auto-dismiss
        setTimeout(() => {
          containerOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
            if (finished) {
              runOnJS(handleDismiss)();
            }
          });
        }, 2200);
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
      onComplete();
    }, [onComplete]);
    
    // ═══════════════════════════════════════════════════════════════
    // ANIMATED STYLES
    // ═══════════════════════════════════════════════════════════════
    
    const containerStyle = useAnimatedStyle(() => ({
      opacity: containerOpacity.value,
    }));
    
    const barsContainerStyle = useAnimatedStyle(() => ({
      flexDirection: layoutProgress.value > 0.5 ? 'row' : 'column',
      gap: interpolate(layoutProgress.value, [0, 1], [0, 8]),
    }));
    
    const barAStyle = useAnimatedStyle(() => ({
      flex: 1,
      height: barHeight,
      borderRadius: 16,
      overflow: 'hidden',
    }));
    
    const barBStyle = useAnimatedStyle(() => ({
      flex: 1,
      height: barHeight,
      borderRadius: 16,
      overflow: 'hidden',
    }));
    
    const fillAStyle = useAnimatedStyle(() => ({
      width: `${barAFill.value * 100}%`,
      height: '100%',
    }));
    
    const fillBStyle = useAnimatedStyle(() => ({
      width: `${barBFill.value * 100}%`,
      height: '100%',
    }));
    
    const crownStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: crownScale.value },
        { translateY: crownY.value },
      ],
    }));
    
    const sassyStyle = useAnimatedStyle(() => ({
      opacity: sassyOpacity.value,
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
    
    return (
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Background overlay */}
        <View style={styles.backdrop} />
        
        {/* Crown + Winner text */}
        <Animated.View style={[styles.crownContainer, crownStyle]}>
          <Text style={styles.crownEmoji}>👑</Text>
          <Text style={[styles.sameText, { color: userWon ? '#00FFBD' : '#FF3B6E' }]}>
            {Math.max(result.percentage_a, result.percentage_b)}% SAME
          </Text>
        </Animated.View>
        
        {/* Hyperstreak Badge */}
        {inHyperstreak && (
          <Animated.View style={[styles.hyperBadge, hyperBadgeStyle]}>
            <Text style={styles.hyperBadgeText}>⚡ 2X BLAST 💥</Text>
          </Animated.View>
        )}
        
        {/* Horizontal Bars */}
        <Animated.View style={[styles.barsContainer, barsContainerStyle]}>
          {/* Bar A */}
          <Animated.View style={[
            styles.bar,
            barAStyle,
            userChoseA && styles.userChoiceBar,
            winnerIsA && styles.winnerBar,
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
                {userChoseA && ' (YOU)'}
              </Text>
            </View>
          </Animated.View>
          
          {/* Bar B */}
          <Animated.View style={[
            styles.bar,
            barBStyle,
            !userChoseA && styles.userChoiceBar,
            !winnerIsA && styles.winnerBar,
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
                {!userChoseA && ' (YOU)'}
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
        
        {/* Sassy Commentary */}
        <Animated.View style={[styles.sassyContainer, sassyStyle]}>
          <Text style={styles.sassyText}>{sassyLine}</Text>
        </Animated.View>
        
        {/* Confetti - bursts from winner position (only on wins) */}
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
  const animatedProps = useAnimatedStyle(() => {
    return {};
  });
  
  // Use a derived value for the text
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      // This is a workaround - in production use reanimated's useDerivedValue
      setDisplayValue(Math.round(value.value));
    }, 16);
    
    return () => clearInterval(interval);
  }, [value]);
  
  return (
    <Animated.Text style={[styles.percentText, { fontSize }]}>
      {displayValue}%
    </Animated.Text>
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
    backgroundColor: 'rgba(15, 15, 26, 0.95)',
  },
  crownContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  crownEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  sameText: {
    fontSize: 28,
    fontFamily: 'Righteous_400Regular',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 255, 189, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  hyperBadge: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: '#00FFBD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#00FFBD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  hyperBadgeText: {
    color: '#000',
    fontSize: 18,
    fontFamily: 'Righteous_400Regular',
    letterSpacing: 2,
  },
  barsContainer: {
    paddingHorizontal: 8,
  },
  bar: {
    position: 'relative',
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  winnerBar: {
    shadowColor: '#00FFBD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  sassyContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  sassyText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

AnswerMorphReveal.displayName = 'AnswerMorphReveal';

