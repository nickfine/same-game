import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '../hooks/useAuth';
import { useAchievements } from '../hooks/useAchievements';
import { getUserStats, updateDisplayName } from '../lib/firestore';
import { LevelBadgeHero } from '../components/LevelBadge';
import { calculateLevel, getNextMilestoneLevel } from '../lib/levels';
import { MILESTONE_REWARDS } from '../lib/constants';
import { REWARDS } from '../lib/rewards';
import type { Achievement } from '../types';

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

// Achievement Badge Component
function AchievementBadge({ 
  achievement, 
  unlocked, 
  delay 
}: { 
  achievement: Achievement & { unlocked: boolean }; 
  unlocked: boolean;
  delay: number;
}) {
  // Secret badges are hidden until unlocked
  const isSecret = achievement.isSecret;
  if (isSecret && !unlocked) return null;
  
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={{
        width: '30%',
        alignItems: 'center',
        marginBottom: 16,
        opacity: unlocked ? 1 : 0.4,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: unlocked ? (isSecret ? '#F97316' : '#F59E0B') : '#e4e4e7',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
          ...(isSecret && unlocked && {
            shadowColor: '#F97316',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
          }),
        }}
      >
        <Text style={{ fontSize: 28 }}>{achievement.icon}</Text>
      </View>
      <Text
        style={{
          fontFamily: 'Poppins_700Bold',
          fontSize: 11,
          color: unlocked ? (isSecret ? '#F97316' : '#18181b') : '#a1a1aa',
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {achievement.name}
      </Text>
      {isSecret && unlocked && (
        <Text
          style={{
            fontFamily: 'Poppins_400Regular',
            fontSize: 9,
            color: '#F97316',
            marginTop: 2,
          }}
        >
          SECRET
        </Text>
      )}
    </Animated.View>
  );
}

// 🔥 Phoenix Badge Hero - Shows prominently when user has it
function PhoenixBadgeHero({ hasPhoenix }: { hasPhoenix: boolean }) {
  if (!hasPhoenix) return null;
  
  return (
    <Animated.View
      entering={FadeInDown.delay(50).springify()}
      style={{
        backgroundColor: '#1C1917',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F97316',
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#F97316',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 16,
        }}
      >
        <Text style={{ fontSize: 36 }}>🔥</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Righteous_400Regular',
            fontSize: 20,
            color: '#F97316',
          }}
        >
          PHOENIX
        </Text>
        <Text
          style={{
            fontFamily: 'Poppins_400Regular',
            fontSize: 12,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 2,
          }}
        >
          Rose from the ashes 🔥
        </Text>
        <Text
          style={{
            fontFamily: 'Poppins_500Medium',
            fontSize: 10,
            color: '#F97316',
            marginTop: 4,
          }}
        >
          SECRET BADGE
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const { user, uid } = useAuth();
  const { achievements, unlockedCount, totalCount, unlocked } = useAchievements(uid, user);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  
  const stats = user ? getUserStats(user) : null;
  
  // Check if user has unlocked the secret Phoenix badge
  const hasPhoenixBadge = unlocked.has('phoenix');

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleEditName = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNewName(user?.display_name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!uid || !newName.trim()) return;
    
    // Validate name
    if (newName.trim().length < 2) {
      Alert.alert('Too Short', 'Name must be at least 2 characters');
      return;
    }
    if (newName.trim().length > 20) {
      Alert.alert('Too Long', 'Name must be 20 characters or less');
      return;
    }
    
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await updateDisplayName(uid, newName.trim());
      setIsEditingName(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditingName(false);
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
        {/* Player Name Card */}
        <Animated.View
          entering={FadeInDown.delay(0).springify()}
          style={{
            backgroundColor: '#6366F1',
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          {isEditingName ? (
            <View style={{ width: '100%' }}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoFocus
                maxLength={20}
                style={{
                  fontFamily: 'Poppins_700Bold',
                  fontSize: 24,
                  color: '#ffffff',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                <Pressable
                  onPress={handleCancelEdit}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 14 }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveName}
                  disabled={saving || !newName.trim()}
                  style={{
                    backgroundColor: '#ffffff',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 12,
                    opacity: saving || !newName.trim() ? 0.5 : 1,
                  }}
                >
                  <Text style={{ fontFamily: 'Poppins_700Bold', color: '#6366F1', fontSize: 14 }}>
                    {saving ? 'Saving...' : 'Save'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <Text
                style={{
                  fontFamily: 'Righteous_400Regular',
                  fontSize: 28,
                  color: '#ffffff',
                  marginBottom: 4,
                }}
              >
                {user?.display_name || 'Anonymous'}
              </Text>
              <Pressable onPress={handleEditName}>
                <Text
                  style={{
                    fontFamily: 'Poppins_400Regular',
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  ✏️ Tap to edit name
                </Text>
              </Pressable>
            </>
          )}
        </Animated.View>

        {/* 🔥 Phoenix Badge Hero - Shows if user has it */}
        <PhoenixBadgeHero hasPhoenix={hasPhoenixBadge} />

        {/* Level Hero Section */}
        <Animated.View
          entering={FadeInDown.delay(25).springify()}
          style={{
            backgroundColor: '#18181b',
            borderRadius: 24,
            padding: 24,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <LevelBadgeHero 
            level={user?.level ?? calculateLevel(user?.xp ?? 0)} 
            xp={user?.xp ?? 0} 
          />
          
          {/* Next Milestone Teaser */}
          {(() => {
            const currentLevel = user?.level ?? calculateLevel(user?.xp ?? 0);
            const nextMilestone = getNextMilestoneLevel(currentLevel);
            const nextReward = MILESTONE_REWARDS[nextMilestone];
            
            if (nextReward && REWARDS[nextReward]) {
              return (
                <View 
                  style={{ 
                    marginTop: 20, 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>
                    {REWARDS[nextReward].icon}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontFamily: 'Poppins_400Regular', 
                      fontSize: 12, 
                      color: 'rgba(255,255,255,0.6)' 
                    }}>
                      Reach Level {nextMilestone} to unlock
                    </Text>
                    <Text style={{ 
                      fontFamily: 'Poppins_700Bold', 
                      fontSize: 14, 
                      color: '#ffffff' 
                    }}>
                      {REWARDS[nextReward].displayName}
                    </Text>
                  </View>
                </View>
              );
            }
            return null;
          })()}
        </Animated.View>

        {/* Score Hero */}
        <Animated.View
          entering={FadeInDown.delay(50).springify()}
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
            delay={150}
          />
          <StatCard 
            label="Votes Cast" 
            value={stats?.votes_cast ?? 0}
            sublabel="total predictions"
            delay={200}
          />
          <StatCard 
            label="Current Streak" 
            value={stats?.current_streak ?? 0}
            sublabel="consecutive wins"
            color={stats?.current_streak && stats.current_streak > 0 ? '#F59E0B' : '#18181b'}
            delay={250}
          />
          <StatCard 
            label="Best Streak" 
            value={stats?.best_streak ?? 0}
            sublabel="personal record"
            color="#6366F1"
            delay={300}
          />
          <StatCard 
            label="Questions" 
            value={stats?.questions_created ?? 0}
            sublabel="created by you"
            delay={350}
          />
        </View>

        {/* Achievements Section */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 20,
            marginTop: 20,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text 
              style={{ 
                fontFamily: 'Righteous_400Regular',
                fontSize: 18,
                color: '#18181b',
              }}
            >
              Achievements
            </Text>
            <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#ffffff' }}>
                {unlockedCount}/{totalCount}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {achievements.map((achievement, index) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                unlocked={achievement.unlocked}
                delay={450 + index * 30}
              />
            ))}
          </View>
        </Animated.View>

        {/* Tips */}
        <Animated.View
          entering={FadeInDown.delay(650).springify()}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 20,
            marginTop: 20,
            marginBottom: 20,
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

