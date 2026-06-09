import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import PixelBox from '@/components/PixelBox';

type Mode = 'login' | 'register';

const logoSource = require('../assets/images/logo.png');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register, getApiUrl } = useAuth();
  const { loadFromCloud } = useGame();
  const { t } = useLanguage();
  const [mode, setMode]         = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  async function handleSubmit() {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError(t('login.error.empty'));
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
        await loadFromCloud(getApiUrl());
      } else {
        await register(username.trim(), password, email.trim() || undefined);
      }
      router.replace('/intro' as never);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  const topPad = Platform.OS === 'web' ? 16 : insets.top + 16;
  const botPad = Platform.OS === 'web' ? 16 : insets.bottom + 16;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: botPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            {/* Logo */}
            <View style={styles.logoArea}>
              <Image source={logoSource} style={styles.logo} contentFit="contain" />
              <Text style={styles.tagline}>{t('login.tagline')}</Text>
            </View>

            {/* Toggle */}
            <PixelBox style={styles.toggle} bgColor="#0a0a0f">
              {(['login', 'register'] as Mode[]).map((m) => (
                <PixelBox
                  key={m}
                  onPress={() => { setMode(m); setError(''); }}
                  style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
                  bgColor={mode === m ? '#0a0a0f' : '#1a1a2e'}
                >
                  <TouchableOpacity
                    onPress={() => { setMode(m); setError(''); }}
                    style={styles.toggleBtnInner}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                      {m === 'login' ? t('login.tab.login') : t('login.tab.register')}
                    </Text>
                  </TouchableOpacity>
                </PixelBox>
              ))}
            </PixelBox>

            {/* Fields */}
            <View style={styles.fields}>
              {/* Username / username-or-email */}
              <PixelBox style={styles.inputWrapper} bgColor="#0a0a0f">
                <Feather name="user" size={13} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'login' ? t('login.usernameOrEmail') : t('login.username')}
                  placeholderTextColor="#6b7280"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={mode === 'login' ? 'email-address' : 'default'}
                  maxLength={mode === 'login' ? 254 : 20}
                />
              </PixelBox>

              {/* Email field — only in register mode, required */}
              {mode === 'register' && (
                <PixelBox style={styles.inputWrapper} bgColor="#0a0a0f">
                  <Feather name="mail" size={13} color="#9ca3af" />
                  <TextInput
                    style={styles.input}
                    placeholder={t('login.email')}
                    placeholderTextColor="#6b7280"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    maxLength={254}
                  />
                  <Text style={styles.requiredTag}>{t('login.required')}</Text>
                </PixelBox>
              )}

              {/* Password */}
              <PixelBox style={styles.inputWrapper} bgColor="#0a0a0f">
                <Feather name="lock" size={13} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder={t('login.password')}
                  placeholderTextColor="#6b7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPw((p) => !p)} style={{ padding: 4 }}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={13} color="#9ca3af" />
                </TouchableOpacity>
              </PixelBox>

              {error !== '' && (
                <PixelBox style={styles.errorBox} bgColor="#0a0a0f">
                  <Feather name="alert-circle" size={14} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </PixelBox>
              )}

              <PixelBox
                style={[styles.submitBtn, loading && styles.submitBtnLoading]}
                bgColor="#0a0a0f"
              >
                <TouchableOpacity
                  onPress={handleSubmit}
                  activeOpacity={loading ? 1 : 0.8}
                  style={styles.submitBtnInner}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>
                      {mode === 'login' ? t('login.btn.login') : t('login.btn.register')}
                    </Text>
                  )}
                </TouchableOpacity>
              </PixelBox>
            </View>

            {mode === 'register' && (
              <Text style={styles.hint}>{t('login.hint')}</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#0a0a0f' },
  flex:             { flex: 1 },
  scrollContent:    { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  inner:            { width: '100%', gap: 16 },

  logoArea:         { alignItems: 'center', gap: 6, paddingTop: 4 },
  logo:             { width: 160, height: 80 },
  tagline:          { fontSize: 12, color: '#6b7280', letterSpacing: 0.5 },

  toggle:           { flexDirection: 'row', backgroundColor: '#1a1a2e', padding: 4, gap: 4 },
  toggleBtn:        { flex: 1 },
  toggleBtnActive:  { backgroundColor: '#3b82f6' },
  toggleBtnInner:   { paddingVertical: 8, alignItems: 'center' as const },
  toggleText:       { fontSize: 12, fontWeight: '700' as const, color: '#6b7280' },
  toggleTextActive: { color: '#ffffff' },

  fields:           { gap: 10 },
  inputWrapper:     {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  input:            { flex: 1, minWidth: 0, fontSize: 11, color: '#f3f4f6' },
  requiredTag:      { fontSize: 9, color: '#f59e0b', fontWeight: '700' as const },
  errorBox:         {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef444422',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 8,
  },
  errorText:        { flex: 1, fontSize: 12, color: '#ef4444' },
  submitBtn:        { backgroundColor: '#3b82f6' },
  submitBtnLoading: { backgroundColor: '#3b82f688' },
  submitBtnInner:   { paddingVertical: 12, alignItems: 'center' as const },
  submitText:       { fontSize: 13, fontWeight: '900' as const, color: '#ffffff', letterSpacing: 1 },
  hint:             { fontSize: 11, textAlign: 'center', color: '#6b7280' },
});
