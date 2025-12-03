import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { COLORS } from '../lib/constants';

interface StreakDeathModalProps {
  visible: boolean;
  deadStreak: number; // The streak that just died
  hasStreakFreeze: boolean; // Whether user has a freeze available
  onUseFreeze: () => void;
  onAcceptDeath: () => void;
  onClose: () => void;
}

export function StreakDeathModal({ 
  visible, 
  deadStreak, 
  hasStreakFreeze,
  onUseFreeze, 
  onAcceptDeath,
  onClose,
}: StreakDeathModalProps) {
  const [showFreezeOption, setShowFreezeOption] = useState(false);
  
  // Animation values
  const backgroundOpacity = useSharedValue(0);
  const scytheRotation = useSharedValue(-45);
  const scytheScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const streakScale = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const pulseGlow = useSharedValue(0);
  const freezeButtonScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setShowFreezeOption(false);
      
      // Dramatic entrance sequence
      backgroundOpacity.value = withTiming(1, { duration: 400 });
      
      // Scythe swings in
      scytheScale.value = withDelay(200, withSpring(1, { damping: 8 }));
      scytheRotation.value = withDelay(200, 
        withSequence(
          withTiming(15, { duration: 300, easing: Easing.out(Easing.cubic) }),
          withTiming(-5, { duration: 200 }),
          withTiming(0, { duration: 150 })
        )
      );
      
      // Screen shake on impact
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeX.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-8, { duration: 50 }),
          withTiming(8, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
      }, 500);
      
      // Streak number "cracks" and falls
      setTimeout(() => {
        streakScale.value = withSequence(
          withTiming(1.2, { duration: 100 }),
          withTiming(0.8, { duration: 200 }),
          withTiming(1, { duration: 150 })
        );
        textOpacity.value = withTiming(1, { duration: 300 });
      }, 700);
      
      // Show freeze option after dramatic pause
      setTimeout(() => {
        setShowFreezeOption(true);
        if (hasStreakFreeze) {
          freezeButtonScale.value = withSpring(1, { damping: 10 });
          pulseGlow.value = withRepeat(
            withSequence(
              withTiming(1, { duration: 500 }),
              withTiming(0.5, { duration: 500 })
            ),
            -1,
            true
          );
        }
      }, 1200);
      
    } else {
      // Reset
      backgroundOpacity.value = 0;
      scytheRotation.value = -45;
      scytheScale.value = 0;
      textOpacity.value = 0;
      streakScale.value = 1;
      shakeX.value = 0;
      pulseGlow.value = 0;
      freezeButtonScale.value = 0;
    }
  }, [visible, hasStreakFreeze]);

  const handleUseFreeze = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Reverse death animation
    scytheRotation.value = withTiming(-90, { duration: 300 });
    scytheScale.value = withTiming(0, { duration: 300 });
    backgroundOpacity.value = withDelay(200, withTiming(0, { duration: 300 }));
    
    setTimeout(() => {
      onUseFreeze();
      onClose();
    }, 500);
  };

  const handleAcceptDeath = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    backgroundOpacity.value = withTiming(0, { duration: 300 });
    
    setTimeout(() => {
      onAcceptDeath();
      onClose();
    }, 300);
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const scytheStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scytheScale.value },
      { rotate: `${scytheRotation.value}deg` },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const streakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const freezeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: freezeButtonScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulseGlow.value,
  }));

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, backgroundStyle]}>
        <Animated.View style={[styles.container, containerStyle]}>
          {/* Grim Reaper Scythe */}
          <Animated.View style={[styles.scytheContainer, scytheStyle]}>
            <Text style={styles.scytheEmoji}>⚰️</Text>
            <View style={styles.scytheBlade}>
              <Text style={styles.scytheIcon}>💀</Text>
            </View>
          </Animated.View>

          {/* Death Message */}
          <Animated.View style={[styles.messageContainer, textStyle]}>
            <Text style={styles.deathTitle}>STREAK LOST</Text>
            
            <Animated.View style={streakStyle}>
              <View style={styles.deadStreakContainer}>
                <Text style={styles.deadStreakNumber}>{deadStreak}</Text>
                <View style={styles.crackOverlay}>
                  <Text style={styles.crackEmoji}>💔</Text>
                </View>
              </View>
            </Animated.View>
            
            <Text style={styles.deathSubtitle}>
              {deadStreak >= 10 
                ? "A legendary streak... gone forever." 
                : deadStreak >= 5 
                  ? "So close to greatness..."
                  : "Back to zero."}
            </Text>
          </Animated.View>

          {/* Action Buttons */}
          {showFreezeOption && (
            <View style={styles.actionsContainer}>
              {hasStreakFreeze ? (
                <>
                  {/* Use Freeze Button */}
                  <Animated.View style={freezeButtonStyle}>
                    <Animated.View style={[styles.freezeGlow, glowStyle]} />
                    <Pressable
                      onPress={handleUseFreeze}
                      style={({ pressed }) => [
                        styles.freezeButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.freezeIcon}>🧊</Text>
                      <View>
                        <Text style={styles.freezeButtonText}>USE STREAK FREEZE</Text>
                        <Text style={styles.freezeSubtext}>Save your {deadStreak} streak!</Text>
                      </View>
                    </Pressable>
                  </Animated.View>

                  {/* Accept Death */}
                  <Pressable
                    onPress={handleAcceptDeath}
                    style={styles.acceptButton}
                  >
                    <Text style={styles.acceptButtonText}>Let it die...</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  {/* No Freeze Available */}
                  <View style={styles.noFreezeContainer}>
                    <Text style={styles.noFreezeText}>
                      😢 No Streak Freeze available
                    </Text>
                    <Text style={styles.noFreezeHint}>
                      Earn them from Mystery Chests or Daily Spin!
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleAcceptDeath}
                    style={({ pressed }) => [
                      styles.continueButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.continueButtonText}>Continue</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },
  scytheContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  scytheEmoji: {
    fontSize: 80,
  },
  scytheBlade: {
    position: 'absolute',
    top: -20,
    right: -30,
  },
  scytheIcon: {
    fontSize: 50,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  deathTitle: {
    fontSize: 36,
    fontFamily: 'Righteous_400Regular',
    color: '#DC2626',
    letterSpacing: 4,
    marginBottom: 20,
    textShadowColor: '#DC2626',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  deadStreakContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  deadStreakNumber: {
    fontSize: 120,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
    opacity: 0.3,
  },
  crackOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  crackEmoji: {
    fontSize: 60,
  },
  deathSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  freezeGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: '#06B6D4',
    borderRadius: 30,
    opacity: 0,
  },
  freezeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 20,
    gap: 12,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  freezeIcon: {
    fontSize: 32,
  },
  freezeButtonText: {
    fontSize: 18,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
  },
  freezeSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  acceptButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  acceptButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },
  noFreezeContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    width: '100%',
  },
  noFreezeText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  noFreezeHint: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
  },
});

