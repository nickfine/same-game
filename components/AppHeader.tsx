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
import { LevelBadge } from './LevelBadge';

interface AppHeaderProps {
  score: number;
  level?: number;
  xp?: number;
  onMenuPress: () => void;
  onLevelPress?: () => void;
}

export function AppHeader({ score, level = 1, xp = 0, onMenuPress, onLevelPress }: AppHeaderProps) {
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
    <View 
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      {/* Level Badge - Prominent left position */}
      <LevelBadge 
        level={level} 
        xp={xp} 
        size="medium" 
        showProgress={true}
        onPress={onLevelPress}
      />

      {/* Logo - Center */}
      <Text 
        style={{ 
          fontFamily: 'Righteous_400Regular',
          fontSize: 28,
          color: '#18181b',
          letterSpacing: 3,
        }}
      >
        SAME
      </Text>

      {/* Right side: Score + Menu */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Score Badge */}
        <Animated.View 
          style={[
            animatedScoreStyle,
            {
              backgroundColor: '#18181b',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 16,
              minWidth: 40,
              alignItems: 'center',
            }
          ]}
        >
          <Text 
            style={{ 
              fontFamily: 'Righteous_400Regular',
              fontSize: 14,
              color: '#ffffff',
            }}
          >
            {score}
          </Text>
        </Animated.View>

        {/* Menu Button */}
        <Pressable 
          onPress={handleMenuPress}
          style={{
            width: 36,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View style={{ gap: 4 }}>
            <View style={{ width: 18, height: 2, backgroundColor: '#18181b', borderRadius: 1 }} />
            <View style={{ width: 18, height: 2, backgroundColor: '#18181b', borderRadius: 1 }} />
            <View style={{ width: 18, height: 2, backgroundColor: '#18181b', borderRadius: 1 }} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

