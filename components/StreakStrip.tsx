import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { COLORS } from '../lib/constants';
import { DuotoneFlame } from './icons';
import { HyperBarRing } from './HyperBarRing';
import { HYPER } from '../lib/hyperstreakLogic';

interface StreakStripProps {
  currentStreak: number;
  bestStreak?: number;
  onPress?: () => void;
  // Hyperstreak props
  hyperProgress?: number; // 0-1 progress for hyper bar
  inHyperstreak?: boolean;
  shouldPulseHyper?: boolean;
  questionsRemaining?: number; // Questions left in hyperstreak
}

// Temperature stages with brand colors: blue → yellow → coral → violet
const STREAK_STAGES = [
  { min: 0, max: 0, name: 'Cold', emoji: '❄️', color: '#60A5FA', bgGradient: ['#1E3A5F', '#0F0F1A'] as const, glowColor: '#3B82F6' },
  { min: 1, max: 2, name: 'Warming', emoji: '🌡️', color: '#FBBF24', bgGradient: ['#78350F', '#1A0F33'] as const, glowColor: '#F59E0B' },
  { min: 3, max: 4, name: 'Hot!', emoji: '🔥', color: '#FF8E53', bgGradient: ['#7C2D12', '#1A0F33'] as const, glowColor: '#FF6B6B' },
  { min: 5, max: 6, name: 'On Fire!', emoji: '🔥', color: COLORS.secondary, bgGradient: ['#7F1D1D', '#1A0F33'] as const, glowColor: COLORS.secondary },
  { min: 7, max: 9, name: 'Blazing!', emoji: '🔥', color: '#D946EF', bgGradient: ['#581C87', '#1A0F33'] as const, glowColor: '#D946EF' },
  { min: 10, max: Infinity, name: 'UNSTOPPABLE!', emoji: '⭐', color: COLORS.primary, bgGradient: ['#3B0764', '#0F0F1A'] as const, glowColor: COLORS.primary },
];

function getStreakStage(streak: number) {
  return STREAK_STAGES.find(s => streak >= s.min && streak <= s.max) || STREAK_STAGES[0];
}

function getProgressToNextStage(streak: number) {
  const currentStage = getStreakStage(streak);
  const currentIndex = STREAK_STAGES.indexOf(currentStage);
  const nextStage = STREAK_STAGES[currentIndex + 1];
  
  if (!nextStage) return { progress: 1, nextTarget: null };
  
  const stageStart = currentStage.min;
  const stageEnd = nextStage.min;
  const progress = (streak - stageStart) / (stageEnd - stageStart);
  
  return { progress: Math.min(1, progress), nextTarget: nextStage.min };
}

// Fire particle for hot streaks
function FireParticle({ delay, color }: { delay: number; color: string }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const xOffset = (Math.random() - 0.5) * 20;
    
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-30 - Math.random() * 20, { duration: 600 + Math.random() * 300, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      )
    );
    
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(xOffset, { duration: 600 + Math.random() * 300 })
        ),
        -1,
        false
      )
    );
    
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 100 }),
          withTiming(0, { duration: 500 + Math.random() * 300 })
        ),
        -1,
        false
      )
    );
    
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 150 }),
          withTiming(0.2, { duration: 450 + Math.random() * 300 })
        ),
        -1,
        false
      )
    );
  }, []);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        particleStyle,
        { backgroundColor: color },
      ]}
    />
  );
}

