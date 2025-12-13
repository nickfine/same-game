import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { AshParticles } from './AshParticles';
import { CrackedStreakNumber } from './CrackedStreakNumber';
import { ReviveOptions } from './ReviveOptions';
import { ConfettiCannon } from './ConfettiCannon';
import { playSound, playSadTrombone, playReviveSound } from '../lib/sounds';
import { COLORS } from '../lib/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Phase = 'idle' | 'kill' | 'fomo' | 'revival' | 'declined' | 'restored';

interface StreakDeathAnimationProps {
  visible: boolean;
  deadStreak: number;
  hasStreakFreeze: boolean;
  wasInHyperstreak?: boolean; // Was user in Hyperstreak when they died?
  onUseFreeze: () => void;
  onWatchAd: () => void;
  onShareRevive: () => void;
  onAcceptDeath: () => void;
  onClose: () => void;
}

// Dynamic fake friends data - streaks scale relative to user's dead streak
function generateFakeFriends(deadStreak: number): { name: string; streak: number; avatar: string; inHyperstreak: boolean }[] {
  // Friends have streaks that feel competitive but achievable
  // Always at least one friend with higher streak for FOMO
  const baseStreak = Math.max(3, deadStreak);
  
  return [
    { 
      name: 'Alex', 
      streak: Math.floor(baseStreak * 1.3) + Math.floor(Math.random() * 10), 
      avatar: '😎',
      inHyperstreak: Math.random() > 0.6,
    },
    { 
      name: 'Sam', 
      streak: Math.floor(baseStreak * 0.9) + Math.floor(Math.random() * 8), 
      avatar: '🔥',
      inHyperstreak: Math.random() > 0.75,
    },
    { 
      name: 'Jordan', 
      streak: Math.floor(baseStreak * 0.6) + Math.floor(Math.random() * 5), 
      avatar: '⚡',
      inHyperstreak: false,
    },
  ].sort((a, b) => b.streak - a.streak); // Sort by streak descending
}

// Calculate fake percentile (everyone is in top 5% because dopamine)
function getFakePercentile(streak: number): string {
  if (streak >= 50) return '0.1%';
  if (streak >= 30) return '0.3%';
  if (streak >= 20) return '0.8%';
  if (streak >= 10) return '2%';
  if (streak >= 5) return '5%';
  return '15%';
}

