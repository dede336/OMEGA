import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Image, Modal,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { CHARACTERS, RARITY_COLORS, RARITY_LABELS, EQUIPMENT_ITEMS, CRAFT_RECIPES } from '@/constants/gameData';
import { getCharacterImageSource, getCharacter } from '@/constants/extendedCharacters';
import { AnimatedEgg } from '@/components/GameComponents';
import { EGG_IMAGES } from '@/constants/characterImages';
import type { GachaPoolEntry } from '@/context/GameContext';
import { pixelStyle } from '@/constants/pixelStyle';

// ── Static item/fragment lists (from game source) ────────────────────────────
const STATIC_EQUIP_ITEMS = EQUIPMENT_ITEMS.map((i) => ({
  id: i.id, name: i.name, rarity: i.rarity, isStatic: true as const,
}));

// Extra crafted items that live in inventory
const EXTRA_STATIC_ITEMS: { id: string; name: string; rarity: string; isStatic: true }[] = [
  { id: 'anel_sagrado', name: 'Anel Sagrado ✨', rarity: 'LEGENDARY', isStatic: true },
];

const ALL_STATIC_ITEMS = [
  ...STATIC_EQUIP_ITEMS,
  ...EXTRA_STATIC_ITEMS.filter((e) => !STATIC_EQUIP_ITEMS.find((i) => i.id === e.id)),
];

// Unique fragments from CRAFT_RECIPES
const STATIC_FRAGMENTS = Array.from(
  new Map(CRAFT_RECIPES.map((r) => [r.pieceId, { id: r.pieceId, name: r.pieceName, isStatic: true as const }])).values()
);

// Slot limits
const SLOT_LIMITS: Record<GachaPoolEntry['raridade'], number | null> = {
  Comum:    10,
  Especial: 6,
  Raro:     null, // dynamic — 1-5 chosen by admin
};

const RARITY_SLOTS: { key: GachaPoolEntry['raridade']; label: string; color: string; emoji: string }[] = [
  { key: 'Comum',    label: 'Comum',    color: '#6b7280', emoji: '⚪' },
  { key: 'Especial', label: 'Especial', color: '#8b5cf6', emoji: '🟣' },
  { key: 'Raro',     label: 'Raro ✦',  color: '#f59e0b', emoji: '🌟' },
];

const TIPO_OPTIONS: { key: GachaPoolEntry['tipo']; label: string; emoji: string }[] = [
  { key: 'DIGIMON',   label: 'Digimon',   emoji: '🦖' },
  { key: 'ITEM',      label: 'Item',      emoji: '⚔️' },
  { key: 'FRAGMENTO', label: 'Fragmento', emoji: '🔮' },
];

const STATIC_CHARS = Object.values(CHARACTERS);

interface ApiItem {
  id: string;
  dbId: number;
  name: string;
  type: string;
  rarity: string;
  description: string;
}

interface ApiDigimon {
  id: string;
  dbId: number;
  name: string;
  rarity: string;
  attribute: string;
  hasImage: boolean;
}

