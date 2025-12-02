import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playSound as playSoundLib, initializeAudio, SoundType } from '../lib/sounds';

const SOUND_ENABLED_KEY = '@same_sound_enabled';

// Create a singleton for global access (for components that don't use the hook)
let globalSoundEnabled = true;

export function setGlobalSoundEnabled(enabled: boolean) {
  globalSoundEnabled = enabled;
}

export function playSoundGlobal(type: SoundType) {
  if (globalSoundEnabled) {
    playSoundLib(type);
  }
}

// Initialize sound settings from storage (call this on app startup)
export async function initializeSoundSettings(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
    if (stored !== null) {
      globalSoundEnabled = stored === 'true';
    }
    await initializeAudio();
  } catch (error) {
    console.warn('Failed to initialize sound settings:', error);
  }
}

interface UseSoundReturn {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => Promise<void>;
  playSound: (type: SoundType) => void;
  isLoaded: boolean;
}

export function useSound(): UseSoundReturn {
  const [soundEnabled, setSoundEnabledState] = useState(globalSoundEnabled);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preference on mount
  useEffect(() => {
    async function loadPreference() {
      try {
        const stored = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
        if (stored !== null) {
          const enabled = stored === 'true';
          setSoundEnabledState(enabled);
          globalSoundEnabled = enabled;
        }
        await initializeAudio();
      } catch (error) {
        console.warn('Failed to load sound preference:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadPreference();
  }, []);

  // Save and update preference
  const setSoundEnabled = useCallback(async (enabled: boolean) => {
    setSoundEnabledState(enabled);
    globalSoundEnabled = enabled;
    try {
      await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    } catch (error) {
      console.warn('Failed to save sound preference:', error);
    }
  }, []);

  // Play sound if enabled
  const playSound = useCallback((type: SoundType) => {
    if (soundEnabled) {
      playSoundLib(type);
    }
  }, [soundEnabled]);

  return {
    soundEnabled,
    setSoundEnabled,
    playSound,
    isLoaded,
  };
}

