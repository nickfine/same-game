import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Sound types available in the app
export type SoundType = 'win' | 'lose' | 'tap' | 'achievement' | 'create' | 'sadTrombone' | 'revive' | 'heartbeat';

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

// Sad trombone - the classic "wah wah waaaah" for streak death
function playSadTromboneSound() {
  if (Platform.OS === 'web') {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Create multiple oscillators for richer sound
    const playNote = (freq: number, delay: number, duration: number, type: OscillatorType = 'sawtooth') => {
      setTimeout(() => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Trombone-like wobble
        oscillator.frequency.linearRampToValueAtTime(freq * 0.95, ctx.currentTime + duration * 0.5);
        
        // Low-pass filter for muffled trombone sound
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        
        // Envelope with reverb tail
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      }, delay);
    };

    // Classic "wah wah wah waaaaah" descending pattern
    playNote(349.23, 0, 0.3);      // F4
    playNote(329.63, 300, 0.3);    // E4  
    playNote(311.13, 600, 0.3);    // Eb4
    playNote(261.63, 900, 0.8);    // C4 - long final note with decay
  }
}

// Revival/resurrection sound - triumphant phoenix rising
function playReviveSoundEffect() {
  if (Platform.OS === 'web') {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Ascending power chord sequence
    const playChord = (frequencies: number[], delay: number, duration: number) => {
      setTimeout(() => {
        frequencies.forEach((freq, i) => {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
          
          // Shimmer effect - slight pitch rise
          oscillator.frequency.linearRampToValueAtTime(freq * 1.02, ctx.currentTime + duration);
          
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
          gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + duration * 0.7);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
          
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + duration);
        });
      }, delay);
    };

    // Rising phoenix sequence
    playChord([261.63, 329.63, 392], 0, 0.2);           // C chord
    playChord([293.66, 369.99, 440], 150, 0.2);         // D chord  
    playChord([329.63, 415.30, 493.88], 300, 0.2);      // E chord
    playChord([392, 493.88, 587.33], 450, 0.3);         // G chord
    
    // Final triumphant chord with shimmer
    setTimeout(() => {
      const finalFreqs = [523.25, 659.25, 783.99, 1046.50]; // C major spread
      finalFreqs.forEach((freq, i) => {
        setTimeout(() => playWebTone(freq, 0.6, 'sine', 0.2), i * 30);
      });
    }, 650);
    
    // Extra sparkle
    setTimeout(() => {
      playWebTone(1318.51, 0.4, 'sine', 0.1); // High E
      playWebTone(1567.98, 0.3, 'sine', 0.08); // High G
    }, 800);
  }
}

// Heartbeat sound for countdown - dramatic thump thump
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

function playHeartbeatSound() {
  if (Platform.OS === 'web') {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Create a deep thump sound
    const playThump = (delay: number, volume: number) => {
      setTimeout(() => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        // Start at low frequency and drop lower
        oscillator.frequency.setValueAtTime(80, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
        
        // Low-pass filter for muffled heartbeat
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, ctx.currentTime);
        
        // Quick attack, medium decay
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.25);
      }, delay);
    };

    // Classic "lub-dub" heartbeat pattern
    playThump(0, 0.4);      // LUB
    playThump(120, 0.3);    // DUB (slightly softer)
  }
}

// Start continuous heartbeat (call this to begin)
export function startHeartbeat(): void {
  stopHeartbeat(); // Clear any existing
  playHeartbeatSound();
  heartbeatInterval = setInterval(() => {
    playHeartbeatSound();
  }, 800); // ~75 BPM - anxious heartbeat
}

// Stop heartbeat
export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Exported wrappers for streak death sounds
export function playSadTrombone(): void {
  try {
    playSadTromboneSound();
  } catch (error) {
    console.warn('Sad trombone playback failed:', error);
  }
}

export function playReviveSound(): void {
  try {
    playReviveSoundEffect();
  } catch (error) {
    console.warn('Revive sound playback failed:', error);
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
      case 'sadTrombone':
        playSadTromboneSound();
        break;
      case 'revive':
        playReviveSoundEffect();
        break;
      case 'heartbeat':
        playHeartbeatSound();
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

