import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, Linking } from 'react-native';
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

interface PlaytimeLimitModalProps {
  visible: boolean;
  weeklyMinutes: number;
  onClose: () => void;
}

export function PlaytimeLimitModal({ 
  visible, 
  weeklyMinutes,
  onClose,
}: PlaytimeLimitModalProps) {
  const shake = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Shake animation
      shake.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withRepeat(
          withSequence(
            withTiming(5, { duration: 100 }),
            withTiming(-5, { duration: 100 })
          ),
          3
        ),
        withTiming(0, { duration: 50 })
      );
      
      // Pulse animation
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    
    const diff = nextMonday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
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
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}>
        <Animated.View
          entering={SlideInUp.springify().damping(18)}
          style={[
            shakeStyle,
            { 
              backgroundColor: COLORS.white,
              borderRadius: 28,
              padding: 32,
              width: '100%',
              maxWidth: 360,
              alignItems: 'center',
              shadowColor: COLORS.danger,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 12,
            }
          ]}
        >
          {/* Icon */}
          <Animated.View style={pulseStyle}>
            <View style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 50,
              backgroundColor: COLORS.danger + '15',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
              borderWidth: 3,
              borderColor: COLORS.danger + '40',
            }}>
              <Text style={{ fontSize: 48 }}>⏰</Text>
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={{ 
            fontSize: 24, 
            fontFamily: 'Righteous_400Regular',
            color: COLORS.danger,
            textAlign: 'center',
            marginBottom: 12,
          }}>
            Weekly Limit Reached
          </Text>

          {/* Stats */}
          <View style={{ 
            backgroundColor: COLORS.danger + '10',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.danger + '20',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ 
                fontFamily: 'Poppins_500Medium',
                fontSize: 14,
                color: COLORS.muted,
              }}>
                Time played this week
              </Text>
              <Text style={{ 
                fontFamily: 'Poppins_600SemiBold',
                fontSize: 14,
                color: COLORS.danger,
              }}>
                {formatTime(weeklyMinutes)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ 
                fontFamily: 'Poppins_500Medium',
                fontSize: 14,
                color: COLORS.muted,
              }}>
                Weekly limit
              </Text>
              <Text style={{ 
                fontFamily: 'Poppins_600SemiBold',
                fontSize: 14,
                color: COLORS.text,
              }}>
                {formatTime(COMPLIANCE.WEEKLY_PLAYTIME_CAP_MINOR)}
              </Text>
            </View>
          </View>

          {/* Message */}
          <Text style={{ 
            fontSize: 15, 
            fontFamily: 'Poppins_400Regular',
            color: COLORS.muted,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 8,
          }}>
            You've reached your {formatTime(COMPLIANCE.WEEKLY_PLAYTIME_CAP_MINOR)} weekly play limit. 
            This helps maintain a healthy balance.
          </Text>

          {/* Reset Timer */}
          <View style={{ 
            backgroundColor: COLORS.background,
            borderRadius: 12,
            padding: 16,
            marginTop: 8,
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
              🔄 Limit resets in
            </Text>
            <Text style={{ 
              fontSize: 18, 
              fontFamily: 'Righteous_400Regular',
              color: COLORS.text,
              textAlign: 'center',
            }}>
              {getTimeUntilReset()}
            </Text>
          </View>

          {/* Suggestions */}
          <View style={{ width: '100%', marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 13, 
              fontFamily: 'Poppins_600SemiBold',
              color: COLORS.text,
              marginBottom: 12,
            }}>
              While you wait, why not:
            </Text>
            <View style={{ gap: 8 }}>
              {[
                '📚 Read a book',
                '🎨 Try a creative hobby',
                '🚶 Go for a walk outside',
                '👋 Hang out with friends',
              ].map((suggestion, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ 
                    fontSize: 14, 
                    fontFamily: 'Poppins_400Regular',
                    color: COLORS.muted,
                  }}>
                    {suggestion}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Close Button */}
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => ({
              backgroundColor: pressed ? COLORS.border : COLORS.background,
              borderRadius: 14,
              paddingVertical: 16,
              width: '100%',
            })}
          >
            <Text style={{ 
              fontFamily: 'Poppins_500Medium',
              fontSize: 15,
              color: COLORS.text,
              textAlign: 'center',
            }}>
              Got it, see you next week! 👋
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

