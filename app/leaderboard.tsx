import React from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useAuth } from '../hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { LevelBadgeInline } from '../components/LevelBadge';
import type { LeaderboardEntry } from '../types';

// Medal colors
const MEDAL_COLORS = {
  1: { bg: '#FFD700', text: '#92400E', emoji: '🥇' }, // Gold
  2: { bg: '#C0C0C0', text: '#374151', emoji: '🥈' }, // Silver
  3: { bg: '#CD7F32', text: '#451A03', emoji: '🥉' }, // Bronze
};

// ═══════════════════════════════════════════════════════════════
// HYPER SERPENT INDICATOR - Shows when user is in Hyperstreak
// ═══════════════════════════════════════════════════════════════
function HyperSerpent({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  
  return (
    <View style={styles.hyperSerpent}>
      <Text style={styles.hyperSerpentEmoji}>🐍</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHER - Global vs Friends
// ═══════════════════════════════════════════════════════════════
function TabSwitcher({ 
  activeTab, 
  onTabChange,
  hasFriends,
}: { 
  activeTab: 'global' | 'friends'; 
  onTabChange: (tab: 'global' | 'friends') => void;
  hasFriends: boolean;
}) {
  return (
    <View style={styles.tabContainer}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange('global');
        }}
        style={[
          styles.tab,
          activeTab === 'global' && styles.tabActive,
        ]}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'global' && styles.tabTextActive,
        ]}>
          🌍 Global
        </Text>
      </Pressable>
      
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange('friends');
        }}
        style={[
          styles.tab,
          activeTab === 'friends' && styles.tabActive,
        ]}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'friends' && styles.tabTextActive,
        ]}>
          👥 Friends {!hasFriends && '(0)'}
        </Text>
      </Pressable>
    </View>
  );
}

