import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useLanguage } from "@/context/LanguageContext";
import NavigationFAB from "@/components/NavigationFAB";

function NativeTabLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.isAdmin ?? false;
  const canShowAdmin = isAdmin || user?.role === 'digimon_creator';
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "house", selected: "house.fill" }} />
          <Label>{t('tab.home')}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="banco">
          <Icon sf={{ default: "book.pages", selected: "book.pages.fill" }} />
          <Label>{t('tab.banco')}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="collection">
          <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
          <Label>{t('tab.collection')}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="craft">
          <Icon sf={{ default: "hammer", selected: "hammer.fill" }} />
          <Label>{t('tab.craft')}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="map">
          <Icon sf={{ default: "map", selected: "map.fill" }} />
          <Label>{t('tab.map')}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="correios">
          <Icon sf={{ default: "envelope", selected: "envelope.fill" }} />
          <Label>{t('tab.mail')}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="gacha">
          <Icon sf={{ default: "sparkles", selected: "sparkles" }} />
          <Label>{t('tab.gacha')}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="ranking">
          <Icon sf={{ default: "trophy", selected: "trophy.fill" }} />
          <Label>{t('tab.ranking')}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="digifarm">
          <Icon sf={{ default: "leaf", selected: "leaf.fill" }} />
          <Label>{t('tab.digifarm')}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="amigos">
          <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
          <Label>{t('tab.friends')}</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="chat">
          <Icon sf={{ default: "message", selected: "message.fill" }} />
          <Label>{t('tab.chat')}</Label>
        </NativeTabs.Trigger>
        {canShowAdmin && (
          <NativeTabs.Trigger name="admin">
            <Icon sf={{ default: "wrench.and.screwdriver", selected: "wrench.and.screwdriver.fill" }} />
            <Label>{t('tab.admin')}</Label>
          </NativeTabs.Trigger>
        )}
      </NativeTabs>
      <NavigationFAB />
    </View>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const { user } = useAuth();
  const { t } = useLanguage();
  const canShowAdmin = (user?.isAdmin ?? false) || user?.role === 'digimon_creator';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
            ),
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('tab.home') }} />
        <Tabs.Screen name="banco" options={{ title: t('tab.banco') }} />
        <Tabs.Screen name="collection" options={{ title: t('tab.collection') }} />
        <Tabs.Screen name="mochila" options={{ href: null }} />
        <Tabs.Screen name="craft" options={{ title: t('tab.craft') }} />
        <Tabs.Screen name="map" options={{ title: t('tab.map') }} />
        <Tabs.Screen name="correios" options={{ title: t('tab.mail') }} />
        <Tabs.Screen name="gacha" options={{ title: t('tab.gacha') }} />
        <Tabs.Screen name="ranking" options={{ title: t('tab.ranking') }} />
        <Tabs.Screen name="digifarm" options={{ title: t('tab.digifarm') }} />
        <Tabs.Screen name="amigos" options={{ title: t('tab.friends') }} />
        <Tabs.Screen name="chat" options={{ title: t('tab.chat') }} />
        <Tabs.Screen name="admin" options={{ href: canShowAdmin ? undefined : null, title: t('tab.admin') }} />
      </Tabs>
      <NavigationFAB />
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
