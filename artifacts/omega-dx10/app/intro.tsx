import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, Platform, TouchableOpacity, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useGame } from '@/context/GameContext';
import { pixelStyle } from '@/constants/pixelStyle';

const useND = Platform.OS !== 'web';

const videoSource = require('../assets/videos/intro.mp4');
const logoSource = require('../assets/images/logo.png');

export default function IntroScreen() {
  const { isLoaded, isOnboarded } = useGame();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.7)).current;

  const navigateAway = useCallback(() => {
    Animated.timing(logoOpacity, { toValue: 0, duration: 400, useNativeDriver: useND }).start(() => {
      if (isLoaded && !isOnboarded) {
        router.replace('/onboarding' as never);
      } else {
        router.replace('/(tabs)' as never);
      }
    });
  }, [isLoaded, isOnboarded, logoOpacity]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    const sub = player.addListener('playingChange', (event) => {
      if (!event.isPlaying && player.currentTime > 0) {
        navigateAway();
      }
    });
    return () => sub.remove();
  }, [player, navigateAway]);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: useND }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: useND }),
      ]).start();
    }, 400);
    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale]);

  useEffect(() => {
    const fallback = setTimeout(() => navigateAway(), 8000);
    return () => clearTimeout(fallback);
  }, [navigateAway]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View
          style={[styles.logoWrapper, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
          pointerEvents="none"
        >
          <Image source={logoSource} style={styles.logo} contentFit="contain" />
        </Animated.View>

        <TouchableOpacity style={[styles.skipBtn, pixelStyle]} onPress={navigateAway} activeOpacity={0.7}>
          <Text style={styles.skipText}>Pular ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%' as any,
    height: '100%' as any,
  },
  logoWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 260,
    height: 110,
  },
  skipBtn: {
    position: 'absolute' as const,
    bottom: 36,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
});