// Podium component for top 3
function Podium({ entries, currentUid }: { entries: LeaderboardEntry[]; currentUid: string | null }) {
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
        {/* 2nd Place */}
        {second && (
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={{ alignItems: 'center', flex: 1 }}
          >
            <Text style={{ fontSize: 32, marginBottom: 4 }}>🥈</Text>
            <View
              style={{
                backgroundColor: second.uid === currentUid ? '#6366F1' : '#C0C0C0',
                borderRadius: 16,
                padding: 12,
                width: '100%',
                alignItems: 'center',
                minHeight: 100,
                position: 'relative',
              }}
            >
              {/* Hyper Serpent indicator */}
              {second.in_hyperstreak && (
                <View style={styles.podiumHyper}>
                  <Text>🐍</Text>
                </View>
              )}
              <Text
                style={{
                  fontFamily: 'Poppins_700Bold',
                  fontSize: 14,
                  color: second.uid === currentUid ? '#fff' : '#374151',
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                {second.display_name}
              </Text>
              <Text
                style={{
                  fontFamily: 'Righteous_400Regular',
                  fontSize: 24,
                  color: second.uid === currentUid ? '#fff' : '#18181b',
                  marginTop: 4,
                }}
              >
                {second.score}
              </Text>
              <Text
                style={{
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 11,
                  color: second.uid === currentUid ? 'rgba(255,255,255,0.8)' : '#6B7280',
                }}
              >
                🔥 {second.current_streak}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* 1st Place */}
        {first && (
          <Animated.View
            entering={FadeInUp.delay(100).springify()}
            style={{ alignItems: 'center', flex: 1.2, marginBottom: 12 }}
          >
            <Text style={{ fontSize: 40, marginBottom: 4 }}>🥇</Text>
            <View
              style={{
                backgroundColor: first.uid === currentUid ? '#6366F1' : '#FFD700',
                borderRadius: 20,
                padding: 16,
                width: '100%',
                alignItems: 'center',
                minHeight: 120,
                shadowColor: '#FFD700',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
                position: 'relative',
              }}
            >
              {/* Hyper Serpent indicator */}
              {first.in_hyperstreak && (
                <View style={[styles.podiumHyper, { right: 8, top: 8 }]}>
                  <Text style={{ fontSize: 18 }}>🐍</Text>
                </View>
              )}
              <Text
                style={{
                  fontFamily: 'Poppins_700Bold',
                  fontSize: 16,
                  color: first.uid === currentUid ? '#fff' : '#92400E',
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                {first.display_name}
              </Text>
              <Text
                style={{
                  fontFamily: 'Righteous_400Regular',
                  fontSize: 32,
                  color: first.uid === currentUid ? '#fff' : '#18181b',
                  marginTop: 4,
                }}
              >
                {first.score}
              </Text>
              <Text
                style={{
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 12,
                  color: first.uid === currentUid ? 'rgba(255,255,255,0.8)' : '#92400E',
                }}
              >
                🔥 {first.current_streak} streak
              </Text>
            </View>
          </Animated.View>
        )}

        {/* 3rd Place */}
        {third && (
          <Animated.View
            entering={FadeInUp.delay(300).springify()}
            style={{ alignItems: 'center', flex: 1 }}
          >
            <Text style={{ fontSize: 28, marginBottom: 4 }}>🥉</Text>
            <View
              style={{
                backgroundColor: third.uid === currentUid ? '#6366F1' : '#CD7F32',
                borderRadius: 16,
                padding: 12,
                width: '100%',
                alignItems: 'center',
                minHeight: 80,
                position: 'relative',
              }}
            >
              {/* Hyper Serpent indicator */}
              {third.in_hyperstreak && (
                <View style={styles.podiumHyper}>
                  <Text>🐍</Text>
                </View>
              )}
              <Text
                style={{
                  fontFamily: 'Poppins_700Bold',
                  fontSize: 13,
                  color: third.uid === currentUid ? '#fff' : '#451A03',
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                {third.display_name}
              </Text>
              <Text
                style={{
                  fontFamily: 'Righteous_400Regular',
                  fontSize: 22,
                  color: third.uid === currentUid ? '#fff' : '#18181b',
                  marginTop: 4,
                }}
              >
                {third.score}
              </Text>
              <Text
                style={{
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 10,
                  color: third.uid === currentUid ? 'rgba(255,255,255,0.8)' : '#78350F',
                }}
              >
                🔥 {third.current_streak}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// Leaderboard row for ranks 4+
function LeaderboardRow({
  entry,
  isCurrentUser,
  index,
  isFriendsTab = false,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
  isFriendsTab?: boolean;
}) {
  const isPlaceholder = entry.uid.startsWith('placeholder_');
  
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).springify()}
      style={[
        styles.leaderboardRow,
        {
          backgroundColor: isCurrentUser ? '#6366F1' : isPlaceholder ? '#F3E8FF' : '#ffffff',
          borderWidth: isCurrentUser ? 0 : isPlaceholder ? 2 : 1,
          borderColor: isPlaceholder ? '#A855F7' : '#f4f4f5',
          borderStyle: isPlaceholder ? 'dashed' : 'solid',
        },
      ]}
    >
      {/* Rank */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : '#f4f4f5',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10,
        }}
      >
        <Text
          style={{
            fontFamily: 'Righteous_400Regular',
            fontSize: 14,
            color: isCurrentUser ? '#fff' : '#71717a',
          }}
        >
          {isPlaceholder ? '?' : entry.rank}
        </Text>
      </View>

      {/* Avatar / Level Badge */}
      <View style={{ marginRight: 10, position: 'relative' }}>
        {isFriendsTab && entry.avatar_emoji ? (
          <View style={styles.avatarContainer}>
            <Text style={{ fontSize: 20 }}>{entry.avatar_emoji}</Text>
          </View>
        ) : (
          <LevelBadgeInline level={entry.level ?? 1} size="small" />
        )}
        
        {/* 🐍 Hyper Serpent indicator */}
        {entry.in_hyperstreak && <HyperSerpent isActive={true} />}
      </View>

      {/* Name & Stats */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins_700Bold',
            fontSize: 15,
            color: isCurrentUser ? '#fff' : isPlaceholder ? '#7C3AED' : '#18181b',
          }}
          numberOfLines={1}
        >
          {entry.display_name}
          {isCurrentUser && ' (You)'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: 'Poppins_400Regular',
              fontSize: 12,
              color: isCurrentUser ? 'rgba(255,255,255,0.7)' : '#71717a',
            }}
          >
            {isPlaceholder ? 'Invite friends to compete!' : `🔥 ${entry.current_streak} streak • Best: ${entry.best_streak}`}
          </Text>
        </View>
      </View>

      {/* Score */}
      {!isPlaceholder && (
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontFamily: 'Righteous_400Regular',
              fontSize: 20,
              color: isCurrentUser ? '#fff' : '#18181b',
            }}
          >
            {entry.score}
          </Text>
          <Text
            style={{
              fontFamily: 'Poppins_400Regular',
              fontSize: 11,
              color: isCurrentUser ? 'rgba(255,255,255,0.7)' : '#a1a1aa',
            }}
          >
            pts
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// FRIENDS EMPTY STATE - Encourages social sharing
// ═══════════════════════════════════════════════════════════════
function FriendsEmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>👥</Text>
      <Text style={styles.emptyStateTitle}>
        Add Friends to Compete!
      </Text>
      <Text style={styles.emptyStateText}>
        Share the app with friends to see their live streaks and Hyperstreaks here.
      </Text>
      <View style={styles.emptyStateHint}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>🐍</Text>
        <Text style={styles.emptyStateHintText}>
          See who's in Hyperstreak mode and crush them!
        </Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { uid } = useAuth();
  const { 
    leaderboard, 
    friendsLeaderboard, 
    userRank, 
    loading, 
    error, 
    activeTab, 
    setActiveTab,
    refresh,
    hasFriends,
  } = useLeaderboard(uid);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refresh();
  };

  // Choose data based on active tab
  const currentData = activeTab === 'global' ? leaderboard : friendsLeaderboard;
  const top3 = currentData.slice(0, 3);
  const rest = currentData.slice(3);

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
          }}
        >
          Leaderboard
        </Text>
        <Pressable
          onPress={handleRefresh}
          style={{
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 20 }}>🔄</Text>
        </Pressable>
      </View>

      {/* Tab Switcher */}
      <TabSwitcher 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        hasFriends={hasFriends}
      />

      {/* Your Rank Badge */}
      {userRank && activeTab === 'global' && (
        <Animated.View
          entering={FadeInDown.delay(0).springify()}
          style={{
            backgroundColor: '#18181b',
            marginHorizontal: 20,
            marginBottom: 16,
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'Poppins_400Regular',
              fontSize: 14,
              color: '#a1a1aa',
            }}
          >
            Your Rank:{' '}
          </Text>
          <Text
            style={{
              fontFamily: 'Righteous_400Regular',
              fontSize: 24,
              color: '#ffffff',
            }}
          >
            #{userRank}
          </Text>
          {userRank <= 3 && (
            <Text style={{ fontSize: 24, marginLeft: 8 }}>
              {userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : '🥉'}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#18181b" />
          <Text
            style={{
              fontFamily: 'Poppins_400Regular',
              fontSize: 14,
              color: '#71717a',
              marginTop: 12,
            }}
          >
            Loading rankings...
          </Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins_700Bold',
              fontSize: 18,
              color: '#FF0055',
              marginBottom: 8,
            }}
          >
            Error
          </Text>
          <Text
            style={{
              fontFamily: 'Poppins_400Regular',
              fontSize: 14,
              color: '#71717a',
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
          <Pressable
            onPress={handleRefresh}
            style={{
              marginTop: 16,
              backgroundColor: '#18181b',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontFamily: 'Righteous_400Regular', color: '#fff' }}>
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : currentData.length === 0 ? (
        activeTab === 'friends' ? (
          <FriendsEmptyState />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🏆</Text>
            <Text
              style={{
                fontFamily: 'Righteous_400Regular',
                fontSize: 24,
                color: '#18181b',
                marginBottom: 8,
              }}
            >
              No Players Yet
            </Text>
            <Text
              style={{
                fontFamily: 'Poppins_400Regular',
                fontSize: 14,
                color: '#71717a',
                textAlign: 'center',
              }}
            >
              Be the first to climb the leaderboard!
            </Text>
          </View>
        )
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => item.uid}
          ListHeaderComponent={
            top3.length > 0 ? <Podium entries={top3} currentUid={uid} /> : null
          }
          renderItem={({ item, index }) => (
            <LeaderboardRow
              entry={item}
              isCurrentUser={item.uid === uid}
              index={index}
              isFriendsTab={activeTab === 'friends'}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#e4e4e7',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#71717a',
  },
  tabTextActive: {
    color: '#18181b',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hyperSerpent: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  hyperSerpentEmoji: {
    fontSize: 10,
  },
  podiumHyper: {
    position: 'absolute',
    right: 6,
    top: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 24,
    color: '#18181b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  emptyStateHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: 300,
  },
  emptyStateHintText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#92400E',
  },
});
