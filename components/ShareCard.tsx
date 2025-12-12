import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Share, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Haptics from 'expo-haptics';
import { COLORS, GRADIENTS } from '../lib/constants';

interface ShareCardProps {
  visible: boolean;
  streak: number;
  correctCount: number;
  onClose: () => void;
}

// Fun quotes to share
const SHARE_QUOTES = [
  "I'm basically a mind reader at this point",
  "The hivemind fears me",
  "I understood the assignment",
  "Same wavelength energy only",
  "Call me the prediction prophet",
  "My streak is hotter than your takes",
  "Living rent-free in everyone's head",
  "The people have spoken (through me)",
];

export function ShareCard({ visible, streak, correctCount, onClose }: ShareCardProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);

  const quote = SHARE_QUOTES[Math.floor(Math.random() * SHARE_QUOTES.length)];

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      cardScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      cardOpacity.value = withTiming(1, { duration: 250 });
      buttonScale.value = withDelay(400, withSpring(1, { damping: 12 }));
    } else {
      cardScale.value = 0.8;
      cardOpacity.value = 0;
      buttonScale.value = 0.8;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonScale.value,
  }));

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Capture the card
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        
        // Share
        await Share.share({
          message: `${quote} 🔮\n\n🔥 ${streak} day streak | ${correctCount} correct\n\nPlay Same: [App Store Link]`,
          url: Platform.OS === 'ios' ? uri : undefined,
        });
      } else {
        // Fallback to text-only share
        await Share.share({
          message: `${quote} 🔮\n\n🔥 ${streak} day streak | ${correctCount} correct answers\n\nThink you can beat me? Play Same!`,
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleClose = () => {
    cardScale.value = withTiming(0.9, { duration: 150 });
    cardOpacity.value = withTiming(0, { duration: 150 });
    setTimeout(onClose, 150);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        
        <Animated.View style={[styles.container, cardStyle]}>
          {/* Shareable card content */}
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <LinearGradient
              colors={[COLORS.surface, COLORS.background]}
              style={styles.card}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.logo}>SAME</Text>
                <Text style={styles.tagline}>Prediction Game</Text>
              </View>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>🔥 {streak}</Text>
                  <Text style={styles.statLabel}>DAY STREAK</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>🎯 {correctCount}</Text>
                  <Text style={styles.statLabel}>CORRECT</Text>
                </View>
              </View>

              {/* Quote */}
              <View style={styles.quoteContainer}>
                <Text style={styles.quote}>"{quote}"</Text>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Think you can beat me?</Text>
              </View>
            </LinearGradient>
          </ViewShot>

          {/* Action buttons */}
          <Animated.View style={[styles.buttons, buttonStyle]}>
            <Pressable onPress={handleShare} style={styles.shareButton}>
              <LinearGradient
                colors={GRADIENTS.purple}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareButtonGradient}
              >
                <Text style={styles.shareButtonText}>📤 SHARE</Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={handleClose} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Maybe later</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 26, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    fontSize: 36,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: COLORS.primary,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Righteous_400Regular',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.glassBorder,
  },
  quoteContainer: {
    backgroundColor: COLORS.muted,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  quote: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.secondary,
  },
  buttons: {
    marginTop: 24,
    gap: 12,
  },
  shareButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  shareButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textMuted,
  },
});
