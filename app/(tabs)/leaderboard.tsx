import React, { useCallback } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useAuth } from '../../hooks/useAuth';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { LevelBadge } from '../../components/LevelBadge';
import { COLORS, GRADIENTS } from '../../lib/constants';
import type { LeaderboardEntry } from '../../types';

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD TAB - Dark Cosmic Theme with Friends Toggle
// "See who's winning. Feel the FOMO. Chase the crown."
// ═══════════════════════════════════════════════════════════════

// Streak flame colors based on streak value
function getStreakColor(streak: number): string {
  if (streak >= 30) return '#FFD700'; // Gold
  if (streak >= 20) return '#FF6B6B'; // Red hot
  if (streak >= 10) return '#FF8E53'; // Orange
  if (streak >= 5) return '#FFA500';  // Warm orange
  if (streak >= 3) return '#FFB800';  // Yellow
  return '#6B7280'; // Gray for low streaks
}

// ═══════════════════════════════════════════════════════════════
// TAB TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════════
function TabToggle({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: 'global' | 'friends';
  onTabChange: (tab: 'global' | 'friends') => void;
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
          👥 Friends
        </Text>
      </Pressable>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// PODIUM - Top 3 with dramatic styling
// ═══════════════════════════════════════════════════════════════
function Podium({ 
  entries, 
  currentUid 
}: { 
  entries: LeaderboardEntry[]; 
  currentUid: string | null;
}) {
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  return (
    <View style={styles.podiumContainer}>
      {/* 2nd Place */}
      {second && (
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.podiumSpotSecond}
        >
          <Text style={styles.podiumMedal}>🥈</Text>
          <PodiumCard 
            entry={second} 
            isCurrentUser={second.uid === currentUid}
            variant="second"
          />
        </Animated.View>
      )}

      {/* 1st Place */}
      {first && (
        <Animated.View
          entering={FadeInUp.delay(100).springify()}
          style={styles.podiumSpotFirst}
        >
          <Text style={styles.podiumMedalFirst}>🥇</Text>
          <PodiumCard 
            entry={first} 
            isCurrentUser={first.uid === currentUid}
            variant="first"
          />
        </Animated.View>
      )}

      {/* 3rd Place */}
      {third && (
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={styles.podiumSpotThird}
        >
          <Text style={styles.podiumMedal}>🥉</Text>
          <PodiumCard 
            entry={third} 
            isCurrentUser={third.uid === currentUid}
            variant="third"
          />
        </Animated.View>
      )}
    </View>
  );
}

function PodiumCard({ 
  entry, 
  isCurrentUser,
  variant,
}: { 
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  variant: 'first' | 'second' | 'third';
}) {
  const bgColor = isCurrentUser 
    ? COLORS.primary 
    : variant === 'first' 
      ? 'rgba(255, 215, 0, 0.15)' 
      : 'rgba(255, 255, 255, 0.08)';
  
  const borderColor = isCurrentUser
    ? COLORS.primary
    : variant === 'first'
      ? 'rgba(255, 215, 0, 0.4)'
      : 'rgba(255, 255, 255, 0.15)';
  
  return (
    <View style={[
      styles.podiumCard,
      { backgroundColor: bgColor, borderColor },
      variant === 'first' && styles.podiumCardFirst,
    ]}>
      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.display_name}
        {isCurrentUser && ' 👤'}
      </Text>
      
      <Text style={[
        styles.podiumScore,
        variant === 'first' && styles.podiumScoreFirst,
      ]}>
        {entry.score}
      </Text>
      
      <View style={styles.podiumStats}>
        <Text style={styles.podiumStat}>{entry.win_rate}% win</Text>
        <View style={styles.streakBadge}>
          <Text style={[styles.streakFlame, { color: getStreakColor(entry.current_streak) }]}>
            🔥
          </Text>
          <Text style={styles.streakNumber}>{entry.current_streak}</Text>
        </View>
      </View>
      
      {/* Hyperstreak indicator */}
      {entry.in_hyperstreak && (
        <View style={styles.hyperIndicator}>
          <Text style={styles.hyperText}>⚡</Text>
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD ROW - Ranks 4+
// ═══════════════════════════════════════════════════════════════
function LeaderboardRow({
  entry,
  isCurrentUser,
  index,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
}) {
  const streakColor = getStreakColor(entry.current_streak);
  
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).springify()}
      style={[
        styles.row,
        isCurrentUser && styles.rowCurrentUser,
      ]}
    >
      {/* Rank */}
      <View style={styles.rankContainer}>
        <Text style={[
          styles.rankText,
          isCurrentUser && styles.rankTextCurrentUser,
        ]}>
          {entry.rank}
        </Text>
      </View>

      {/* Level Badge */}
      {entry.level && (
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv.{entry.level}</Text>
        </View>
      )}

      {/* Avatar + Name */}
      <View style={styles.nameContainer}>
        {entry.avatar_emoji && (
          <Text style={styles.avatar}>{entry.avatar_emoji}</Text>
        )}
        <View style={styles.nameTextContainer}>
          <Text style={[
            styles.nameText,
            isCurrentUser && styles.nameTextCurrentUser,
          ]} numberOfLines={1}>
            {entry.display_name}
            {isCurrentUser && ' (You)'}
          </Text>
          
          {/* Stats row */}
          <Text style={styles.statsText}>
            {entry.votes_won} wins • {entry.win_rate}%
          </Text>
        </View>
      </View>

      {/* Streak flame */}
      <View style={styles.streakContainer}>
        <Text style={[styles.streakFlame, { color: streakColor }]}>🔥</Text>
        <Text style={[styles.streakValue, { color: streakColor }]}>
          {entry.current_streak}
        </Text>
        
        {/* Hyperstreak serpent icon */}
        {entry.in_hyperstreak && (
          <Text style={styles.hyperSerpent}>🐍</Text>
        )}
      </View>

      {/* Score */}
      <View style={styles.scoreContainer}>
        <Text style={[
          styles.scoreText,
          isCurrentUser && styles.scoreTextCurrentUser,
        ]}>
          {entry.score}
        </Text>
        <Text style={styles.ptsLabel}>pts</Text>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════
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
  } = useLeaderboard(uid);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refresh();
  }, [refresh]);

  // Select data based on active tab
  const currentData = activeTab === 'global' ? leaderboard : friendsLeaderboard;
  const top3 = currentData.slice(0, 3);
  const rest = currentData.slice(3);

  return (
    <View style={styles.container}>
      {/* Dark cosmic gradient background */}
      <LinearGradient
        colors={GRADIENTS.background}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          
          <Text style={styles.title}>Leaderboard</Text>
          
          <Pressable onPress={handleRefresh} style={styles.refreshButton}>
            <Text style={styles.refreshText}>🔄</Text>
          </Pressable>
        </View>

        {/* Tab Toggle */}
        <TabToggle activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Your Rank Badge */}
        {userRank && activeTab === 'global' && (
          <Animated.View
            entering={FadeInDown.delay(0).springify()}
            style={styles.yourRankBadge}
          >
            <Text style={styles.yourRankLabel}>Your Rank</Text>
            <Text style={styles.yourRankNumber}>#{userRank}</Text>
            {userRank <= 3 && (
              <Text style={styles.yourRankMedal}>
                {userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : '🥉'}
              </Text>
            )}
          </Animated.View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Loading rankings...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Pressable onPress={handleRefresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : currentData.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'friends' ? 'No Friends Yet' : 'No Players Yet'}
            </Text>
            <Text style={styles.emptyMessage}>
              {activeTab === 'friends' 
                ? 'Invite friends to compete!' 
                : 'Be the first to climb the leaderboard!'}
            </Text>
          </View>
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
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES - Dark Cosmic Theme
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 28,
    color: COLORS.text,
  },
  title: {
    flex: 1,
    fontFamily: 'Righteous_400Regular',
    fontSize: 24,
    color: COLORS.text,
    textAlign: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 20,
  },
  
  // Tab Toggle
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  
  // Your Rank Badge
  yourRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(110, 12, 255, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  yourRankLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textMuted,
  },
  yourRankNumber: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 24,
    color: COLORS.text,
  },
  yourRankMedal: {
    fontSize: 24,
  },
  
  // Podium
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 8,
  },
  podiumSpotFirst: {
    flex: 1.2,
    alignItems: 'center',
    marginBottom: 16,
  },
  podiumSpotSecond: {
    flex: 1,
    alignItems: 'center',
  },
  podiumSpotThird: {
    flex: 1,
    alignItems: 'center',
  },
  podiumMedal: {
    fontSize: 32,
    marginBottom: 8,
  },
  podiumMedalFirst: {
    fontSize: 44,
    marginBottom: 8,
  },
  podiumCard: {
    width: '100%',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 100,
  },
  podiumCardFirst: {
    minHeight: 120,
    padding: 16,
  },
  podiumName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumScore: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 24,
    color: COLORS.text,
  },
  podiumScoreFirst: {
    fontSize: 32,
  },
  podiumStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  podiumStat: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.textMuted,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakFlame: {
    fontSize: 14,
  },
  streakNumber: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  hyperIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    padding: 4,
  },
  hyperText: {
    fontSize: 12,
  },
  
  // Leaderboard Rows
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowCurrentUser: {
    backgroundColor: 'rgba(110, 12, 255, 0.2)',
    borderColor: COLORS.primary,
  },
  rankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 14,
    color: COLORS.textMuted,
  },
  rankTextCurrentUser: {
    color: COLORS.text,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  levelText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: COLORS.textMuted,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    fontSize: 20,
  },
  nameTextContainer: {
    flex: 1,
  },
  nameText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: COLORS.text,
  },
  nameTextCurrentUser: {
    color: COLORS.accent,
  },
  statsText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.textMuted,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 12,
  },
  streakValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  hyperSerpent: {
    fontSize: 14,
    marginLeft: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 18,
    color: COLORS.text,
  },
  scoreTextCurrentUser: {
    color: COLORS.accent,
  },
  ptsLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: COLORS.textMuted,
  },
  
  // Center content states
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  errorTitle: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 24,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  errorMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 14,
    color: COLORS.text,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Righteous_400Regular',
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});


