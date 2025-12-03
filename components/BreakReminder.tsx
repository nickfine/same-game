import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeIn, 
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, COMPLIANCE } from '../lib/constants';

interface BreakReminderProps {
  visible: boolean;
  sessionMinutes: number;
  onDismiss: () => void;
  onTakeBreak: () => void;
}

export function BreakReminder({ 
  visible, 
  sessionMinutes, 
  onDismiss, 
  onTakeBreak 
}: BreakReminderProps) {
  const bounce = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      // Start animations
      bounce.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        true
      );
      
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  const handleTakeBreak = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTakeBreak();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}>
        <Animated.View
          entering={SlideInUp.springify().damping(18)}
          style={{ 
            backgroundColor: COLORS.white,
            borderRadius: 28,
            padding: 32,
            width: '100%',
            maxWidth: 360,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* Animated Icon */}
          <Animated.View style={iconStyle}>
            <View style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 50,
              backgroundColor: COLORS.warning + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Animated.View 
                style={[
                  { 
                    position: 'absolute',
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: COLORS.warning,
                  },
                  glowStyle
                ]} 
              />
              <Text style={{ fontSize: 48, zIndex: 1 }}>☕</Text>
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={{ 
            fontSize: 24, 
            fontFamily: 'Righteous_400Regular',
            color: COLORS.text,
            textAlign: 'center',
            marginBottom: 12,
          }}>
            Time for a Break!
          </Text>

          {/* Message */}
          <Text style={{ 
            fontSize: 15, 
            fontFamily: 'Poppins_400Regular',
            color: COLORS.muted,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 8,
          }}>
            You've been playing for{' '}
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: COLORS.text }}>
              {formatTime(sessionMinutes)}
            </Text>
            . Taking regular breaks helps you stay sharp!
          </Text>

          {/* Tip */}
          <View style={{ 
            backgroundColor: COLORS.background,
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            marginBottom: 24,
            width: '100%',
          }}>
            <Text style={{ 
              fontSize: 13, 
              fontFamily: 'Poppins_500Medium',
              color: COLORS.optionA,
              textAlign: 'center',
              marginBottom: 4,
            }}>
              💡 Pro Tip
            </Text>
            <Text style={{ 
              fontSize: 13, 
              fontFamily: 'Poppins_400Regular',
              color: COLORS.muted,
              textAlign: 'center',
              lineHeight: 20,
            }}>
              Stand up, stretch, grab some water, and look at something far away for 20 seconds.
            </Text>
          </View>

          {/* Buttons */}
          <View style={{ width: '100%', gap: 12 }}>
            <Pressable
              onPress={handleTakeBreak}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#059669' : COLORS.success,
                borderRadius: 14,
                paddingVertical: 16,
                width: '100%',
              })}
            >
              <Text style={{ 
                fontFamily: 'Righteous_400Regular',
                fontSize: 16,
                color: COLORS.white,
                textAlign: 'center',
              }}>
                🚶 Take a 5-min Break
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => ({
                backgroundColor: pressed ? COLORS.border : 'transparent',
                borderRadius: 14,
                paddingVertical: 14,
                width: '100%',
              })}
            >
              <Text style={{ 
                fontFamily: 'Poppins_500Medium',
                fontSize: 14,
                color: COLORS.muted,
                textAlign: 'center',
              }}>
                Remind me in {COMPLIANCE.BREAK_REMINDER_COOLDOWN} minutes
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

