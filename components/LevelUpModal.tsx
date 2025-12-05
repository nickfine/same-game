import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, Modal, Pressable, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { getLevelTier, getMilestoneReward, calculateLevelUpBonus, isMilestoneLevel } from '../lib/levels';
import { REWARDS } from '../lib/rewards';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LevelUpModalProps {
  visible: boolean;
  newLevel: number;
  onClose: () => void;
}

// Premium confetti particle
function ConfettiParticle({ 
  delay, 
  color, 
  startX,
  size,
  shape,
}: { 
  delay: number; 
  color: string; 
  startX: number;
  size: number;
  shape: 'circle' | 'square' | 'star';
}) {
  const translateY = useSharedValue(-100);
  const translateX = useSharedValue(startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  
  useEffect(() => {
    // Burst in
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 8 }));
    
    // Fall with physics
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: 2500 + Math.random() * 1500,
        easing: Easing.in(Easing.quad),
      })
    );
    
    // Drift sideways
    translateX.value = withDelay(
      delay,
      withTiming(startX + (Math.random() - 0.5) * 200, {
        duration: 3000,
        easing: Easing.out(Easing.quad),
      })
    );
    
    // Spin
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: 800 + Math.random() * 400, easing: Easing.linear }),
        -1,
        false
      )
    );
    
    // Fade out
    opacity.value = withDelay(delay + 2000, withTiming(0, { duration: 800 }));
  }, []);
  
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
  const shapes: Record<string, string> = {
    circle: '●',
    square: '■',
    star: '★',
  };
  
  return (
    <Animated.Text style={[style, { fontSize: size, color }]}>
      {shapes[shape]}
    </Animated.Text>
  );
}

