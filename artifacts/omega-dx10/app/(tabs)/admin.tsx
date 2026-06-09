import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { pixelStyle } from '@/constants/pixelStyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import DigimonSection from '@/components/admin/DigimonSection';
import ItemsSection from '@/components/admin/ItemsSection';
import MapsSection from '@/components/admin/MapsSection';
import FarmSection from '@/components/admin/FarmSection';
import TamersSection from '@/components/admin/TamersSection';
import GachaSection from '@/components/admin/GachaSection';
import SendSection from '@/components/admin/SendSection';

type Section = 'digimons' | 'items' | 'maps' | 'fazenda' | 'tamers' | 'gacha' | 'enviar';

const ADMIN_ICON = require('../../assets/images/admin_icon.png');

const ALL_SECTIONS: { key: Section; label: string; emoji: string; color: string; adminOnly: boolean }[] = [
  { key: 'digimons', label: 'Digimons', emoji: '🦖', color: '#3b82f6', adminOnly: false },
  { key: 'items',    label: 'Itens',    emoji: '⚔️',  color: '#f59e0b', adminOnly: true },
  { key: 'maps',     label: 'Fases',    emoji: '🗺️',  color: '#22c55e', adminOnly: true },
  { key: 'fazenda',  label: 'Fazenda',  emoji: '🌿',  color: '#84cc16', adminOnly: true },
  { key: 'tamers',   label: 'Tamers',   emoji: '🃏',  color: '#8b5cf6', adminOnly: true },
  { key: 'gacha',    label: 'Gacha',    emoji: '🌌',  color: '#a855f7', adminOnly: true },
  { key: 'enviar',   label: 'Enviar',   emoji: '🎁',  color: '#22c55e', adminOnly: true },
];

export default function AdminScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const isAdmin = user?.isAdmin ?? false;
  const isDigimonCreator = user?.role === 'digimon_creator';
  const canAccess = isAdmin || isDigimonCreator;

  const sections = isAdmin ? ALL_SECTIONS : ALL_SECTIONS.filter((s) => !s.adminOnly);
  const [section, setSection] = useState<Section>('digimons');

  if (!canAccess) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Acesso restrito.</Text>
      </View>
    );
  }

  const validSection = sections.find((s) => s.key === section) ? section : 'digimons';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={ADMIN_ICON} style={{ width: 32, height: 32 }} resizeMode="contain" />
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Painel Admin</Text>
            {isDigimonCreator && !isAdmin && (
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Criador de Digimons</Text>
            )}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.sectionRow}>
            {sections.map((s) => (
              <TouchableOpacity key={s.key} onPress={() => setSection(s.key)}
                style={[styles.sectionBtn, {
                  backgroundColor: validSection === s.key ? s.color : colors.card,
                  borderColor: validSection === s.key ? s.color : colors.border,
                }, pixelStyle]}>
                <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
                <Text style={{ color: validSection === s.key ? '#fff' : colors.foreground, fontSize: 12, fontWeight: '600' }}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {validSection === 'digimons' && <DigimonSection />}
        {validSection === 'items'    && isAdmin && <ItemsSection />}
        {validSection === 'maps'     && isAdmin && <MapsSection />}
        {validSection === 'fazenda'  && isAdmin && <FarmSection />}
        {validSection === 'tamers'   && isAdmin && <TamersSection />}
        {validSection === 'gacha'    && isAdmin && <GachaSection />}
        {validSection === 'enviar'   && isAdmin && <SendSection />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 15, fontWeight: '800' },
  sectionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sectionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5 },
  content: { padding: 16 },
});
