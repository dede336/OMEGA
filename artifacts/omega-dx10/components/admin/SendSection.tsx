import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Image,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { CHARACTERS, EQUIPMENT_ITEMS, CRAFT_RECIPES, RARITY_COLORS, RARITY_LABELS } from '@/constants/gameData';
import { getCharacterImageSource } from '@/constants/extendedCharacters';
import { pixelStyle } from '@/constants/pixelStyle';
import { DigimonPickerModal, FieldInput, ss } from './AdminShared';

type SendTab = 'digimon' | 'item' | 'fragmento' | 'gemas' | 'copiar';

interface CustomDigimon { id: string; name: string; dbId: number; }
interface ApiItem { id: string; dbId: number; name: string; type: string; rarity: string; }

// ── Static lists ────────────────────────────────────────────────────────────

const STATIC_ITEMS = EQUIPMENT_ITEMS.map((i) => ({ id: i.id, name: i.name, rarity: i.rarity }));

// Also include crafted items that exist in inventory (not in EQUIPMENT_ITEMS)
const EXTRA_STATIC_ITEMS: { id: string; name: string; rarity: string }[] = [
  { id: 'anel_sagrado', name: 'Anel Sagrado ✨', rarity: 'LEGENDARY' },
];

const ALL_STATIC_ITEMS = [
  ...STATIC_ITEMS,
  ...EXTRA_STATIC_ITEMS.filter((e) => !STATIC_ITEMS.find((i) => i.id === e.id)),
];

const STATIC_FRAGMENTS = Array.from(
  new Map(
    CRAFT_RECIPES.map((r) => [r.pieceId, { id: r.pieceId, name: r.pieceName }])
  ).values()
);

// ── Rarity helpers ───────────────────────────────────────────────────────────

function rarityColor(r: string) {
  const map: Record<string, string> = { COMMON: '#6b7280', RARE: '#3b82f6', EPIC: '#8b5cf6', LEGENDARY: '#f59e0b' };
  return RARITY_COLORS[r as keyof typeof RARITY_COLORS] ?? map[r] ?? '#6b7280';
}
function rarityLabel(r: string) {
  return RARITY_LABELS[r as keyof typeof RARITY_LABELS] ?? r;
}

// ── Item picker ──────────────────────────────────────────────────────────────

