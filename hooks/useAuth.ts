import { useEffect, useState, useCallback } from 'react';
import { signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getOrCreateUser, subscribeToUser } from '../lib/firestore';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get or create user document
          const user = await getOrCreateUser(firebaseUser.uid);
          setState(prev => ({ ...prev, firebaseUser, user, loading: false, error: null }));
          
          // Subscribe to real-time user updates
          unsubscribeUser = subscribeToUser(firebaseUser.uid, (updatedUser) => {
            if (updatedUser) {
              setState(prev => ({ ...prev, user: updatedUser }));
            }
          });
        } catch (err) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: err instanceof Error ? err.message : 'Failed to load user' 
          }));
        }
      } else {
        // No user, attempt anonymous sign in
        try {
          await signInAnonymously(auth);
        } catch (err) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: err instanceof Error ? err.message : 'Failed to sign in' 
          }));
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  const refreshUser = useCallback(async () => {
    if (state.firebaseUser) {
      try {
        const user = await getOrCreateUser(state.firebaseUser.uid);
        setState(prev => ({ ...prev, user }));
      } catch (err) {
        console.error('Failed to refresh user:', err);
      }
    }
  }, [state.firebaseUser]);

  return {
    ...state,
    refreshUser,
    uid: state.firebaseUser?.uid ?? null,
  };
}

