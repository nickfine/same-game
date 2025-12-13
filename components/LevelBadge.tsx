import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { getLevelProgress, getLevelTier, getLevelGradient, formatXP } from '../lib/levels';

interface LevelBadgeProps {
  level: number;
  xp: number;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  onPress?: () => void;
}

const SIZES = {
  small: { outer: 44, fontSize: 16, strokeWidth: 3, emojiSize: 10 },
  medium: { outer: 60, fontSize: 22, strokeWidth: 4, emojiSize: 12 },
  large: { outer: 88, fontSize: 36, strokeWidth: 5, emojiSize: 16 },
};

export function LevelBadge({
  level,
  xp,
  size = 'medium',
  showProgress = true,
  onPress,
}: LevelBadgeProps) {
  const { outer, fontSize, strokeWidth, emojiSize } = SIZES[size];
  const progress = getLevelProgress(xp);
  const tier = getLevelTier(level);
  const gradient = getLevelGradient(level);
  
  // Animation values
  const scale = useSharedValue(1);
  const glowPulse = useSharedValue(0);
  const ringProgress = useSharedValue(0);
  const shimmer = useSharedValue(0);
  
  // Animate progress ring on mount
  useEffect(() => {
    ringProgress.value = withDelay(
      200,
      withTiming(progress.progress, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [progress.progress]);
  
  // Continuous subtle glow for premium feel
  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    // Shimmer effect for high levels
    if (level >= 20) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [level]);
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 400 })
    );
    onPress?.();
  };
  
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.15]) }],
  }));
  
  // Progress ring style for future SVG progress indicator
  // const circumference = Math.PI * (outer - strokeWidth);
  // Commented out for now - will be used when SVG progress ring is implemented

  return (
    <Pressable onPress={handlePress} disabled={!onPress}>
      <Animated.View style={[containerStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        {/* Glow backdrop */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: outer + 16,
              height: outer + 16,
              borderRadius: (outer + 16) / 2,
              backgroundColor: tier.glowColor,
            },
            glowStyle,
          ]}
        />
        
        {/* Main badge container */}
        <View
          style={{
            width: outer,
            height: outer,
            borderRadius: outer / 2,
            backgroundColor: '#18181b',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: strokeWidth,
            borderColor: tier.color,
            shadowColor: tier.color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Inner gradient feel */}
          <View
            style={{
              position: 'absolute',
              width: outer - strokeWidth * 2,
              height: outer - strokeWidth * 2,
              borderRadius: (outer - strokeWidth * 2) / 2,
              backgroundColor: tier.bgColor,
            }}
          />
          
          {/* Level number */}
          <Text
            style={{
              fontFamily: 'Righteous_400Regular',
              fontSize,
              color: tier.color,
              textShadowColor: tier.glowColor,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
            }}
          >
            {level}
          </Text>
          
          {/* Tier emoji badge */}
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              backgroundColor: '#18181b',
              borderRadius: 10,
              padding: 2,
              borderWidth: 2,
              borderColor: tier.color,
            }}
          >
            <Text style={{ fontSize: emojiSize }}>{tier.emoji}</Text>
          </View>
        </View>
        
        {/* Progress indicator dots */}
        {showProgress && !progress.isMaxLevel && (
          <View style={{ flexDirection: 'row', marginTop: 6, gap: 3 }}>
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: i < Math.ceil(progress.progress * 5) 
                    ? tier.color 
                    : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// Compact inline badge for leaderboards
interface LevelBadgeInlineProps {
  level: number;
  size?: 'tiny' | 'small' | 'medium';
}

const INLINE_SIZES = {
  tiny: { height: 20, fontSize: 11, paddingH: 8 },
  small: { height: 24, fontSize: 12, paddingH: 10 },
  medium: { height: 28, fontSize: 14, paddingH: 12 },
};

export function LevelBadgeInline({ level, size = 'small' }: LevelBadgeInlineProps) {
  const { height, fontSize, paddingH } = INLINE_SIZES[size];
  const tier = getLevelTier(level);
  
  return (
    <View
      style={{
        height,
        paddingHorizontal: paddingH,
        borderRadius: height / 2,
        backgroundColor: '#18181b',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: tier.color,
        gap: 4,
        shadowColor: tier.color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: fontSize - 2 }}>{tier.emoji}</Text>
      <Text
        style={{
          fontFamily: 'Righteous_400Regular',
          fontSize,
          color: tier.color,
        }}
      >
        {level}
      </Text>
    </View>
  );
}

// Large hero badge for profile page
interface LevelBadgeHeroProps {
  level: number;
  xp: number;
  onPress?: () => void;
}

export function LevelBadgeHero({ level, xp, onPress }: LevelBadgeHeroProps) {
  const progress = getLevelProgress(xp);
  const tier = getLevelTier(level);
  
  const scale = useSharedValue(1);
  const glowPulse = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  
  useEffect(() => {
    // Animate progress bar
    progressWidth.value = withDelay(
      400,
      withTiming(progress.progress, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      })
    );
    
    // Continuous glow
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1,
      true
    );
  }, [progress.progress]);
  
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      scale.value = withSequence(
        withTiming(0.96, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
      onPress();
    }
  };
  
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.4, 0.8]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.1]) }],
  }));
  
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <Pressable onPress={handlePress} disabled={!onPress}>
      <Animated.View style={[containerStyle, { alignItems: 'center' }]}>
        {/* Large glow */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: tier.glowColor,
            },
            glowStyle,
          ]}
        />
        
        {/* Main badge */}
        <View
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: '#18181b',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 5,
            borderColor: tier.color,
            shadowColor: tier.color,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 16,
          }}
        >
          {/* Inner glow */}
          <View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: tier.bgColor,
            }}
          />
          
          <Text
            style={{
              fontFamily: 'Righteous_400Regular',
              fontSize: 56,
              color: tier.color,
              textShadowColor: tier.glowColor,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 16,
            }}
          >
            {level}
          </Text>
        </View>
        
        {/* Tier badge */}
        <View
          style={{
            marginTop: -16,
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: tier.color,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            shadowColor: tier.color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text style={{ fontSize: 16 }}>{tier.emoji}</Text>
          <Text
            style={{
              fontFamily: 'Poppins_700Bold',
              fontSize: 14,
              color: '#18181b',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {tier.name}
          </Text>
        </View>
        
        {/* XP Progress bar */}
        <View style={{ marginTop: 20, width: 220 }}>
          <View
            style={{
              height: 10,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 5,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Animated.View
              style={[
                {
                  height: '100%',
                  backgroundColor: tier.color,
                  borderRadius: 4,
                },
                progressBarStyle,
              ]}
            />
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text
              style={{
                fontFamily: 'Poppins_600SemiBold',
                fontSize: 13,
                color: tier.color,
              }}
            >
              {formatXP(xp)} XP
            </Text>
            {!progress.isMaxLevel && (
              <Text
                style={{
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {formatXP(progress.nextLevelXP)} XP
              </Text>
            )}
          </View>
          
          {!progress.isMaxLevel && (
            <Text
              style={{
                fontFamily: 'Poppins_400Regular',
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              {formatXP(progress.xpToNextLevel)} XP to Level {level + 1}
            </Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}



