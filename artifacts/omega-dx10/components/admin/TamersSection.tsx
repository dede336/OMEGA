import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image, StyleSheet,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { TAMERS } from '@/constants/gameData';
import { pixelStyle } from '@/constants/pixelStyle';
import { FieldInput, ColorPickerField, ImagePickerBlock, ImageData, ss } from './AdminShared';

interface CustomTamer {
  id: number;
  name: string;
  fullName: string;
  description: string;
  accentColor: string;
  tamerImageBase64: string | null;
  tamerImageMime: string;
  rankingCardImageBase64: string | null;
  rankingCardImageMime: string;
  homeImageBase64: string | null;
  homeImageMime: string;
  avatarOffsetY: number;
  avatarOffsetX: number;
  rankingOffsetY: number;
  rankingOffsetX: number;
  homeOffsetY: number;
  homeOffsetX: number;
  fragmentsToComplete: number;
  stageDrops: { stageId: string; stageIndex: number }[];
}

interface TamerOverride {
  id: number;
  tamerId: string;
  avatarOffsetY: number | null;
  avatarOffsetX: number | null;
  rankingOffsetY: number | null;
  rankingOffsetX: number | null;
  rankingCardImageBase64: string | null;
  rankingCardImageMime: string;
}

type Tab = 'builtin' | 'custom' | 'create';

const EMPTY_IMG: ImageData = { base64: null, mimeType: 'image/png', previewUri: null };

function emptyForm() {
  return {
    name: '',
    fullName: '',
    description: '',
    accentColor: '#3b82f6',
    avatarOffsetY: '-8',
    avatarOffsetX: '0',
    rankingOffsetY: '-8',
    rankingOffsetX: '0',
    homeOffsetY: '-8',
    homeOffsetX: '0',
    fragmentsToComplete: '10',
    tamerImg: EMPTY_IMG,
    rankingCardImg: EMPTY_IMG,
    homeImg: EMPTY_IMG,
  };
}

