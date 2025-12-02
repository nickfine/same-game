import React, { useCallback } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '../hooks/useAuth';
import { useCreateQuestion } from '../hooks/useCreateQuestion';
import { CreateQuestionModal } from '../components/CreateQuestionModal';
import type { CreateQuestionInput } from '../types';

export default function CreateQuestionScreen() {
  const { user, uid } = useAuth();
  const { create, loading, error, reset } = useCreateQuestion();

  const handleClose = useCallback(() => {
    reset();
    router.back();
  }, [reset]);

  const handleSubmit = useCallback(async (input: CreateQuestionInput) => {
    if (!uid) return;

    const result = await create(uid, input);
    
    if (result) {
      // Success - close modal
      Alert.alert(
        'Question Posted!', 
        'Your question is now live.',
        [{ text: 'OK', onPress: handleClose }]
      );
    } else if (error) {
      // Error is already set in state, show alert
      Alert.alert('Error', error);
    }
  }, [uid, create, error, handleClose]);

  return (
    <View className="flex-1">
      <CreateQuestionModal
        visible={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        userScore={user?.score ?? 0}
        loading={loading}
      />
    </View>
  );
}

