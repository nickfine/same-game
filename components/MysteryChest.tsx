import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { COLORS } from '../lib/constants';
import { ANIMATION_TIMING, generateChestReward, REWARDS, type Reward } from '../lib/rewards';

interface MysteryChestProps {
  visible: boolean;
  onClose: () => void;
  onRewardClaimed: (reward: Reward) => void;
}

type ChestState = 'appearing' | 'shaking' | 'opening' | 'revealed';

export function MysteryChest({ visible, onClose, onRewardClaimed }: MysteryChestProps) {
  const [chestState, setChestState] = useState<ChestState>('appearing');
  const [reward, setReward] = useState<Reward | null>(null);
  const [showTapHint, setShowTapHint] = useState(false);

  // Animation values
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const lidRotation = useSharedValue(0);
  const rewardScale = useSharedValue(0);
  const rewardY = useSharedValue(50);
  const sparkles = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setChestState('appearing');
      setReward(null);
      setShowTapHint(false);
      
      // Generate reward immediately but don't reveal yet
      const newReward = generateChestReward();
      setReward(newReward);
      
      // Start appearance animation
      backgroundOpacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      
      // Show tap hint after appearing
      setTimeout(() => {
        setShowTapHint(true);
      }, 500);
    } else {
      // Reset all values
      scale.value = 0;
      rotation.value = 0;
      glowOpacity.value = 0;
      glowScale.value = 1;
      lidRotation.value = 0;
      rewardScale.value = 0;
      rewardY.value = 50;
      sparkles.value = 0;
      backgroundOpacity.value = 0;
    }
  }, [visible]);

  const startOpeningSequence = useCallback(() => {
    if (chestState !== 'appearing') return;
    
    setChestState('shaking');
    setShowTapHint(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Phase 1: Shaking (builds anticipation)
    rotation.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 100 }),
        withTiming(-8, { duration: 100 }),
        withTiming(0, { duration: 50 })
      ),
      4, // Repeat 4 times
      false
    );

    // Glow pulse during shake
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: ANIMATION_TIMING.CHEST_GLOW_PULSE }),
        withTiming(0.3, { duration: ANIMATION_TIMING.CHEST_GLOW_PULSE })
      ),
      -1,
      true
    );
    
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: ANIMATION_TIMING.CHEST_GLOW_PULSE }),
        withTiming(1, { duration: ANIMATION_TIMING.CHEST_GLOW_PULSE })
      ),
      -1,
      true
    );

    // Haptic pulses during shake
    const hapticInterval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 150);

    // Phase 2: The dramatic pause + open (1.8s total)
    setTimeout(() => {
      clearInterval(hapticInterval);
      setChestState('opening');
      
      // Stop shaking
      rotation.value = withTiming(0, { duration: 100 });
      
      // Dramatic glow intensifies
      glowOpacity.value = withTiming(1, { duration: 300 });
      glowScale.value = withTiming(1.5, { duration: 300 });
      
      // Heavy haptic for opening
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Lid opens
      lidRotation.value = withSpring(-120, { damping: 8, stiffness: 80 });
      
      // Reward emerges
      setTimeout(() => {
        setChestState('revealed');
        
        // Reward animation
        rewardScale.value = withSpring(1, { damping: 10, stiffness: 100 });
        rewardY.value = withSpring(-80, { damping: 12, stiffness: 90 });
        
        // Sparkle particles
        sparkles.value = withTiming(1, { duration: 500 });
        
        // Success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 400);
      
    }, ANIMATION_TIMING.CHEST_REVEAL_DELAY);
  }, [chestState]);

  const handleClaim = useCallback(() => {
    if (chestState !== 'revealed' || !reward) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate out
    scale.value = withTiming(0, { duration: 200 });
    backgroundOpacity.value = withTiming(0, { duration: 200 });
    
    setTimeout(() => {
      onRewardClaimed(reward);
      onClose();
    }, 200);
  }, [chestState, reward, onRewardClaimed, onClose]);

  // Animated styles
  const chestStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 500 },
      { rotateX: `${lidRotation.value}deg` },
    ],
    transformOrigin: 'bottom',
  }));

  const rewardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: rewardScale.value },
      { translateY: rewardY.value },
    ],
    opacity: interpolate(rewardScale.value, [0, 0.5, 1], [0, 1, 1]),
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const getRarityGlow = () => {
    if (!reward) return COLORS.optionB;
    switch (reward.rarity) {
      case 'legendary': return '#FFD700';
      case 'epic': return '#A855F7';
      case 'rare': return '#3B82F6';
      case 'uncommon': return '#22C55E';
      default: return COLORS.optionB;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, backgroundStyle]}>
        <Pressable 
          style={styles.container}
          onPress={chestState === 'appearing' ? startOpeningSequence : handleClaim}
        >
          {/* Glow effect */}
          <Animated.View 
            style={[
              styles.glow, 
              glowStyle,
              { backgroundColor: getRarityGlow() }
            ]} 
          />

          {/* Chest */}
          <Animated.View style={[styles.chestContainer, chestStyle]}>
            {/* Chest body */}
            <View style={styles.chestBody}>
              <Text style={styles.chestEmoji}>📦</Text>
            </View>

            {/* Lid (animated) */}
            <Animated.View style={[styles.chestLid, lidStyle]}>
              <View style={styles.lidInner} />
            </Animated.View>
          </Animated.View>

          {/* Reward display */}
          {reward && chestState === 'revealed' && (
            <Animated.View style={[styles.rewardContainer, rewardStyle]}>
              <View style={[styles.rewardBadge, { backgroundColor: reward.color + '20', borderColor: reward.color }]}>
                <Text style={styles.rewardIcon}>{reward.icon}</Text>
              </View>
              <Text style={styles.rewardName}>{reward.displayName}</Text>
              {reward.value > 0 && (
                <Text style={[styles.rewardValue, { color: reward.color }]}>
                  {reward.type === 'points' ? `+${reward.value}` : `x${reward.value}`}
                </Text>
              )}
              <Text style={styles.rewardDescription}>{reward.description}</Text>
            </Animated.View>
          )}

          {/* Tap hint */}
          {showTapHint && chestState === 'appearing' && (
            <Animated.View style={styles.tapHint}>
              <Text style={styles.tapHintText}>👆 Tap to open!</Text>
            </Animated.View>
          )}

          {/* Claim button */}
          {chestState === 'revealed' && (
            <Pressable style={styles.claimButton} onPress={handleClaim}>
              <Text style={styles.claimButtonText}>Claim Reward!</Text>
            </Pressable>
          )}

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {chestState === 'appearing' && '🎁 Mystery Chest!'}
              {chestState === 'shaking' && '✨ Opening...'}
              {chestState === 'opening' && '💫'}
              {chestState === 'revealed' && '🎉 You got:'}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    position: 'absolute',
    top: 120,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
    textAlign: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0,
  },
  chestContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chestBody: {
    width: 120,
    height: 100,
    backgroundColor: '#8B4513',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#D4A574',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  chestEmoji: {
    fontSize: 60,
  },
  chestLid: {
    position: 'absolute',
    top: -10,
    width: 130,
    height: 40,
    backgroundColor: '#A0522D',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 4,
    borderColor: '#D4A574',
  },
  lidInner: {
    position: 'absolute',
    top: 10,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 20,
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  rewardContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  rewardBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 16,
  },
  rewardIcon: {
    fontSize: 48,
  },
  rewardName: {
    fontSize: 24,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 36,
    fontFamily: 'Righteous_400Regular',
    marginBottom: 8,
  },
  rewardDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    maxWidth: 250,
  },
  tapHint: {
    position: 'absolute',
    bottom: 200,
  },
  tapHintText: {
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.8)',
  },
  claimButton: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: '#22C55E',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  claimButtonText: {
    fontSize: 18,
    fontFamily: 'Righteous_400Regular',
    color: '#fff',
  },
});

