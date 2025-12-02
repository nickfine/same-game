import React from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, { 
  SlideInLeft,
  SlideOutLeft,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.8;

interface UserMenuProps {
  visible: boolean;
  onClose: () => void;
  score: number;
  questionsCreated: number;
}

interface MenuItemProps {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  color?: string;
}

function MenuItem({ icon, label, sublabel, onPress, color = '#18181b' }: MenuItemProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: pressed ? '#f4f4f5' : 'transparent',
      })}
    >
      <Text style={{ fontSize: 24, marginRight: 16 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text 
          style={{ 
            fontFamily: 'Righteous_400Regular',
            fontSize: 18,
            color,
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
    </Pressable>
  );
}

export function UserMenu({ visible, onClose, score, questionsCreated }: UserMenuProps) {
  if (!visible) return null;

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 200);
  };

  const handleCreateQuestion = () => {
    onClose();
    setTimeout(() => {
      router.push('/create-question');
    }, 200);
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <Pressable 
          style={{ flex: 1 }} 
          onPress={onClose}
        />
      </Animated.View>

      {/* Menu Panel */}
      <Animated.View
        entering={SlideInLeft.springify().damping(20)}
        exiting={SlideOutLeft.duration(200)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: MENU_WIDTH,
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {/* Header */}
        <View 
          style={{ 
            paddingTop: 60,
            paddingBottom: 24,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#f4f4f5',
          }}
        >
          <Text 
            style={{ 
              fontFamily: 'Righteous_400Regular',
              fontSize: 36,
              color: '#18181b',
              letterSpacing: 3,
            }}
          >
            SAME
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
            <View 
              style={{ 
                backgroundColor: '#18181b',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Text 
                style={{ 
                  fontFamily: 'Righteous_400Regular',
                  fontSize: 14,
                  color: '#ffffff',
                }}
              >
                {score} pts
              </Text>
            </View>
            <View 
              style={{ 
                backgroundColor: '#f4f4f5',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Text 
                style={{ 
                  fontFamily: 'Poppins_700Bold',
                  fontSize: 14,
                  color: '#71717a',
                }}
              >
                {questionsCreated} asked
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={{ flex: 1, paddingTop: 8 }}>
          <MenuItem 
            icon="📊" 
            label="Profile" 
            sublabel="Your stats & achievements"
            onPress={() => handleNavigate('/profile')}
          />
          <MenuItem 
            icon="📜" 
            label="Vote History" 
            sublabel="Questions you've answered"
            onPress={() => handleNavigate('/history')}
          />
          <MenuItem 
            icon="❓" 
            label="My Questions" 
            sublabel="Questions you've created"
            onPress={() => handleNavigate('/my-questions')}
          />
          
          <View style={{ height: 1, backgroundColor: '#f4f4f5', marginVertical: 8 }} />
          
          <MenuItem 
            icon="✨" 
            label="Create Question" 
            sublabel={`Costs 3 pts • You have ${score}`}
            onPress={handleCreateQuestion}
            color={score >= 3 ? '#6366F1' : '#a1a1aa'}
          />
          
          <View style={{ height: 1, backgroundColor: '#f4f4f5', marginVertical: 8 }} />
          
          <MenuItem 
            icon="⚙️" 
            label="Settings" 
            onPress={() => handleNavigate('/settings')}
          />
          <MenuItem 
            icon="ℹ️" 
            label="About" 
            sublabel="How to play"
            onPress={() => handleNavigate('/about')}
          />
        </View>

        {/* Footer */}
        <View 
          style={{ 
            paddingVertical: 20,
            paddingHorizontal: 20,
            borderTopWidth: 1,
            borderTopColor: '#f4f4f5',
          }}
        >
          <Text 
            style={{ 
              fontFamily: 'Poppins_400Regular',
              fontSize: 12,
              color: '#a1a1aa',
              textAlign: 'center',
            }}
          >
            SAME v1.0.0
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

