import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from 'expo-font';
import React, { useEffect, useRef } from "react";
import { Platform, View, Modal, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GameProvider, useGame } from "@/context/GameContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { TamerThemeProvider, useTamerTheme } from "@/context/TamerThemeContext";
import { SocketProvider, useSocket, ActiveBattleMember } from "@/context/SocketContext";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useCloudSync } from "@/hooks/useCloudSync";
import { TAMERS, CHARACTERS } from "@/constants/gameData";
import { CharacterAvatar } from "@/components/GameComponents";

SplashScreen.preventAutoHideAsync();

// IMPORTANT: must be a plain object, NOT StyleSheet.create().someKey.
// On native, StyleSheet.create returns a numeric ID — assigning a number to
// defaultProps.style does NOT resolve to the style on native Text/TextInput.
// Plain object works identically on both web and native.
const _pixelFontStyle = { fontFamily: 'Silkscreen_400Regular' };

// Apply pixel font as default for ALL Text + TextInput at module-load time.
// Components render only after fontsLoaded (we return null until then), so by
// the time any Text mounts, the font is already registered.
if (!(Text as any).defaultProps) (Text as any).defaultProps = {};
(Text as any).defaultProps.style = _pixelFontStyle;
if (!(TextInput as any).defaultProps) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.style = _pixelFontStyle;

const queryClient = new QueryClient();

const LIGHT_TAMER_COLORS = new Set(['#eab308']);

function TamerThemeSyncer() {
  const { tamerId } = useGame();
  const { setTheme } = useTamerTheme();
  useEffect(() => {
    const tamer = tamerId ? TAMERS.find((t) => t.id === tamerId) : null;
    if (tamer) {
      setTheme({
        primary: tamer.accentColor,
        primaryForeground: LIGHT_TAMER_COLORS.has(tamer.accentColor) ? '#0f172a' : '#ffffff',
      });
    }
  }, [tamerId, setTheme]);
  return null;
}

function NavigationGuard() {
  const { isLoaded } = useGame();
  const { isAuthLoaded, user } = useAuth();
  const { isLanguageLoaded, isLanguageSelected } = useLanguage();
  const fired = useRef(false);
  useEffect(() => {
    if (!isLoaded || !isAuthLoaded || !isLanguageLoaded || fired.current) return;
    fired.current = true;
    if (!isLanguageSelected) {
      router.replace('/language-select' as never);
    } else if (!user) {
      router.replace('/login' as never);
    } else {
      router.replace('/intro' as never);
    }
  }, [isLoaded, isAuthLoaded, isLanguageLoaded, isLanguageSelected, user]);
  return null;
}

function CloudSyncManager() {
  useCloudSync();
  return null;
}

function buildBattleTeam(
  collection: ReturnType<typeof useGame>['collection'],
  team: ReturnType<typeof useGame>['team'],
): ActiveBattleMember[] {
  return team.slice(0, 3).map((ownedId) => {
    const owned = collection.find((c) => c.ownedId === ownedId);
    if (!owned) return null;
    const char = CHARACTERS[owned.characterId];
    if (!char) return null;
    const lvl = owned.level;
    return {
      characterId: owned.characterId,
      name: char.name,
      hp: char.baseStats.hp * lvl,
      maxHp: char.baseStats.hp * lvl,
      atk: char.baseStats.atk,
      def: char.baseStats.def,
      attackName: char.attackName || 'Ataque',
      spiritName: char.spiritName || char.attackName || 'Espírito',
      level: lvl,
    } as ActiveBattleMember;
  }).filter(Boolean) as ActiveBattleMember[];
}

