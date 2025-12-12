import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CrackedStreakNumberProps {
  streakNumber: number;
  phase: 'crack' | 'explode' | 'settle' | 'idle';
  onCrackComplete?: () => void;
  onExplodeComplete?: () => void;
}

interface Shard {
  id: number;
  char: string;
  originX: number;
  originY: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  scale: number;
}

// Glass crack line component
function CrackLine({ 
  startX, 
  startY, 
  length, 
  angle, 
  delay 
}: { 
  startX: number; 
  startY: number; 
  length: number; 
  angle: number; 
  delay: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Slower crack spreading for dramatic effect
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const lineStyle = useAnimatedStyle(() => {
    return {
      width: progress.value * length,
      transform: [{ rotate: `${angle}deg` }],
      opacity: progress.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.crackLine,
        lineStyle,
        { left: startX, top: startY }
      ]}
    />
  );
}

// Exploding shard component
function ExplodingShard({ 
  char, 
  originX, 
  originY, 
  velocityX, 
  velocityY, 
  rotation, 
  scale,
  delay 
}: Shard & { delay: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      delay + 500,
      withTiming(0, { duration: 300 })
    );
  }, []);

  const shardStyle = useAnimatedStyle(() => {
    const translateX = originX + velocityX * progress.value;
    const translateY = originY + velocityY * progress.value + (progress.value * progress.value * 200); // Gravity
    const rotate = rotation * progress.value;
    const scaleVal = interpolate(progress.value, [0, 0.3, 1], [scale, scale * 1.2, scale * 0.3]);

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotate}deg` },
        { scale: scaleVal },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.Text style={[styles.shard, shardStyle]}>
      {char}
    </Animated.Text>
  );
}

// Main flame icon that cracks and explodes
function FlameIcon({ phase }: { phase: string }) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (phase === 'crack') {
      // Violent shake
      scale.value = withSequence(
        withTiming(1.3, { duration: 100 }),
        withTiming(0.9, { duration: 100 }),
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      rotation.value = withSequence(
        withTiming(-15, { duration: 50 }),
        withTiming(15, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    } else if (phase === 'explode') {
      scale.value = withSequence(
        withTiming(2, { duration: 100 }),
        withTiming(0, { duration: 200 })
      );
      opacity.value = withDelay(100, withTiming(0, { duration: 200 }));
    }
  }, [phase]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.flameContainer, flameStyle]}>
      <Text style={styles.flameEmoji}>🔥</Text>
    </Animated.View>
  );
}

export function CrackedStreakNumber({ 
  streakNumber, 
  phase, 
  onCrackComplete,
  onExplodeComplete 
}: CrackedStreakNumberProps) {
  const containerScale = useSharedValue(0.8);
  const containerOpacity = useSharedValue(0);
  const numberScale = useSharedValue(1);
  const glassOpacity = useSharedValue(0);
  const crackProgress = useSharedValue(0);

  // Convert streak number to string for shard generation
  const streakString = String(streakNumber);
  
  // Generate crack lines
  const crackLines = useMemo(() => {
    if (phase !== 'crack' && phase !== 'explode') return [];
    
    const lines = [];
    const centerX = 0;
    const centerY = 0;
    
    // Create radiating cracks from center - slower staggered spreading
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) + Math.random() * 20 - 10;
      const length = 50 + Math.random() * 70;
      lines.push({
        id: i,
        startX: centerX,
        startY: centerY,
        length,
        angle,
        delay: i * 60, // Slower stagger for dramatic effect
      });
      
      // Add branching cracks - delayed further
      if (Math.random() > 0.4) {
        lines.push({
          id: i + 100,
          startX: centerX + Math.cos(angle * Math.PI / 180) * (length * 0.5),
          startY: centerY + Math.sin(angle * Math.PI / 180) * (length * 0.5),
          length: length * 0.5,
          angle: angle + (Math.random() > 0.5 ? 35 : -35),
          delay: i * 60 + 120, // Branches appear after main crack
        });
      }
    }
    
    return lines;
  }, [phase]);

  // Generate exploding shards from the number
  const shards = useMemo(() => {
    if (phase !== 'explode') return [];
    
    const shardList: Shard[] = [];
    
    // Create shards from each digit
    streakString.split('').forEach((char, idx) => {
      const charOffsetX = (idx - streakString.length / 2) * 60;
      
      // Multiple shards per character for dramatic effect
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 150 + Math.random() * 250;
        shardList.push({
          id: idx * 10 + i,
          char,
          originX: charOffsetX + Math.random() * 20 - 10,
          originY: Math.random() * 20 - 10,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed - 100, // Upward bias
          rotation: (Math.random() - 0.5) * 720,
          scale: 0.3 + Math.random() * 0.5,
        });
      }
    });
    
    // Add the flame emoji as shards too
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 200;
      shardList.push({
        id: 1000 + i,
        char: '🔥',
        originX: Math.random() * 40 - 20,
        originY: -80 + Math.random() * 20,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed - 150,
        rotation: (Math.random() - 0.5) * 540,
        scale: 0.4 + Math.random() * 0.3,
      });
    }
    
    return shardList;
  }, [phase, streakString]);

  useEffect(() => {
    if (phase === 'crack') {
      // ═══════════════════════════════════════════════════════════════
      // CRACK PHASE - Dramatic entrance with slow crack spread
      // ═══════════════════════════════════════════════════════════════
      
      // Dramatic entrance - slower for weight
      containerOpacity.value = withTiming(1, { duration: 350 });
      containerScale.value = withSpring(1, { damping: 10, stiffness: 120 });
      
      // Glass overlay appears with cracks
      glassOpacity.value = withDelay(300, withTiming(0.4, { duration: 300 }));
      
      // Cracks spread slowly - this is the dramatic moment
      crackProgress.value = withDelay(200, withTiming(1, { duration: 700 }));
      
      // Shake the number as cracks spread
      numberScale.value = withDelay(
        300,
        withSequence(
          withTiming(1.15, { duration: 120 }),
          withTiming(0.92, { duration: 120 }),
          withTiming(1.08, { duration: 120 }),
          withTiming(0.96, { duration: 100 }),
          withTiming(1, { duration: 100 })
        )
      );
      
      if (onCrackComplete) {
        setTimeout(onCrackComplete, 1200);
      }
    } else if (phase === 'explode') {
      // ═══════════════════════════════════════════════════════════════
      // EXPLODE PHASE - Everything shatters outward
      // ═══════════════════════════════════════════════════════════════
      
      // Brief expansion before explosion
      numberScale.value = withSequence(
        withTiming(1.6, { duration: 120 }),
        withTiming(0, { duration: 180 })
      );
      glassOpacity.value = withTiming(0, { duration: 150 });
      
      if (onExplodeComplete) {
        setTimeout(onExplodeComplete, 1000);
      }
    }
  }, [phase]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    opacity: containerOpacity.value,
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  const glassStyle = useAnimatedStyle(() => ({
    opacity: glassOpacity.value,
  }));

  if (phase === 'idle') return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.innerContainer, containerStyle]}>
        {/* Flame icon */}
        <FlameIcon phase={phase} />
        
        {/* Main streak number */}
        {phase !== 'explode' && (
          <Animated.View style={[styles.numberContainer, numberStyle]}>
            <Text style={styles.streakNumber}>{streakNumber}</Text>
          </Animated.View>
        )}
        
        {/* Glass overlay with cracks */}
        {(phase === 'crack' || phase === 'explode') && (
          <Animated.View style={[styles.glassOverlay, glassStyle]}>
            {crackLines.map(line => (
              <CrackLine
                key={line.id}
                startX={line.startX}
                startY={line.startY}
                length={line.length}
                angle={line.angle}
                delay={line.delay}
              />
            ))}
          </Animated.View>
        )}
        
        {/* Exploding shards */}
        {phase === 'explode' && shards.map((shard, idx) => (
          <ExplodingShard
            key={shard.id}
            {...shard}
            delay={idx * 20}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  flameContainer: {
    marginBottom: 8,
  },
  flameEmoji: {
    fontSize: 64,
    textShadowColor: '#FF6B00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  numberContainer: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 100,
    fontFamily: 'Righteous_400Regular',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crackLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transformOrigin: 'left center',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  shard: {
    position: 'absolute',
    fontSize: 48,
    fontFamily: 'Righteous_400Regular',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 100, 50, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

