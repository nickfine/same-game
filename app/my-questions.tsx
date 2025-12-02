import React from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '../hooks/useAuth';
import { useMyQuestions } from '../hooks/useMyQuestions';
import type { Question } from '../types';

interface QuestionItemProps {
  question: Question;
  index: number;
}

function QuestionItem({ question, index }: QuestionItemProps) {
  const totalVotes = question.votes_a + question.votes_b;
  const percentageA = totalVotes > 0 ? Math.round((question.votes_a / totalVotes) * 100) : 50;
  const percentageB = 100 - percentageA;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Question */}
      <Text 
        style={{ 
          fontFamily: 'Poppins_700Bold',
          fontSize: 18,
          color: '#18181b',
          marginBottom: 12,
        }}
      >
        {question.text}
      </Text>

      {/* Options with Vote Counts */}
      <View style={{ gap: 8 }}>
        {/* Option A */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#6366F1' }}>
              {question.option_a}
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#71717a' }}>
              {question.votes_a} votes ({percentageA}%)
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: '#e4e4e7', borderRadius: 4, overflow: 'hidden' }}>
            <View 
              style={{ 
                height: '100%', 
                width: `${percentageA}%`, 
                backgroundColor: '#6366F1',
                borderRadius: 4,
              }} 
            />
          </View>
        </View>

        {/* Option B */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#F59E0B' }}>
              {question.option_b}
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#71717a' }}>
              {question.votes_b} votes ({percentageB}%)
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: '#e4e4e7', borderRadius: 4, overflow: 'hidden' }}>
            <View 
              style={{ 
                height: '100%', 
                width: `${percentageB}%`, 
                backgroundColor: '#F59E0B',
                borderRadius: 4,
              }} 
            />
          </View>
        </View>
      </View>

      {/* Total Engagement */}
      <View 
        style={{ 
          marginTop: 12, 
          paddingTop: 12, 
          borderTopWidth: 1, 
          borderTopColor: '#f4f4f5',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#71717a' }}>
          {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function MyQuestionsScreen() {
  const { uid } = useAuth();
  const { questions, loading, error, refresh } = useMyQuestions(uid);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create-question');
  };

  const totalEngagement = questions.reduce((sum, q) => sum + q.votes_a + q.votes_b, 0);

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
          My Questions
        </Text>
      </View>

      {/* Summary */}
      {questions.length > 0 && (
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
              backgroundColor: '#18181b',
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Righteous_400Regular', fontSize: 24, color: '#ffffff' }}>
              {questions.length}
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#a1a1aa' }}>
              questions
            </Text>
          </View>
          <View 
            style={{ 
              flex: 1,
              backgroundColor: '#6366F1',
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Righteous_400Regular', fontSize: 24, color: '#ffffff' }}>
              {totalEngagement}
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              total votes
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
      ) : questions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>❓</Text>
          <Text style={{ fontFamily: 'Righteous_400Regular', fontSize: 24, color: '#18181b', marginBottom: 8 }}>
            No Questions Yet
          </Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#71717a', textAlign: 'center', marginBottom: 24 }}>
            Create your first question and see how people vote!
          </Text>
          <Pressable
            onPress={handleCreate}
            style={{
              backgroundColor: '#6366F1',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontFamily: 'Righteous_400Regular', fontSize: 16, color: '#ffffff' }}>
              Create Question
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <QuestionItem question={item} index={index} />}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

