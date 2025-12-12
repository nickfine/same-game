import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  useDerivedValue,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

interface PercentageBarProps {
  percentage: number;
  label: string;
  isWinner: boolean;
  isUserChoice: boolean;
  delay?: number;
  color: string;
  index: number;
}

export function PercentageBar({ 
  percentage, 
  label, 
  isWinner, 
  isUserChoice,
  delay = 0,
  color,
  index,
}: PercentageBarProps) {
  const width = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideX = useSharedValue(index === 0 ? -100 : 100);
  const displayPercentage = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    slideX.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 100 }));
    
    width.value = withDelay(
      delay + 200,
      withTiming(percentage, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
    
    displayPercentage.value = withDelay(
      delay + 200,
      withTiming(percentage, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
    
    if (isWinner) {
      glowOpacity.value = withDelay(
        delay + 800,
        withTiming(1, { duration: 300 })
      );
    }
  }, [percentage]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: slideX.value }],
  }));

  const barFillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const gradientColors = isWinner 
    ? [color, color]
    : ['#4B5563', '#374151'];

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.labelRow}>
        <View style={styles.labelContainer}>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
          {isWinner && (
            <Text style={styles.crownEmoji}>👑</Text>
          )}
          {isUserChoice && (
            <View style={[styles.youBadge, { backgroundColor: isWinner ? '#00FFBD' : '#FF3B6E' }]}>
              <Text style={styles.youText}>YOU</Text>
            </View>
          )}
        </View>
        <AnimatedPercentage value={displayPercentage} isWinner={isWinner} />
      </View>
      
      <View style={styles.barBackground}>
        {isWinner && (
          <Animated.View style={[styles.glow, glowStyle, { backgroundColor: color }]} />
        )}
        
        <Animated.View style={[styles.barFill, barFillStyle]}>
          <View style={[styles.gradient, { backgroundColor: gradientColors[0] }]}>
            <View style={styles.shine} />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function AnimatedPercentage({ value, isWinner }: { value: Animated.SharedValue<number>; isWinner: boolean }) {
  const [displayValue, setDisplayValue] = React.useState(0);
  
  useDerivedValue(() => {
    runOnJS(setDisplayValue)(Math.round(value.value));
  });

  return (
    <Text style={[styles.percentage, isWinner && styles.percentageWinner]}>
      {displayValue}%
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  crownEmoji: {
    fontSize: 20,
  },
  youBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 10,
    color: '#000000',
  },
  percentage: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 28,
    color: '#9CA3AF',
  },
  percentageWinner: {
    color: '#FFFFFF',
    fontSize: 32,
  },
  barBackground: {
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    opacity: 0.3,
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 12,
    position: 'relative',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});
