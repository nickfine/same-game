import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { 
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, COMPLIANCE } from '../lib/constants';

interface DailyVoteLimitModalProps {
  visible: boolean;
  votesToday: number;
  onClose: () => void;
}

export function DailyVoteLimitModal({ 
  visible, 
  votesToday,
  onClose,
}: DailyVoteLimitModalProps) {
  const wobble = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      wobble.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 100 }),
          withTiming(3, { duration: 100 }),
          withTiming(0, { duration: 100 })
        ),
        2
      );
    }
  }, [visible]);

  const wobbleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value}deg` }],
  }));

  const getTimeUntilMidnight = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
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
            maxWidth: 340,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* Icon */}
          <Animated.View style={wobbleStyle}>
            <View style={{ 
              width: 88, 
              height: 88, 
              borderRadius: 44,
              backgroundColor: COLORS.optionB + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 44 }}>🗳️</Text>
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={{ 
            fontSize: 22, 
            fontFamily: 'Righteous_400Regular',
            color: COLORS.text,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Daily Votes Used Up!
          </Text>

          {/* Counter */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'baseline',
            marginBottom: 16,
          }}>
            <Text style={{ 
              fontSize: 36, 
              fontFamily: 'Righteous_400Regular',
              color: COLORS.optionB,
            }}>
              {votesToday}
            </Text>
            <Text style={{ 
              fontSize: 18, 
              fontFamily: 'Poppins_500Medium',
              color: COLORS.muted,
              marginLeft: 4,
            }}>
              / {COMPLIANCE.DAILY_VOTE_CAP_MINOR}
            </Text>
          </View>

          {/* Message */}
          <Text style={{ 
            fontSize: 15, 
            fontFamily: 'Poppins_400Regular',
            color: COLORS.muted,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 20,
          }}>
            You've cast all {COMPLIANCE.DAILY_VOTE_CAP_MINOR} of your daily votes. 
            Nice work! Come back tomorrow for more.
          </Text>

          {/* Reset Timer */}
          <View style={{ 
            backgroundColor: COLORS.background,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            width: '100%',
          }}>
            <Text style={{ 
              fontSize: 13, 
              fontFamily: 'Poppins_500Medium',
              color: COLORS.success,
              textAlign: 'center',
              marginBottom: 4,
            }}>
              ✨ New votes in
            </Text>
            <Text style={{ 
              fontSize: 20, 
              fontFamily: 'Righteous_400Regular',
              color: COLORS.text,
              textAlign: 'center',
            }}>
              {getTimeUntilMidnight()}
            </Text>
          </View>

          {/* Suggestion */}
          <Text style={{ 
            fontSize: 13, 
            fontFamily: 'Poppins_400Regular',
            color: COLORS.muted,
            textAlign: 'center',
            marginBottom: 24,
          }}>
            💡 Why not create a question for others to vote on?
          </Text>

          {/* Close Button */}
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#2d2d30' : COLORS.text,
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
              See you tomorrow! 👋
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

