import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '../hooks/useAuth';
import { getUserStats } from '../lib/firestore';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
  delay?: number;
}

function StatCard({ label, value, sublabel, color = '#18181b', delay = 0 }: StatCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        flex: 1,
        minWidth: '45%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text 
        style={{ 
          fontFamily: 'Poppins_400Regular',
          fontSize: 14,
          color: '#71717a',
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text 
        style={{ 
          fontFamily: 'Righteous_400Regular',
          fontSize: 32,
          color,
        }}
      >
        {value}
      </Text>
      {sublabel && (
        <Text 
          style={{ 
            fontFamily: 'Poppins_400Regular',
            fontSize: 12,
            color: '#a1a1aa',
            marginTop: 4,
          }}
        >
          {sublabel}
        </Text>
      )}
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  
  const stats = user ? getUserStats(user) : null;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f5' }}>
      {/* Header */}
      <View 
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Pressable 
          onPress={handleBack}
          style={{
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 28 }}>←</Text>
        </Pressable>
        <Text 
          style={{ 
            flex: 1,
            fontFamily: 'Righteous_400Regular',
            fontSize: 24,
            color: '#18181b',
            textAlign: 'center',
            marginRight: 44,
          }}
        >
          Profile
        </Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Hero */}
        <Animated.View
          entering={FadeInDown.delay(0).springify()}
          style={{
            backgroundColor: '#18181b',
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Text 
            style={{ 
              fontFamily: 'Poppins_400Regular',
              fontSize: 16,
              color: '#a1a1aa',
              marginBottom: 8,
            }}
          >
            Current Score
          </Text>
          <Text 
            style={{ 
              fontFamily: 'Righteous_400Regular',
              fontSize: 72,
              color: '#ffffff',
            }}
          >
            {stats?.score ?? 0}
          </Text>
          <Text 
            style={{ 
              fontFamily: 'Poppins_400Regular',
              fontSize: 14,
              color: '#71717a',
              marginTop: 8,
            }}
          >
            points available to spend
          </Text>
        </Animated.View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <StatCard 
            label="Win Rate" 
            value={`${stats?.win_rate ?? 0}%`}
            sublabel={`${stats?.votes_won ?? 0} wins`}
            color="#00E054"
            delay={100}
          />
          <StatCard 
            label="Votes Cast" 
            value={stats?.votes_cast ?? 0}
            sublabel="total predictions"
            delay={150}
          />
          <StatCard 
            label="Current Streak" 
            value={stats?.current_streak ?? 0}
            sublabel="consecutive wins"
            color={stats?.current_streak && stats.current_streak > 0 ? '#F59E0B' : '#18181b'}
            delay={200}
          />
          <StatCard 
            label="Best Streak" 
            value={stats?.best_streak ?? 0}
            sublabel="personal record"
            color="#6366F1"
            delay={250}
          />
          <StatCard 
            label="Questions" 
            value={stats?.questions_created ?? 0}
            sublabel="created by you"
            delay={300}
          />
        </View>

        {/* Tips */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 20,
            marginTop: 20,
          }}
        >
          <Text 
            style={{ 
              fontFamily: 'Righteous_400Regular',
              fontSize: 18,
              color: '#18181b',
              marginBottom: 12,
            }}
          >
            How to Earn Points
          </Text>
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#71717a' }}>
              ✓ Vote on questions and predict the majority
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#71717a' }}>
              ✓ Each correct prediction = +1 point
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#71717a' }}>
              ✓ Creating a question costs 3 points
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

