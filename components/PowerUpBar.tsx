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
  compact?: boolean; // New prop for 56px height mode
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
  compact?: boolean;
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
  compact,
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
          compact && styles.powerUpButtonCompact,
          isActive && { backgroundColor: `${color}30`, borderColor: color },
          isDisabled && !isActive && styles.powerUpButtonDisabled,
          animatedStyle,
        ]}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, compact && styles.iconContainerCompact]}>
          {icon}
        </View>
        
        {/* Label - always show when not in compact mode */}
        {!compact && (
          <Text style={[
            styles.powerUpLabel,
            isActive && { color },
            isDisabled && !isActive && styles.textDisabled,
          ]}>
            {label}
          </Text>
        )}
        
        {/* Count badge */}
        {count > 0 && (
          <View style={[
            styles.countBadge, 
            { backgroundColor: color },
            compact && styles.countBadgeCompact,
          ]}>
            <Text style={[styles.countText, compact && styles.countTextCompact]}>{count}</Text>
          </View>
        )}
        
        {/* Cost indicator */}
        {count <= 0 && (
          <View style={[
            styles.costBadge,
            compact && styles.costBadgeCompact,
            !canAfford && styles.costBadgeDisabled,
          ]}>
            <Text style={[
              styles.costText,
              compact && styles.costTextCompact,
              !canAfford && styles.costTextDisabled,
            ]}>
              {cost}pt
            </Text>
          </View>
        )}

        {/* Active indicator */}
        {isActive && (
          <View style={[
            styles.activeIndicator, 
            { backgroundColor: color },
            compact && styles.activeIndicatorCompact,
          ]}>
            <Text style={[styles.activeText, compact && styles.activeTextCompact]}>ON</Text>
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
  compact = false,
}: PowerUpBarProps) {
  const iconSize = compact ? 32 : 36; // Larger icons when labels are shown (non-compact)
  
  return (
    <View style={[
      styles.container, 
      compact && styles.containerCompact,
      hidden && styles.hidden,
    ]}>
      <View style={[styles.powerUpsRow, compact && styles.powerUpsRowCompact]}>
        {/* Peek */}
        <PowerUpButton
          icon={
            <DuotoneEye 
              size={iconSize} 
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
          compact={compact}
        />

        {/* Skip */}
        <PowerUpButton
          icon={
            <DuotoneSkip 
              size={iconSize} 
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
          compact={compact}
        />

        {/* Double Down */}
        <PowerUpButton
          icon={
            <DuotoneDice 
              size={iconSize} 
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
          compact={compact}
        />
      </View>

      {/* Active power-up indicator - hidden in compact mode */}
      {!compact && (peekActive || doubleDownActive) && (
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
  containerCompact: {
    paddingVertical: 8,
    height: 72, // Increased from 56 to 72 for better proportions
    justifyContent: 'center',
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
  powerUpsRowCompact: {
    gap: 12, // Increased from 8 to 12 for better spacing
  },
  powerUpButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 90, // Increased for better proportions with labels
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  powerUpButtonCompact: {
    paddingHorizontal: 16, // Increased from 12
    paddingVertical: 10, // Increased from 6
    minWidth: 70, // Increased from 50 to 70 for better proportions
    borderRadius: 16, // Increased from 12 for smoother look
    borderWidth: 2, // Increased from 1 for better visibility
  },
  powerUpButtonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    marginBottom: 6, // Increased spacing for better label separation
  },
  iconContainerCompact: {
    marginBottom: 2, // Small margin for better spacing
  },
  powerUpLabel: {
    fontSize: 12, // Slightly larger for better readability
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.text,
    marginTop: 2,
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
  countBadgeCompact: {
    top: -6,
    right: -6,
    minWidth: 20, // Increased from 16
    height: 20, // Increased from 16
    borderRadius: 10, // Increased from 8
  },
  countText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  countTextCompact: {
    fontSize: 10, // Increased from 9
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
  costBadgeCompact: {
    top: -6,
    right: -6,
    paddingHorizontal: 6, // Increased from 4
    paddingVertical: 2, // Increased from 1
    borderRadius: 8, // Increased from 6
  },
  costBadgeDisabled: {
    backgroundColor: COLORS.destructive,
  },
  costText: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  costTextCompact: {
    fontSize: 9, // Increased from 8
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
  activeIndicatorCompact: {
    bottom: -8,
    paddingHorizontal: 8, // Increased from 6
    paddingVertical: 2, // Increased from 1
    borderRadius: 6, // Increased from 4
  },
  activeText: {
    fontSize: 8,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  activeTextCompact: {
    fontSize: 8, // Increased from 7
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
