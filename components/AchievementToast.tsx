import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Achievement } from '../types';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const translateY = useSharedValue(-150);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Play success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate in
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      dismissToast();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const dismissToast = () => {
    translateY.value = withTiming(-150, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDismiss)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          top: 60,
          left: 20,
          right: 20,
          zIndex: 1000,
        },
      ]}
    >
      <Pressable onPress={dismissToast}>
        <View
          style={{
            backgroundColor: '#18181b',
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#F59E0B',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 24 }}>{achievement.icon}</Text>
          </View>

          {/* Text */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#F59E0B',
                fontSize: 12,
                fontFamily: 'Poppins_700Bold',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Achievement Unlocked!
            </Text>
            <Text
              style={{
                color: '#ffffff',
                fontSize: 18,
                fontFamily: 'Righteous_400Regular',
                marginTop: 2,
              }}
            >
              {achievement.name}
            </Text>
            <Text
              style={{
                color: '#a1a1aa',
                fontSize: 13,
                fontFamily: 'Poppins_400Regular',
                marginTop: 2,
              }}
            >
              {achievement.description}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