// Phase 1: The Kill - Screen goes black, streak explodes
function KillPhase({ 
  active, 
  deadStreak,
  onComplete 
}: { 
  active: boolean;
  deadStreak: number;
  onComplete: () => void;
}) {
  const blackOpacity = useSharedValue(0);
  const textScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const redGlow = useSharedValue(0);
  const [crackPhase, setCrackPhase] = useState<'idle' | 'crack' | 'explode'>('idle');
  const [showAsh, setShowAsh] = useState(false);

  useEffect(() => {
    if (active) {
      // ═══════════════════════════════════════════════════════════════
      // PHASE 1: THE KILL - 2.8 seconds total
      // Slow, dramatic pacing for emotional impact
      // ═══════════════════════════════════════════════════════════════
      
      // Screen goes pitch black (slow fade for dread)
      blackOpacity.value = withTiming(1, { duration: 400 });
      
      // Start crack animation after black settles
      setTimeout(() => setCrackPhase('crack'), 500);
      
      // Sad trombone + heavy haptic - let cracks spread first
      setTimeout(() => {
        playSadTrombone();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // Screen shake - slower, more violent
        shakeX.value = withSequence(
          withTiming(-18, { duration: 50 }),
          withTiming(18, { duration: 50 }),
          withTiming(-15, { duration: 50 }),
          withTiming(15, { duration: 50 }),
          withTiming(-12, { duration: 50 }),
          withTiming(12, { duration: 50 }),
          withTiming(-8, { duration: 50 }),
          withTiming(8, { duration: 50 }),
          withTiming(-4, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
      }, 900);
      
      // Explode - give time to see cracks spread
      setTimeout(() => {
        setCrackPhase('explode');
        setShowAsh(true);
        
        // Heavy haptic on explosion
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 1400);
      
      // "STREAK SNAPPED" text - wait for explosion to register
      setTimeout(() => {
        textOpacity.value = withTiming(1, { duration: 150 });
        textScale.value = withSequence(
          withSpring(1.4, { damping: 6, stiffness: 200 }),
          withTiming(1, { duration: 300 })
        );
        
        // Red glow pulse - more dramatic
        redGlow.value = withSequence(
          withTiming(0.7, { duration: 150 }),
          withTiming(0.25, { duration: 600 })
        );
        
        // Second haptic for text slam
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 1700);
      
      // Complete phase - hold on "STREAK SNAPPED" for impact
      setTimeout(onComplete, 2800);
    } else {
      blackOpacity.value = 0;
      textScale.value = 0;
      textOpacity.value = 0;
      redGlow.value = 0;
      setCrackPhase('idle');
      setShowAsh(false);
    }
  }, [active]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const blackStyle = useAnimatedStyle(() => ({
    opacity: blackOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
    opacity: textOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: redGlow.value,
  }));

  if (!active) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
      {/* Pitch black background */}
      <Animated.View style={[styles.blackBackground, blackStyle]} />
      
      {/* Red glow overlay */}
      <Animated.View style={[styles.redGlow, glowStyle]} />
      
      {/* Cracking/Exploding streak number */}
      <View style={styles.killContent}>
        <CrackedStreakNumber 
          streakNumber={deadStreak}
          phase={crackPhase}
        />
        
        {/* STREAK SNAPPED text */}
        <Animated.View style={[styles.snappedTextContainer, textStyle]}>
          <Text style={styles.snappedText}>STREAK SNAPPED</Text>
        </Animated.View>
      </View>
      
      {/* Falling ashes */}
      <AshParticles active={showAsh} count={80} duration={2500} />
    </Animated.View>
  );
}

// Phase 2: The FOMO - Show what they lost
function FOMOPhase({ 
  active, 
  deadStreak,
  onComplete 
}: { 
  active: boolean;
  deadStreak: number;
  onComplete: () => void;
}) {
  const containerOpacity = useSharedValue(0);
  const streakNumberScale = useSharedValue(0.5);
  const textOpacity = useSharedValue(0);
  const friendsOpacity = useSharedValue(0);
  const frameScale = useSharedValue(0.8);

  const percentile = getFakePercentile(deadStreak);
  
  // Generate dynamic friends based on user's dead streak
  const fakeFriends = React.useMemo(() => generateFakeFriends(deadStreak), [deadStreak]);

  useEffect(() => {
    if (active) {
      // ═══════════════════════════════════════════════════════════════
      // PHASE 2: THE FOMO - 4.0 seconds total
      // Each element gets time to sink in emotionally
      // ═══════════════════════════════════════════════════════════════
      
      // Fade in container (smooth transition from black)
      containerOpacity.value = withTiming(1, { duration: 500 });
      
      // Cracked frame appears with dramatic spring
      frameScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 80 }));
      
      // Giant streak number - let frame settle first
      streakNumberScale.value = withDelay(700, withSpring(1, { damping: 8, stiffness: 100 }));
      
      // "You were on a X-day streak..." - give number time to register
      textOpacity.value = withDelay(1400, withTiming(1, { duration: 400 }));
      
      // "Top X% of players" - slight additional delay for reading
      // This is in the same container so it fades with the main text
      
      // Friends leaderboard - final FOMO punch, let text sink in
      friendsOpacity.value = withDelay(2200, withTiming(1, { duration: 400 }));
      
      // Complete - give time to see friends and feel the FOMO
      setTimeout(onComplete, 4000);
    } else {
      containerOpacity.value = 0;
      streakNumberScale.value = 0.5;
      textOpacity.value = 0;
      friendsOpacity.value = 0;
      frameScale.value = 0.8;
    }
  }, [active]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const frameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: frameScale.value }],
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakNumberScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const friendsStyle = useAnimatedStyle(() => ({
    opacity: friendsOpacity.value,
  }));

  if (!active) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.fomoContainer, containerStyle]}>
      {/* Cracked glass frame with streak number */}
      <Animated.View style={[styles.crackedFrame, frameStyle]}>
        {/* Glass crack effects */}
        <View style={styles.crackLines}>
          <View style={[styles.crackLine, { transform: [{ rotate: '45deg' }] }]} />
          <View style={[styles.crackLine, { transform: [{ rotate: '-45deg' }] }]} />
          <View style={[styles.crackLine, { transform: [{ rotate: '15deg' }] }]} />
          <View style={[styles.crackLine, { transform: [{ rotate: '-70deg' }] }]} />
        </View>
        
        <Animated.View style={numberStyle}>
          <Text style={styles.fomoStreakNumber}>{deadStreak}</Text>
          <Text style={styles.dayText}>DAYS</Text>
        </Animated.View>
      </Animated.View>

      {/* FOMO text */}
      <Animated.View style={[styles.fomoTextContainer, textStyle]}>
        <Text style={styles.fomoMainText}>
          You were on a {deadStreak}-day streak…
        </Text>
        <Text style={styles.fomoSubText}>
          Top {percentile} of players worldwide
        </Text>
      </Animated.View>

      {/* Friends still alive leaderboard */}
      <Animated.View style={[styles.friendsContainer, friendsStyle]}>
        <Text style={styles.friendsTitle}>Friends still alive:</Text>
        <View style={styles.friendsList}>
          {fakeFriends.map((friend, idx) => (
            <View key={idx} style={styles.friendItem}>
              <Text style={styles.friendAvatar}>{friend.avatar}</Text>
              <Text style={styles.friendName}>{friend.name}</Text>
              <View style={styles.friendStreak}>
                <Text style={styles.friendFlame}>🔥</Text>
                <Text style={styles.friendStreakNumber}>{friend.streak}</Text>
                {/* Hyperstreak serpent indicator */}
                {friend.inHyperstreak && (
                  <Text style={styles.hyperSerpent}>🐍</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// Phase: Declined - "Back to Zero" brutal animation
function DeclinedPhase({ 
  active, 
  deadStreak,
  onComplete 
}: { 
  active: boolean;
  deadStreak: number;
  onComplete: () => void;
}) {
  const containerOpacity = useSharedValue(0);
  const [countdownNumber, setCountdownNumber] = useState(deadStreak);
  const textScale = useSharedValue(0.8);
  const blueOverlay = useSharedValue(0);

  useEffect(() => {
    if (active) {
      // ═══════════════════════════════════════════════════════════════
      // DECLINED PHASE - 3.5 seconds total
      // Brutal countdown that makes them feel the loss
      // ═══════════════════════════════════════════════════════════════
      
      containerOpacity.value = withTiming(1, { duration: 300 });
      textScale.value = withSpring(1, { damping: 10 });
      
      // Countdown animation - slower for emotional weight
      const countdownStartDelay = 800; // Let "Back to zero" sink in
      const countdownDuration = 2200;
      const steps = Math.min(deadStreak, 25); // Cap steps for smooth animation
      const interval = countdownDuration / steps;
      
      // Start countdown after delay
      setTimeout(() => {
        let current = deadStreak;
        const timer = setInterval(() => {
          current = Math.max(0, current - Math.ceil(deadStreak / steps));
          setCountdownNumber(Math.max(0, current));
          
          // Light haptic on each tick
          if (current > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          
          if (current <= 0) {
            clearInterval(timer);
            // Heavy final haptic when hitting zero
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }, interval);
        
        return () => clearInterval(timer);
      }, countdownStartDelay);
      
      // Cold blue fade - starts as countdown nears end
      blueOverlay.value = withDelay(2400, withTiming(0.5, { duration: 600 }));
      
      // Complete after countdown finishes and blue settles
      setTimeout(onComplete, 3500);
    } else {
      containerOpacity.value = 0;
      textScale.value = 0.8;
      blueOverlay.value = 0;
      setCountdownNumber(deadStreak);
    }
  }, [active, deadStreak]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
  }));

  const blueStyle = useAnimatedStyle(() => ({
    opacity: blueOverlay.value,
  }));

  if (!active) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.declinedContainer, containerStyle]}>
      {/* Cold blue overlay */}
      <Animated.View style={[styles.coldBlueOverlay, blueStyle]} />
      
      <Animated.View style={[styles.declinedContent, textStyle]}>
        <Text style={styles.backToZeroText}>Back to zero.</Text>
        <Text style={styles.coffinEmoji}>⚰️</Text>
        
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownNumber}>{countdownNumber}</Text>
          <Text style={styles.arrowText}>→</Text>
          <Text style={styles.zeroNumber}>0</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// Phase: Restored - Full celebration
function RestoredPhase({ 
  active, 
  deadStreak,
  onComplete 
}: { 
  active: boolean;
  deadStreak: number;
  onComplete: () => void;
}) {
  const containerOpacity = useSharedValue(0);
  const textScale = useSharedValue(0);
  const streakScale = useSharedValue(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (active) {
      // ═══════════════════════════════════════════════════════════════
      // RESTORED PHASE - 4.0 seconds total
      // Maximum celebration - they earned it!
      // ═══════════════════════════════════════════════════════════════
      
      // Play revival sound
      playReviveSound();
      
      // Vibrate like crazy - celebration pattern
      const vibratePattern = async () => {
        for (let i = 0; i < 6; i++) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise(r => setTimeout(r, 80));
        }
        // Final success haptic
        await new Promise(r => setTimeout(r, 200));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      };
      vibratePattern();
      
      containerOpacity.value = withTiming(1, { duration: 300 });
      
      // "STREAK RESTORED" slams in dramatically
      textScale.value = withSequence(
        withSpring(1.5, { damping: 5, stiffness: 150 }),
        withTiming(1, { duration: 400 })
      );
      
      // Streak number bounces in after title registers
      streakScale.value = withDelay(600, withSpring(1, { damping: 6, stiffness: 100 }));
      
      // Confetti explosion - slight delay for impact
      setTimeout(() => setShowConfetti(true), 400);
      
      // Complete after full celebration
      setTimeout(onComplete, 4000);
    } else {
      containerOpacity.value = 0;
      textScale.value = 0;
      streakScale.value = 0;
      setShowConfetti(false);
    }
  }, [active]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
  }));

  const streakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  if (!active) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
      {/* Success gradient background */}
      <LinearGradient
        colors={['#064E3B', '#065F46', '#047857']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.restoredContent}>
        <Animated.View style={textStyle}>
          <Text style={styles.restoredTitle}>STREAK RESTORED</Text>
        </Animated.View>
        
        <Animated.View style={[styles.restoredStreakContainer, streakStyle]}>
          <Text style={styles.restoredFlame}>🔥</Text>
          <Text style={styles.restoredNumber}>{deadStreak}</Text>
        </Animated.View>
        
        {/* Phoenix badge for 20+ day streaks */}
        {deadStreak >= 20 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeEmoji}>🦅</Text>
            <Text style={styles.badgeText}>Phoenix Badge Unlocked!</Text>
          </View>
        )}
        
        {/* Immortal title for 50+ */}
        {deadStreak >= 50 && (
          <View style={styles.titleContainer}>
            <Text style={styles.titleEmoji}>👑</Text>
            <Text style={styles.titleText}>IMMORTAL</Text>
          </View>
        )}
      </View>
      
      {/* Epic confetti cannon */}
      <ConfettiCannon shoot={showConfetti} variant="milestone" />
    </Animated.View>
  );
}