function BattleInviteModal() {
  const { pendingBattleInvite, acceptBattle, declineBattle } = useSocket();
  const { collection, team } = useGame();
  const { user } = useAuth();
  const colors = useColors();

  if (!pendingBattleInvite) return null;

  const myTeam = buildBattleTeam(collection, team);
  const hasTeam = myTeam.length > 0;

  function handleAccept() {
    if (!pendingBattleInvite || !hasTeam) return;
    acceptBattle(pendingBattleInvite.inviteId, myTeam, user?.username ?? 'Tamer');
    router.push('/friend-battle' as any);
  }

  function handleDecline() {
    if (!pendingBattleInvite) return;
    declineBattle(pendingBattleInvite.inviteId);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleDecline}>
      <View style={inv.overlay}>
        <View style={[inv.sheet, { backgroundColor: colors.card }]}>
          <View style={[inv.handle, { backgroundColor: colors.border }]} />
          <Text style={inv.swords}>⚔️</Text>
          <Text style={[inv.title, { color: colors.foreground }]}>Convite de Batalha!</Text>
          <Text style={[inv.from, { color: colors.mutedForeground }]}>
            {pendingBattleInvite.fromPlayerName} (@{pendingBattleInvite.from}) te desafiou!
          </Text>

          {pendingBattleInvite.team.length > 0 && (
            <View style={inv.oppTeam}>
              <Text style={[inv.oppLabel, { color: colors.mutedForeground }]}>Equipe do desafiante:</Text>
              <View style={inv.oppAvatars}>
                {pendingBattleInvite.team.map((m, i) => (
                  <View key={i} style={inv.oppSlot}>
                    <CharacterAvatar characterId={m.characterId} size={44} />
                    <Text style={[inv.oppName, { color: colors.foreground }]} numberOfLines={1}>{m.name}</Text>
                    <Text style={[inv.oppLv, { color: colors.primary }]}>Lv {m.level}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!hasTeam && (
            <Text style={inv.noTeamWarn}>
              ⚠️ Você não tem equipe definida. Defina antes de batalhar.
            </Text>
          )}

          <View style={inv.btnRow}>
            <TouchableOpacity
              style={[inv.acceptBtn, !hasTeam && { opacity: 0.4 }]}
              onPress={handleAccept}
              disabled={!hasTeam}
              activeOpacity={0.8}
            >
              <Text style={inv.acceptText}>⚔️ Aceitar!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[inv.declineBtn, { borderColor: colors.border }]} onPress={handleDecline}>
              <Text style={[inv.declineText, { color: colors.mutedForeground }]}>Recusar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const inv = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 10, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, marginBottom: 4 },
  swords: { fontSize: 24 },
  title: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
  from: { fontSize: 12, textAlign: 'center' },
  oppTeam: { gap: 6, width: '100%' },
  oppLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  oppAvatars: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  oppSlot: { alignItems: 'center', gap: 2, flex: 1, maxWidth: 80 },
  oppName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  oppLv: { fontSize: 10, fontWeight: '800' },
  noTeamWarn: { color: '#f59e0b', fontSize: 12, textAlign: 'center', backgroundColor: 'rgba(245,158,11,0.1)', padding: 10, borderRadius: 10, width: '100%' },
  btnRow: { gap: 8, marginTop: 4, width: '100%' },
  acceptBtn: { backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 15, alignItems: 'center', width: '100%' },
  acceptText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  declineBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center', width: '100%' },
  declineText: { fontWeight: '600', fontSize: 12 },
});

function RootLayoutNav() {
  return (
    <>
      <TamerThemeSyncer />
      <NavigationGuard />
      <CloudSyncManager />
      <BattleInviteModal />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="intro" options={{ headerShown: false, gestureEnabled: false, animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="battle" options={{ headerShown: false, presentation: "fullScreenModal" }} />
        <Stack.Screen name="friend-battle" options={{ headerShown: false, presentation: "fullScreenModal" }} />
        <Stack.Screen name="character/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false, animation: 'none' }} />
        <Stack.Screen name="language-select" options={{ headerShown: false, gestureEnabled: false, animation: 'none' }} />
        <Stack.Screen name="chat-conversation" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Silkscreen_400Regular: require('../assets/fonts/Silkscreen_400Regular.ttf'),
  });

  if (fontsLoaded) {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.getElementById('__silkscreen_gfont')) {
        const link = document.createElement('link');
        link.id = '__silkscreen_gfont';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Silkscreen&display=swap';
        document.head.appendChild(link);
      }
      const styleId = '__pixel_font_global';
      if (!document.getElementById(styleId)) {
        const s = document.createElement('style');
        s.id = styleId;
        // Silkscreen covers standard Latin — it has no Private Use Area glyphs.
        // Icon fonts (Feather, etc.) use PUA codepoints that Silkscreen lacks,
        // so the browser naturally falls back to the icon font for those glyphs.
        // This means we get Silkscreen on all text AND working icons with one rule.
        s.textContent = [
          `* {`,
          `  font-family:`,
          `    'Silkscreen', 'Silkscreen_400Regular',`,
          `    'Feather', 'MaterialCommunityIcons', 'AntDesign', 'Ionicons',`,
          `    'FontAwesome', 'Entypo', 'MaterialIcons', 'Octicons',`,
          `    'SimpleLineIcons', 'Zocial', 'EvilIcons',`,
          `    'Apple Color Emoji', 'Segoe UI Emoji', monospace !important;`,
          `}`,
          `img, canvas { image-rendering: auto; }`,
        ].join('\n');
        document.head.appendChild(s);
      }
    }
  }

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <TamerThemeProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <LanguageProvider>
            <AuthProvider>
              <SocketProvider>
                <GameProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <View style={Platform.OS === 'web'
                      ? { flex: 1, maxWidth: 430, width: '100%', alignSelf: 'center' as const, overflow: 'hidden' as const }
                      : { flex: 1 }
                    }>
                      <KeyboardProvider>
                        <RootLayoutNav />
                      </KeyboardProvider>
                    </View>
                  </GestureHandlerRootView>
                </GameProvider>
              </SocketProvider>
            </AuthProvider>
            </LanguageProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </TamerThemeProvider>
    </SafeAreaProvider>
  );
}
