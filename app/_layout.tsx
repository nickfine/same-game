import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { Righteous_400Regular } from '@expo-google-fonts/righteous';
import { useAuth } from '../hooks/useAuth';
import { initializeSoundSettings } from '../hooks/useSound';
import '../global.css';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_900Black,
    Righteous_400Regular,
  });

  const { loading: authLoading, error: authError, user } = useAuth();
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
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#18181b" />
        <Text className="mt-4 text-text text-lg">Loading...</Text>
      </View>
    );
  }

  if (authError) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-8">
        <Text className="text-fail text-xl text-center mb-4">
          Something went wrong
        </Text>
        <Text className="text-gray-500 text-center">
          {authError}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f4f4f5' },
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
    </GestureHandlerRootView>
  );
}
