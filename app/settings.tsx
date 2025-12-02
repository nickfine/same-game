import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Switch, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSound } from '../hooks/useSound';
import { setGlobalSoundEnabled, playSoundGlobal } from '../hooks/useSound';

interface SettingRowProps {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  delay?: number;
}

function SettingRow({ icon, label, sublabel, onPress, rightElement, delay = 0 }: SettingRowProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 20,
          backgroundColor: pressed && onPress ? '#f4f4f5' : '#ffffff',
        })}
      >
        <Text style={{ fontSize: 24, marginRight: 16 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text 
            style={{ 
              fontFamily: 'Poppins_700Bold',
              fontSize: 16,
              color: '#18181b',
            }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text 
              style={{ 
                fontFamily: 'Poppins_400Regular',
                fontSize: 13,
                color: '#71717a',
                marginTop: 2,
              }}
            >
              {sublabel}
            </Text>
          )}
        </View>
        {rightElement}
        {onPress && !rightElement && (
          <Text style={{ fontSize: 20, color: '#a1a1aa' }}>›</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const HAPTICS_ENABLED_KEY = '@same_haptics_enabled';

export default function SettingsScreen() {
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const { soundEnabled, setSoundEnabled } = useSound();

  // Load haptics preference on mount
  useEffect(() => {
    async function loadHapticsPreference() {
      try {
        const stored = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
        if (stored !== null) {
          setHapticsEnabled(stored === 'true');
        }
      } catch (error) {
        console.warn('Failed to load haptics preference:', error);
      }
    }
    loadHapticsPreference();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleHapticsToggle = async (value: boolean) => {
    setHapticsEnabled(value);
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, String(value));
    } catch (error) {
      console.warn('Failed to save haptics preference:', error);
    }
  };

  const handleSoundToggle = async (value: boolean) => {
    await setSoundEnabled(value);
    setGlobalSoundEnabled(value);
    if (value) {
      // Play a test sound when enabling
      playSoundGlobal('tap');
    }
  };

  const handleResetAccount = () => {
    Alert.alert(
      'Reset Account',
      'This will reset all your progress. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming Soon', 'Account reset is not yet available.');
          }
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy coming soon.');
  };

  const handleTerms = () => {
    Alert.alert('Terms of Service', 'Terms of service coming soon.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f5' }}>
      {/* Header */}
      <View 
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Pressable 
          onPress={handleBack}
          style={{
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 28 }}>←</Text>
        </Pressable>
        <Text 
          style={{ 
            flex: 1,
            fontFamily: 'Righteous_400Regular',
            fontSize: 24,
            color: '#18181b',
            textAlign: 'center',
            marginRight: 44,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Preferences */}
        <View style={{ marginTop: 8 }}>
          <Text 
            style={{ 
              fontFamily: 'Poppins_700Bold',
              fontSize: 13,
              color: '#71717a',
              paddingHorizontal: 20,
              paddingVertical: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Preferences
          </Text>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 20, overflow: 'hidden' }}>
            <SettingRow
              icon="🔊"
              label="Sound Effects"
              sublabel="Audio feedback on actions"
              delay={0}
              rightElement={
                <Switch
                  value={soundEnabled}
                  onValueChange={handleSoundToggle}
                  trackColor={{ false: '#e4e4e7', true: '#6366F1' }}
                  thumbColor="#ffffff"
                />
              }
            />
            <View style={{ height: 1, backgroundColor: '#f4f4f5', marginLeft: 60 }} />
            <SettingRow
              icon="📳"
              label="Haptic Feedback"
              sublabel="Vibration on interactions"
              delay={50}
              rightElement={
                <Switch
                  value={hapticsEnabled}
                  onValueChange={handleHapticsToggle}
                  trackColor={{ false: '#e4e4e7', true: '#6366F1' }}
                  thumbColor="#ffffff"
                />
              }
            />
          </View>
        </View>

        {/* Legal */}
        <View style={{ marginTop: 24 }}>
          <Text 
            style={{ 
              fontFamily: 'Poppins_700Bold',
              fontSize: 13,
              color: '#71717a',
              paddingHorizontal: 20,
              paddingVertical: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Legal
          </Text>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 20, overflow: 'hidden' }}>
            <SettingRow
              icon="🔒"
              label="Privacy Policy"
              onPress={handlePrivacyPolicy}
              delay={100}
            />
            <View style={{ height: 1, backgroundColor: '#f4f4f5', marginLeft: 60 }} />
            <SettingRow
              icon="📄"
              label="Terms of Service"
              onPress={handleTerms}
              delay={150}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={{ marginTop: 24 }}>
          <Text 
            style={{ 
              fontFamily: 'Poppins_700Bold',
              fontSize: 13,
              color: '#71717a',
              paddingHorizontal: 20,
              paddingVertical: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Danger Zone
          </Text>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 20, overflow: 'hidden' }}>
            <SettingRow
              icon="⚠️"
              label="Reset Account"
              sublabel="Clear all progress and start over"
              onPress={handleResetAccount}
              delay={200}
            />
          </View>
        </View>

        {/* App Info */}
        <Animated.View 
          entering={FadeInDown.delay(300).springify()}
          style={{ 
            alignItems: 'center', 
            paddingVertical: 40,
          }}
        >
          <Text 
            style={{ 
              fontFamily: 'Righteous_400Regular',
              fontSize: 24,
              color: '#18181b',
              letterSpacing: 2,
            }}
          >
            SAME
          </Text>
          <Text 
            style={{ 
              fontFamily: 'Poppins_400Regular',
              fontSize: 14,
              color: '#a1a1aa',
              marginTop: 4,
            }}
          >
            Version 1.5.0
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