function AddItemModal({
  visible, onClose, onAdd, apiUrl,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (entry: Omit<GachaPoolEntry, 'raridade'>) => void;
  apiUrl: string;
}) {
  const colors = useColors();
  const [tipo, setTipo]         = useState<GachaPoolEntry['tipo']>('DIGIMON');
  const [search, setSearch]     = useState('');
  const [selectedId, setSelectedId] = useState('');

  // Remote data
  const [apiItems, setApiItems]       = useState<ApiItem[]>([]);
  const [apiDigimons, setApiDigimons] = useState<ApiDigimon[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch items + custom digimons from API when modal opens
  useEffect(() => {
    if (!visible) return;
    setLoadingData(true);
    Promise.all([
      fetch(`${apiUrl}/items`).then((r) => r.json()).catch(() => ({ items: [] })),
      fetch(`${apiUrl}/digimons/custom`).then((r) => r.json()).catch(() => ({ digimons: [] })),
    ]).then(([itemsData, digimonsData]) => {
      setApiItems(Array.isArray(itemsData.items) ? itemsData.items : []);
      setApiDigimons(Array.isArray(digimonsData.digimons) ? digimonsData.digimons : []);
    }).finally(() => setLoadingData(false));
  }, [visible, apiUrl]);

  // All digimons = static + custom (deduped by name)
  const staticNames = new Set(STATIC_CHARS.map((c) => c.name.toLowerCase()));
  const customDigimonsFiltered = apiDigimons.filter(
    (d) => !staticNames.has(d.name.toLowerCase())
  );

  const allDigimons = [
    ...STATIC_CHARS.map((c) => ({
      id: c.id,
      name: c.name,
      rarity: c.rarity,
      isCustom: false as const,
    })),
    ...customDigimonsFiltered.map((d) => ({
      id: d.id,
      name: d.name,
      rarity: d.rarity,
      isCustom: true as const,
      dbId: d.dbId,
    })),
  ];

  const filteredDigimons = allDigimons.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  // Combined item/fragment lists: static (from source code) + custom (from API)
  const apiEquipNames = new Set(apiItems.filter((i) => i.type === 'equipment').map((i) => i.name.toLowerCase()));
  const apiFragNames  = new Set(apiItems.filter((i) => i.type === 'fragment').map((i) => i.name.toLowerCase()));

  const combinedItems: { id: string; name: string; rarity: string; isStatic: boolean }[] = tipo === 'ITEM'
    ? [
        ...ALL_STATIC_ITEMS.filter((i) => !apiEquipNames.has(i.name.toLowerCase())),
        ...apiItems.filter((i) => i.type === 'equipment').map((i) => ({ id: i.id, name: i.name, rarity: i.rarity, isStatic: false })),
      ]
    : [
        ...STATIC_FRAGMENTS.filter((i) => !apiFragNames.has(i.name.toLowerCase())).map((i) => ({ ...i, rarity: 'COMMON' })),
        ...apiItems.filter((i) => i.type === 'fragment').map((i) => ({ id: i.id, name: i.name, rarity: i.rarity, isStatic: false })),
      ];

  const filteredCombinedItems = combinedItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Keep for backward compat (selected item lookup)
  const filteredApiItems = filteredCombinedItems;

  function getDigimonRarityColor(rarity: string): string {
    return RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] ?? '#6b7280';
  }

  function getDigimonRarityLabel(rarity: string): string {
    return RARITY_LABELS[rarity as keyof typeof RARITY_LABELS] ?? rarity;
  }

  function getItemRarityColor(rarity: string): string {
    const map: Record<string, string> = {
      COMMON: '#6b7280', RARE: '#3b82f6', EPIC: '#8b5cf6', LEGENDARY: '#f59e0b',
    };
    return map[rarity] ?? '#6b7280';
  }

  function getItemRarityLabel(rarity: string): string {
    const map: Record<string, string> = {
      COMMON: 'Comum', RARE: 'Raro', EPIC: 'Épico', LEGENDARY: 'Lendário',
    };
    return map[rarity] ?? rarity;
  }

  function handleAdd() {
    if (tipo === 'DIGIMON') {
      if (!selectedId) { Alert.alert('Selecione um Digimon'); return; }
      const staticChar = CHARACTERS[selectedId];
      if (staticChar) {
        onAdd({ id: selectedId, nome: staticChar.name, tipo: 'DIGIMON', characterId: selectedId });
      } else {
        const custom = customDigimonsFiltered.find((d) => d.id === selectedId);
        if (custom) {
          onAdd({ id: selectedId, nome: custom.name, tipo: 'DIGIMON', characterId: selectedId });
        }
      }
    } else {
      if (!selectedId) {
        Alert.alert('Selecione um ' + (tipo === 'ITEM' ? 'Item' : 'Fragmento'));
        return;
      }
      const item = combinedItems.find((i) => i.id === selectedId);
      if (item) {
        onAdd({ id: item.id, nome: item.name, tipo });
      }
    }
    setSearch(''); setSelectedId('');
    onClose();
  }

  function resetState() {
    setSearch(''); setSelectedId('');
  }

  const selectedDigimon = selectedId
    ? (CHARACTERS[selectedId] ? { name: CHARACTERS[selectedId].name, rarity: CHARACTERS[selectedId].rarity, isCustom: false }
      : (() => { const c = customDigimonsFiltered.find((d) => d.id === selectedId); return c ? { name: c.name, rarity: c.rarity, isCustom: true, dbId: c.dbId } : null; })())
    : null;

  const selectedItem = selectedId ? combinedItems.find((i) => i.id === selectedId) : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalPanel, { backgroundColor: colors.card }, pixelStyle]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>➕ Adicionar ao Pool</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Tipo de premiação</Text>
          <View style={styles.tipoRow}>
            {TIPO_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => { setTipo(t.key); resetState(); }}
                style={[styles.tipoBtn, {
                  backgroundColor: tipo === t.key ? '#8b5cf6' : colors.background,
                  borderColor: tipo === t.key ? '#8b5cf6' : colors.border,
                }]}
              >
                <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
                <Text style={{ color: tipo === t.key ? '#fff' : colors.foreground, fontSize: 12, fontWeight: '600' }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loadingData ? (
            <ActivityIndicator color="#8b5cf6" style={{ marginVertical: 20 }} />
          ) : (
            <>
              {/* ── DIGIMON PICKER ── */}
              {tipo === 'DIGIMON' && (
                <>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Buscar Digimon ({allDigimons.length} disponíveis)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Nome do Digimon..."
                    placeholderTextColor={colors.mutedForeground}
                  />

                  {selectedDigimon ? (
                    <View style={[styles.selectedRow, { backgroundColor: colors.background, borderColor: getDigimonRarityColor(selectedDigimon.rarity) }, pixelStyle]}>
                      {!selectedDigimon.isCustom && getCharacterImageSource(selectedId) ? (
                        <Image source={getCharacterImageSource(selectedId)!} style={{ width: 32, height: 32 }} resizeMode="contain" />
                      ) : selectedDigimon.isCustom && (selectedDigimon as any).dbId ? (
                        <Image source={{ uri: `${apiUrl}/digimons/custom/${(selectedDigimon as any).dbId}/image` }} style={{ width: 32, height: 32 }} resizeMode="contain" />
                      ) : (
                        <View style={[styles.fallbackIcon, { backgroundColor: getDigimonRarityColor(selectedDigimon.rarity) + '33' }]}>
                          <Text style={{ fontSize: 14 }}>🦖</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{selectedDigimon.name}</Text>
                        <Text style={{ color: getDigimonRarityColor(selectedDigimon.rarity), fontSize: 11 }}>
                          {getDigimonRarityLabel(selectedDigimon.rarity)}
                          {selectedDigimon.isCustom ? ' · Customizado' : ''}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedId('')}>
                        <Text style={{ color: '#ef4444', fontWeight: '700' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {filteredDigimons.map((c) => {
                        const img = !c.isCustom ? getCharacterImageSource(c.id) : null;
                        const customDbId = (c as any).dbId;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            onPress={() => { setSelectedId(c.id); setSearch(''); }}
                            style={[styles.charRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                          >
                            {img ? (
                              <Image source={img} style={{ width: 28, height: 28 }} resizeMode="contain" />
                            ) : c.isCustom && customDbId ? (
                              <Image source={{ uri: `${apiUrl}/digimons/custom/${customDbId}/image` }} style={{ width: 28, height: 28 }} resizeMode="contain" />
                            ) : (
                              <View style={[styles.fallbackIcon, { width: 28, height: 28, backgroundColor: getDigimonRarityColor(c.rarity) + '33' }]}>
                                <Text style={{ fontSize: 12 }}>🦖</Text>
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{c.name}</Text>
                              <Text style={{ color: getDigimonRarityColor(c.rarity), fontSize: 11 }}>
                                {getDigimonRarityLabel(c.rarity)}
                                {c.isCustom ? ' · ✨ Customizado' : ''}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      {filteredDigimons.length === 0 && (
                        <Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 12, fontSize: 13 }}>
                          Nenhum Digimon encontrado
                        </Text>
                      )}
                    </ScrollView>
                  )}
                </>
              )}

              {/* ── ITEM / FRAGMENTO PICKER ── */}
              {(tipo === 'ITEM' || tipo === 'FRAGMENTO') && (
                <>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    {tipo === 'ITEM' ? 'Selecionar Item' : 'Selecionar Fragmento'}
                    {' '}({combinedItems.length} disponíveis)
                  </Text>

                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
                    value={search}
                    onChangeText={setSearch}
                    placeholder={tipo === 'ITEM' ? 'Buscar item...' : 'Buscar fragmento...'}
                    placeholderTextColor={colors.mutedForeground}
                  />

                  {selectedItem ? (
                    <View style={[styles.selectedRow, { backgroundColor: colors.background, borderColor: getItemRarityColor(selectedItem.rarity) }, pixelStyle]}>
                      <View style={[styles.fallbackIcon, { backgroundColor: getItemRarityColor(selectedItem.rarity) + '33' }]}>
                        <Text style={{ fontSize: 14 }}>{tipo === 'ITEM' ? '⚔️' : '🔮'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>{selectedItem.name}</Text>
                        <Text style={{ color: getItemRarityColor(selectedItem.rarity), fontSize: 11 }}>
                          {getItemRarityLabel(selectedItem.rarity)}
                          {(selectedItem as any).isStatic === false ? ' · Customizado' : ''}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedId('')}>
                        <Text style={{ color: '#ef4444', fontWeight: '700' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {filteredCombinedItems.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => { setSelectedId(item.id); setSearch(''); }}
                          style={[styles.charRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                        >
                          <View style={[styles.fallbackIcon, { width: 28, height: 28, backgroundColor: getItemRarityColor(item.rarity) + '33' }]}>
                            <Text style={{ fontSize: 12 }}>{tipo === 'ITEM' ? '⚔️' : '🔮'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
                            <Text style={{ color: getItemRarityColor(item.rarity), fontSize: 11 }}>
                              {getItemRarityLabel(item.rarity)}
                              {!item.isStatic ? ' · Customizado' : ''}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                      {filteredCombinedItems.length === 0 && (
                        <Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 12, fontSize: 13 }}>
                          Nenhum resultado para "{search}"
                        </Text>
                      )}
                    </ScrollView>
                  )}
                </>
              )}
            </>
          )}

          <View style={styles.modalBtns}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.mutedForeground, fontWeight: '700' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SlotSection({
  slot, entries, maxEntries, onAdd, onRemove, apiUrl,
}: {
  slot: typeof RARITY_SLOTS[number];
  entries: GachaPoolEntry[];
  maxEntries: number;
  onAdd: () => void;
  onRemove: (id: string, idx: number) => void;
  apiUrl: string;
}) {
  const colors = useColors();
  const isFull = entries.length >= maxEntries;
  const progressColor = isFull ? '#22c55e' : slot.color;

  return (
    <View style={[styles.slotCard, { borderColor: slot.color + '55', backgroundColor: slot.color + '0A' }, pixelStyle]}>
      {/* Header */}
      <View style={styles.slotHeader}>
        <Text style={[styles.slotTitle, { color: slot.color }]}>{slot.emoji} {slot.label}</Text>
        <View style={[styles.slotBadge, {
          backgroundColor: isFull ? '#22c55e22' : slot.color + '22',
          borderColor: isFull ? '#22c55e66' : slot.color + '55',
        }]}>
          <Text style={{ color: progressColor, fontWeight: '800', fontSize: 13 }}>
            {entries.length}/{maxEntries}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: slot.color + '22' }]}>
        <View style={[styles.progressFill, {
          backgroundColor: progressColor,
          width: `${Math.min((entries.length / maxEntries) * 100, 100)}%` as any,
        }]} />
      </View>

      {/* Empty state */}
      {entries.length === 0 && (
        <View style={[styles.emptySlot, { borderColor: slot.color + '44' }]}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Nenhum item nesta raridade</Text>
        </View>
      )}

      {/* Entries */}
      {entries.map((entry, idx) => {
        const isDigimon = entry.tipo === 'DIGIMON' && entry.characterId;
        const char = isDigimon ? (getCharacter(entry.characterId!) ?? CHARACTERS[entry.characterId!]) : null;
        const isEgg = char?.rarity === 'EGG';
        const img  = isDigimon && char && !isEgg ? getCharacterImageSource(entry.characterId!) : null;
        const tipoEmoji = entry.tipo === 'DIGIMON' ? '🦖' : entry.tipo === 'ITEM' ? '⚔️' : '🔮';
        const isCustomDigimon = isDigimon && !char;

        return (
          <View key={`${entry.id}_${idx}`} style={[styles.entryRow, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
            {isEgg && isDigimon ? (
              <AnimatedEgg characterId={entry.characterId!} element={char?.element ?? 'NULL'} size={34} />
            ) : img ? (
              <Image source={img} style={{ width: 34, height: 34 }} resizeMode="contain" />
            ) : isCustomDigimon ? (
              <Image
                source={{ uri: `${apiUrl}/digimons/custom/${entry.characterId!.replace('custom_', '')}/image` }}
                style={{ width: 34, height: 34 }}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.tipoIcon, { backgroundColor: slot.color + '22' }]}>
                <Text style={{ fontSize: 14 }}>{tipoEmoji}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
                {entry.nome}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                {tipoEmoji} {entry.tipo}
                {char ? ` · ${RARITY_LABELS[char.rarity as keyof typeof RARITY_LABELS] ?? char.rarity}` : ''}
                {isCustomDigimon ? ' · ✨ Customizado' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onRemove(entry.id, idx)} style={styles.removeBtn}>
              <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '800' }}>✕</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Add button — hidden when full */}
      {isFull ? (
        <View style={[styles.fullBanner, { backgroundColor: '#22c55e18', borderColor: '#22c55e55' }, pixelStyle]}>
          <Text style={{ color: '#22c55e', fontWeight: '800', fontSize: 13 }}>✅ Slot completo ({maxEntries}/{maxEntries})</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addItemBtn, { borderColor: slot.color + '88', backgroundColor: slot.color + '15' }, pixelStyle]}
          onPress={onAdd}
        >
          <Text style={{ color: slot.color, fontWeight: '800', fontSize: 13 }}>
            + Adicionar à {slot.label} ({maxEntries - entries.length} vaga{maxEntries - entries.length !== 1 ? 's' : ''})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function GachaSection() {
  const colors = useColors();
  const { token, getApiUrl } = useAuth();
  const apiUrl = getApiUrl();
  const headers = { Authorization: `Bearer ${token ?? ''}`, 'Content-Type': 'application/json' };

  const [pool, setPool]         = useState<GachaPoolEntry[]>([]);
  const [raroMax, setRaroMax]   = useState(3);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [addingTo, setAddingTo]     = useState<GachaPoolEntry['raridade']>('Comum');
  const [gachaActive, setGachaActive] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/config`)
      .then((r) => r.json())
      .then((data) => {
        const raw = data?.config?.gacha_pool;
        if (raw && raw !== 'none') {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.pool)) {
              setPool(parsed.pool);
              if (typeof parsed.raroMax === 'number') setRaroMax(parsed.raroMax);
            } else if (Array.isArray(parsed)) {
              setPool(parsed);
            }
          } catch {}
        }
        const activeRaw = data?.config?.gacha_active;
        setGachaActive(activeRaw === 'true');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleGachaActive() {
    setTogglingActive(true);
    const next = !gachaActive;
    try {
      await fetch(`${apiUrl}/config/gacha_active`, {
        method: 'PUT', headers, body: JSON.stringify({ value: String(next) }),
      });
      setGachaActive(next);
      Alert.alert(next ? '✅ Gacha ATIVADO' : '🔒 Gacha DESATIVADO', next ? 'Os jogadores agora podem usar o Gacha.' : 'O Gacha está oculto para os jogadores.');
    } catch {
      Alert.alert('Erro', 'Falha ao alterar o status do Gacha.');
    } finally {
      setTogglingActive(false);
    }
  }

  function openAdd(raridade: GachaPoolEntry['raridade']) {
    setAddingTo(raridade);
    setModalOpen(true);
  }

  function handleAdd(entry: Omit<GachaPoolEntry, 'raridade'>) {
    const limit = addingTo === 'Raro' ? raroMax : SLOT_LIMITS[addingTo] ?? 10;
    const currentCount = pool.filter((e) => e.raridade === addingTo).length;
    if (currentCount >= limit) {
      Alert.alert('Slot cheio', `Máximo de ${limit} item(s) para ${addingTo}.`);
      return;
    }
    const full: GachaPoolEntry = { ...entry, raridade: addingTo };
    setPool((prev) => [...prev, full]);
  }

  function handleRemove(id: string, idx: number) {
    setPool((prev) => {
      // Find the exact position among ALL entries (not just by rarity)
      let count = -1;
      const globalIdx = prev.findIndex((e) => {
        if (e.id === id) { count++; }
        return e.id === id && count === 0;
      });
      // Use the passed index relative to filtered list
      let rarity: GachaPoolEntry['raridade'] | null = null;
      let relIdx = 0;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id === id) {
          if (relIdx === idx) { rarity = prev[i].raridade; break; }
          relIdx++;
        }
      }
      // Remove at the absolute position matching rarity+id+idx
      let hit = 0;
      return prev.filter((e) => {
        if (e.id === id && e.raridade === rarity) {
          if (hit === idx) { hit++; return false; }
          hit++;
        }
        return true;
      });
    });
  }

  // Simpler remove by absolute pool index
  function handleRemoveBySlot(raridade: GachaPoolEntry['raridade'], entryIdx: number) {
    setPool((prev) => {
      const filtered = prev.map((e, i) => ({ e, i })).filter(({ e }) => e.raridade === raridade);
      if (entryIdx >= filtered.length) return prev;
      const absIdx = filtered[entryIdx].i;
      return [...prev.slice(0, absIdx), ...prev.slice(absIdx + 1)];
    });
  }

  function changeRaroMax(delta: number) {
    setRaroMax((prev) => {
      const next = Math.max(1, Math.min(5, prev + delta));
      if (next < prev) {
        setPool((p) => {
          const raroEntries = p.filter((e) => e.raridade === 'Raro');
          const toKeep = raroEntries.slice(0, next).map((e) => e.id);
          let kept = 0;
          return p.filter((e) => {
            if (e.raridade !== 'Raro') return true;
            if (kept < next) { kept++; return true; }
            return false;
          });
        });
      }
      return next;
    });
  }

  async function salvar() {
    const comunCount = pool.filter((e) => e.raridade === 'Comum').length;
    const espCount   = pool.filter((e) => e.raridade === 'Especial').length;
    const raroCount  = pool.filter((e) => e.raridade === 'Raro').length;
    if (comunCount < 10 || espCount < 6 || raroCount < raroMax) {
      Alert.alert(
        '⚠️ Pool incompleto',
        `Preencha todos os slots antes de salvar:\n\n` +
        `⚪ Comum: ${comunCount}/10\n` +
        `🟣 Especial: ${espCount}/6\n` +
        `🌟 Raro: ${raroCount}/${raroMax}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salvar mesmo assim', onPress: () => doSalvar() },
        ]
      );
      return;
    }
    doSalvar();
  }

  async function doSalvar() {
    setSaving(true);
    try {
      const payload = JSON.stringify({ pool, raroMax });
      await fetch(`${apiUrl}/config/gacha_pool`, {
        method: 'PUT', headers, body: JSON.stringify({ value: payload }),
      });
      Alert.alert('✅ Pool salvo!', `${pool.length} item(s) configurado(s).\n⚪ Comum: 10  🟣 Especial: 6  🌟 Raro: ${raroMax}`);
    } catch {
      Alert.alert('Erro', 'Falha ao salvar o pool do Gacha.');
    } finally {
      setSaving(false);
    }
  }

  function limparTudo() {
    Alert.alert('Limpar Pool', 'Remover todos os itens do pool do Gacha?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => setPool([]) },
    ]);
  }

  if (loading) return <ActivityIndicator color="#8b5cf6" style={{ marginTop: 40 }} />;

  const comunEntries = pool.filter((e) => e.raridade === 'Comum');
  const especEntries = pool.filter((e) => e.raridade === 'Especial');
  const raroEntries  = pool.filter((e) => e.raridade === 'Raro');
  const totalFilled  = comunEntries.length + especEntries.length + raroEntries.length;
  const totalSlots   = 10 + 10 + raroMax;

  return (
    <View style={styles.container}>
      {/* ON/OFF Toggle card */}
      <View style={[styles.headerCard, {
        backgroundColor: gachaActive ? '#16a34a18' : '#dc262618',
        borderColor: gachaActive ? '#16a34a88' : '#dc262688',
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: gachaActive ? '#16a34a' : '#dc2626', fontWeight: '800', fontSize: 13 }}>
              {gachaActive ? '✅ Gacha ATIVO' : '🔒 Gacha INATIVO'}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
              {gachaActive
                ? 'Jogadores podem usar o Gacha agora.'
                : 'Gacha oculto para jogadores. Configure o pool e depois ative.'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={toggleGachaActive}
            disabled={togglingActive}
            style={{
              paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10,
              backgroundColor: gachaActive ? '#dc2626' : '#16a34a',
              opacity: togglingActive ? 0.6 : 1,
            }}
          >
            {togglingActive
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                  {gachaActive ? 'DESATIVAR' : 'ATIVAR'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Header card */}
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>🌌 Pool de Recompensas do Gacha</Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
          Configure exatamente quais recompensas aparecem no Gacha. Comum tem 10 slots, Especial tem 6 slots; Raro tem de 1 a 5 slots.
        </Text>

        <View style={styles.statRow}>
          <View style={[styles.statChip, { backgroundColor: '#6b728022', borderColor: '#6b728055' }]}>
            <Text style={{ color: '#6b7280', fontWeight: '800', fontSize: 14 }}>{comunEntries.length}/10</Text>
            <Text style={{ color: '#6b7280', fontSize: 11 }}>⚪ Comum</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#8b5cf622', borderColor: '#8b5cf655' }]}>
            <Text style={{ color: '#8b5cf6', fontWeight: '800', fontSize: 14 }}>{especEntries.length}/6</Text>
            <Text style={{ color: '#8b5cf6', fontSize: 11 }}>🟣 Especial</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#f59e0b22', borderColor: '#f59e0b55' }]}>
            <Text style={{ color: '#f59e0b', fontWeight: '800', fontSize: 14 }}>{raroEntries.length}/{raroMax}</Text>
            <Text style={{ color: '#f59e0b', fontSize: 11 }}>🌟 Raro</Text>
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Progresso geral</Text>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }}>{totalFilled}/{totalSlots}</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, {
              backgroundColor: totalFilled >= totalSlots ? '#22c55e' : '#8b5cf6',
              width: `${Math.min((totalFilled / totalSlots) * 100, 100)}%` as any,
            }]} />
          </View>
        </View>
      </View>

      {/* Raro max selector */}
      <View style={[styles.raroPickerCard, { backgroundColor: '#f59e0b0A', borderColor: '#f59e0b55' }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#f59e0b', fontWeight: '800', fontSize: 12 }}>🌟 Quantidade de slots Raro</Text>
          <Text style={{ color: '#f59e0b99', fontSize: 12 }}>Escolha de 1 a 5 Digimons/Itens raros no pool</Text>
        </View>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={[styles.stepBtn, { backgroundColor: raroMax <= 1 ? '#f59e0b22' : '#f59e0b44' }]}
            onPress={() => changeRaroMax(-1)}
            disabled={raroMax <= 1}
          >
            <Text style={{ color: '#f59e0b', fontWeight: '900', fontSize: 14 }}>−</Text>
          </TouchableOpacity>
          <View style={styles.stepValue}>
            <Text style={{ color: '#f59e0b', fontWeight: '900', fontSize: 14 }}>{raroMax}</Text>
          </View>
          <TouchableOpacity
            style={[styles.stepBtn, { backgroundColor: raroMax >= 5 ? '#f59e0b22' : '#f59e0b44' }]}
            onPress={() => changeRaroMax(1)}
            disabled={raroMax >= 5}
          >
            <Text style={{ color: '#f59e0b', fontWeight: '900', fontSize: 14 }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fixed special item — cannot be removed */}
      <View style={{ borderRadius: 16, borderWidth: 1.5, borderColor: '#f0c04088', backgroundColor: '#f0c04010', padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#f0c040', fontWeight: '800', fontSize: 13 }}>✨ Especial Fixo</Text>
          <View style={{ borderRadius: 8, borderWidth: 1, borderColor: '#f0c04066', backgroundColor: '#f0c04022', paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ color: '#f0c040', fontWeight: '700', fontSize: 12 }}>🔒 1% sempre</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f0c04015', borderRadius: 10, padding: 10 }}>
          <AnimatedEgg characterId="custom_1550" element="SPECIAL" size={40} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#f0c040', fontWeight: '800', fontSize: 12 }}>Digitama Especial</Text>
            <Text style={{ color: '#f0c04099', fontSize: 12 }}>Pode chocar qualquer forma bebê do Mundo Digital</Text>
          </View>
          <View style={{ borderRadius: 6, borderWidth: 1, borderColor: '#f0c04055', backgroundColor: '#f0c04022', paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: '#f0c040', fontSize: 11, fontWeight: '700' }}>EGG</Text>
          </View>
        </View>
        <Text style={{ color: '#f0c04077', fontSize: 11, textAlign: 'center' }}>
          Este item sempre aparece com 1% de chance por puxada. Não pode ser removido.
        </Text>
      </View>

      {/* Slot sections */}
      <SlotSection
        slot={RARITY_SLOTS[0]}
        entries={comunEntries}
        maxEntries={10}
        onAdd={() => openAdd('Comum')}
        onRemove={(_, idx) => handleRemoveBySlot('Comum', idx)}
        apiUrl={apiUrl}
      />
      <SlotSection
        slot={RARITY_SLOTS[1]}
        entries={especEntries}
        maxEntries={10}
        onAdd={() => openAdd('Especial')}
        onRemove={(_, idx) => handleRemoveBySlot('Especial', idx)}
        apiUrl={apiUrl}
      />
      <SlotSection
        slot={RARITY_SLOTS[2]}
        entries={raroEntries}
        maxEntries={raroMax}
        onAdd={() => openAdd('Raro')}
        onRemove={(_, idx) => handleRemoveBySlot('Raro', idx)}
        apiUrl={apiUrl}
      />

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.clearBtn2, { borderColor: '#ef4444' }]}
          onPress={limparTudo}
        >
          <Text style={{ color: '#ef4444', fontWeight: '700' }}>🗑️ Limpar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: '#8b5cf6', flex: 1, opacity: saving ? 0.6 : 1 }]}
          onPress={salvar}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size={16} color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>💾 Salvar Pool ({totalFilled}/{totalSlots})</Text>
          }
        </TouchableOpacity>
      </View>

      <AddItemModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
        apiUrl={apiUrl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14, padding: 4 },
  headerCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle:  { fontSize: 14, fontWeight: '800' as const },
  cardDesc:   { fontSize: 13, lineHeight: 18 },
  statRow:    { flexDirection: 'row', gap: 8 },
  statChip:   { flex: 1, borderRadius: 10, borderWidth: 1, alignItems: 'center', paddingVertical: 8, gap: 2 },

  raroPickerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  stepper:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepValue:  { width: 40, alignItems: 'center' },

  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },

  slotCard:   { borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 10 },
  slotHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotTitle:  { fontSize: 13, fontWeight: '800' as const },
  slotBadge:  { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  emptySlot:  { borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', padding: 12, alignItems: 'center' },
  fullBanner: { borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
  entryRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, padding: 8 },
  tipoIcon:   { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  removeBtn:  { paddingHorizontal: 8, paddingVertical: 4 },
  addItemBtn: { borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', padding: 10, alignItems: 'center' },

  actionRow:  { flexDirection: 'row', gap: 10 },
  clearBtn2:  { borderRadius: 12, borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtn:    { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
  modalPanel:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, maxHeight: '90%' },
  modalTitle:   { fontSize: 14, fontWeight: '800' as const, textAlign: 'center' },
  label:        { fontSize: 13, fontWeight: '700' as const },
  input:        { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12 },
  selectedRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 2, padding: 10 },
  charRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, padding: 8, marginBottom: 4 },
  tipoRow:      { flexDirection: 'row', gap: 8 },
  tipoBtn:      { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 8, alignItems: 'center', gap: 2 },
  modalBtns:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:    { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 14, alignItems: 'center' },
  addBtn:       { flex: 1, borderRadius: 12, backgroundColor: '#8b5cf6', paddingVertical: 14, alignItems: 'center' },
  fallbackIcon: { borderRadius: 8, alignItems: 'center', justifyContent: 'center', width: 34, height: 34 },
  emptyApiNotice: { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', padding: 20, alignItems: 'center', gap: 4 },
});
