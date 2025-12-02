import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Sound types available in the app
export type SoundType = 'win' | 'lose' | 'tap' | 'achievement' | 'create';

// Web Audio context for web platform
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (Platform.OS === 'web') {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
  }
  return null;
}

// Generate a simple tone using Web Audio API
function playWebTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

// Play a chord (multiple frequencies)
function playWebChord(
  frequencies: number[],
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.2
) {
  frequencies.forEach((freq, i) => {
    setTimeout(() => playWebTone(freq, duration, type, volume), i * 30);
  });
}

// Win sound - triumphant ascending arpeggio
function playWinSound() {
  if (Platform.OS === 'web') {
    // C major arpeggio going up - happy sound
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playWebTone(freq, 0.15, 'sine', 0.25), i * 60);
    });
    // Final chord
    setTimeout(() => {
      playWebChord([523.25, 659.25, 783.99], 0.4, 'sine', 0.15);
    }, 280);
  }
}

// Lose sound - descending tone
function playLoseSound() {
  if (Platform.OS === 'web') {
    // Descending minor sound
    const notes = [392, 349.23, 293.66]; // G4, F4, D4
    notes.forEach((freq, i) => {
      setTimeout(() => playWebTone(freq, 0.2, 'triangle', 0.2), i * 100);
    });
  }
}

// Tap sound - quick click
function playTapSound() {
  if (Platform.OS === 'web') {
    playWebTone(800, 0.05, 'square', 0.1);
  }
}

// Achievement sound - fanfare
function playAchievementSound() {
  if (Platform.OS === 'web') {
    // Fanfare! Rising major chord
    const sequence = [
      { freq: 523.25, delay: 0 },     // C5
      { freq: 659.25, delay: 100 },   // E5
      { freq: 783.99, delay: 200 },   // G5
      { freq: 1046.50, delay: 300 },  // C6
    ];
    sequence.forEach(({ freq, delay }) => {
      setTimeout(() => playWebTone(freq, 0.3, 'sine', 0.2), delay);
    });
    // Final triumphant chord
    setTimeout(() => {
      playWebChord([523.25, 659.25, 783.99, 1046.50], 0.6, 'sine', 0.15);
    }, 450);
  }
}

// Create question sound - confirmation chime
function playCreateSound() {
  if (Platform.OS === 'web') {
    playWebChord([659.25, 783.99], 0.3, 'sine', 0.2); // E5, G5 - nice 2-note chime
  }
}

// Main play function
export async function playSound(type: SoundType): Promise<void> {
  try {
    switch (type) {
      case 'win':
        playWinSound();
        break;
      case 'lose':
        playLoseSound();
        break;
      case 'tap':
        playTapSound();
        break;
      case 'achievement':
        playAchievementSound();
        break;
      case 'create':
        playCreateSound();
        break;
    }
  } catch (error) {
    console.warn('Sound playback failed:', error);
  }
}

// Initialize audio for native platforms
export async function initializeAudio(): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }
}

