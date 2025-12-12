import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { Righteous_400Regular } from '@expo-google-fonts/righteous';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useAuth } from '../hooks/useAuth';
import { initializeSoundSettings } from '../hooks/useSound';
import { ComplianceProvider } from '../components/ComplianceProvider';
import { COLORS } from '../lib/constants';
import '../global.css';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
    Righteous_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  const { loading: authLoading, error: authError, user, uid } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      if (fontsLoaded && !authLoading) {
        // Initialize sound settings before app is ready
        await initializeSoundSettings();
        setAppReady(true);
        SplashScreen.hideAsync();
      }
    }
    prepareApp();
  }, [fontsLoaded, authLoading]);

  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, color: COLORS.text, fontSize: 18, fontFamily: 'Righteous_400Regular' }}>
          Loading...
        </Text>
      </View>
    );
  }

  if (authError) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ color: COLORS.secondary, fontSize: 24, textAlign: 'center', marginBottom: 16, fontFamily: 'Righteous_400Regular' }}>
          Something went wrong
        </Text>
        <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>
          {authError}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ComplianceProvider uid={uid} user={user}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen 
            name="create-question" 
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen 
            name="profile" 
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="history" 
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="my-questions" 
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="settings" 
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="about" 
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="leaderboard" 
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </ComplianceProvider>
    </GestureHandlerRootView>
  );
}
