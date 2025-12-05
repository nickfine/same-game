import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { POWER_UP_COSTS, COLORS } from '../lib/constants';

interface PowerUps {
  peek: number;
  skip: number;
  doubleDown: number;
  streakFreeze: number;
}

interface PowerUpBarProps {
  powerUps: PowerUps;
  userScore: number;
  doubleDownActive: boolean;
  peekActive: boolean;
  onUsePeek: () => void;
  onUseSkip: () => void;
  onUseDoubleDown: () => void;
  disabled?: boolean;
}

interface PowerUpButtonProps {
  icon: string;
  label: string;
  count: number;
  cost: number;
  userScore: number;
  isActive?: boolean;
  onPress: () => void;
  disabled?: boolean;
  color: string;
}

function PowerUpButton({ 
  icon, 
  label, 
  count, 
  cost, 
  userScore,
  isActive,
  onPress, 
  disabled,
  color,
}: PowerUpButtonProps) {
  const scale = useSharedValue(1);
  const canAfford = userScore >= cost;
  // Enable if user has inventory OR can afford to buy
  const hasAccess = count > 0 || canAfford;
  const isDisabled = disabled || !hasAccess;

  const handlePress = () => {
    if (isDisabled) {
      // Shake animation for disabled state
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withTiming(0.9, { duration: 50 }),
      withSpring(1, { damping: 10 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable 
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View 
        style={[
          styles.powerUpButton,
          isActive && { backgroundColor: color + '40', borderColor: color },
          isDisabled && !isActive && styles.powerUpButtonDisabled,
          animatedStyle,
        ]}
      >
        {/* Icon */}
        <Text style={styles.powerUpIcon}>{icon}</Text>
        
        {/* Label */}
        <Text style={[
          styles.powerUpLabel,
          isActive && { color },
          isDisabled && !isActive && styles.textDisabled,
        ]}>
          {label}
        </Text>
        
        {/* Count badge */}
        {count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: color }]}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
        
        {/* Cost indicator */}
        {count <= 0 && (
          <View style={[
            styles.costBadge,
            !canAfford && styles.costBadgeDisabled,
          ]}>
            <Text style={[
              styles.costText,
              !canAfford && styles.costTextDisabled,
            ]}>
              {cost}pt
            </Text>
          </View>
        )}

        {/* Active indicator */}
        {isActive && (
          <View style={[styles.activeIndicator, { backgroundColor: color }]}>
            <Text style={styles.activeText}>ON</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function PowerUpBar({
  powerUps,
  userScore,
  doubleDownActive,
  peekActive,
  onUsePeek,
  onUseSkip,
  onUseDoubleDown,
  disabled = false,
}: PowerUpBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.powerUpsRow}>
        {/* Peek */}
        <PowerUpButton
          icon="👁️"
          label="Peek"
          count={powerUps.peek}
          cost={POWER_UP_COSTS.PEEK}
          userScore={userScore}
          isActive={peekActive}
          onPress={onUsePeek}
          disabled={disabled || peekActive}
          color="#10B981"
        />

        {/* Skip */}
        <PowerUpButton
          icon="⏭️"
          label="Skip"
          count={powerUps.skip}
          cost={POWER_UP_COSTS.SKIP}
          userScore={userScore}
          onPress={onUseSkip}
          disabled={disabled}
          color="#6366F1"
        />

        {/* Double Down */}
        <PowerUpButton
          icon="🎲"
          label="2x"
          count={powerUps.doubleDown}
          cost={POWER_UP_COSTS.DOUBLE_DOWN}
          userScore={userScore}
          isActive={doubleDownActive}
          onPress={onUseDoubleDown}
          disabled={disabled || doubleDownActive}
          color="#EC4899"
        />
      </View>

      {/* Active power-up indicator */}
      {(peekActive || doubleDownActive) && (
        <View style={styles.activeWarning}>
          {peekActive && (
            <Text style={styles.activeWarningText}>
              👁️ Peek active - vote to reveal majority!
            </Text>
          )}
          {doubleDownActive && (
            <Text style={[styles.activeWarningText, { color: '#EC4899' }]}>
              🎲 Double Down active - 2x points on next vote!
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  powerUpsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  powerUpButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 70,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  powerUpButtonDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  powerUpIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  powerUpLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.text,
  },
  textDisabled: {
    color: COLORS.mutedLight,
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  costBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.muted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  costBadgeDisabled: {
    backgroundColor: '#DC2626',
  },
  costText: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  costTextDisabled: {
    color: '#fff',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeText: {
    fontSize: 8,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  activeWarning: {
    marginTop: 12,
    alignItems: 'center',
  },
  activeWarningText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#10B981',
  },
});




