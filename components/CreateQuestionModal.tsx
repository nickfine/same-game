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

const MAX_QUESTION_LENGTH = 80;
const MAX_OPTION_LENGTH = 15;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CreateQuestionModal({ 
  visible, 
  onClose, 
  onSubmit, 
  userScore,
  loading 
}: CreateQuestionModalProps) {
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [selectedVote, setSelectedVote] = useState<VoteChoice | null>(null);

  const scaleA = useSharedValue(1);
  const scaleB = useSharedValue(1);

  const canAfford = userScore >= QUESTION_CREATION_COST;
  const isValid = question.trim().length > 0 && 
                  optionA.trim().length > 0 && 
                  optionB.trim().length > 0 && 
                  selectedVote !== null;

  const handleSelectVote = (choice: VoteChoice) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVote(choice);
  };

  const handleSubmit = async () => {
    if (!canAfford) {
      Alert.alert('Not Enough Points', `You need ${QUESTION_CREATION_COST} points to ask a question.`);
      return;
    }

    if (!isValid) {
      Alert.alert('Incomplete', 'Please fill in all fields and select your vote.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await onSubmit({
      text: question.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      initial_vote: selectedVote!,
    });

    // Reset form
    setQuestion('');
    setOptionA('');
    setOptionB('');
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
                Ask a Question
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

            {/* Question Input */}
            <Text 
              className="text-sm text-gray-500 mb-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              What are you asking? ({question.length}/{MAX_QUESTION_LENGTH})
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 text-lg text-text mb-4"
              style={{ fontFamily: 'Poppins_700Bold' }}
              placeholder="Is a hotdog a sandwich?"
              placeholderTextColor="#9ca3af"
              value={question}
              onChangeText={(text) => setQuestion(text.slice(0, MAX_QUESTION_LENGTH))}
              multiline
              maxLength={MAX_QUESTION_LENGTH}
            />

            {/* Options */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text 
                  className="text-sm text-gray-500 mb-2"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  Option 1 ({optionA.length}/{MAX_OPTION_LENGTH})
                </Text>
                <TextInput
                  className="bg-gray-100 rounded-xl p-4 text-lg text-text"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                  placeholder="Yes"
                  placeholderTextColor="#9ca3af"
                  value={optionA}
                  onChangeText={(text) => setOptionA(text.slice(0, MAX_OPTION_LENGTH))}
                  maxLength={MAX_OPTION_LENGTH}
                />
              </View>
              <View className="flex-1">
                <Text 
                  className="text-sm text-gray-500 mb-2"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  Option 2 ({optionB.length}/{MAX_OPTION_LENGTH})
                </Text>
                <TextInput
                  className="bg-gray-100 rounded-xl p-4 text-lg text-text"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                  placeholder="No"
                  placeholderTextColor="#9ca3af"
                  value={optionB}
                  onChangeText={(text) => setOptionB(text.slice(0, MAX_OPTION_LENGTH))}
                  maxLength={MAX_OPTION_LENGTH}
                />
              </View>
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
                className={`flex-1 p-4 rounded-xl ${selectedVote === 'a' ? 'bg-[#6366F1]' : 'bg-[#6366F1]/20'}`}
              >
                <Text 
                  className={`text-center text-lg ${selectedVote === 'a' ? 'text-white' : 'text-[#6366F1]'}`}
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  {optionA || 'Option 1'}
                </Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={animatedStyleB}
                onPress={() => handleSelectVote('b')}
                className={`flex-1 p-4 rounded-xl ${selectedVote === 'b' ? 'bg-[#F59E0B]' : 'bg-[#F59E0B]/20'}`}
              >
                <Text 
                  className={`text-center text-lg ${selectedVote === 'b' ? 'text-white' : 'text-[#F59E0B]'}`}
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
    </Animated.View>
  );
}

