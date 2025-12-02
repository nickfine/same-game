import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function Section({ title, children, delay = 0 }: SectionProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <Text 
        style={{ 
          fontFamily: 'Righteous_400Regular',
          fontSize: 20,
          color: '#18181b',
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      {children}
    </Animated.View>
  );
}

export default function AboutScreen() {
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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
          How to Play
        </Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View
          entering={FadeInDown.delay(0).springify()}
          style={{
            backgroundColor: '#18181b',
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Text 
            style={{ 
              fontFamily: 'Righteous_400Regular',
              fontSize: 48,
              color: '#ffffff',
              letterSpacing: 4,
            }}
          >
            SAME
          </Text>
          <Text 
            style={{ 
              fontFamily: 'Poppins_400Regular',
              fontSize: 16,
              color: '#a1a1aa',
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            Predict what the majority thinks
          </Text>
        </Animated.View>

        {/* The Game */}
        <Section title="The Game" delay={100}>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: '#52525b', lineHeight: 24 }}>
            SAME is a rapid-fire prediction game. You'll see binary questions (A vs B) and must guess which option the majority of people chose.
          </Text>
        </Section>

        {/* How Scoring Works */}
        <Section title="Scoring" delay={150}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View 
                style={{ 
                  width: 40, 
                  height: 40, 
                  backgroundColor: '#00E054', 
                  borderRadius: 20, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontFamily: 'Righteous_400Regular', fontSize: 16, color: '#ffffff' }}>+1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#18181b' }}>SAME!</Text>
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#71717a' }}>
                  You guessed correctly - earn 1 point
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View 
                style={{ 
                  width: 40, 
                  height: 40, 
                  backgroundColor: '#FF0055', 
                  borderRadius: 20, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontFamily: 'Righteous_400Regular', fontSize: 16, color: '#ffffff' }}>0</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#18181b' }}>NOPE</Text>
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#71717a' }}>
                  Wrong guess - no points lost, just no gain
                </Text>
              </View>
            </View>
          </View>
        </Section>

        {/* The Economy */}
        <Section title="The Economy" delay={200}>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: '#52525b', lineHeight: 24, marginBottom: 12 }}>
            Points are your currency in SAME:
          </Text>
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#52525b' }}>
              • You start with <Text style={{ fontFamily: 'Poppins_700Bold' }}>3 points</Text>
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#52525b' }}>
              • Voting correctly earns <Text style={{ fontFamily: 'Poppins_700Bold', color: '#00E054' }}>+1 point</Text>
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#52525b' }}>
              • Creating a question costs <Text style={{ fontFamily: 'Poppins_700Bold', color: '#FF0055' }}>-3 points</Text>
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#52525b' }}>
              • Max <Text style={{ fontFamily: 'Poppins_700Bold' }}>5 questions</Text> per day
            </Text>
          </View>
        </Section>

        {/* Tips */}
        <Section title="Pro Tips" delay={250}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#52525b' }}>
              💡 Think about what <Text style={{ fontFamily: 'Poppins_700Bold' }}>most people</Text> would choose, not what you prefer
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#52525b' }}>
              🎯 Build up a streak of correct predictions for bragging rights
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#52525b' }}>
              ❓ Create questions that are genuinely divisive - they're more fun!
            </Text>
          </View>
        </Section>

        {/* Footer */}
        <Animated.View 
          entering={FadeInDown.delay(300).springify()}
          style={{ alignItems: 'center', paddingVertical: 20 }}
        >
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#a1a1aa' }}>
            Made with ❤️
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

