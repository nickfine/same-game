import React from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '../hooks/useAuth';
import { useVoteHistory } from '../hooks/useVoteHistory';
import type { VoteHistoryItem } from '../types';

interface HistoryItemProps {
  item: VoteHistoryItem;
  index: number;
}

function HistoryItem({ item, index }: HistoryItemProps) {
  const { vote, question } = item;
  const totalVotes = question.votes_a + question.votes_b;
  const percentageA = totalVotes > 0 ? Math.round((question.votes_a / totalVotes) * 100) : 50;
  const percentageB = 100 - percentageA;
  
  const yourChoice = vote.choice === 'a' ? question.optionA : question.optionB;
  const yourEmoji = vote.choice === 'a' ? question.emojiA : question.emojiB;
  const yourPercentage = vote.choice === 'a' ? percentageA : percentageB;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: vote.won ? '#00E054' : '#FF0055',
      }}
    >
      {/* Result Badge */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View 
          style={{ 
            backgroundColor: vote.won ? '#00E054' : '#FF0055',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text 
            style={{ 
              fontFamily: 'Righteous_400Regular',
              fontSize: 12,
              color: '#ffffff',
            }}
          >
            {vote.won ? 'SAME!' : 'NOPE'}
          </Text>
        </View>
        <Text 
          style={{ 
            fontFamily: 'Poppins_400Regular',
            fontSize: 12,
            color: '#a1a1aa',
          }}
        >
          {totalVotes} votes
        </Text>
      </View>

      {/* Question - Emoji display */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Text style={{ fontSize: 24 }}>{question.emojiA}</Text>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#18181b' }}>
          {question.optionA}
        </Text>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#71717a' }}>vs</Text>
        <Text style={{ fontSize: 24 }}>{question.emojiB}</Text>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#18181b' }}>
          {question.optionB}
        </Text>
      </View>

      {/* Your Choice */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text 
          style={{ 
            fontFamily: 'Poppins_400Regular',
            fontSize: 14,
            color: '#71717a',
          }}
        >
          You picked:
        </Text>
        <View 
          style={{ 
            backgroundColor: vote.choice === 'a' ? '#6366F1' : '#F59E0B',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text 
            style={{ 
              fontFamily: 'Poppins_700Bold',
              fontSize: 14,
              color: '#ffffff',
            }}
          >
            {yourEmoji} {yourChoice} ({yourPercentage}%)
          </Text>
        </View>
      </View>

      {/* Vote Breakdown */}
      <View style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ flex: percentageA, backgroundColor: '#6366F1' }} />
          <View style={{ flex: percentageB, backgroundColor: '#F59E0B' }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#71717a' }}>
            {question.emojiA} {question.optionA}: {percentageA}%
          </Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#71717a' }}>
            {question.emojiB} {question.optionB}: {percentageB}%
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const { uid } = useAuth();
  const { history, loading, error, refresh } = useVoteHistory(uid);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const wins = history.filter(h => h.vote.won).length;
  const losses = history.length - wins;

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
          Vote History
        </Text>
      </View>

      {/* Summary */}
      {history.length > 0 && (
        <View 
          style={{ 
            flexDirection: 'row', 
            paddingHorizontal: 20, 
            paddingBottom: 16,
            gap: 12,
          }}
        >
          <View 
            style={{ 
              flex: 1,
              backgroundColor: '#00E054',
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Righteous_400Regular', fontSize: 24, color: '#ffffff' }}>
              {wins}
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#ffffff' }}>
              wins
            </Text>
          </View>
          <View 
            style={{ 
              flex: 1,
              backgroundColor: '#FF0055',
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Righteous_400Regular', fontSize: 24, color: '#ffffff' }}>
              {losses}
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#ffffff' }}>
              losses
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#18181b" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#FF0055', marginBottom: 8 }}>
            Error
          </Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#71717a', textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      ) : history.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📜</Text>
          <Text style={{ fontFamily: 'Righteous_400Regular', fontSize: 24, color: '#18181b', marginBottom: 8 }}>
            No History Yet
          </Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#71717a', textAlign: 'center' }}>
            Start voting on questions to see your history here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.vote.id}
          renderItem={({ item, index }) => <HistoryItem item={item} index={index} />}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

