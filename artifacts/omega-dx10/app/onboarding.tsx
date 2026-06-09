import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useGame } from '@/context/GameContext';
import { pixelStyle } from '@/constants/pixelStyle';
import { TAMERS } from '@/constants/gameData';
import type { TamerGender } from '@/constants/gameData';
import { useLanguage } from '@/context/LanguageContext';

const TOTAL_STEPS = 3;
const isWeb = Platform.OS === 'web';
const TAMER_GAP = 8;

const GENDER_OPTION_BASE: { id: TamerGender; icon: string; color: string }[] = [
  { id: 'M', icon: '♂\uFE0E', color: '#3b82f6' },
  { id: 'F', icon: '♀\uFE0E', color: '#ec4899' },
  { id: 'N', icon: '⚧\uFE0E', color: '#8b5cf6' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useGame();
  const { t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const hPad = isWeb ? 20 : 24;
  const containerWidth = Math.min(windowWidth, 430) - hPad * 2;
  const tamerCardWidth = Math.floor((containerWidth - TAMER_GAP * 2) / 3);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<TamerGender | null>(null);
  const [tamerId, setTamerId] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const GENDER_OPTIONS = GENDER_OPTION_BASE.map((g) => ({
    ...g,
    label: t(g.id === 'M' ? 'onboarding.genderM' : g.id === 'F' ? 'onboarding.genderF' : 'onboarding.genderN'),
  }));

  const visibleTamers = gender === 'N'
    ? TAMERS
    : TAMERS.filter((t) => t.forGender === gender);

  function animateStep(nextStep: number) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    setTimeout(() => setStep(nextStep), 150);
  }

  function handleNext() {
    if (step === 0) {
      const trimmed = name.trim();
      if (trimmed.length < 2) { setNameError(t('onboarding.nameErrorMin')); return; }
      if (trimmed.length > 16) { setNameError(t('onboarding.nameErrorMax')); return; }
      setNameError('');
      animateStep(1);
    } else if (step === 1) {
      if (!gender) return;
      setTamerId(null);
      animateStep(2);
    } else if (step === 2) {
      if (!tamerId || !gender) return;
      completeOnboarding(name.trim(), gender, tamerId);
      router.replace('/(tabs)' as never);
    }
  }

  function handleBack() {
    if (step > 0) {
      animateStep(step - 1);
    } else {
      router.replace('/login' as never);
    }
  }

  const canNext =
    (step === 0 && name.trim().length >= 2) ||
    (step === 1 && gender !== null) ||
    (step === 2 && tamerId !== null);

  const topPad = isWeb ? 8 : insets.top;
  const botPad = isWeb ? 8 : insets.bottom;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
        <View style={styles.inner}>

          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Feather name="arrow-left" size={isWeb ? 18 : 22} color="#94a3b8" />
            </TouchableOpacity>
            <View style={styles.dots}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
              ))}
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Content */}
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

            {/* STEP 0 — Nome */}
            {step === 0 && (
              <View style={styles.stepContainer}>
                <Image source={require('../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
                <Text style={styles.stepTitle}>{t('onboarding.welcome')}</Text>
                <Text style={styles.stepSubtitle}>{t('onboarding.nameSub')}</Text>
                <View style={[styles.inputWrapper, pixelStyle]}>
                  <Feather name="user" size={isWeb ? 15 : 18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('onboarding.namePlaceholder')}
                    placeholderTextColor="#475569"
                    value={name}
                    onChangeText={(t) => { setName(t); setNameError(''); }}
                    maxLength={16}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleNext}
                  />
                </View>
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>
            )}

            {/* STEP 1 — Gênero */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepEmoji}>👤</Text>
                <Text style={styles.stepTitle}>{t('onboarding.hello')} {name}!</Text>
                <Text style={styles.stepSubtitle}>{t('onboarding.genderSub')}</Text>
                <View style={styles.genderGrid}>
                  {GENDER_OPTIONS.map((g) => {
                    const selected = gender === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        style={[styles.genderCard, selected && { borderColor: g.color, backgroundColor: g.color + '22' }, pixelStyle]}
                        onPress={() => setGender(g.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.genderIcon}>{g.icon}</Text>
                        {selected && (
                          <View style={[styles.genderCheck, { backgroundColor: g.color }]}>
                            <Feather name="check" size={10} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 2 — Tamer */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepEmoji}>🧢</Text>
                <Text style={styles.stepTitle}>{t('onboarding.tamerTitle')}</Text>
                <Text style={styles.stepSubtitle}>{t('onboarding.tamerSub')}</Text>
                <ScrollView style={styles.tamerList} contentContainerStyle={styles.tamerGridContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.tamerGrid}>
                    {visibleTamers.map((t) => {
                      const selected = tamerId === t.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[styles.tamerGridCard, { width: tamerCardWidth }, selected && { borderColor: t.accentColor, backgroundColor: t.accentColor + '18' }, pixelStyle]}
                          onPress={() => setTamerId(t.id)}
                          activeOpacity={0.8}
                        >
                          {selected && (
                            <View style={[styles.tamerCheck, { backgroundColor: t.accentColor }]}>
                              <Feather name="check" size={10} color="#fff" />
                            </View>
                          )}
                          <View style={styles.tamerAvatarWrapper}>
                            <Image
                              source={t.image}
                              style={[
                                styles.tamerAvatar,
                                t.id === 'tamer_matt' && { transform: [{ scale: 1.8 }] },
                                t.id === 'tamer_tk' && { transform: [{ scale: 1.2 }] },
                              ]}
                              contentFit="contain"
                            />
                          </View>
                          <Text style={[styles.tamerName, selected && { color: t.accentColor }]} numberOfLines={1}>{t.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </Animated.View>

          {/* Footer button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.nextBtn, !canNext && styles.nextBtnDisabled, pixelStyle]}
              onPress={handleNext}
              activeOpacity={canNext ? 0.85 : 1}
            >
              <Text style={[styles.nextBtnText, !canNext && styles.nextBtnTextDisabled]}>
                {step < TOTAL_STEPS - 1 ? t('onboarding.continue') : t('onboarding.start')}
              </Text>
              <Feather name={step < TOTAL_STEPS - 1 ? 'arrow-right' : 'zap'} size={isWeb ? 15 : 18} color={canNext ? '#ffffff' : '#475569'} />
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: '#0a0a0f' },
  container:         { flex: 1, alignItems: 'center' },
  inner:             { flex: 1, width: '100%' },

  topBar:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: isWeb ? 8 : 14 },
  backBtn:           { padding: 4, width: 36 },
  dots:              { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot:               { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1e293b' },
  dotActive:         { width: 24, backgroundColor: '#6366f1' },
  dotDone:           { backgroundColor: '#22c55e' },

  content:           { flex: 1, paddingHorizontal: isWeb ? 20 : 24 },
  stepContainer:     { flex: 1, alignItems: 'center', paddingTop: isWeb ? 4 : 12 },
  logo:              { width: isWeb ? 140 : 200, height: isWeb ? 56 : 80, marginBottom: isWeb ? 10 : 20 },
  stepEmoji:         { fontSize: isWeb ? 36 : 52, marginBottom: isWeb ? 6 : 12 },
  stepTitle:         { fontSize: isWeb ? 18 : 24, fontWeight: '800' as const, color: '#f1f5f9', textAlign: 'center', marginBottom: isWeb ? 4 : 8 },
  stepSubtitle:      { fontSize: isWeb ? 12 : 14, color: '#64748b', textAlign: 'center', lineHeight: isWeb ? 16 : 20, marginBottom: isWeb ? 16 : 28 },

  inputWrapper:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderWidth: 1.5, borderColor: '#1e293b', borderRadius: 14, paddingHorizontal: 14, paddingVertical: isWeb ? 2 : 4, width: '100%' },
  inputIcon:         { marginRight: 10 },
  input:             { flex: 1, fontSize: isWeb ? 14 : 17, color: '#f1f5f9', paddingVertical: isWeb ? 10 : 14, fontWeight: '600' as const, backgroundColor: 'transparent' },
  charCount:         { fontSize: 11, color: '#475569' },
  errorText:         { color: '#ef4444', fontSize: 12, marginTop: 8, alignSelf: 'flex-start' },

  genderGrid:        { flexDirection: 'row', gap: isWeb ? 8 : 12, width: '100%' },
  genderCard:        { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1.5, borderColor: '#1e293b', backgroundColor: '#111827', paddingVertical: isWeb ? 16 : 28, gap: isWeb ? 5 : 8, position: 'relative' as const },
  genderIcon:        { fontSize: isWeb ? 26 : 36, color: '#94a3b8' },
  genderLabel:       { fontSize: isWeb ? 11 : 13, fontWeight: '700' as const, color: '#94a3b8' },
  genderCheck:       { position: 'absolute' as const, top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  tamerList:         { width: '100%', flex: 1 },
  tamerGridContent:  { paddingBottom: 20, width: '100%' },
  tamerGrid:         { flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: TAMER_GAP },
  tamerGridCard:     { alignItems: 'center', borderWidth: 1.5, borderColor: '#1e293b', backgroundColor: '#111827', borderRadius: 14, padding: isWeb ? 6 : 8, position: 'relative' as const },
  tamerAvatarWrapper:{ width: isWeb ? 54 : 62, height: isWeb ? 78 : 88, alignSelf: 'center' as const },
  tamerAvatar:       { width: '100%', height: '100%' },
  tamerName:         { fontSize: isWeb ? 13 : 14, fontWeight: '800' as const, color: '#f1f5f9', textAlign: 'center' as const, marginTop: 4 },
  tamerCheck:        { position: 'absolute' as const, top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  footer:            { paddingHorizontal: isWeb ? 20 : 24, paddingBottom: isWeb ? 8 : 12, paddingTop: isWeb ? 6 : 10 },
  nextBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: isWeb ? 12 : 18 },
  nextBtnDisabled:   { backgroundColor: '#1e293b' },
  nextBtnText:       { fontSize: isWeb ? 13 : 16, fontWeight: '700' as const, color: '#ffffff' },
  nextBtnTextDisabled: { color: '#475569' },
});
