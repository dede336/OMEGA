import React, { useState } from 'react';
import {
  View, StyleSheet, Platform, TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/constants/i18n';

const logoSource = require('../assets/images/logo.png');

const LANGUAGES: { code: Language; flag: any }[] = [
  { code: 'pt', flag: require('../assets/images/flag_pt.png') },
  { code: 'en', flag: require('../assets/images/flag_en.png') },
  { code: 'es', flag: require('../assets/images/flag_es.webp') },
];

export default function LanguageSelectScreen() {
  const insets = useSafeAreaInsets();
  const { setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);

  async function handleSelect(lang: Language) {
    if (loading) return;
    setLoading(true);
    await setLanguage(lang);
    router.replace('/login' as never);
  }

  const topPad = Platform.OS === 'web' ? 24 : insets.top + 24;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 24;

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={styles.logoArea}>
        <Image source={logoSource} style={styles.logo} contentFit="contain" />
      </View>

      <View style={styles.flags}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.flagBtn}
            onPress={() => handleSelect(lang.code)}
            activeOpacity={0.75}
            disabled={loading}
          >
            <Image
              source={lang.flag}
              style={styles.flagImg}
              contentFit="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 48,
  },
  logoArea: { alignItems: 'center' },
  logo: { width: 200, height: 100 },

  flags: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  flagImg: {
    width: 80,
    height: 50,
  },
});
