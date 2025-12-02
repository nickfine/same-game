import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useAuth } from '../../hooks/useAuth';
import { useQuestions } from '../../hooks/useQuestions';
import { useVote } from '../../hooks/useVote';
import { AppHeader } from '../../components/AppHeader';
import { UserMenu } from '../../components/UserMenu';
import { QuestionCard } from '../../components/QuestionCard';
import { VoteButtons } from '../../components/VoteButtons';
import type { VoteChoice } from '../../types';

export default function FeedScreen() {
  const { user, uid } = useAuth();
  const { 
    currentQuestion, 
    loading: questionsLoading, 
    error: questionsError,
    nextQuestion,
    refresh,
    hasMoreQuestions,
  } = useQuestions(uid);
  
  const { vote, result: voteResult, loading: voteLoading, reset: resetVote } = useVote();
  const [showingResult, setShowingResult] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleVote = useCallback(async (choice: VoteChoice) => {
    if (!uid || !currentQuestion || voteLoading || showingResult) return;
    
    setShowingResult(true);
    await vote(uid, currentQuestion.id, choice);
  }, [uid, currentQuestion, vote, voteLoading, showingResult]);

  const handleAnimationComplete = useCallback(() => {
    resetVote();
    setShowingResult(false);
    nextQuestion();
  }, [resetVote, nextQuestion]);

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refresh();
  }, [refresh]);

  const handleMenuOpen = useCallback(() => {
    setMenuVisible(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuVisible(false);
  }, []);

  // Loading state
  if (questionsLoading && !currentQuestion) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f5', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#18181b" />
        <Text 
          style={{ 
            marginTop: 16, 
            color: '#18181b', 
            fontSize: 18,
            fontFamily: 'Righteous_400Regular',
          }}
        >
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (questionsError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f5', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text 
          style={{ 
            color: '#FF0055', 
            fontSize: 24, 
            textAlign: 'center', 
            marginBottom: 16,
            fontFamily: 'Righteous_400Regular',
          }}
        >
          Oops!
        </Text>
        <Text style={{ color: '#71717a', textAlign: 'center', marginBottom: 24, fontFamily: 'Poppins_400Regular' }}>
          {questionsError}
        </Text>
        <Pressable 
          onPress={handleRefresh}
          style={{
            backgroundColor: '#18181b',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text 
            style={{ 
              color: '#ffffff', 
              fontSize: 18,
              fontFamily: 'Righteous_400Regular',
            }}
          >
            Try Again
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // No more questions
  if (!currentQuestion && !hasMoreQuestions) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f5' }}>
        <AppHeader 
          score={user?.score ?? 0} 
          onMenuPress={handleMenuOpen}
        />
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Animated.View entering={FadeIn.duration(300)}>
            <Text 
              style={{ 
                fontSize: 36, 
                color: '#18181b', 
                textAlign: 'center', 
                marginBottom: 16,
                fontFamily: 'Righteous_400Regular',
              }}
            >
              All caught up!
            </Text>
            <Text 
              style={{ 
                color: '#71717a', 
                textAlign: 'center', 
                fontSize: 16, 
                marginBottom: 32,
                fontFamily: 'Poppins_400Regular',
                lineHeight: 24,
              }}
            >
              You've answered all available questions.{'\n'}Open the menu to create your own!
            </Text>
            
            <Pressable 
              onPress={handleRefresh}
              style={{
                backgroundColor: '#e4e4e7',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text 
                style={{ 
                  color: '#18181b', 
                  textAlign: 'center', 
                  fontSize: 16,
                  fontFamily: 'Righteous_400Regular',
                }}
              >
                Check for new questions
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        <UserMenu 
          visible={menuVisible}
          onClose={handleMenuClose}
          score={user?.score ?? 0}
          questionsCreated={user?.questions_created ?? 0}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f5' }}>
      {/* App Header */}
      <AppHeader 
        score={user?.score ?? 0} 
        onMenuPress={handleMenuOpen}
      />

      {/* Question Card */}
      {currentQuestion && (
        <QuestionCard 
          key={currentQuestion.id}
          question={currentQuestion}
          voteResult={voteResult}
          onAnimationComplete={handleAnimationComplete}
        />
      )}

      {/* Vote Buttons */}
      {currentQuestion && (
        <VoteButtons
          optionA={currentQuestion.option_a}
          optionB={currentQuestion.option_b}
          onVote={handleVote}
          disabled={voteLoading || showingResult}
          hidden={showingResult}
        />
      )}

      {/* User Menu */}
      <UserMenu 
        visible={menuVisible}
        onClose={handleMenuClose}
        score={user?.score ?? 0}
        questionsCreated={user?.questions_created ?? 0}
      />
    </SafeAreaView>
  );
}
