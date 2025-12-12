import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useAuth } from '../../hooks/useAuth';
import { useQuestions } from '../../hooks/useQuestions';
import { useVote } from '../../hooks/useVote';
import { useAchievements } from '../../hooks/useAchievements';
import { useDopamineFeatures } from '../../hooks/useDopamineFeatures';
import { useStreakManager } from '../../hooks/useStreakManager';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useComplianceContext } from '../../components/ComplianceProvider';
import { AppHeader } from '../../components/AppHeader';
import { UserMenu } from '../../components/UserMenu';
import { QuestionCard } from '../../components/QuestionCard';
import { VoteButtons } from '../../components/VoteButtons';
import { AchievementToast } from '../../components/AchievementToast';
import { MysteryChest } from '../../components/MysteryChest';
import { DailySpinWheel } from '../../components/DailySpinWheel';
import { StreakStrip } from '../../components/StreakStrip';
import { StreakDeathAnimation } from '../../components/StreakDeathAnimation';
import { PowerUpBar } from '../../components/PowerUpBar';
import { LevelUpModal } from '../../components/LevelUpModal';
import { ResultReveal } from '../../components/ResultReveal';
import { ConfettiCannon } from '../../components/ConfettiCannon';
import { ScreenFlash } from '../../components/ScreenFlash';
import { calculateLevel } from '../../lib/levels';
import { deductUserScore, addUserScore } from '../../lib/firestore';
import { COLORS, GRADIENTS } from '../../lib/constants';
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
  const { userRank } = useLeaderboard(uid);
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
    reviveWithAd,
    reviveWithShare,
    acceptStreakDeath,
    closeDeathModal,
  } = useStreakManager(user, hasStreakFreeze);
  
  const [showingResult, setShowingResult] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [userChoice, setUserChoice] = useState<'a' | 'b' | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pendingChestReward, setPendingChestReward] = useState<Reward | null>(null);

  // Visual feedback states
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [flashVariant, setFlashVariant] = useState<'correct' | 'wrong'>('correct');

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
    
    setUserChoice(choice);
    setShowingResult(true);
    const result = await vote(uid, currentQuestion.id, choice);
    
    // Check if vote failed due to daily limit
    if (!result && voteError === 'DAILY_LIMIT_REACHED') {
      setShowingResult(false);
      setUserChoice(null);
      showDailyVoteLimitModal();
      return;
    }
    
    // Trigger visual feedback
    if (result) {
      setFlashVariant(result.won ? 'correct' : 'wrong');
      setShowFlash(true);
      
      if (result.won) {
        setShowConfetti(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      setShowCelebration(true);
    }
    
    // Check for streak death (loss aversion trigger)
    const lostStreak = result && !result.won && result.previousStreak > 0;
    if (lostStreak) {
      // User lost with an active streak - trigger death modal after animation
      setTimeout(() => {
        handleStreakDeath(result.previousStreak);
      }, 4000); // Show after celebration completes
    }
    
    // Check for mystery chest after vote
    // Only show chest on WINS and when no other important events (like streak death) are happening
    if (result && user) {
      onVoteComplete(user.votes_cast + 1, result.won, {
        lostStreak: lostStreak ?? false,
      });
      // Chest will show after result animation completes (only on wins)
    }
    
    // Clear active power-up effects after vote
    clearActiveEffects();
    setPeekData(null);
  }, [uid, currentQuestion, vote, voteLoading, showingResult, canVote, showDailyVoteLimitModal, voteError, user, onVoteComplete, handleStreakDeath, clearActiveEffects]);

  // Handle celebration complete
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setShowingResult(false);
    setUserChoice(null);
    setShowConfetti(false);
    setShowFlash(false);
    resetVote();

    // Don't advance to next question if chest is about to show
    if (!showChest) {
      nextQuestion();
    }
  }, [resetVote, nextQuestion, showChest]);

  // Handle chest reward claimed
  const handleChestReward = useCallback((reward: Reward) => {
    if (user) {
      onChestClaimed(reward, user.votes_cast);
    }
    nextQuestion();
  }, [user, onChestClaimed, nextQuestion]);

  // Handle spin reward claimed  
  const handleSpinReward = useCallback((reward: Reward) => {
    onSpinClaimed(reward);
  }, [onSpinClaimed]);

  // Handle using a streak freeze
  const handleUseStreakFreeze = useCallback(async () => {
    const success = await useStreakFreeze();
    if (success) {
      // Consume the streak freeze power-up
      useStreakFreezeItem();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [useStreakFreeze, useStreakFreezeItem]);

  // Handle reviving with ad (no freeze consumed)
  const handleReviveWithAd = useCallback(async () => {
    // In production, this would show a rewarded ad first
    // For now, directly revive
    const success = await reviveWithAd();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [reviveWithAd]);

  // Handle reviving with share (viral growth hack)
  const handleReviveWithShare = useCallback(async () => {
    // Share was already triggered in ReviveOptions
    // Now just complete the revive
    const success = await reviveWithShare();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [reviveWithShare]);

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
      <View style={styles.container}>
        <LinearGradient
          colors={GRADIENTS.background}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </View>
    );
  }

  // Error state
  if (questionsError) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={GRADIENTS.background}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.centerContent}>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{questionsError}</Text>
          <Pressable onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // No more questions
  if (!currentQuestion && !hasMoreQuestions) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={GRADIENTS.background}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={{ flex: 1 }}>
          <AppHeader
            level={user?.level ?? calculateLevel(user?.xp ?? 0)}
            rank={userRank}
            canSpin={canSpin}
            onMenuPress={handleMenuOpen}
            onLevelPress={handleLevelPress}
            onSpinPress={openDailySpin}
          />
          
          <View style={styles.centerContent}>
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyMessage}>
                You've answered all available questions.{'\n'}Open the menu to create your own!
              </Text>
              
              <Pressable onPress={handleRefresh} style={styles.checkButton}>
                <Text style={styles.checkButtonText}>Check for new questions</Text>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={GRADIENTS.background}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* App Header with glassmorphism */}
        <AppHeader
          level={user?.level ?? calculateLevel(user?.xp ?? 0)}
          rank={userRank}
          canSpin={canSpin}
          onMenuPress={handleMenuOpen}
          onLevelPress={handleLevelPress}
          onSpinPress={openDailySpin}
        />

        {/* Streak Strip */}
        <View style={styles.streakContainer}>
          <StreakStrip
            currentStreak={user?.current_streak ?? 0}
            bestStreak={user?.best_streak ?? 0}
          />
        </View>

        {/* Active Multiplier Indicator */}
        {activeMultiplier > 1 && (
          <View style={styles.multiplierBadge}>
            <Text style={styles.multiplierText}>🚀 {activeMultiplier}x</Text>
          </View>
        )}

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Card Container - holds both question and result in same position */}
          <View style={styles.cardContainer}>
            {/* Question Card - Always visible underneath */}
            {currentQuestion && (
              <QuestionCard 
                key={currentQuestion.id}
                question={currentQuestion}
                voteResult={voteResult}
                peekData={peekData}
                doubleDownActive={doubleDownActive}
              />
            )}
            
            {/* Result Reveal - Overlays directly on top of question card */}
            {currentQuestion && showingResult && voteResult && (
              <ResultReveal
                visible={showingResult}
                question={currentQuestion}
                result={voteResult}
                onComplete={handleCelebrationComplete}
              />
            )}
          </View>
        </View>

        {/* Power-Up Bar */}
        {currentQuestion && (
          <PowerUpBar
            powerUps={powerUps}
            userScore={user?.score ?? 0}
            doubleDownActive={doubleDownActive}
            peekActive={peekActive}
            onUsePeek={handleUsePeek}
            onUseSkip={handleUseSkip}
            onUseDoubleDown={handleUseDoubleDown}
            disabled={voteLoading}
            hidden={showingResult}
          />
        )}

        {/* Vote Buttons - Stacked vertically */}
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

        {/* Epic Streak Death Animation (Loss Aversion + FOMO) */}
        <StreakDeathAnimation
          visible={showDeathModal}
          deadStreak={deadStreak}
          hasStreakFreeze={hasStreakFreeze}
          onUseFreeze={handleUseStreakFreeze}
          onWatchAd={handleReviveWithAd}
          onShareRevive={handleReviveWithShare}
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

      {/* Visual Feedback Overlays */}
      <ScreenFlash 
        visible={showFlash} 
        variant={flashVariant}
        onComplete={() => setShowFlash(false)}
      />
      <ConfettiCannon 
        shoot={showConfetti}
        variant="correct"
        onComplete={() => setShowConfetti(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.text,
    fontSize: 18,
    fontFamily: 'Righteous_400Regular',
  },
  errorTitle: {
    color: COLORS.secondary,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Righteous_400Regular',
  },
  errorMessage: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Poppins_400Regular',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryButtonText: {
    color: COLORS.primaryForeground,
    fontSize: 18,
    fontFamily: 'Righteous_400Regular',
  },
  emptyTitle: {
    fontSize: 36,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Righteous_400Regular',
  },
  emptyMessage: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 32,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 24,
  },
  checkButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  checkButtonText: {
    color: COLORS.text,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Righteous_400Regular',
  },
  streakContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  multiplierBadge: {
    position: 'absolute',
    top: 100,
    left: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  multiplierText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Righteous_400Regular',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 80,
  },
  cardContainer: {
    position: 'relative',
  },
});
