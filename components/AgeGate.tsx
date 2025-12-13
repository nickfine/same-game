import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  Pressable, 
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { COMPLIANCE, COLORS } from '../lib/constants';
import { calculateAge, meetsMinimumAge } from '../hooks/useCompliance';

interface AgeGateProps {
  visible: boolean;
  onComplete: (birthDate: string) => Promise<void>;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function AgeGate({ visible, onComplete }: AgeGateProps) {
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [step, setStep] = useState<'month' | 'day' | 'year' | 'confirm'>('month');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMonthSelect = useCallback((m: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMonth(m);
    setStep('day');
    setError(null);
  }, []);

  const handleDaySelect = useCallback((d: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDay(d);
    setStep('year');
    setError(null);
  }, []);

  const handleYearSelect = useCallback((y: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setYear(y);
    setStep('confirm');
    setError(null);
  }, []);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'day') setStep('month');
    else if (step === 'year') setStep('day');
    else if (step === 'confirm') setStep('year');
    setError(null);
  }, [step]);

  const handleConfirm = useCallback(async () => {
    if (month === null || day === null || year === null) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);
    
    // Format as ISO date
    const birthDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Validate age
    if (!meetsMinimumAge(birthDate)) {
      setError(`Sorry, you must be at least ${COMPLIANCE.MIN_AGE} years old to use this app.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLoading(false);
      return;
    }
    
    try {
      await onComplete(birthDate);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [month, day, year, onComplete]);

  const getFormattedDate = () => {
    if (month === null || day === null || year === null) return '';
    return `${MONTHS[month]} ${day}, ${year}`;
  };

  const getAge = () => {
    if (month === null || day === null || year === null) return null;
    const birthDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calculateAge(birthDate);
  };

  const renderMonthPicker = () => (
    <Animated.View 
      entering={FadeIn.duration(200)} 
      exiting={FadeOut.duration(100)}
      style={{ flex: 1 }}
    >
      <Text style={{ 
        fontSize: 20, 
        fontFamily: 'Righteous_400Regular',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 24,
      }}>
        What month were you born?
      </Text>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
          {MONTHS.map((m, i) => (
            <Pressable
              key={m}
              onPress={() => handleMonthSelect(i)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${m}`}
              testID={`month-${m.toLowerCase()}`}
              style={({ pressed }) => ({
                backgroundColor: pressed ? COLORS.primary : COLORS.surface,
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 20,
                minWidth: 140,
                borderWidth: 2,
                borderColor: pressed ? COLORS.primary : COLORS.glassBorder,
              })}
            >
              {({ pressed }) => (
                <Text style={{ 
                  fontFamily: 'Poppins_500Medium',
                  fontSize: 16,
                  color: COLORS.text,
                  textAlign: 'center',
                }}>
                  {m}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderDayPicker = () => (
    <Animated.View 
      entering={FadeIn.duration(200)} 
      exiting={FadeOut.duration(100)}
      style={{ flex: 1 }}
    >
      <Pressable onPress={handleBack} style={{ marginBottom: 16 }}>
        <Text style={{ 
          fontFamily: 'Poppins_500Medium',
          fontSize: 14,
          color: COLORS.muted,
        }}>
          ← {MONTHS[month!]}
        </Text>
      </Pressable>
      <Text style={{ 
        fontSize: 20, 
        fontFamily: 'Righteous_400Regular',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 24,
      }}>
        What day?
      </Text>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
          {DAYS.map((d) => (
            <Pressable
              key={d}
              onPress={() => handleDaySelect(d)}
              accessibilityRole="button"
              accessibilityLabel={`Select day ${d}`}
              testID={`day-${d}`}
              style={({ pressed }) => ({
                backgroundColor: pressed ? COLORS.primary : COLORS.surface,
                borderRadius: 10,
                width: 56,
                height: 56,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: pressed ? COLORS.primary : COLORS.glassBorder,
              })}
            >
              {({ pressed }) => (
                <Text style={{ 
                  fontFamily: 'Poppins_600SemiBold',
                  fontSize: 18,
                  color: COLORS.text,
                }}>
                  {d}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderYearPicker = () => (
    <Animated.View 
      entering={FadeIn.duration(200)} 
      exiting={FadeOut.duration(100)}
      style={{ flex: 1 }}
    >
      <Pressable onPress={handleBack} style={{ marginBottom: 16 }}>
        <Text style={{ 
          fontFamily: 'Poppins_500Medium',
          fontSize: 14,
          color: COLORS.muted,
        }}>
          ← {MONTHS[month!]} {day}
        </Text>
      </Pressable>
      <Text style={{ 
        fontSize: 20, 
        fontFamily: 'Righteous_400Regular',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 24,
      }}>
        What year?
      </Text>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
          {YEARS.map((y) => (
            <Pressable
              key={y}
              onPress={() => handleYearSelect(y)}
              accessibilityRole="button"
              accessibilityLabel={`Select year ${y}`}
              testID={`year-${y}`}
              style={({ pressed }) => ({
                backgroundColor: pressed ? COLORS.primary : COLORS.surface,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 16,
                minWidth: 80,
                borderWidth: 2,
                borderColor: pressed ? COLORS.primary : COLORS.glassBorder,
              })}
            >
              {({ pressed }) => (
                <Text style={{ 
                  fontFamily: 'Poppins_600SemiBold',
                  fontSize: 16,
                  color: COLORS.text,
                  textAlign: 'center',
                }}>
                  {y}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderConfirmation = () => {
    const age = getAge();
    const isMinor = age !== null && age < COMPLIANCE.ADULT_AGE;
    
    return (
      <Animated.View 
        entering={FadeIn.duration(200)} 
        exiting={FadeOut.duration(100)}
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <Pressable onPress={handleBack} style={{ position: 'absolute', top: 0 }}>
          <Text style={{ 
            fontFamily: 'Poppins_500Medium',
            fontSize: 14,
            color: COLORS.muted,
          }}>
            ← Change date
          </Text>
        </Pressable>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={{ 
            fontSize: 64, 
            marginBottom: 16,
          }}>
            🎂
          </Text>
          
          <Text style={{ 
            fontSize: 24, 
            fontFamily: 'Righteous_400Regular',
            color: COLORS.text,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {getFormattedDate()}
          </Text>
          
          {age !== null && (
            <Text style={{ 
              fontSize: 18, 
              fontFamily: 'Poppins_500Medium',
              color: COLORS.muted,
              textAlign: 'center',
              marginBottom: 24,
            }}>
              {age} years old
            </Text>
          )}

          {isMinor && (
            <View style={{ 
              backgroundColor: COLORS.warning + '20',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: COLORS.warning,
            }}>
              <Text style={{ 
                fontFamily: 'Poppins_600SemiBold',
                fontSize: 14,
                color: COLORS.warning,
                textAlign: 'center',
                marginBottom: 8,
              }}>
                🛡️ Safe Play Mode Active
              </Text>
              <Text style={{ 
                fontFamily: 'Poppins_400Regular',
                fontSize: 13,
                color: COLORS.text,
                textAlign: 'center',
                lineHeight: 20,
              }}>
                You'll have a {COMPLIANCE.WEEKLY_PLAYTIME_CAP_MINOR}-minute weekly playtime limit, 
                {COMPLIANCE.DAILY_VOTE_CAP_MINOR} daily votes, and break reminders every{' '}
                {COMPLIANCE.BREAK_REMINDER_INTERVAL} minutes.
              </Text>
            </View>
          )}

          {error && (
            <View style={{ 
              backgroundColor: COLORS.fail + '20',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}>
              <Text style={{ 
                fontFamily: 'Poppins_500Medium',
                fontSize: 14,
                color: COLORS.fail,
                textAlign: 'center',
              }}>
                {error}
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleConfirm}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Confirm birthday"
            testID="confirm-birthday"
            style={({ pressed }) => ({
              backgroundColor: loading ? COLORS.muted : (pressed ? '#2d2d30' : COLORS.text),
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 48,
              opacity: loading ? 0.7 : 1,
            })}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={{ 
                fontFamily: 'Righteous_400Regular',
                fontSize: 18,
                color: COLORS.white,
              }}>
                That's me! Let's play
              </Text>
            )}
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
      }}>
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutDown}
          style={{ 
            backgroundColor: COLORS.background,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingTop: 24,
            paddingHorizontal: 24,
            paddingBottom: 40,
            maxHeight: '85%',
            minHeight: '60%',
          }}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ 
              width: 40, 
              height: 4, 
              backgroundColor: COLORS.border, 
              borderRadius: 2,
              marginBottom: 20,
            }} />
            <Text style={{ 
              fontSize: 28, 
              fontFamily: 'Righteous_400Regular',
              color: COLORS.text,
              textAlign: 'center',
            }}>
              Welcome to SAME
            </Text>
            <Text style={{ 
              fontSize: 15, 
              fontFamily: 'Poppins_400Regular',
              color: COLORS.muted,
              textAlign: 'center',
              marginTop: 8,
            }}>
              First, let's verify your birthday
            </Text>
          </View>

          {/* Content */}
          {step === 'month' && renderMonthPicker()}
          {step === 'day' && renderDayPicker()}
          {step === 'year' && renderYearPicker()}
          {step === 'confirm' && renderConfirmation()}
        </Animated.View>
      </View>
    </Modal>
  );
}

