import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, STREAK_MILESTONES, GRADIENTS } from '../lib/constants';
import { ConfettiCannon } from './ConfettiCannon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StreakCelebrationProps {
  visible: boolean;
  milestone: 3 | 7 | 14 | 30;
  onClose: () => void;
}

// Liquid gradient burst particle
function BurstParticle({ delay, color, angle }: { delay: number; color: string; angle: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      delay + 800,
      withTiming(0, { duration: 400 })
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const distance = interpolate(progress.value, [0, 1], [0, SCREEN_WIDTH * 0.8]);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const scale = interpolate(progress.value, [0, 0.3, 1], [0, 1, 0.3]);

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

// Pulsing ring effect
function PulseRing({ delay, color }: { delay: number; color: string }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withTiming(3, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      delay,
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 150,
          height: 150,
          borderRadius: 75,
          borderWidth: 4,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

export function StreakCelebration({ visible, milestone, onClose }: StreakCelebrationProps) {
  const milestoneData = STREAK_MILESTONES[milestone];
  
  const backdropOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0);
  const titleScale = useSharedValue(0);
  const emojiRotation = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  // Generate burst particles
  const particles = useMemo(() => {
    const colors = [milestoneData.color, COLORS.primary, COLORS.secondary, '#FFD700'];
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      angle: (i / 24) * Math.PI * 2,
      delay: Math.random() * 200,
      color: colors[i % colors.length],
    }));
  }, [milestoneData.color]);

  useEffect(() => {
    if (visible) {
      // Haptic burst
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);

      // Animate in
      backdropOpacity.value = withTiming(1, { duration: 300 });
      contentScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 200 }));
      titleScale.value = withDelay(
        400,
        withSequence(
          withSpring(1.2, { damping: 6, stiffness: 300 }),
          withSpring(1, { damping: 10 })
        )
      );
      
      // Emoji celebration animation
      emojiRotation.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(-15, { duration: 150 }),
            withTiming(15, { duration: 150 })
          ),
          3,
          true
        )
      );

      // Glow pulse
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.5, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      backdropOpacity.value = 0;
      contentScale.value = 0;
      titleScale.value = 0;
      emojiRotation.value = 0;
      glowPulse.value = 0;
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${emojiRotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.3, 0.8]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.2]) }],
  }));

  const handleClose = () => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    contentScale.value = withTiming(0.8, { duration: 200 });
    setTimeout(onClose, 200);
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Confetti */}
      <ConfettiCannon shoot={visible} variant="milestone" />

      {/* Backdrop with gradient */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <LinearGradient
          colors={['rgba(15, 15, 26, 0.98)', 'rgba(26, 15, 51, 0.98)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Burst particles from center */}
      <View style={styles.burstContainer}>
        {visible && particles.map(p => (
          <BurstParticle key={p.id} {...p} />
        ))}
      </View>

      {/* Pulse rings */}
      <View style={styles.burstContainer}>
        {visible && (
          <>
            <PulseRing delay={0} color={milestoneData.color} />
            <PulseRing delay={200} color={COLORS.primary} />
            <PulseRing delay={400} color={COLORS.secondary} />
          </>
        )}
      </View>

      {/* Main content */}
      <View style={styles.container}>
        <Animated.View style={[styles.content, contentStyle]}>
          {/* Glow behind emoji */}
          <Animated.View 
            style={[
              styles.glow, 
              glowStyle, 
              { backgroundColor: milestoneData.color }
            ]} 
          />

          {/* Big emoji */}
          <Animated.Text style={[styles.emoji, emojiStyle]}>
            {milestoneData.emoji}
          </Animated.Text>

          {/* Streak number */}
          <Text style={[styles.streakNumber, { color: milestoneData.color }]}>
            {milestone}
          </Text>
          <Text style={styles.streakLabel}>DAY STREAK</Text>

          {/* Title */}
          <Animated.View style={titleStyle}>
            <Text style={[styles.title, { color: milestoneData.color }]}>
              {milestoneData.title}
            </Text>
          </Animated.View>

          {/* Continue button */}
          <Pressable onPress={handleClose} style={styles.button}>
            <LinearGradient
              colors={[milestoneData.color, COLORS.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>LET'S GO!</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  burstContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -20,
  },
  emoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  streakNumber: {
    fontSize: 80,
    fontFamily: 'Righteous_400Regular',
    lineHeight: 90,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  streakLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 4,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Righteous_400Regular',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  button: {
    marginTop: 40,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    paddingHorizontal: 48,
    paddingVertical: 18,
  },
  buttonText: {
    fontSize: 20,
    fontFamily: 'Righteous_400Regular',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
});
