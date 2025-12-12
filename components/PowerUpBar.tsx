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
import { DuotoneEye, DuotoneSkip, DuotoneDice } from './icons';

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
  hidden?: boolean;
}

interface PowerUpButtonProps {
  icon: React.ReactNode;
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
          isActive && { backgroundColor: `${color}30`, borderColor: color },
          isDisabled && !isActive && styles.powerUpButtonDisabled,
          animatedStyle,
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          {icon}
        </View>
        
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
  hidden = false,
}: PowerUpBarProps) {
  return (
    <View style={[styles.container, hidden && styles.hidden]}>
      <View style={styles.powerUpsRow}>
        {/* Peek */}
        <PowerUpButton
          icon={
            <DuotoneEye 
              size={28} 
              primaryColor={peekActive ? COLORS.accent : COLORS.primary}
              accentColor={COLORS.secondary}
            />
          }
          label="Peek"
          count={powerUps.peek}
          cost={POWER_UP_COSTS.PEEK}
          userScore={userScore}
          isActive={peekActive}
          onPress={onUsePeek}
          disabled={disabled || peekActive}
          color={COLORS.accent}
        />

        {/* Skip */}
        <PowerUpButton
          icon={
            <DuotoneSkip 
              size={28} 
              primaryColor={COLORS.primary}
              accentColor={COLORS.secondary}
            />
          }
          label="Skip"
          count={powerUps.skip}
          cost={POWER_UP_COSTS.SKIP}
          userScore={userScore}
          onPress={onUseSkip}
          disabled={disabled}
          color={COLORS.primary}
        />

        {/* Double Down */}
        <PowerUpButton
          icon={
            <DuotoneDice 
              size={28} 
              primaryColor={doubleDownActive ? COLORS.secondary : COLORS.primary}
              accentColor={COLORS.secondary}
            />
          }
          label="2x"
          count={powerUps.doubleDown}
          cost={POWER_UP_COSTS.DOUBLE_DOWN}
          userScore={userScore}
          isActive={doubleDownActive}
          onPress={onUseDoubleDown}
          disabled={disabled || doubleDownActive}
          color={COLORS.secondary}
        />
      </View>

      {/* Active power-up indicator */}
      {(peekActive || doubleDownActive) && (
        <View style={styles.activeWarning}>
          {peekActive && (
            <Text style={[styles.activeWarningText, { color: COLORS.accent }]}>
              👁️ Peek active - vote to reveal majority!
            </Text>
          )}
          {doubleDownActive && (
            <Text style={[styles.activeWarningText, { color: COLORS.secondary }]}>
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
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  powerUpsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  powerUpButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 70,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  powerUpButtonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    marginBottom: 4,
  },
  powerUpLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.text,
  },
  textDisabled: {
    color: COLORS.textMuted,
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
    backgroundColor: COLORS.destructive,
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
  },
});
