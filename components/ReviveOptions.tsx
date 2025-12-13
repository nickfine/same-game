import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Share, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReviveOptionsProps {
  visible: boolean;
  deadStreak: number;
  hasStreakFreeze: boolean;
  wasInHyperstreak?: boolean; // Was user in Hyperstreak when they died?
  onUseFreeze: () => void;
  onWatchAd: () => void;
  onShareToFriends: () => void;
  onDecline: () => void;
}

// Individual option card with spring animation
function OptionCard({ 
  index, 
  icon, 
  title, 
  subtitle,
  gradientColors,
  glowColor,
  onPress,
  disabled = false,
  shake = false,
}: {
  index: number;
  icon: string;
  title: string;
  subtitle: string;
  gradientColors: readonly [string, string, ...string[]];
  glowColor: string;
  onPress: () => void;
  disabled?: boolean;
  shake?: boolean;
}) {
  const translateX = useSharedValue(SCREEN_WIDTH);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);
  const shakeX = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Staggered spring entrance - slower for readability
    const delay = 200 + index * 180; // More delay between cards
    
    translateX.value = withDelay(
      delay,
      withSpring(0, { 
        damping: 12, 
        stiffness: 80, // Softer spring
        mass: 1.2,
      })
    );
    
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300 })
    );
    
    // Pulsing glow - starts after card settles
    glowOpacity.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.4, { duration: 1000 })
        ),
        -1,
        true
      )
    );
  }, []);

  // Shake animation for the ad option
  useEffect(() => {
    if (shake) {
      shakeX.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 80 }),
          withTiming(3, { duration: 80 }),
          withTiming(-2, { duration: 80 }),
          withTiming(2, { duration: 80 }),
          withTiming(0, { duration: 80 })
        ),
        -1,
        false
      );
    }
  }, [shake]);

  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    if (disabled) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Satisfying press animation
    pressScale.value = withSequence(
      withTiming(0.9, { duration: 50 }),
      withSpring(1.05, { damping: 10 }),
      withTiming(1, { duration: 100 })
    );
    
    setTimeout(onPress, 150);
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + shakeX.value },
      { scale: scale.value * pressScale.value },
    ],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.cardContainer, cardStyle]}>
      {/* Glow effect behind card */}
      <Animated.View style={[styles.cardGlow, glowStyle, { backgroundColor: glowColor }]} />
      
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={styles.cardPressable}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardIcon}>{icon}</Text>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
          </View>
          
          {/* Arrow indicator */}
          <Text style={styles.cardArrow}>→</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// The main call-to-action text
function ReviveTitle({ visible, wasInHyperstreak }: { visible: boolean; wasInHyperstreak?: boolean }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const hyperTextOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Dramatic title entrance
      opacity.value = withTiming(1, { duration: 350 });
      scale.value = withSequence(
        withSpring(1.15, { damping: 8, stiffness: 120 }),
        withTiming(1, { duration: 200 })
      );
      
      // Delayed hyperstreak message for extra devastation
      if (wasInHyperstreak) {
        hyperTextOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
      }
    }
  }, [visible, wasInHyperstreak]);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const hyperStyle = useAnimatedStyle(() => ({
    opacity: hyperTextOpacity.value,
  }));

  return (
    <Animated.View style={[styles.titleContainer, titleStyle]}>
      <Text style={styles.reviveTitle}>BRING IT BACK?</Text>
      {wasInHyperstreak && (
        <Animated.Text style={[styles.hyperstreakDeathText, hyperStyle]}>
          🐍 Your Hyperstreak also crashed… devastating.
        </Animated.Text>
      )}
    </Animated.View>
  );
}