// Burst ring animation
function BurstRing({ delay, color }: { delay: number; color: string }) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0.8);
  
  useEffect(() => {
    scale.value = withDelay(
      delay,
      withTiming(2.5, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      delay,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, []);
  
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: color,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return <Animated.View style={style} />;
}

export function LevelUpModal({ visible, newLevel, onClose }: LevelUpModalProps) {
  const tier = getLevelTier(newLevel);
  const milestoneReward = getMilestoneReward(newLevel);
  const bonusPoints = calculateLevelUpBonus(newLevel);
  const isMilestone = isMilestoneLevel(newLevel);
  
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const levelScale = useSharedValue(0);
  const levelRotation = useSharedValue(-30);
  const contentOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const glowIntensity = useSharedValue(0);
  
  // Generate confetti
  const confettiParticles = useMemo(() => {
    const colors = [tier.color, '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const shapes: Array<'circle' | 'square' | 'star'> = ['circle', 'square', 'star'];
    
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      delay: Math.random() * 400,
      color: colors[Math.floor(Math.random() * colors.length)],
      startX: Math.random() * SCREEN_WIDTH,
      size: 12 + Math.random() * 16,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));
  }, [tier.color]);
  
  const triggerHaptics = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  const triggerImpact = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);
  
  useEffect(() => {
    if (visible) {
      // Orchestrated animation sequence
      backdropOpacity.value = withTiming(1, { duration: 300 });
      
      // Card entrance
      cardScale.value = withDelay(100, withSpring(1, { damping: 14, stiffness: 200 }));
      cardOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));
      
      // Level reveal with bounce
      levelScale.value = withDelay(
        400,
        withSequence(
          withSpring(1.2, { damping: 6, stiffness: 300 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        )
      );
      levelRotation.value = withDelay(400, withSpring(0, { damping: 12 }));
      
      // Content fade in
      contentOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
      
      // Button entrance
      buttonScale.value = withDelay(1000, withSpring(1, { damping: 12, stiffness: 200 }));
      
      // Glow pulse
      glowIntensity.value = withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(0.5, { duration: 1000 })
          ),
          -1,
          true
        )
      );
      
      // Haptic feedback sequence
      setTimeout(() => runOnJS(triggerImpact)(), 400);
      setTimeout(() => runOnJS(triggerHaptics)(), 600);
    } else {
      // Reset all values
      backdropOpacity.value = 0;
      cardScale.value = 0.8;
      cardOpacity.value = 0;
      levelScale.value = 0;
      levelRotation.value = -30;
      contentOpacity.value = 0;
      buttonScale.value = 0.8;
      glowIntensity.value = 0;
    }
  }, [visible]);
  
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  
  const levelStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: levelScale.value },
      { rotate: `${levelRotation.value}deg` },
    ],
  }));
  
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));
  
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonScale.value,
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowIntensity.value, [0, 1], [0.3, 0.8]),
    transform: [{ scale: interpolate(glowIntensity.value, [0, 1], [1, 1.15]) }],
  }));
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Exit animation
    backdropOpacity.value = withTiming(0, { duration: 250 });
    cardScale.value = withTiming(0.9, { duration: 200 });
    cardOpacity.value = withTiming(0, { duration: 200 });
    
    setTimeout(onClose, 250);
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      {/* Confetti layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {visible && confettiParticles.map((particle) => (
          <ConfettiParticle key={particle.id} {...particle} />
        ))}
      </View>
      
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          },
          backdropStyle,
        ]}
      >
        {/* Burst rings */}
        {visible && (
          <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
            <BurstRing delay={400} color={tier.color} />
            <BurstRing delay={500} color={tier.color} />
            <BurstRing delay={600} color={tier.color} />
          </View>
        )}
        
        {/* Main card */}
        <Animated.View
          style={[
            {
              backgroundColor: '#1a1a1a',
              borderRadius: 28,
              padding: 32,
              alignItems: 'center',
              width: '100%',
              maxWidth: 340,
              borderWidth: 2,
              borderColor: tier.color,
              shadowColor: tier.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 30,
              elevation: 24,
            },
            cardStyle,
          ]}
        >
          {/* Header text */}
          <Animated.View style={contentStyle}>
            <Text
              style={{
                fontFamily: 'Righteous_400Regular',
                fontSize: 28,
                color: tier.color,
                letterSpacing: 6,
                textShadowColor: tier.glowColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 20,
                marginBottom: 24,
              }}
            >
              LEVEL UP!
            </Text>
          </Animated.View>
          
          {/* Level badge with glow */}
          <View style={{ position: 'relative', marginBottom: 20 }}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: tier.glowColor,
                  top: -15,
                  left: -15,
                },
                glowStyle,
              ]}
            />
            
            <Animated.View
              style={[
                {
                  width: 130,
                  height: 130,
                  borderRadius: 65,
                  backgroundColor: '#18181b',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 4,
                  borderColor: tier.color,
                  shadowColor: tier.color,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.6,
                  shadowRadius: 16,
                },
                levelStyle,
              ]}
            >
              <View
                style={{
                  position: 'absolute',
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  backgroundColor: tier.bgColor,
                }}
              />
              <Text
                style={{
                  fontFamily: 'Righteous_400Regular',
                  fontSize: 64,
                  color: tier.color,
                  textShadowColor: tier.glowColor,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 12,
                }}
              >
                {newLevel}
              </Text>
            </Animated.View>
          </View>
          
          {/* Tier name pill */}
          <Animated.View
            style={[
              contentStyle,
              {
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 24,
                backgroundColor: tier.color,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 24,
              },
            ]}
          >
            <Text style={{ fontSize: 18 }}>{tier.emoji}</Text>
            <Text
              style={{
                fontFamily: 'Poppins_700Bold',
                fontSize: 16,
                color: '#18181b',
                textTransform: 'uppercase',
                letterSpacing: 3,
              }}
            >
              {tier.name}
            </Text>
          </Animated.View>
          
          {/* Rewards section */}
          <Animated.View style={[contentStyle, { alignItems: 'center', width: '100%' }]}>
            {/* Points reward */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 184, 0, 0.15)',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 184, 0, 0.3)',
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 10 }}>⭐</Text>
              <Text
                style={{
                  fontFamily: 'Poppins_700Bold',
                  fontSize: 20,
                  color: '#FFB800',
                }}
              >
                +{bonusPoints} Points
              </Text>
            </View>
            
            {/* Milestone power-up reward */}
            {milestoneReward && REWARDS[milestoneReward] && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: `${REWARDS[milestoneReward].color}15`,
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: REWARDS[milestoneReward].color,
                  width: '100%',
                }}
              >
                <Text style={{ fontSize: 32, marginRight: 12 }}>
                  {REWARDS[milestoneReward].icon}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: 'Poppins_700Bold',
                      fontSize: 16,
                      color: REWARDS[milestoneReward].color,
                    }}
                  >
                    {REWARDS[milestoneReward].displayName}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Poppins_400Regular',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.6)',
                      marginTop: 2,
                    }}
                  >
                    🎉 Milestone Reward Unlocked!
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
          
          {/* Continue button */}
          <Animated.View style={[buttonStyle, { width: '100%', marginTop: 24 }]}>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => ({
                backgroundColor: tier.color,
                paddingVertical: 18,
                borderRadius: 16,
                alignItems: 'center',
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text
                style={{
                  fontFamily: 'Righteous_400Regular',
                  fontSize: 18,
                  color: '#18181b',
                  letterSpacing: 3,
                }}
              >
                AWESOME!
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