function ItemPicker({
  items, selected, onSelect, placeholder,
}: {
  items: { id: string; name: string; rarity?: string }[];
  selected: string;
  onSelect: (id: string, name: string) => void;
  placeholder: string;
}) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const sel = items.find((i) => i.id === selected);

  if (sel) {
    return (
      <View style={[pk.selRow, { backgroundColor: colors.background, borderColor: rarityColor(sel.rarity ?? 'COMMON') }, pixelStyle]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{sel.name}</Text>
          {sel.rarity && (
            <Text style={{ color: rarityColor(sel.rarity), fontSize: 11 }}>{rarityLabel(sel.rarity)}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => onSelect('', '')}>
          <Text style={{ color: '#ef4444', fontWeight: '700', paddingHorizontal: 8 }}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <TextInput
        style={[pk.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
        value={search}
        onChangeText={setSearch}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
      />
      <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => { onSelect(item.id, item.name); setSearch(''); }}
            style={[pk.row, { backgroundColor: colors.background, borderColor: colors.border }, pixelStyle]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
              {item.rarity && (
                <Text style={{ color: rarityColor(item.rarity), fontSize: 11 }}>{rarityLabel(item.rarity)}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 12, fontSize: 13 }}>
            Nenhum resultado
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const pk = StyleSheet.create({
  selRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, padding: 10 },
  input:  { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, borderWidth: 1, padding: 8, marginBottom: 4 },
});

// ── Main component ───────────────────────────────────────────────────────────

export default function SendSection() {
  const colors = useColors();
  const { token, getApiUrl } = useAuth();
  const apiUrl = getApiUrl();
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` };

  const [tab, setTab] = useState<SendTab>('digimon');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Copy save state
  const [copySrc, setCopySrc] = useState('');
  const [copyDst, setCopyDst] = useState('');

  // API data
  const [customDigimons, setCustomDigimons] = useState<CustomDigimon[]>([]);
  const [apiItems, setApiItems]             = useState<ApiItem[]>([]);

  // Digimon send state
  const [digimonId, setDigimonId]     = useState('');
  const [digimonName, setDigimonName] = useState('');
  const [digimonLevel, setDigimonLevel] = useState('1');
  const [pickerOpen, setPickerOpen]   = useState(false);

  // Item send state
  const [itemId, setItemId]   = useState('');
  const [itemName, setItemName] = useState('');

  // Fragment send state
  const [fragId, setFragId]   = useState('');
  const [fragName, setFragName] = useState('');
  const [fragAmt, setFragAmt] = useState('1');

  // Gems send state
  const [gemasAmt, setGemasAmt] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [digRes, itemRes] = await Promise.all([
        fetch(`${apiUrl}/digimons/custom`).then((r) => r.json()).catch(() => ({ digimons: [] })),
        fetch(`${apiUrl}/items`).then((r) => r.json()).catch(() => ({ items: [] })),
      ]);
      setCustomDigimons(Array.isArray(digRes.digimons) ? digRes.digimons.map((d: any) => ({ id: d.id, name: d.name, dbId: d.dbId })) : []);
      setApiItems(Array.isArray(itemRes.items) ? itemRes.items : []);
    } catch {}
  }, [apiUrl]);

  useEffect(() => { loadData(); }, [loadData]);

  // Build combined item lists
  const staticNames = new Set(STATIC_ITEMS.map((i) => i.name.toLowerCase()));
  const apiEquipItems = apiItems
    .filter((i) => i.type === 'equipment' && !staticNames.has(i.name.toLowerCase()))
    .map((i) => ({ id: i.id, name: i.name, rarity: i.rarity }));
  const apiFrag = apiItems
    .filter((i) => i.type === 'fragment')
    .map((i) => ({ id: i.id, name: i.name }));

  const allItems = [...ALL_STATIC_ITEMS, ...apiEquipItems];
  const allFragments = [
    ...STATIC_FRAGMENTS,
    ...apiFrag.filter((f) => !STATIC_FRAGMENTS.find((s) => s.id === f.id)),
  ];

  async function handleCopySave() {
    if (!copySrc.trim() || !copyDst.trim()) {
      Alert.alert('Erro', 'Informe o username de origem e destino');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/saves/copy`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ sourceUsername: copySrc.trim(), targetUsername: copyDst.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error ?? 'Falha ao copiar save'); return; }
      Alert.alert('✅ Copiado!', data.message ?? 'Save copiado com sucesso!');
      setCopySrc(''); setCopyDst('');
    } catch (e) { Alert.alert('Erro', String(e)); }
    finally { setLoading(false); }
  }

  async function doSend(body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/digimons/send`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ username: username.trim(), ...body }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error ?? 'Falha ao enviar'); return; }
      Alert.alert('✅ Enviado!', data.message ?? `Enviado com sucesso para ${username}`);
      // Reset selection
      setDigimonId(''); setDigimonName(''); setDigimonLevel('1');
      setItemId(''); setItemName('');
      setFragId(''); setFragName(''); setFragAmt('1');
      setGemasAmt('');
    } catch (e) { Alert.alert('Erro', String(e)); }
    finally { setLoading(false); }
  }

  function handleSend() {
    if (!username.trim()) { Alert.alert('Erro', 'Informe o username do jogador'); return; }

    if (tab === 'digimon') {
      if (!digimonId) { Alert.alert('Erro', 'Selecione um Digimon'); return; }
      doSend({ characterId: digimonId, characterName: digimonName, level: Number(digimonLevel) || 1 });
    } else if (tab === 'item') {
      if (!itemId) { Alert.alert('Erro', 'Selecione um Item'); return; }
      doSend({ items: [itemId], itemNames: [itemName] });
    } else if (tab === 'fragmento') {
      if (!fragId) { Alert.alert('Erro', 'Selecione um Fragmento'); return; }
      doSend({ fragments: [{ pieceId: fragId, amount: Number(fragAmt) || 1 }], fragmentNames: [fragName] });
    } else if (tab === 'gemas') {
      const amt = Number(gemasAmt);
      if (!amt || amt <= 0) { Alert.alert('Erro', 'Informe uma quantidade válida de gemas'); return; }
      doSend({ gemas: amt });
    }
  }

  const TABS: { key: SendTab; label: string; emoji: string; color: string }[] = [
    { key: 'digimon',   label: 'Digimon',   emoji: '🦖', color: '#3b82f6' },
    { key: 'item',      label: 'Item',      emoji: '⚔️',  color: '#f59e0b' },
    { key: 'fragmento', label: 'Fragmento', emoji: '🔮', color: '#8b5cf6' },
    { key: 'gemas',     label: 'Gemas',     emoji: '💎', color: '#06b6d4' },
    { key: 'copiar',    label: 'Copiar',    emoji: '📋', color: '#22c55e' },
  ];

  return (
    <View style={{ gap: 14 }}>
      {/* Header */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>🎁 Enviar para Jogador</Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
          Envie Digimons, itens, fragmentos ou gemas diretamente para o save de qualquer jogador.
        </Text>
      </View>

      {/* Type tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabBtn, {
              backgroundColor: tab === t.key ? t.color : colors.card,
              borderColor: tab === t.key ? t.color : colors.border,
            }]}
          >
            <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
            <Text style={{ color: tab === t.key ? '#fff' : colors.foreground, fontSize: 11, fontWeight: '700' }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Username (common) — hidden for copiar tab */}
      {tab !== 'copiar' && (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
        <Text style={[ss.label, { color: colors.mutedForeground }]}>Username do jogador *</Text>
        <TextInput
          style={[pk.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
          value={username}
          onChangeText={setUsername}
          placeholder="Ex: dede336"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
        />

        {/* ── DIGIMON ── */}
        {tab === 'digimon' && (
          <>
            <Text style={[ss.label, { color: colors.mutedForeground, marginTop: 8 }]}>Digimon</Text>
            {digimonId ? (
              <View style={[pk.selRow, { backgroundColor: colors.background, borderColor: RARITY_COLORS[CHARACTERS[digimonId]?.rarity ?? 'COMMON'] ?? '#6b7280' }, pixelStyle]}>
                {getCharacterImageSource(digimonId) ? (
                  <Image source={getCharacterImageSource(digimonId)!} style={{ width: 28, height: 28 }} resizeMode="contain" />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{digimonName}</Text>
                  {CHARACTERS[digimonId] && (
                    <Text style={{ color: rarityColor(CHARACTERS[digimonId].rarity), fontSize: 11 }}>
                      {rarityLabel(CHARACTERS[digimonId].rarity)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => { setDigimonId(''); setDigimonName(''); }}>
                  <Text style={{ color: '#ef4444', fontWeight: '700', paddingHorizontal: 8 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setPickerOpen(true)}
                style={[pk.input, { justifyContent: 'center', borderStyle: 'dashed' }, pixelStyle]}
              >
                <Text style={{ color: colors.mutedForeground }}>Selecionar Digimon...</Text>
              </TouchableOpacity>
            )}
            <Text style={[ss.label, { color: colors.mutedForeground, marginTop: 8 }]}>Level</Text>
            <TextInput
              style={[pk.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
              value={digimonLevel}
              onChangeText={setDigimonLevel}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={colors.mutedForeground}
            />
          </>
        )}

        {/* ── ITEM ── */}
        {tab === 'item' && (
          <>
            <Text style={[ss.label, { color: colors.mutedForeground, marginTop: 8 }]}>
              Item ({allItems.length} disponíveis)
            </Text>
            <ItemPicker
              items={allItems}
              selected={itemId}
              onSelect={(id, name) => { setItemId(id); setItemName(name); }}
              placeholder="Buscar item..."
            />
          </>
        )}

        {/* ── FRAGMENTO ── */}
        {tab === 'fragmento' && (
          <>
            <Text style={[ss.label, { color: colors.mutedForeground, marginTop: 8 }]}>
              Fragmento ({allFragments.length} disponíveis)
            </Text>
            <ItemPicker
              items={allFragments}
              selected={fragId}
              onSelect={(id, name) => { setFragId(id); setFragName(name); }}
              placeholder="Buscar fragmento..."
            />
            <Text style={[ss.label, { color: colors.mutedForeground, marginTop: 8 }]}>Quantidade</Text>
            <TextInput
              style={[pk.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
              value={fragAmt}
              onChangeText={setFragAmt}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={colors.mutedForeground}
            />
          </>
        )}

        {/* ── GEMAS ── */}
        {tab === 'gemas' && (
          <>
            <Text style={[ss.label, { color: colors.mutedForeground, marginTop: 8 }]}>Quantidade de gemas 💎</Text>
            <TextInput
              style={[pk.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
              value={gemasAmt}
              onChangeText={setGemasAmt}
              keyboardType="numeric"
              placeholder="Ex: 500"
              placeholderTextColor={colors.mutedForeground}
            />
            {gemasAmt && Number(gemasAmt) > 0 && (
              <View style={[styles.gemPreview, { backgroundColor: '#06b6d411', borderColor: '#06b6d444' }, pixelStyle]}>
                <Text style={{ color: '#06b6d4', fontSize: 18 }}>💎</Text>
                <Text style={{ color: '#06b6d4', fontWeight: '800', fontSize: 14 }}>+{Number(gemasAmt).toLocaleString()}</Text>
                <Text style={{ color: '#06b6d499', fontSize: 12 }}>gemas serão adicionadas</Text>
              </View>
            )}
          </>
        )}

        {/* Send button (for non-copiar tabs) */}
        {tab !== 'copiar' && (
          <TouchableOpacity
            style={[styles.sendBtn, {
              backgroundColor: TABS.find((t) => t.key === tab)?.color ?? '#8b5cf6',
              opacity: loading ? 0.6 : 1,
              marginTop: 16,
            }, pixelStyle]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size={16} color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                  {tab === 'digimon'   ? '🦖 Enviar Digimon'   :
                   tab === 'item'      ? '⚔️ Enviar Item'       :
                   tab === 'fragmento' ? '🔮 Enviar Fragmento'  :
                                        '💎 Enviar Gemas'}
                </Text>
            }
          </TouchableOpacity>
        )}
      </View>
      )}

      {/* ── COPIAR SAVE ── (separate card, always outside username card) */}
      {tab === 'copiar' && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: '#22c55e55' }, pixelStyle]}>
          <Text style={[styles.cardTitle, { color: '#22c55e' }]}>📋 Copiar Save entre Contas</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
            Copia todo o progresso (Digimons, itens, gemas, etc.) de uma conta para outra.
          </Text>
          <Text style={[ss.label, { color: colors.mutedForeground, marginTop: 8 }]}>Username de ORIGEM (quem tem o save) *</Text>
          <TextInput
            style={[pk.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
            value={copySrc}
            onChangeText={setCopySrc}
            placeholder="Ex: jogador_antigo"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
          />
          <Text style={[ss.label, { color: colors.mutedForeground, marginTop: 8 }]}>Username de DESTINO (quem vai receber) *</Text>
          <TextInput
            style={[pk.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
            value={copyDst}
            onChangeText={setCopyDst}
            placeholder="Ex: conta_nova"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
          />
          <View style={[styles.gemPreview, { backgroundColor: '#ef444411', borderColor: '#ef444444', marginTop: 4 }, pixelStyle]}>
            <Text style={{ color: '#ef4444', fontSize: 12, textAlign: 'center' }}>
              ⚠️ Isso substituirá o save atual da conta destino. Essa ação é irreversível.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: '#22c55e', opacity: loading ? 0.6 : 1, marginTop: 12 }, pixelStyle]}
            onPress={handleCopySave}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size={16} color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>📋 Copiar Save</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Digimon picker modal */}
      <DigimonPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        customDigimons={customDigimons.map((d) => ({ id: d.id, name: d.name }))}
        onSelect={(id, name) => { setDigimonId(id); setDigimonName(name); setPickerOpen(false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card:      { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800' as const },
  cardDesc:  { fontSize: 13, lineHeight: 18 },
  tabRow:    { flexDirection: 'row', gap: 8 },
  tabBtn:    { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 10, alignItems: 'center', gap: 4 },
  sendBtn:   { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  gemPreview:{ borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center', gap: 4, marginTop: 8 },
});