// Decline button at the bottom
function DeclineButton({ 
  onPress, 
  visible 
}: { 
  onPress: () => void; 
  visible: boolean;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      // Appear after all cards have settled (cards take ~1s to appear)
      opacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
      translateY.value = withDelay(1200, withSpring(0, { damping: 12 }));
    }
  }, [visible]);

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={buttonStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={({ pressed }) => [
          styles.declineButton,
          pressed && styles.declinePressed,
        ]}
      >
        <Text style={styles.declineText}>Let it die...</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ReviveOptions({
  visible,
  deadStreak,
  hasStreakFreeze,
  wasInHyperstreak = false,
  onUseFreeze,
  onWatchAd,
  onShareToFriends,
  onDecline,
}: ReviveOptionsProps) {
  const backgroundOpacity = useSharedValue(0);
  const [showContent, setShowContent] = useState(false);

  // Pre-written share message - guaranteed to get opens + revives
  const shareMessage = `I just lost my ${deadStreak}-day streak on @same_app and I'm in physical pain. Save me. 💀`;

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web share API or clipboard fallback
        if (navigator.share) {
          await navigator.share({
            title: 'Help me save my streak!',
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
      onShareToFriends();
    } catch (error) {
      console.log('Share cancelled or failed');
    }
  };

  useEffect(() => {
    if (visible) {
      // Violet/coral gradient background fades in
      backgroundOpacity.value = withTiming(1, { duration: 400 });
      
      // Show content after background settles
      setTimeout(() => setShowContent(true), 200);
    } else {
      backgroundOpacity.value = withTiming(0, { duration: 200 });
      setShowContent(false);
    }
  }, [visible]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Gradient background */}
      <Animated.View style={[StyleSheet.absoluteFill, backgroundStyle]}>
        <LinearGradient
          colors={['#1A0533', '#2D1B4E', '#1A0533']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Animated gradient overlay for drama */}
        <LinearGradient
          colors={['transparent', 'rgba(139, 92, 246, 0.15)', 'rgba(255, 107, 107, 0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.container}>
        {/* Main CTA */}
        <ReviveTitle visible={showContent} wasInHyperstreak={wasInHyperstreak} />

        {/* Option cards */}
        <View style={styles.cardsContainer}>
          {/* Option 1: Use Streak Freeze */}
          {hasStreakFreeze && (
            <OptionCard
              index={0}
              icon="🧊"
              title="Revive with Streak Freeze"
              subtitle={`Save your ${deadStreak}-day streak!`}
              gradientColors={['#06B6D4', '#0891B2', '#0E7490']}
              glowColor="#06B6D4"
              onPress={onUseFreeze}
            />
          )}

          {/* Option 2: Watch Ad */}
          <OptionCard
            index={hasStreakFreeze ? 1 : 0}
            icon="📺"
            title="Watch Ad → Revive FREE"
            subtitle="30s ad = streak lives"
            gradientColors={['#8B5CF6', '#7C3AED', '#6D28D9']}
            glowColor="#8B5CF6"
            onPress={onWatchAd}
            shake={true}
          />

          {/* Option 3: Share to Friends */}
          <OptionCard
            index={hasStreakFreeze ? 2 : 1}
            icon="💬"
            title="Share → Revive FREE"
            subtitle="Send to 3 friends to unlock"
            gradientColors={['#FF6B6B', '#F43F5E', '#E11D48']}
            glowColor="#FF6B6B"
            onPress={handleShare}
          />
        </View>

        {/* Decline option */}
        <DeclineButton onPress={onDecline} visible={showContent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  titleContainer: {
    marginBottom: 40,
  },
  reviveTitle: {
    fontSize: 36,
    fontFamily: 'Righteous_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 3,
    textShadowColor: 'rgba(139, 92, 246, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  hyperstreakDeathText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#F97316',
    textAlign: 'center',
    marginTop: 12,
    textShadowColor: 'rgba(249, 115, 22, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  cardsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  cardContainer: {
    width: '100%',
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 24,
    opacity: 0.4,
  },
  cardPressable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Righteous_400Regular',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardArrow: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Righteous_400Regular',
  },
  declineButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  declinePressed: {
    opacity: 0.6,
  },
  declineText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
});

