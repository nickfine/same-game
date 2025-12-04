import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { StreakMeterCompact } from './StreakMeter';

interface AppHeaderProps {
  score: number;
  currentStreak?: number;
  lastDeadStreak?: number | null;
  daysSinceDeath?: number;
  onMenuPress: () => void;
  onStreakPress?: () => void;
}

export function AppHeader({ 
  score, 
  currentStreak = 0,
  lastDeadStreak,
  daysSinceDeath,
  onMenuPress,
  onStreakPress,
}: AppHeaderProps) {
  const scale = useSharedValue(1);
  const previousScore = useSharedValue(score);

  useEffect(() => {
    if (score !== previousScore.value) {
      scale.value = withSequence(
        withTiming(1.3, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      previousScore.value = score;
    }
  }, [score]);

  const animatedScoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMenuPress();
  };

  return (
    <View style={{ paddingTop: 4 }}>
      {/* Top row: Menu, Logo, Score */}
      <View 
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        {/* Menu Button */}
        <Pressable 
          onPress={handleMenuPress}
          style={{
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View style={{ gap: 5 }}>
            <View style={{ width: 22, height: 2.5, backgroundColor: '#18181b', borderRadius: 2 }} />
            <View style={{ width: 22, height: 2.5, backgroundColor: '#18181b', borderRadius: 2 }} />
            <View style={{ width: 22, height: 2.5, backgroundColor: '#18181b', borderRadius: 2 }} />
          </View>
        </Pressable>

        {/* Logo + Streak */}
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text 
            style={{ 
              fontFamily: 'Righteous_400Regular',
              fontSize: 32,
              color: '#18181b',
              letterSpacing: 4,
            }}
          >
            SAME
          </Text>
        </View>

        {/* Score Badge */}
        <Animated.View 
          style={[
            animatedScoreStyle,
            {
              backgroundColor: '#18181b',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              minWidth: 44,
              alignItems: 'center',
            }
          ]}
        >
          <Text 
            style={{ 
              fontFamily: 'Righteous_400Regular',
              fontSize: 16,
              color: '#ffffff',
            }}
          >
            {score}
          </Text>
        </Animated.View>
      </View>

      {/* Streak meter row */}
      <View style={{ 
        alignItems: 'center', 
        paddingBottom: 8,
      }}>
        <StreakMeterCompact
          currentStreak={currentStreak}
          lastDeadStreak={lastDeadStreak}
          daysSinceDeath={daysSinceDeath}
          onPress={onStreakPress}
        />
      </View>
    </View>
  );
}