// Tooltip component for long-press explanation
function HyperTooltip({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.tooltipOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.tooltipContainer}>
          <Text style={styles.tooltipTitle}>⚡ HYPERSTREAK</Text>
          <Text style={styles.tooltipText}>
            Get 10 correct in a row to activate HYPERSTREAK!
          </Text>
          <View style={styles.tooltipBonuses}>
            <Text style={styles.tooltipBonus}>🪙 2x Coins</Text>
            <Text style={styles.tooltipBonus}>✨ 2x XP</Text>
            <Text style={styles.tooltipBonus}>🎁 2x Power-ups</Text>
          </View>
          <Text style={styles.tooltipDuration}>
            Lasts for 5 questions or until wrong answer
          </Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export function StreakStrip({ 
  currentStreak, 
  bestStreak = 0, 
  onPress,
  // Hyperstreak props with defaults
  hyperProgress = 0,
  inHyperstreak = false,
  shouldPulseHyper = false,
  questionsRemaining = 0,
}: StreakStripProps) {
  const { width } = useWindowDimensions();
  const isSmall = width < 380;
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Long press handler for tooltip
  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowTooltip(true);
  }, []);
  
  const handleCloseTooltip = useCallback(() => {
    setShowTooltip(false);
  }, []);
  
  const stage = useMemo(() => getStreakStage(currentStreak), [currentStreak]);
  const { progress, nextTarget } = useMemo(() => getProgressToNextStage(currentStreak), [currentStreak]);
  const prevStreak = useRef(currentStreak);
  const isMaxStage = stage.min === 10;
  
  // Animation values
  const barWidth = useSharedValue(0);
  const containerScale = useSharedValue(1);
  const emojiScale = useSharedValue(1);
  const emojiRotate = useSharedValue(0);
  const numberScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);
  
  // Detect streak changes
  useEffect(() => {
    if (currentStreak > prevStreak.current) {
      // Streak increased - celebration!
      numberScale.value = withSequence(
        withTiming(1.5, { duration: 100 }),
        withSpring(1, { damping: 8, stiffness: 300 })
      );
      
      emojiScale.value = withSequence(
        withTiming(1.4, { duration: 100 }),
        withSpring(1, { damping: 6, stiffness: 200 })
      );
      
      containerScale.value = withSequence(
        withTiming(1.03, { duration: 100 }),
        withSpring(1, { damping: 10 })
      );
      
      pulseOpacity.value = withSequence(
        withTiming(0.6, { duration: 50 }),
        withTiming(0, { duration: 300 })
      );
      
      // Check for stage upgrade
      const prevStage = getStreakStage(prevStreak.current);
      if (stage !== prevStage) {
        shakeX.value = withSequence(
          withTiming(-4, { duration: 30 }),
          withTiming(4, { duration: 30 }),
          withTiming(-4, { duration: 30 }),
          withTiming(4, { duration: 30 }),
          withTiming(-2, { duration: 30 }),
          withTiming(2, { duration: 30 }),
          withTiming(0, { duration: 30 })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else if (currentStreak < prevStreak.current && currentStreak === 0) {
      // Streak lost
      shakeX.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
    
    prevStreak.current = currentStreak;
  }, [currentStreak]);
  
  // Bar width animation
  useEffect(() => {
    const stageIndex = STREAK_STAGES.indexOf(stage);
    const baseWidth = stageIndex * 16;
    const progressWidth = progress * 16;
    const totalWidth = Math.min(100, baseWidth + progressWidth);
    
    barWidth.value = withSpring(totalWidth, { 
      damping: 15, 
      stiffness: 100,
      mass: 0.8,
    });
  }, [currentStreak, progress, stage]);
  
  // Continuous animations based on streak level
  useEffect(() => {
    cancelAnimation(emojiRotate);
    cancelAnimation(glowOpacity);
    
    if (currentStreak === 0) {
      emojiRotate.value = 0;
      glowOpacity.value = 0;
      return;
    }
    
    if (currentStreak >= 1 && currentStreak <= 2) {
      emojiRotate.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 500 }),
          withTiming(5, { duration: 500 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 800 }),
          withTiming(0.1, { duration: 800 })
        ),
        -1,
        true
      );
      return;
    }
    
    if (currentStreak >= 3 && currentStreak <= 4) {
      emojiRotate.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 150 }),
          withTiming(8, { duration: 150 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 400 }),
          withTiming(0.2, { duration: 400 })
        ),
        -1,
        true
      );
      return;
    }
    
    if (currentStreak >= 5) {
      emojiRotate.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 100 }),
          withTiming(12, { duration: 100 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1,
        true
      );
    }
  }, [currentStreak]);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: containerScale.value },
      { translateX: shakeX.value },
    ],
  }));
  
  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));
  
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: emojiScale.value },
      { rotate: `${emojiRotate.value}deg` },
    ],
  }));
  
  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };
  
  // Override colors when in hyperstreak
  const effectiveStage = inHyperstreak ? {
    ...stage,
    color: HYPER.COLOR_ACTIVE,
    glowColor: HYPER.COLOR_ACTIVE,
    bgGradient: ['#0A2E26', '#0F0F1A'] as const,
    name: 'HYPER MODE!',
  } : stage;
  
  // Generate fire particles for hot streaks
  const particles = useMemo(() => {
    if (currentStreak < 5) return [];
    const count = currentStreak >= 10 ? 8 : currentStreak >= 7 ? 5 : 3;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: i * 100,
    }));
  }, [currentStreak]);

  return (
    <Pressable 
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Hyperstreak Tooltip */}
        <HyperTooltip visible={showTooltip} onClose={handleCloseTooltip} />
        {/* Outer glow - enhanced during hyperstreak */}
        <Animated.View 
          style={[
            styles.glow, 
            glowStyle,
            { backgroundColor: effectiveStage.glowColor },
            inHyperstreak && styles.hyperGlow,
          ]} 
        />
        
        {/* Flash pulse on increase */}
        <Animated.View 
          style={[
            styles.flashPulse, 
            pulseStyle,
            { backgroundColor: effectiveStage.color }
          ]} 
        />
        
        {/* Main strip body with gradient */}
        <View style={styles.stripBody}>
          <LinearGradient
            colors={effectiveStage.bgGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Stage markers */}
          <View style={styles.markersContainer}>
            {STREAK_STAGES.slice(1).map((s, i) => (
              <View 
                key={s.min} 
                style={[
                  styles.marker,
                  { left: `${(i + 1) * 16}%` },
                  currentStreak >= s.min && { backgroundColor: s.color, opacity: 0.6 }
                ]} 
              />
            ))}
          </View>
          
          {/* Progress fill */}
          <Animated.View style={[styles.fill, barStyle]}>
            <LinearGradient
              colors={[effectiveStage.color, effectiveStage.glowColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          
          {/* Fire particles */}
          {particles.length > 0 && (
            <View style={styles.particleContainer}>
              {particles.map(p => (
                <FireParticle key={p.id} delay={p.delay} color={stage.color} />
              ))}
            </View>
          )}
        </View>
        
        {/* Border - glowing emerald during hyperstreak */}
        <View style={[
          styles.border, 
          { borderColor: effectiveStage.color },
          inHyperstreak && styles.hyperBorder,
        ]} />
        
        {/* Left side: Flame with HyperBarRing */}
        <View style={styles.emojiContainer}>
          <HyperBarRing
            progress={hyperProgress}
            isActive={inHyperstreak}
            shouldPulse={shouldPulseHyper}
            size={isSmall ? 40 : 48}
            strokeWidth={3}
          >
            {currentStreak >= 3 || inHyperstreak ? (
              <Animated.View style={emojiStyle}>
                <DuotoneFlame 
                  size={isSmall ? 22 : 26} 
                  primaryColor={inHyperstreak ? HYPER.COLOR_ACTIVE : effectiveStage.color}
                  accentColor={inHyperstreak ? '#6EE7B7' : COLORS.gradientCoralEnd}
                />
              </Animated.View>
            ) : (
              <Animated.Text style={[styles.emoji, emojiStyle, isSmall && styles.emojiSmall]}>
                {effectiveStage.emoji}
              </Animated.Text>
            )}
          </HyperBarRing>
        </View>
        
        {/* Center: Streak count */}
        <View style={styles.countContainer}>
          <Animated.Text style={[styles.count, numberStyle, isSmall && styles.countSmall]}>
            {currentStreak}
          </Animated.Text>
          <Text style={[styles.label, isSmall && styles.labelSmall]}>STREAK</Text>
        </View>
        
        {/* Right side: Stage name & next target OR Hyper info */}
        <View style={styles.infoContainer}>
          <Text style={[
            styles.stageName, 
            { color: effectiveStage.color }, 
            isSmall && styles.stageNameSmall,
            inHyperstreak && styles.hyperStageName,
          ]}>
            {effectiveStage.name}
          </Text>
          {inHyperstreak ? (
            <Text style={[styles.hyperRemaining, isSmall && styles.nextTargetSmall]}>
              {questionsRemaining} left • 2x MODE
            </Text>
          ) : nextTarget ? (
            <Text style={[styles.nextTarget, isSmall && styles.nextTargetSmall]}>
              {nextTarget - currentStreak} to go
            </Text>
          ) : null}
        </View>
        
        {/* MAX badge OR HYPER badge */}
        {inHyperstreak ? (
          <View style={[styles.hyperBadge]}>
            <Text style={styles.hyperBadgeText}>⚡ HYPER</Text>
          </View>
        ) : isMaxStage && (
          <View style={[styles.maxBadge, { backgroundColor: effectiveStage.color }]}>
            <Text style={styles.maxText}>MAX</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginHorizontal: 16,
    height: 56,
    borderRadius: 16,
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
  },
  flashPulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
  },
  stripBody: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
  },
  markersContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  marker: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1,
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emojiContainer: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  emojiSmall: {
    fontSize: 22,
  },
  countContainer: {
    position: 'absolute',
    left: 52,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  count: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_700Bold',
    lineHeight: 26,
    color: '#FFFFFF',
  },
  countSmall: {
    fontSize: 20,
    lineHeight: 22,
  },
  label: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
    marginTop: -2,
    // Text shadow for contrast
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  labelSmall: {
    fontSize: 8,
  },
  infoContainer: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  stageName: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_700Bold',
    textTransform: 'uppercase',
    // Text shadow for contrast against filled progress bar
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  stageNameSmall: {
    fontSize: 11,
  },
  nextTarget: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.85)',
    // Text shadow for contrast
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nextTargetSmall: {
    fontSize: 9,
  },
  maxBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  maxText: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#000',
  },
  // Hyperstreak styles
  hyperGlow: {
    shadowColor: HYPER.COLOR_ACTIVE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  hyperBorder: {
    borderWidth: 3,
    shadowColor: HYPER.COLOR_ACTIVE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  hyperStageName: {
    textShadowColor: HYPER.COLOR_ACTIVE,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  hyperRemaining: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: HYPER.COLOR_ACTIVE,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hyperBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: HYPER.COLOR_ACTIVE,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: HYPER.COLOR_ACTIVE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  hyperBadgeText: {
    fontSize: 11,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#000',
    letterSpacing: 1,
  },
  // Tooltip styles
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tooltipContainer: {
    backgroundColor: '#1A0F33',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: HYPER.COLOR_CHARGING,
    maxWidth: 320,
    alignItems: 'center',
  },
  tooltipTitle: {
    fontSize: 24,
    fontFamily: 'Righteous_400Regular',
    color: HYPER.COLOR_ACTIVE,
    marginBottom: 12,
    textShadowColor: HYPER.COLOR_ACTIVE,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tooltipText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  tooltipBonuses: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tooltipBonus: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: HYPER.COLOR_ACTIVE,
    backgroundColor: 'rgba(0, 255, 189, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tooltipDuration: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});



