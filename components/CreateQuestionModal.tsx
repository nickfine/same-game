import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { QUESTION_CREATION_COST } from '../lib/constants';
import type { VoteChoice, CreateQuestionInput } from '../types';

interface CreateQuestionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: CreateQuestionInput) => Promise<void>;
  userScore: number;
  loading?: boolean;
}

const MAX_OPTION_LENGTH = 12;
const MAX_CONTEXT_LENGTH = 30;

// Popular emoji suggestions for quick selection
const EMOJI_SUGGESTIONS = [
  '🔥', '💀', '😂', '🤔', '💯', '⚡', '✨', '🎯',
  '🌅', '🌙', '☕', '🍵', '🍕', '🌮', '🎮', '📱',
  '💰', '⏰', '❤️', '🧠', '👑', '🎉', '😴', '💪',
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CreateQuestionModal({ 
  visible, 
  onClose, 
  onSubmit, 
  userScore,
  loading 
}: CreateQuestionModalProps) {
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [emojiA, setEmojiA] = useState('');
  const [emojiB, setEmojiB] = useState('');
  const [spicyContext, setSpicyContext] = useState('');
  const [selectedVote, setSelectedVote] = useState<VoteChoice | null>(null);
  const [selectingEmojiFor, setSelectingEmojiFor] = useState<'a' | 'b' | null>(null);

  const scaleA = useSharedValue(1);
  const scaleB = useSharedValue(1);

  const canAfford = userScore >= QUESTION_CREATION_COST;
  const isValid = optionA.trim().length > 0 && 
                  optionB.trim().length > 0 && 
                  emojiA.length > 0 &&
                  emojiB.length > 0 &&
                  selectedVote !== null;

  const handleSelectVote = (choice: VoteChoice) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVote(choice);
  };

  const handleSelectEmoji = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectingEmojiFor === 'a') {
      setEmojiA(emoji);
    } else if (selectingEmojiFor === 'b') {
      setEmojiB(emoji);
    }
    setSelectingEmojiFor(null);
  };

  const handleSubmit = async () => {
    if (!canAfford) {
      Alert.alert('Not Enough Points', `You need ${QUESTION_CREATION_COST} points to ask a question.`);
      return;
    }

    if (!isValid) {
      Alert.alert('Incomplete', 'Please fill in all fields (options + emojis) and select your vote.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await onSubmit({
      optionA: optionA.trim().toUpperCase(),
      emojiA: emojiA,
      optionB: optionB.trim().toUpperCase(),
      emojiB: emojiB,
      spicyContext: spicyContext.trim() || undefined,
      initial_vote: selectedVote!,
    });

    // Reset form
    setOptionA('');
    setOptionB('');
    setEmojiA('');
    setEmojiB('');
    setSpicyContext('');
    setSelectedVote(null);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const animatedStyleA = useAnimatedStyle(() => ({
    transform: [{ scale: scaleA.value }],
    borderWidth: selectedVote === 'a' ? 3 : 0,
    borderColor: '#fff',
  }));

  const animatedStyleB = useAnimatedStyle(() => ({
    transform: [{ scale: scaleB.value }],
    borderWidth: selectedVote === 'b' ? 3 : 0,
    borderColor: '#fff',
  }));

  if (!visible) return null;

  return (
    <Animated.View 
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="absolute inset-0 bg-black/50 justify-end"
    >
      <Pressable className="flex-1" onPress={handleClose} />
      
      <Animated.View
        entering={SlideInDown.springify().damping(20)}
        exiting={SlideOutDown.duration(200)}
        className="bg-white rounded-t-3xl"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            className="p-6"
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text 
                className="text-2xl text-text"
                style={{ fontFamily: 'Righteous_400Regular' }}
              >
                Create Question
              </Text>
              <Pressable onPress={handleClose}>
                <Text className="text-3xl text-gray-400">×</Text>
              </Pressable>
            </View>

            {/* Cost indicator */}
            <View className={`p-3 rounded-xl mb-6 ${canAfford ? 'bg-success/10' : 'bg-fail/10'}`}>
              <Text 
                className={`text-center ${canAfford ? 'text-success' : 'text-fail'}`}
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Cost: {QUESTION_CREATION_COST} points • You have: {userScore} points
              </Text>
            </View>

            {/* Option A */}
            <View className="mb-4">
              <Text 
                className="text-sm text-gray-500 mb-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Option 1 ({optionA.length}/{MAX_OPTION_LENGTH})
              </Text>
              <View className="flex-row gap-2">
                <Pressable 
                  onPress={() => setSelectingEmojiFor('a')}
                  className="w-14 h-14 bg-gray-100 rounded-xl items-center justify-center"
                >
                  <Text className="text-3xl">{emojiA || '➕'}</Text>
                </Pressable>
                <TextInput
                  className="flex-1 bg-gray-100 rounded-xl p-4 text-lg text-text"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                  placeholder="MORNING"
                  placeholderTextColor="#9ca3af"
                  value={optionA}
                  onChangeText={(text) => setOptionA(text.slice(0, MAX_OPTION_LENGTH).toUpperCase())}
                  maxLength={MAX_OPTION_LENGTH}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Option B */}
            <View className="mb-4">
              <Text 
                className="text-sm text-gray-500 mb-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Option 2 ({optionB.length}/{MAX_OPTION_LENGTH})
              </Text>
              <View className="flex-row gap-2">
                <Pressable 
                  onPress={() => setSelectingEmojiFor('b')}
                  className="w-14 h-14 bg-gray-100 rounded-xl items-center justify-center"
                >
                  <Text className="text-3xl">{emojiB || '➕'}</Text>
                </Pressable>
                <TextInput
                  className="flex-1 bg-gray-100 rounded-xl p-4 text-lg text-text"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                  placeholder="NIGHT"
                  placeholderTextColor="#9ca3af"
                  value={optionB}
                  onChangeText={(text) => setOptionB(text.slice(0, MAX_OPTION_LENGTH).toUpperCase())}
                  maxLength={MAX_OPTION_LENGTH}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Spicy Context (optional) */}
            <View className="mb-4">
              <Text 
                className="text-sm text-gray-500 mb-2"
                style={{ fontFamily: 'Poppins_700Bold' }}
              >
                Context for sharing (optional)
              </Text>
              <TextInput
                className="bg-gray-100 rounded-xl p-4 text-base text-text"
                style={{ fontFamily: 'Poppins_500Medium' }}
                placeholder="e.g. shower thoughts, dating life..."
                placeholderTextColor="#9ca3af"
                value={spicyContext}
                onChangeText={(text) => setSpicyContext(text.slice(0, MAX_CONTEXT_LENGTH))}
                maxLength={MAX_CONTEXT_LENGTH}
              />
            </View>

            {/* Vote Selection */}
            <Text 
              className="text-sm text-gray-500 mb-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Cast your vote (required)
            </Text>
            <View className="flex-row gap-3 mb-6">
              <AnimatedPressable
                style={animatedStyleA}
                onPress={() => handleSelectVote('a')}
                className={`flex-1 p-4 rounded-xl flex-row items-center justify-center gap-2 ${selectedVote === 'a' ? 'bg-[#6366F1]' : 'bg-[#6366F1]/20'}`}
              >
                <Text className="text-2xl">{emojiA || '❓'}</Text>
                <Text 
                  className={`text-lg ${selectedVote === 'a' ? 'text-white' : 'text-[#6366F1]'}`}
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  {optionA || 'Option 1'}
                </Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={animatedStyleB}
                onPress={() => handleSelectVote('b')}
                className={`flex-1 p-4 rounded-xl flex-row items-center justify-center gap-2 ${selectedVote === 'b' ? 'bg-[#F59E0B]' : 'bg-[#F59E0B]/20'}`}
              >
                <Text className="text-2xl">{emojiB || '❓'}</Text>
                <Text 
                  className={`text-lg ${selectedVote === 'b' ? 'text-white' : 'text-[#F59E0B]'}`}
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  {optionB || 'Option 2'}
                </Text>
              </AnimatedPressable>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={!canAfford || !isValid || loading}
              className={`p-4 rounded-xl mb-4 ${
                canAfford && isValid && !loading 
                  ? 'bg-text' 
                  : 'bg-gray-300'
              }`}
            >
              <Text 
                className="text-white text-center text-xl"
                style={{ fontFamily: 'Righteous_400Regular' }}
              >
                {loading ? 'Posting...' : `Post & Vote (-${QUESTION_CREATION_COST}pts)`}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Emoji Picker Modal */}
      <Modal
        visible={selectingEmojiFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectingEmojiFor(null)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setSelectingEmojiFor(null)}
        >
          <View className="bg-white rounded-2xl p-6 mx-6 max-w-sm">
            <Text 
              className="text-xl text-center mb-4 text-text"
              style={{ fontFamily: 'Righteous_400Regular' }}
            >
              Pick an Emoji
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {EMOJI_SUGGESTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleSelectEmoji(emoji)}
                  className="w-12 h-12 items-center justify-center bg-gray-100 rounded-xl"
                >
                  <Text className="text-2xl">{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-center text-gray-400 mt-4 text-sm">
              Or type your own emoji in the field
            </Text>
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}