export default function TamersSection() {
  const colors = useColors();
  const { token, getApiUrl } = useAuth();
  const [tab, setTab] = useState<Tab>('builtin');
  const [customTamers, setCustomTamers] = useState<CustomTamer[]>([]);
  const [overrides, setOverrides] = useState<TamerOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingOverride, setEditingOverride] = useState<Record<string, { offY: string; offX: string; rankOffY: string; rankOffX: string; cardImg: ImageData }>>({});

  const api = getApiUrl();

  async function loadTamers() {
    setLoading(true);
    try {
      const res = await fetch(`${api}/tamers`);
      if (!res.ok) return;
      const data = await res.json() as { tamers: CustomTamer[]; overrides: TamerOverride[] };
      setCustomTamers(data.tamers);
      setOverrides(data.overrides);
      const ovMap: typeof editingOverride = {};
      for (const ov of data.overrides) {
        ovMap[ov.tamerId] = {
          offY: String(ov.avatarOffsetY ?? ''),
          offX: String(ov.avatarOffsetX ?? ''),
          rankOffY: String(ov.rankingOffsetY ?? ''),
          rankOffX: String(ov.rankingOffsetX ?? ''),
          cardImg: ov.rankingCardImageBase64
            ? { base64: ov.rankingCardImageBase64, mimeType: ov.rankingCardImageMime ?? 'image/png', previewUri: `data:${ov.rankingCardImageMime ?? 'image/png'};base64,${ov.rankingCardImageBase64}` }
            : EMPTY_IMG,
        };
      }
      setEditingOverride(ovMap);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadTamers(); }, []);

  function getOverrideFor(tamerId: string) {
    const base = TAMERS.find((t) => t.id === tamerId);
    return editingOverride[tamerId] ?? {
      offY: String(base?.avatarOffset ?? -8),
      offX: String(base?.avatarOffsetX ?? 0),
      rankOffY: String(base?.avatarOffset ?? -8),
      rankOffX: String(base?.avatarOffsetX ?? 0),
      cardImg: EMPTY_IMG,
    };
  }

  function setOverrideField(tamerId: string, field: string, value: string | ImageData) {
    setEditingOverride((prev) => ({
      ...prev,
      [tamerId]: { ...getOverrideFor(tamerId), [field]: value },
    }));
  }

  async function saveBuiltinOverride(tamerId: string) {
    const ov = getOverrideFor(tamerId);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        avatarOffsetY: parseInt(ov.offY) || 0,
        avatarOffsetX: parseInt(ov.offX) || 0,
        rankingOffsetY: parseInt(ov.rankOffY) || 0,
        rankingOffsetX: parseInt(ov.rankOffX) || 0,
      };
      if (ov.cardImg.base64) {
        body.rankingCardImageBase64 = ov.cardImg.base64;
        body.rankingCardImageMime = ov.cardImg.mimeType;
      }
      const res = await fetch(`${api}/tamers/overrides/${tamerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      Alert.alert('Salvo!', `Ajuste do tamer ${tamerId} salvo.`);
      loadTamers();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    }
    setSaving(false);
  }

  async function createTamer() {
    if (!form.name.trim() || !form.fullName.trim()) {
      Alert.alert('Atenção', 'Nome e nome completo são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        fullName: form.fullName.trim(),
        description: form.description.trim(),
        accentColor: form.accentColor.trim() || '#3b82f6',
        avatarOffsetY: parseInt(form.avatarOffsetY) || -8,
        avatarOffsetX: parseInt(form.avatarOffsetX) || 0,
        rankingOffsetY: parseInt(form.rankingOffsetY) || -8,
        rankingOffsetX: parseInt(form.rankingOffsetX) || 0,
        homeOffsetY: parseInt(form.homeOffsetY) || -8,
        homeOffsetX: parseInt(form.homeOffsetX) || 0,
        fragmentsToComplete: parseInt(form.fragmentsToComplete) || 10,
      };
      if (form.tamerImg.base64) { body.tamerImageBase64 = form.tamerImg.base64; body.tamerImageMime = form.tamerImg.mimeType; }
      if (form.rankingCardImg.base64) { body.rankingCardImageBase64 = form.rankingCardImg.base64; body.rankingCardImageMime = form.rankingCardImg.mimeType; }
      if (form.homeImg.base64) { body.homeImageBase64 = form.homeImg.base64; body.homeImageMime = form.homeImg.mimeType; }
      const res = await fetch(`${api}/tamers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      Alert.alert('Criado!', `Card "${form.name}" criado com sucesso.`);
      setForm(emptyForm());
      setTab('custom');
      loadTamers();
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o tamer.');
    }
    setSaving(false);
  }

  async function deleteTamer(id: number, name: string) {
    Alert.alert('Deletar', `Deletar card "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar', style: 'destructive', onPress: async () => {
          try {
            await fetch(`${api}/tamers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            loadTamers();
          } catch {
            Alert.alert('Erro', 'Não foi possível deletar.');
          }
        },
      },
    ]);
  }

  const tabConfigs: { key: Tab; label: string; color: string }[] = [
    { key: 'builtin', label: 'Tamers Padrão', color: '#3b82f6' },
    { key: 'custom', label: 'Cards Custom', color: '#8b5cf6' },
    { key: 'create', label: '+ Criar Card', color: '#22c55e' },
  ];

  return (
    <View>
      <View style={styles.tabRow}>
        {tabConfigs.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={[styles.tabBtn, { backgroundColor: tab === t.key ? t.color : colors.card, borderColor: tab === t.key ? t.color : colors.border }, pixelStyle]}>
            <Text style={{ color: tab === t.key ? '#fff' : colors.foreground, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}

      {tab === 'builtin' && !loading && (
        <View>
          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Ajustar tamers padrão</Text>
          <Text style={[{ color: colors.mutedForeground, fontSize: 12, marginBottom: 16 }]}>
            Ajuste o corte exato da imagem de cada tamer no ranking e no card.
          </Text>
          {TAMERS.map((tamer) => {
            const ov = getOverrideFor(tamer.id);
            return (
              <View key={tamer.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.colorDot, { backgroundColor: tamer.accentColor }]} />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{tamer.fullName}</Text>
                  <Text style={[{ color: colors.mutedForeground, fontSize: 11 }]}>{tamer.id}</Text>
                </View>
                <View style={styles.offsetRow}>
                  <View style={{ flex: 1 }}>
                    <FieldInput label="Avatar OffsetY" value={ov.offY} onChange={(v) => setOverrideField(tamer.id, 'offY', v)} numeric />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FieldInput label="Avatar OffsetX" value={ov.offX} onChange={(v) => setOverrideField(tamer.id, 'offX', v)} numeric />
                  </View>
                </View>
                <View style={styles.offsetRow}>
                  <View style={{ flex: 1 }}>
                    <FieldInput label="Ranking OffsetY" value={ov.rankOffY} onChange={(v) => setOverrideField(tamer.id, 'rankOffY', v)} numeric />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FieldInput label="Ranking OffsetX" value={ov.rankOffX} onChange={(v) => setOverrideField(tamer.id, 'rankOffX', v)} numeric />
                  </View>
                </View>
                <ImagePickerBlock
                  label="Card do Ranking (opcional, substitui o padrão)"
                  data={ov.cardImg}
                  onChange={(d) => setOverrideField(tamer.id, 'cardImg', d)}
                  cropWidth={800}
                  cropHeight={180}
                />
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: tamer.accentColor }, pixelStyle]}
                  onPress={() => saveBuiltinOverride(tamer.id)}
                  disabled={saving}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Salvando...' : 'Salvar ajustes'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {tab === 'custom' && !loading && (
        <View>
          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Cards Personalizados</Text>
          {customTamers.length === 0 && (
            <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: 16 }}>
              Nenhum card criado ainda. Crie um na aba "+ Criar Card".
            </Text>
          )}
          {customTamers.map((ct) => (
            <View key={ct.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
              <View style={styles.cardHeader}>
                <View style={[styles.colorDot, { backgroundColor: ct.accentColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{ct.fullName}</Text>
                  <Text style={[{ color: colors.mutedForeground, fontSize: 11 }]}>
                    {ct.fragmentsToComplete} fragmentos = 1 card • custom_tamer_{ct.id}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deleteTamer(ct.id, ct.name)}
                  style={[styles.deleteBtn, { borderColor: '#ef4444' }, pixelStyle]}>
                  <Text style={{ color: '#ef4444', fontSize: 12 }}>Deletar</Text>
                </TouchableOpacity>
              </View>
              <Text style={[{ color: colors.mutedForeground, fontSize: 12, marginBottom: 8 }]}>{ct.description}</Text>
              <View style={styles.previewRow}>
                {ct.tamerImageBase64 && (
                  <View style={styles.previewItem}>
                    <Image source={{ uri: `data:${ct.tamerImageMime};base64,${ct.tamerImageBase64}` }} style={styles.previewImg} resizeMode="contain" />
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Tamer</Text>
                  </View>
                )}
                {ct.rankingCardImageBase64 && (
                  <View style={styles.previewItem}>
                    <Image source={{ uri: `data:${ct.rankingCardImageMime};base64,${ct.rankingCardImageBase64}` }} style={styles.previewImg} resizeMode="contain" />
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Card Ranking</Text>
                  </View>
                )}
                {ct.homeImageBase64 && (
                  <View style={styles.previewItem}>
                    <Image source={{ uri: `data:${ct.homeImageMime};base64,${ct.homeImageBase64}` }} style={styles.previewImg} resizeMode="contain" />
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Início</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {tab === 'create' && (
        <View>
          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Criar Card Personalizado</Text>
          <Text style={[{ color: colors.mutedForeground, fontSize: 12, marginBottom: 16 }]}>
            Crie um card que jogadores podem colecionar. 10 fragmentos = 1 card completo.
            Os fragmentos podem ser configurados como drops em fases.
          </Text>
          <FieldInput label="Nome curto" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Ex: Ken" />
          <FieldInput label="Nome completo" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} placeholder="Ex: Ken Ichijoji" />
          <FieldInput label="Descrição" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline placeholder="Descrição do personagem..." />

          <ColorPickerField
            label="Cor de destaque"
            value={form.accentColor}
            onChange={(v) => setForm({ ...form, accentColor: v })}
          />

          <FieldInput label="Fragmentos para completar" value={form.fragmentsToComplete} onChange={(v) => setForm({ ...form, fragmentsToComplete: v })} numeric />

          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Ajuste de Posição das Imagens</Text>
          <View style={styles.offsetRow}>
            <View style={{ flex: 1 }}><FieldInput label="Avatar OffsetY" value={form.avatarOffsetY} onChange={(v) => setForm({ ...form, avatarOffsetY: v })} numeric /></View>
            <View style={{ flex: 1 }}><FieldInput label="Avatar OffsetX" value={form.avatarOffsetX} onChange={(v) => setForm({ ...form, avatarOffsetX: v })} numeric /></View>
          </View>
          <View style={styles.offsetRow}>
            <View style={{ flex: 1 }}><FieldInput label="Ranking OffsetY" value={form.rankingOffsetY} onChange={(v) => setForm({ ...form, rankingOffsetY: v })} numeric /></View>
            <View style={{ flex: 1 }}><FieldInput label="Ranking OffsetX" value={form.rankingOffsetX} onChange={(v) => setForm({ ...form, rankingOffsetX: v })} numeric /></View>
          </View>
          <View style={styles.offsetRow}>
            <View style={{ flex: 1 }}><FieldInput label="Início OffsetY" value={form.homeOffsetY} onChange={(v) => setForm({ ...form, homeOffsetY: v })} numeric /></View>
            <View style={{ flex: 1 }}><FieldInput label="Início OffsetX" value={form.homeOffsetX} onChange={(v) => setForm({ ...form, homeOffsetX: v })} numeric /></View>
          </View>

          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Imagens do Card</Text>
          <ImagePickerBlock
            label="Imagem do Tamer (avatar/fundo — círculo)"
            data={form.tamerImg}
            onChange={(d) => setForm({ ...form, tamerImg: d })}
            cropWidth={200}
            cropHeight={450}
          />
          <ImagePickerBlock
            label="Card do Ranking (fundo do card no placar)"
            data={form.rankingCardImg}
            onChange={(d) => setForm({ ...form, rankingCardImg: d })}
            cropWidth={800}
            cropHeight={180}
          />
          <ImagePickerBlock
            label="Imagem da Tela Inicial (fundo do herói)"
            data={form.homeImg}
            onChange={(d) => setForm({ ...form, homeImg: d })}
            cropWidth={1080}
            cropHeight={400}
          />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: '#22c55e', marginTop: 8 }, pixelStyle]}
            onPress={createTamer}
            disabled={saving}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{saving ? 'Criando...' : 'Criar Card'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  card: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  cardTitle: { fontWeight: '700', fontSize: 12, flex: 1 },
  offsetRow: { flexDirection: 'row', gap: 8 },
  saveBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  deleteBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  previewRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  previewItem: { alignItems: 'center', gap: 4 },
  previewImg: { width: 60, height: 80, borderRadius: 6 },
  previewLabel: { fontSize: 10 },
});
