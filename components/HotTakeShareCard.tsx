import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Share, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { COLORS, GRADIENTS } from '../lib/constants';

// ═══════════════════════════════════════════════════════════════
// HOT TAKE SHARE CARD - Beautiful auto-share prompt
// Shows after winning today's hot take question
// ═══════════════════════════════════════════════════════════════

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HotTakeShareCardProps {
  visible: boolean;
  optionA: string;
  optionB: string;
  emojiA: string;
  emojiB: string;
  userChoice: 'a' | 'b';
  userPercent: number;
  shareMessage: string;
  onShare: () => void;
  onDismiss: () => void;
}

export function HotTakeShareCard({
  visible,
  optionA,
  optionB,
  emojiA,
  emojiB,
  userChoice,
  userPercent,
  shareMessage,
  onShare,
  onDismiss,
}: HotTakeShareCardProps) {
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(50);
  const crownScale = useSharedValue(0);
  const glowPulse = useSharedValue(0.5);
  const buttonScale = useSharedValue(1);
  
  useEffect(() => {
    if (visible) {
      // Reset
      backdropOpacity.value = 0;
      cardScale.value = 0.8;
      cardOpacity.value = 0;
      cardY.value = 50;
      crownScale.value = 0;
      glowPulse.value = 0.5;
      
      // Animate in
      backdropOpacity.value = withTiming(1, { duration: 300 });
      
      cardScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 150 }));
      cardOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));
      cardY.value = withDelay(100, withSpring(0, { damping: 15 }));
      
      // Crown slam
      crownScale.value = withDelay(400, withSequence(
        withSpring(1.3, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 10 })
      ));
      
      // Glow pulse
      glowPulse.value = withDelay(600, withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      ));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible]);
  
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 50 }),
      withSpring(1, { damping: 10 })
    );
    
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Same - Hot Take',
            text: shareMessage,
          });
        } else {
          await navigator.clipboard.writeText(shareMessage);
        }
      } else {
        await Share.share({
          message: shareMessage,
        });
      }
      onShare();
    } catch (error) {
      console.log('Share cancelled');
    }
  };
  
  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    backdropOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withTiming(0.9, { duration: 200 });
    cardOpacity.value = withTiming(0, { duration: 200 });
    
    setTimeout(onDismiss, 200);
  };
  
  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { translateY: cardY.value },
    ],
    opacity: cardOpacity.value,
  }));
  
  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));
  
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));
  
  const chosenOption = userChoice === 'a' ? optionA : optionB;
  const chosenEmoji = userChoice === 'a' ? emojiA : emojiB;
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>
        
        {/* Card */}
        <Animated.View style={[styles.cardWrapper, cardStyle]}>
          {/* Outer glow */}
          <Animated.View style={[styles.cardGlow, glowStyle]} />
          
          <LinearGradient
            colors={['#1A0F33', '#2D1B4E', '#1A0F33']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* HOT TAKE Badge */}
            <View style={styles.hotTakeBadge}>
              <LinearGradient
                colors={GRADIENTS.coral}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hotTakeBadgeGradient}
              >
                <Text style={styles.hotTakeBadgeText}>🔥 HOT TAKE 🔥</Text>
              </LinearGradient>
            </View>
            
            {/* Crown */}
            <Animated.View style={[styles.crownContainer, crownStyle]}>
              <Text style={styles.crown}>👑</Text>
            </Animated.View>
            
            {/* "I knew I was right" */}
            <Text style={styles.headline}>I KNEW I WAS RIGHT</Text>
            
            {/* Question preview */}
            <View style={styles.questionPreview}>
              <View style={styles.optionRow}>
                <Text style={styles.optionEmoji}>{emojiA}</Text>
                <Text style={[
                  styles.optionText,
                  userChoice === 'a' && styles.optionTextChosen,
                ]}>
                  {optionA}
                </Text>
                {userChoice === 'a' && <Text style={styles.checkmark}>✓</Text>}
              </View>
              
              <Text style={styles.vsText}>VS</Text>
              
              <View style={styles.optionRow}>
                <Text style={styles.optionEmoji}>{emojiB}</Text>
                <Text style={[
                  styles.optionText,
                  userChoice === 'b' && styles.optionTextChosen,
                ]}>
                  {optionB}
                </Text>
                {userChoice === 'b' && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
            
            {/* Result stat */}
            <View style={styles.resultContainer}>
              <Text style={styles.resultPercent}>{userPercent}%</Text>
              <Text style={styles.resultLabel}>of players agree</Text>
            </View>
            
            {/* Share button */}
            <Animated.View style={buttonStyle}>
              <Pressable onPress={handleShare} style={styles.shareButton}>
                <LinearGradient
                  colors={[COLORS.accent, '#00FFA3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shareButtonGradient}
                >
                  <Text style={styles.shareButtonText}>SHARE YOUR WIN</Text>
                  <Text style={styles.shareButtonEmoji}>📤</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
            
            {/* Skip text */}
            <Pressable onPress={handleDismiss}>
              <Text style={styles.skipText}>Maybe later</Text>
            </Pressable>
            
            {/* Branding */}
            <View style={styles.branding}>
              <Text style={styles.brandingText}>same</Text>
            </View>
          </LinearGradient>
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
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  cardWrapper: {
    width: Math.min(SCREEN_WIDTH - 40, 360),
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -16,
    left: -16,
    right: -16,
    bottom: -16,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  
  // Hot Take Badge
  hotTakeBadge: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
  },
  hotTakeBadgeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hotTakeBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  
  // Crown
  crownContainer: {
    marginTop: 20,
    marginBottom: 8,
  },
  crown: {
    fontSize: 64,
  },
  
  // Headline
  headline: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 24,
    color: COLORS.accent,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20,
    textShadowColor: COLORS.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  
  // Question preview
  questionPreview: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
  },
  optionTextChosen: {
    color: COLORS.accent,
  },
  checkmark: {
    fontSize: 18,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  vsText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginVertical: 8,
    letterSpacing: 3,
  },
  
  // Result
  resultContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultPercent: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 48,
    color: '#FFFFFF',
    textShadowColor: COLORS.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  resultLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: -4,
  },
  
  // Share button
  shareButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  shareButtonText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 16,
    color: '#000',
    letterSpacing: 1,
  },
  shareButtonEmoji: {
    fontSize: 18,
  },
  
  // Skip
  skipText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 8,
  },
  
  // Branding
  branding: {
    position: 'absolute',
    bottom: 8,
    right: 16,
  },
  brandingText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.2)',
    letterSpacing: 2,
  },
});


