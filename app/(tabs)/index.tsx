import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useAuth } from '../../hooks/useAuth';
import { useQuestions } from '../../hooks/useQuestions';
import { useVote } from '../../hooks/useVote';
import { useAchievements } from '../../hooks/useAchievements';
import { useDopamineFeatures } from '../../hooks/useDopamineFeatures';
import { useStreakManager } from '../../hooks/useStreakManager';
import { useComplianceContext } from '../../components/ComplianceProvider';
import { AppHeader } from '../../components/AppHeader';
import { UserMenu } from '../../components/UserMenu';
import { QuestionCard } from '../../components/QuestionCard';
import { VoteButtons } from '../../components/VoteButtons';
import { AchievementToast } from '../../components/AchievementToast';
import { MysteryChest } from '../../components/MysteryChest';
import { DailySpinWheel } from '../../components/DailySpinWheel';
import { ComboMultiplier } from '../../components/ComboMultiplier';
import { StreakDeathModal } from '../../components/StreakDeathModal';
import { PowerUpBar } from '../../components/PowerUpBar';
import { LevelUpModal } from '../../components/LevelUpModal';
import { calculateLevel } from '../../lib/levels';
import { deductUserScore, addUserScore } from '../../lib/firestore';
import type { VoteChoice } from '../../types';
import type { Reward } from '../../lib/rewards';

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
  
  const { vote, result: voteResult, loading: voteLoading, reset: resetVote, error: voteError } = useVote();
  const { newlyUnlocked, clearNewlyUnlocked } = useAchievements(uid, user);
  const { canVote, remainingVotes, showDailyVoteLimitModal, isMinor } = useComplianceContext();
  
  // Dopamine features
  const {
    canSpin,
    showChest,
    showSpin,
    powerUps,
    activeMultiplier,
    doubleDownActive,
    peekActive,
    onVoteComplete,
    onChestClaimed,
    openDailySpin,
    onSpinClaimed,
    closeChest,
    closeSpin,
    useStreakFreezeItem,
    activatePeek,
    deactivatePeek,
    activateDoubleDown,
    activateSkip,
    clearActiveEffects,
  } = useDopamineFeatures();

  // Streak death management (loss aversion)
  const hasStreakFreeze = powerUps.streakFreeze > 0;
  const {
    showDeathModal,
    deadStreak,
    daysSinceDeath,
    showCrackedBadge,
    lastDeadStreak,
    handleStreakDeath,
    useStreakFreeze,
    acceptStreakDeath,
    closeDeathModal,
  } = useStreakManager(user, hasStreakFreeze);
  
  const [showingResult, setShowingResult] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [comboActive, setComboActive] = useState(false);
  const [pendingChestReward, setPendingChestReward] = useState<Reward | null>(null);

  // Peek data for showing vote percentages
  interface PeekData {
    percentage_a: number;
    percentage_b: number;
    leading: 'a' | 'b' | 'tie';
  }
  const [peekData, setPeekData] = useState<PeekData | null>(null);
  
  // Calculate peek data when peek is activated
  useEffect(() => {
    if (peekActive && currentQuestion) {
      const total = currentQuestion.votes_a + currentQuestion.votes_b;
      let data: PeekData;
      if (total === 0) {
        data = { percentage_a: 50, percentage_b: 50, leading: 'tie' };
      } else {
        const percentage_a = Math.round((currentQuestion.votes_a / total) * 100);
        const percentage_b = 100 - percentage_a;
        let leading: 'a' | 'b' | 'tie' = 'tie';
        if (currentQuestion.votes_a > currentQuestion.votes_b) leading = 'a';
        else if (currentQuestion.votes_b > currentQuestion.votes_a) leading = 'b';
        data = { percentage_a, percentage_b, leading };
      }
      setPeekData(data);
    } else {
      setPeekData(null);
    }
  }, [peekActive, currentQuestion]);
  
  // Level up tracking
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [newLevelToShow, setNewLevelToShow] = useState(1);
  const previousLevelRef = useRef<number | null>(null);
  
  // Track level changes and show level-up modal
  useEffect(() => {
    if (user) {
      const currentLevel = user.level ?? calculateLevel(user.xp ?? 0);
      
      if (previousLevelRef.current !== null && currentLevel > previousLevelRef.current) {
        // Level up detected!
        setNewLevelToShow(currentLevel);
        setShowLevelUpModal(true);
      }
      
      previousLevelRef.current = currentLevel;
    }
  }, [user?.level, user?.xp]);

  // Handle achievement toast dismissal
  const handleAchievementDismiss = useCallback(() => {
    if (currentAchievementIndex < newlyUnlocked.length - 1) {
      setCurrentAchievementIndex(prev => prev + 1);
    } else {
      clearNewlyUnlocked();
      setCurrentAchievementIndex(0);
    }
  }, [currentAchievementIndex, newlyUnlocked.length, clearNewlyUnlocked]);

  const handleVote = useCallback(async (choice: VoteChoice) => {
    if (!uid || !currentQuestion || voteLoading || showingResult) return;
    
    // Check daily vote limit for minors
    if (!canVote) {
      showDailyVoteLimitModal();
      return;
    }
    
    setShowingResult(true);
    setComboActive(true); // Activate combo timer
    const result = await vote(uid, currentQuestion.id, choice);
    
    // Check if vote failed due to daily limit
    if (!result && voteError === 'DAILY_LIMIT_REACHED') {
      setShowingResult(false);
      setComboActive(false);
      showDailyVoteLimitModal();
      return;
    }
    
    // Check for streak death (loss aversion trigger)
    if (result && !result.won && result.previousStreak > 0) {
      // User lost with an active streak - trigger death modal after animation
      setTimeout(() => {
        handleStreakDeath(result.previousStreak);
      }, 1500); // Show after result animation completes
    }
    
    // Check for mystery chest after vote
    if (result && user) {
      const shouldShowChest = onVoteComplete(user.votes_cast + 1, result.won);
      // Chest will show after result animation completes
    }
    
    // Clear active power-up effects after vote
    clearActiveEffects();
    setPeekData(null);
  }, [uid, currentQuestion, vote, voteLoading, showingResult, canVote, showDailyVoteLimitModal, voteError, user, onVoteComplete, handleStreakDeath, clearActiveEffects]);

  const handleAnimationComplete = useCallback(() => {
    resetVote();
    setShowingResult(false);
    // Don't advance to next question if chest is about to show
    if (!showChest) {
      nextQuestion();
    }
  }, [resetVote, nextQuestion, showChest]);

  // Handle chest reward claimed
  const handleChestReward = useCallback((reward: Reward) => {
    if (user) {
      onChestClaimed(reward, user.votes_cast);
      // TODO: Apply points reward to user score if reward.type === 'points'
    }
    nextQuestion();
  }, [user, onChestClaimed, nextQuestion]);

  // Handle spin reward claimed  
  const handleSpinReward = useCallback((reward: Reward) => {
    onSpinClaimed(reward);
    // TODO: Apply points reward to user score if reward.type === 'points'
  }, [onSpinClaimed]);

  // Handle combo expired
  const handleComboExpired = useCallback(() => {
    setComboActive(false);
  }, []);

  // Handle using a streak freeze
  const handleUseStreakFreeze = useCallback(async () => {
    const success = await useStreakFreeze();
    if (success) {
      // Consume the streak freeze power-up
      useStreakFreezeItem();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [useStreakFreeze, useStreakFreezeItem]);

  // Handle accepting streak death
  const handleAcceptStreakDeath = useCallback(async () => {
    await acceptStreakDeath();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [acceptStreakDeath]);

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

  const handleLevelUpClose = useCallback(() => {
    setShowLevelUpModal(false);
  }, []);

  const handleLevelPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile');
  }, []);

  // Power-up handlers
  const handleUsePeek = useCallback(async () => {
    if (!uid || !user || peekActive) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { success, cost } = await activatePeek();
    
    if (success && cost > 0) {
      try {
        await deductUserScore(uid, cost);
      } catch (error) {
        console.error('Failed to deduct points for peek:', error);
        deactivatePeek();
        return;
      }
    }
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [uid, user, peekActive, activatePeek, deactivatePeek]);

  const handleUseSkip = useCallback(async () => {
    if (!uid || !user || !currentQuestion) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { success, cost } = await activateSkip();
    
    if (success && cost > 0) {
      try {
        await deductUserScore(uid, cost);
      } catch (error) {
        console.error('Failed to deduct points for skip:', error);
        return;
      }
    }
    
    if (success) {
      clearActiveEffects();
      setPeekData(null);
      nextQuestion();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [uid, user, currentQuestion, activateSkip, clearActiveEffects, nextQuestion]);

  const handleUseDoubleDown = useCallback(async () => {
    if (!uid || !user || doubleDownActive) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { success, cost } = await activateDoubleDown();
    
    if (success && cost > 0) {
      try {
        await deductUserScore(uid, cost);
      } catch (error) {
        console.error('Failed to deduct points for double down:', error);
        return;
      }
    }
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [uid, user, doubleDownActive, activateDoubleDown]);

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
          level={user?.level ?? calculateLevel(user?.xp ?? 0)}
          xp={user?.xp ?? 0}
          onMenuPress={handleMenuOpen}
          onLevelPress={handleLevelPress}
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

      {/* Daily Spin Button - Shows when spin is available */}
      {canSpin && (
        <Pressable
          onPress={openDailySpin}
          style={{
            position: 'absolute',
            top: 60,
            right: 16,
            backgroundColor: '#F59E0B',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            zIndex: 10,
          }}
        >
          <Text style={{ fontSize: 16 }}>🎰</Text>
          <Text style={{ 
            color: '#fff', 
            fontSize: 12, 
            fontFamily: 'Righteous_400Regular',
          }}>
            SPIN!
          </Text>
        </Pressable>
      )}

      {/* Combo Multiplier Bar */}
      {(user?.current_streak ?? 0) >= 1 && (
        <View style={{ 
          position: 'absolute', 
          top: 100, 
          left: 0, 
          right: 0,
          zIndex: 5,
        }}>
          <ComboMultiplier
            streak={user?.current_streak ?? 0}
            isActive={comboActive}
            onComboExpired={handleComboExpired}
          />
        </View>
      )}

      {/* Active Multiplier Indicator */}
      {activeMultiplier > 1 && (
        <View style={{
          position: 'absolute',
          top: 60,
          left: 16,
          backgroundColor: '#8B5CF6',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          zIndex: 10,
        }}>
          <Text style={{ 
            color: '#fff', 
            fontSize: 14, 
            fontFamily: 'Righteous_400Regular',
          }}>
            🚀 {activeMultiplier}x
          </Text>
        </View>
      )}

      {/* Main Content Area */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* Question Card */}
        {currentQuestion && (
          <QuestionCard 
            key={currentQuestion.id}
            question={currentQuestion}
            voteResult={voteResult}
            peekData={peekData}
            doubleDownActive={doubleDownActive}
            onAnimationComplete={handleAnimationComplete}
          />
        )}
      </View>

      {/* Power-Up Bar */}
      {currentQuestion && !showingResult && (
        <PowerUpBar
          powerUps={powerUps}
          userScore={user?.score ?? 0}
          doubleDownActive={doubleDownActive}
          peekActive={peekActive}
          onUsePeek={handleUsePeek}
          onUseSkip={handleUseSkip}
          onUseDoubleDown={handleUseDoubleDown}
          disabled={voteLoading}
        />
      )}

      {/* Vote Buttons - Fixed at bottom */}
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

      {/* Achievement Toast */}
      {newlyUnlocked.length > 0 && (
        <AchievementToast
          key={newlyUnlocked[currentAchievementIndex].id}
          achievement={newlyUnlocked[currentAchievementIndex]}
          onDismiss={handleAchievementDismiss}
        />
      )}

      {/* Mystery Chest Modal */}
      <MysteryChest
        visible={showChest}
        onClose={closeChest}
        onRewardClaimed={handleChestReward}
      />

      {/* Daily Spin Wheel Modal */}
      <DailySpinWheel
        visible={showSpin}
        onClose={closeSpin}
        onRewardClaimed={handleSpinReward}
      />

      {/* Streak Death Modal (Loss Aversion) */}
      <StreakDeathModal
        visible={showDeathModal}
        deadStreak={deadStreak}
        hasStreakFreeze={hasStreakFreeze}
        onUseFreeze={handleUseStreakFreeze}
        onAcceptDeath={handleAcceptStreakDeath}
        onClose={closeDeathModal}
      />

      {/* Level Up Celebration Modal */}
      <LevelUpModal
        visible={showLevelUpModal}
        newLevel={newLevelToShow}
        onClose={handleLevelUpClose}
      />

    </SafeAreaView>
  );
}