export function StreakDeathAnimation({
  visible,
  deadStreak,
  hasStreakFreeze,
  wasInHyperstreak = false,
  onUseFreeze,
  onWatchAd,
  onShareRevive,
  onAcceptDeath,
  onClose,
}: StreakDeathAnimationProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [showReviveOptions, setShowReviveOptions] = useState(false);

  // Phase progression
  useEffect(() => {
    if (visible) {
      // Start the death sequence
      setPhase('kill');
    } else {
      setPhase('idle');
      setShowReviveOptions(false);
    }
  }, [visible]);

  // Handle phase transitions
  const handleKillComplete = useCallback(() => {
    setPhase('fomo');
  }, []);

  const handleFOMOComplete = useCallback(() => {
    setPhase('revival');
    setShowReviveOptions(true);
  }, []);

  // Revival handlers
  const handleUseFreeze = useCallback(() => {
    setShowReviveOptions(false);
    setPhase('restored');
  }, []);

  const handleWatchAd = useCallback(() => {
    // In real implementation, show ad then revive
    // For now, simulate ad completion
    setShowReviveOptions(false);
    setPhase('restored');
    onWatchAd();
  }, [onWatchAd]);

  const handleShareRevive = useCallback(() => {
    // After sharing, revive
    setShowReviveOptions(false);
    setPhase('restored');
    onShareRevive();
  }, [onShareRevive]);

  const handleDecline = useCallback(() => {
    setShowReviveOptions(false);
    setPhase('declined');
  }, []);

  const handleDeclinedComplete = useCallback(() => {
    onAcceptDeath();
    onClose();
  }, [onAcceptDeath, onClose]);

  const handleRestoredComplete = useCallback(() => {
    onUseFreeze();
    onClose();
  }, [onUseFreeze, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Phase 1: The Kill (0-2.8s) - Dramatic death sequence */}
        <KillPhase 
          active={phase === 'kill'} 
          deadStreak={deadStreak}
          onComplete={handleKillComplete}
        />
        
        {/* Phase 2: The FOMO (2.8-6.8s) - Show what they lost */}
        <FOMOPhase
          active={phase === 'fomo'}
          deadStreak={deadStreak}
          onComplete={handleFOMOComplete}
        />
        
        {/* Phase 3: The Revival (6.8s+) - Recovery options */}
        <ReviveOptions
          visible={showReviveOptions}
          deadStreak={deadStreak}
          hasStreakFreeze={hasStreakFreeze}
          wasInHyperstreak={wasInHyperstreak}
          onUseFreeze={handleUseFreeze}
          onWatchAd={handleWatchAd}
          onShareToFriends={handleShareRevive}
          onDecline={handleDecline}
        />
        
        {/* Declined phase */}
        <DeclinedPhase
          active={phase === 'declined'}
          deadStreak={deadStreak}
          onComplete={handleDeclinedComplete}
        />
        
        {/* Restored phase */}
        <RestoredPhase
          active={phase === 'restored'}
          deadStreak={deadStreak}
          onComplete={handleRestoredComplete}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Kill Phase styles
  blackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  redGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DC2626',
  },
  killContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snappedTextContainer: {
    marginTop: 20,
  },
  snappedText: {
    fontSize: 42,
    fontFamily: 'Righteous_400Regular',
    color: '#DC2626',
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: '#DC2626',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  
  // FOMO Phase styles
  fomoContainer: {
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  crackedFrame: {
    width: 200,
    height: 200,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  crackLines: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  crackLine: {
    position: 'absolute',
    width: 200,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    top: '50%',
    left: 0,
  },
  fomoStreakNumber: {
    fontSize: 80,
    fontFamily: 'Righteous_400Regular',
    color: '#FFFFFF',
    opacity: 0.4,
  },
  dayText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    letterSpacing: 4,
  },
  fomoTextContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  fomoMainText: {
    fontSize: 24,
    fontFamily: 'Righteous_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  fomoSubText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.accent,
    textAlign: 'center',
  },
  friendsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  friendsTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  friendsList: {
    gap: 10,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  friendAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  friendName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
  },
  friendStreak: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendFlame: {
    fontSize: 16,
    marginRight: 4,
  },
  friendStreakNumber: {
    fontSize: 16,
    fontFamily: 'Righteous_400Regular',
    color: COLORS.accent,
  },
  hyperSerpent: {
    fontSize: 14,
    marginLeft: 4,
  },
  
  // Declined Phase styles
  declinedContainer: {
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coldBlueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E3A5F',
  },
  declinedContent: {
    alignItems: 'center',
  },
  backToZeroText: {
    fontSize: 28,
    fontFamily: 'Righteous_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },
  coffinEmoji: {
    fontSize: 80,
    marginBottom: 30,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  countdownNumber: {
    fontSize: 72,
    fontFamily: 'Righteous_400Regular',
    color: '#DC2626',
    minWidth: 100,
    textAlign: 'center',
  },
  arrowText: {
    fontSize: 36,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  zeroNumber: {
    fontSize: 72,
    fontFamily: 'Righteous_400Regular',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Restored Phase styles
  restoredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoredTitle: {
    fontSize: 36,
    fontFamily: 'Righteous_400Regular',
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: '#10B981',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    marginBottom: 30,
  },
  restoredStreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  restoredFlame: {
    fontSize: 64,
  },
  restoredNumber: {
    fontSize: 100,
    fontFamily: 'Righteous_400Regular',
    color: '#FFFFFF',
    textShadowColor: 'rgba(16, 185, 129, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFB800',
  },
  badgeEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  badgeText: {
    fontSize: 16,
    fontFamily: 'Righteous_400Regular',
    color: '#FFB800',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  titleEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  titleText: {
    fontSize: 14,
    fontFamily: 'Righteous_400Regular',
    color: '#D946EF',
    letterSpacing: 3,
  },
});

