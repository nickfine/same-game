import React from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useAuth } from '../hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import type { LeaderboardEntry } from '../types';

// Medal colors
const MEDAL_COLORS = {
  1: { bg: '#FFD700', text: '#92400E', emoji: '🥇' }, // Gold
  2: { bg: '#C0C0C0', text: '#374151', emoji: '🥈' }, // Silver
  3: { bg: '#CD7F32', text: '#451A03', emoji: '🥉' }, // Bronze
};

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
              }}
            >
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
                {second.win_rate}% win
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
              }}
            >
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
                {first.win_rate}% win rate
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
              }}
            >
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
                {third.win_rate}% win
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
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).springify()}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isCurrentUser ? '#6366F1' : '#ffffff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        marginHorizontal: 20,
        borderWidth: isCurrentUser ? 0 : 1,
        borderColor: '#f4f4f5',
      }}
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
          marginRight: 12,
        }}
      >
        <Text
          style={{
            fontFamily: 'Righteous_400Regular',
            fontSize: 14,
            color: isCurrentUser ? '#fff' : '#71717a',
          }}
        >
          {entry.rank}
        </Text>
      </View>

      {/* Name & Stats */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins_700Bold',
            fontSize: 15,
            color: isCurrentUser ? '#fff' : '#18181b',
          }}
          numberOfLines={1}
        >
          {entry.display_name}
          {isCurrentUser && ' (You)'}
        </Text>
        <Text
          style={{
            fontFamily: 'Poppins_400Regular',
            fontSize: 12,
            color: isCurrentUser ? 'rgba(255,255,255,0.7)' : '#71717a',
          }}
        >
          {entry.votes_won} wins • {entry.win_rate}% rate • 🔥 {entry.best_streak}
        </Text>
      </View>

      {/* Score */}
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
    </Animated.View>
  );
}

export default function LeaderboardScreen() {
  const { uid } = useAuth();
  const { leaderboard, userRank, loading, error, refresh } = useLeaderboard(uid);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refresh();
  };

  // Separate top 3 from rest
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

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

      {/* Your Rank Badge */}
      {userRank && (
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
      ) : leaderboard.length === 0 ? (
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
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

