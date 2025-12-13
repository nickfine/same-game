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
import { useHyperstreak } from '../../hooks/useHyperstreak';
import { AppHeader } from '../../components/AppHeader';
import { UserMenu } from '../../components/UserMenu';
import { VoteButtons } from '../../components/VoteButtons';
import { AnswerMorphReveal, AnswerMorphRevealRef } from '../../components/AnswerMorphReveal';
import { AchievementToast } from '../../components/AchievementToast';
import { MysteryChest } from '../../components/MysteryChest';
import { DailySpinWheel } from '../../components/DailySpinWheel';
import { StreakStrip } from '../../components/StreakStrip';
import { StreakDeathAnimation } from '../../components/StreakDeathAnimation';
import { PowerUpBar } from '../../components/PowerUpBar';
import { LevelUpModal } from '../../components/LevelUpModal';
import { ConfettiCannon } from '../../components/ConfettiCannon';
import { ScreenFlash } from '../../components/ScreenFlash';
import { HyperstreakActivation } from '../../components/HyperstreakActivation';
import { HyperstreakCrash } from '../../components/HyperstreakCrash';
import { calculateLevel } from '../../lib/levels';
import { HYPER } from '../../lib/hyperstreakLogic';
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
  
  // Hyperstreak management (2x dopamine mode)
  const {
    hyperBar,
    inHyperstreak,
    progress: hyperProgress,
    shouldPulse: shouldPulseHyper,
    questionsRemaining: hyperQuestionsRemaining,
    multiplier: hyperMultiplier,
    showActivation: showHyperActivation,
    showCrash: showHyperCrash,
    incrementHyperBar,
    tickHyperQuestion,
    crashHyperstreak,
    dismissActivation: dismissHyperActivation,
    dismissCrash: dismissHyperCrash,
  } = useHyperstreak(user);

  // Dopamine features (pass hyperstreak state for freeze bonus)
  const {
    canSpin,
    showChest,
    showSpin,
    powerUps,
    activeMultiplier,
    doubleDownActive,
    peekActive,
    streakFreezeCapacity,
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
  } = useDopamineFeatures(inHyperstreak);

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
  
  // ═══════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════
  const [showingResult, setShowingResult] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [userChoice, setUserChoice] = useState<'a' | 'b' | null>(null);
  const [pendingChestReward, setPendingChestReward] = useState<Reward | null>(null);

  // Visual feedback states
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [flashVariant, setFlashVariant] = useState<'correct' | 'wrong'>('correct');
  
  // Track pending streak death to show after result animation
  // Using ref instead of state to avoid closure issues with the morph callback
  const pendingStreakDeathRef = useRef<number | null>(null);

  // Morph Reveal ref (imperative API)
  const morphRevealRef = useRef<AnswerMorphRevealRef>(null);

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

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════

  // Handle achievement toast dismissal
  const handleAchievementDismiss = useCallback(() => {
    if (currentAchievementIndex < newlyUnlocked.length - 1) {
      setCurrentAchievementIndex(prev => prev + 1);
    } else {
      clearNewlyUnlocked();
      setCurrentAchievementIndex(0);
    }
  }, [currentAchievementIndex, newlyUnlocked.length, clearNewlyUnlocked]);

  // ═══════════════════════════════════════════════════════════════
  // VOTE HANDLER - Triggers the dopamine bomb
  // ═══════════════════════════════════════════════════════════════
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
    
    if (result) {
      // ═══════════════════════════════════════════════════════════
      // TRIGGER THE MORPH REVEAL (The Dopamine Bomb)
      // ═══════════════════════════════════════════════════════════
      morphRevealRef.current?.reveal(result, choice, {
        inHyperstreak,
        doubleDownActive,
      });
      
      // Visual feedback (screen flash)
      setFlashVariant(result.won ? 'correct' : 'wrong');
      setShowFlash(true);
      
      if (result.won) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Hyperstreak logic
        if (inHyperstreak) {
          tickHyperQuestion();
        } else {
          incrementHyperBar();
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        crashHyperstreak();
      }
      
      // Check for streak death (loss aversion trigger)
      const lostStreak = !result.won && result.previousStreak > 0;
      if (lostStreak) {
        pendingStreakDeathRef.current = result.previousStreak;
      }
      
      // Check for mystery chest after vote
      if (user) {
        onVoteComplete(user.votes_cast + 1, result.won, {
          lostStreak: lostStreak ?? false,
        });
      }
      
      // Clear active power-up effects
      clearActiveEffects();
      setPeekData(null);
    }
  }, [uid, currentQuestion, vote, voteLoading, showingResult, canVote, showDailyVoteLimitModal, voteError, user, onVoteComplete, inHyperstreak, doubleDownActive, clearActiveEffects, incrementHyperBar, tickHyperQuestion, crashHyperstreak]);

  // ═══════════════════════════════════════════════════════════════
  // MORPH COMPLETE - Called when reveal animation finishes
  // ═══════════════════════════════════════════════════════════════
  const handleMorphComplete = useCallback(() => {
    const pendingStreakDeath = pendingStreakDeathRef.current;
    setShowingResult(false);
    setUserChoice(null);
    setShowFlash(false);
    resetVote();

    // Check if we have a pending streak death to show
    if (pendingStreakDeath !== null) {
      handleStreakDeath(pendingStreakDeath);
      pendingStreakDeathRef.current = null;
      return;
    }

    // Don't advance to next question if chest is about to show
    if (!showChest) {
      nextQuestion();
    }
  }, [resetVote, nextQuestion, showChest, handleStreakDeath]);
  
  // Handle hyperstreak activation complete
  const handleHyperActivationComplete = useCallback(() => {
    dismissHyperActivation();
  }, [dismissHyperActivation]);
  
  // Handle hyperstreak crash complete
  const handleHyperCrashComplete = useCallback(() => {
    dismissHyperCrash();
  }, [dismissHyperCrash]);

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
      useStreakFreezeItem();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      nextQuestion();
    }
  }, [useStreakFreeze, useStreakFreezeItem, nextQuestion]);

  // Handle reviving with ad
  const handleReviveWithAd = useCallback(async () => {
    const success = await reviveWithAd();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      nextQuestion();
    }
  }, [reviveWithAd, nextQuestion]);

  // Handle reviving with share
  const handleReviveWithShare = useCallback(async () => {
    const success = await reviveWithShare();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      nextQuestion();
    }
  }, [reviveWithShare, nextQuestion]);

  // Handle accepting streak death
  const handleAcceptStreakDeath = useCallback(async () => {
    await acceptStreakDeath();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    nextQuestion();
  }, [acceptStreakDeath, nextQuestion]);
  
  // Handle closing death modal
  const handleCloseDeathModal = useCallback(() => {
    closeDeathModal();
    nextQuestion();
  }, [closeDeathModal, nextQuestion]);

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

  // ═══════════════════════════════════════════════════════════════
  // RENDER STATES
  // ═══════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER - Buttons-Only Layout
  // ═══════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={GRADIENTS.background}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* ═══════════════════════════════════════════════════════════
            TOP 15% - AppHeader + StreakStrip
        ═══════════════════════════════════════════════════════════ */}
        <View style={styles.headerSection}>
          <AppHeader
            level={user?.level ?? calculateLevel(user?.xp ?? 0)}
            rank={userRank}
            canSpin={canSpin}
            onMenuPress={handleMenuOpen}
            onLevelPress={handleLevelPress}
            onSpinPress={openDailySpin}
          />

          {/* Streak Strip with Hyperstreak Integration */}
          <StreakStrip
            currentStreak={user?.current_streak ?? 0}
            bestStreak={user?.best_streak ?? 0}
            hyperProgress={hyperProgress}
            inHyperstreak={inHyperstreak}
            shouldPulseHyper={shouldPulseHyper}
            questionsRemaining={hyperQuestionsRemaining}
          />
        </View>

        {/* Active Multiplier Indicator */}
        {(activeMultiplier > 1 || inHyperstreak) && (
          <View style={[
            styles.multiplierBadge,
            inHyperstreak && styles.hyperMultiplierBadge,
          ]}>
            <Text style={[
              styles.multiplierText,
              inHyperstreak && styles.hyperMultiplierText,
            ]}>
              {inHyperstreak ? '⚡ HYPER 2x' : `🚀 ${activeMultiplier}x`}
            </Text>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════
            75% - Hero Vote Buttons (No teaser text - emoji-first UI)
        ═══════════════════════════════════════════════════════════ */}
        {currentQuestion && (
          <View style={styles.heroButtonsSection}>
            <VoteButtons
              optionA={currentQuestion.optionA}
              optionB={currentQuestion.optionB}
              emojiA={currentQuestion.emojiA}
              emojiB={currentQuestion.emojiB}
              onVote={handleVote}
              disabled={voteLoading || showingResult}
              hidden={showingResult}
              inHyperstreak={inHyperstreak}
              peekData={peekData}
              doubleDownActive={doubleDownActive}
            />
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════
            BOTTOM 10% - Compact PowerUpBar
        ═══════════════════════════════════════════════════════════ */}
        {currentQuestion && (
          <View style={styles.powerUpSection}>
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
              compact={true}
            />
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════
            ANSWER MORPH REVEAL - The Dopamine Bomb (Absolute positioned)
        ═══════════════════════════════════════════════════════════ */}
        <AnswerMorphReveal
          ref={morphRevealRef}
          optionA={currentQuestion?.optionA ?? ''}
          optionB={currentQuestion?.optionB ?? ''}
          onComplete={handleMorphComplete}
        />

        {/* ═══════════════════════════════════════════════════════════
            MODALS & OVERLAYS
        ═══════════════════════════════════════════════════════════ */}
        
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

        {/* Epic Streak Death Animation */}
        <StreakDeathAnimation
          visible={showDeathModal}
          deadStreak={deadStreak}
          hasStreakFreeze={hasStreakFreeze}
          onUseFreeze={handleUseStreakFreeze}
          onWatchAd={handleReviveWithAd}
          onShareRevive={handleReviveWithShare}
          onAcceptDeath={handleAcceptStreakDeath}
          onClose={handleCloseDeathModal}
        />

        {/* Level Up Celebration Modal */}
        <LevelUpModal
          visible={showLevelUpModal}
          newLevel={newLevelToShow}
          onClose={handleLevelUpClose}
        />
        
        {/* Hyperstreak Activation Animation */}
        <HyperstreakActivation
          visible={showHyperActivation}
          onComplete={handleHyperActivationComplete}
        />
        
        {/* Hyperstreak Crash Animation */}
        <HyperstreakCrash
          visible={showHyperCrash}
          onComplete={handleHyperCrashComplete}
          chainToStreakDeath={showDeathModal}
        />
      </SafeAreaView>

      {/* Visual Feedback Overlays */}
      <ScreenFlash 
        visible={showFlash} 
        variant={flashVariant}
        onComplete={() => setShowFlash(false)}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES - Buttons-Only Layout
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
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
  
  // ═══════════════════════════════════════════════════════════════
  // LAYOUT SECTIONS
  // ═══════════════════════════════════════════════════════════════
  headerSection: {
    // ~15% of screen
  },
  heroButtonsSection: {
    flex: 0.75, // Reduce buttons to 75% of available space
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 12,
  },
  powerUpSection: {
    // ~10% of screen (56px fixed)
  },
  
  // Multiplier badge
  multiplierBadge: {
    position: 'absolute',
    top: 140,
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
  hyperMultiplierBadge: {
    backgroundColor: HYPER.COLOR_ACTIVE,
    borderWidth: 2,
    borderColor: '#6EE7B7',
    shadowColor: HYPER.COLOR_ACTIVE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  hyperMultiplierText: {
    color: '#000',
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 1,
  },
});
