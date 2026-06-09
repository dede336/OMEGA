import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StyleSheet, Modal, FlatList, TextInput,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { CHARACTERS } from '@/constants/gameData';
import { pixelStyle } from '@/constants/pixelStyle';
import {
  PickerRow, ToggleRow, FieldInput, ImagePickerBlock, ImageData,
  DigimonPickerModal, ss,
} from './AdminShared';

type MapTab = 'new' | 'edit';
type MapType = 'normal' | 'dungeon';

interface EnemyRow { characterId: string; characterName: string; level: string; }
interface ItemDrop { itemId: string; itemName: string; chance: string; }
interface StageBuilder {
  name: string;
  enemies: EnemyRow[];
  expReward: string;
  bitsReward: string;
  bitsDropEnabled: boolean;
  bitsDropAmount: string;
  itemDrops: ItemDrop[];
}

const emptyEnemy = (): EnemyRow => ({ characterId: '', characterName: '', level: '10' });
const emptyStage = (): StageBuilder => ({
  name: '', enemies: [emptyEnemy()], expReward: '80', bitsReward: '50',
  bitsDropEnabled: false, bitsDropAmount: '50',
  itemDrops: [],
});

interface MapForm {
  name: string; description: string; type: MapType; bitsReward: string;
  isPermanent: boolean; expiresAt: string;
  stages: StageBuilder[]; imageData: ImageData;
}

const emptyMapForm = (): MapForm => ({
  name: '', description: '', type: 'normal', bitsReward: '0',
  isPermanent: true, expiresAt: '',
  stages: [emptyStage()], imageData: { base64: null, mimeType: 'image/png', previewUri: null },
});

interface CustomMapEntry {
  dbId: number; id: string; name: string; type: string;
  isActive: boolean; isPermanent: boolean; expiresAt: string | null;
  stages: unknown[];
}

interface AvailableItem { id: string; name: string; type: string; }

type PickerTargetMap = { stageIdx: number; enemyIdx: number } | null;
type ItemPickerTarget = { stageIdx: number; dropIdx: number } | null;

// ─── Item Picker Modal ────────────────────────────────────────────────────────
function ItemPickerModal({ visible, items, onClose, onSelect }: {
  visible: boolean; items: AvailableItem[];
  onClose: () => void; onSelect: (id: string, name: string) => void;
}) {
  const colors = useColors();
  const [q, setQ] = useState('');
  const filtered = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()) || i.id.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0009', justifyContent: 'flex-end' }}>
        <View style={[{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%', padding: 16 }, pixelStyle]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>Selecionar Item</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ color: colors.primary, fontSize: 14 }}>Fechar</Text></TouchableOpacity>
          </View>
          <TextInput
            value={q} onChangeText={setQ}
            placeholder="Buscar item..."
            placeholderTextColor={colors.mutedForeground}
            style={{ backgroundColor: colors.card, color: colors.foreground, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 10 }}
          />
          {filtered.length === 0
            ? <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: 20 }}>Nenhum item encontrado</Text>
            : (
              <FlatList
                data={filtered}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => { onSelect(item.id, item.name); setQ(''); onClose(); }}
                    style={[{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginBottom: 6 }, pixelStyle]}>
                    <Text style={{ color: colors.foreground, fontWeight: '600' }}>{item.name}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{item.id} · {item.type}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
        </View>
      </View>
    </Modal>
  );
}

export default function MapsSection() {
  const colors = useColors();
  const { token, getApiUrl } = useAuth();
  const [tab, setTab] = useState<MapTab>('new');
  const [form, setForm] = useState<MapForm>(emptyMapForm());
  const [loading, setLoading] = useState(false);
  const [customMaps, setCustomMaps] = useState<CustomMapEntry[]>([]);
  const [editingDbId, setEditingDbId] = useState<number | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTargetMap>(null);
  const [itemPickerTarget, setItemPickerTarget] = useState<ItemPickerTarget>(null);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);

  const loadMaps = useCallback(async () => {
    setLoadingList(true);
    try {
      const r = await fetch(`${getApiUrl()}/maps`);
      const data = await r.json();
      if (data.maps) setCustomMaps(data.maps);
    } catch {} finally { setLoadingList(false); }
  }, [getApiUrl]);

  const loadItems = useCallback(async () => {
    try {
      const r = await fetch(`${getApiUrl()}/items`);
      const data = await r.json();
      if (data.items) setAvailableItems(data.items.map((i: any) => ({ id: i.id, name: i.name, type: i.type })));
    } catch {}
  }, [getApiUrl]);

  useEffect(() => { if (tab === 'edit') loadMaps(); }, [tab, loadMaps]);
  useEffect(() => { loadItems(); }, [loadItems]);

  const editingMap = editingDbId !== null ? customMaps.find((m) => m.dbId === editingDbId) : null;
  const isPermanentEdit = editingMap?.isPermanent ?? false;

  function setStage(idx: number, partial: Partial<StageBuilder>) {
    setForm((f) => {
      const stages = [...f.stages]; stages[idx] = { ...stages[idx], ...partial };
      return { ...f, stages };
    });
  }

  function setEnemy(stageIdx: number, enemyIdx: number, partial: Partial<EnemyRow>) {
    setForm((f) => {
      const stages = [...f.stages];
      const enemies = [...stages[stageIdx].enemies];
      enemies[enemyIdx] = { ...enemies[enemyIdx], ...partial };
      stages[stageIdx] = { ...stages[stageIdx], enemies };
      return { ...f, stages };
    });
  }

  function addStage() { setForm((f) => ({ ...f, stages: [...f.stages, emptyStage()] })); }
  function removeStage(idx: number) {
    setForm((f) => ({ ...f, stages: f.stages.filter((_, i) => i !== idx) }));
  }
  function addEnemy(stageIdx: number) {
    if (form.stages[stageIdx].enemies.length >= 3) return;
    setForm((f) => {
      const stages = [...f.stages];
      stages[stageIdx] = { ...stages[stageIdx], enemies: [...stages[stageIdx].enemies, emptyEnemy()] };
      return { ...f, stages };
    });
  }
  function removeEnemy(stageIdx: number, enemyIdx: number) {
    setForm((f) => {
      const stages = [...f.stages];
      const enemies = stages[stageIdx].enemies.filter((_, i) => i !== enemyIdx);
      stages[stageIdx] = { ...stages[stageIdx], enemies: enemies.length > 0 ? enemies : [emptyEnemy()] };
      return { ...f, stages };
    });
  }
  function addItemDrop(stageIdx: number) {
    setForm((f) => {
      const stages = [...f.stages];
      stages[stageIdx] = { ...stages[stageIdx], itemDrops: [...stages[stageIdx].itemDrops, { itemId: '', itemName: '', chance: '0.5' }] };
      return { ...f, stages };
    });
  }
  function removeItemDrop(stageIdx: number, dropIdx: number) {
    setForm((f) => {
      const stages = [...f.stages];
      stages[stageIdx] = { ...stages[stageIdx], itemDrops: stages[stageIdx].itemDrops.filter((_, i) => i !== dropIdx) };
      return { ...f, stages };
    });
  }
  function setItemDrop(stageIdx: number, dropIdx: number, partial: Partial<ItemDrop>) {
    setForm((f) => {
      const stages = [...f.stages];
      const itemDrops = [...stages[stageIdx].itemDrops];
      itemDrops[dropIdx] = { ...itemDrops[dropIdx], ...partial };
      stages[stageIdx] = { ...stages[stageIdx], itemDrops };
      return { ...f, stages };
    });
  }

  function buildStagesPayload() {
    return form.stages.map((s, i) => {
      const drops: any[] = [];
      if (s.bitsDropEnabled) {
        drops.push({ type: 'bits', amount: Number(s.bitsDropAmount) || 50, chance: 1.0 });
      }
      for (const d of s.itemDrops) {
        if (d.itemId) drops.push({ type: 'item', itemId: d.itemId, chance: Number(d.chance) || 0.5 });
      }
      return {
        index: i, name: s.name || `Estágio ${i + 1}`,
        enemies: s.enemies.filter((e) => e.characterId).map((e) => ({ characterId: e.characterId, level: Number(e.level) || 1 })),
        expReward: Number(s.expReward) || 80, bitsReward: Number(s.bitsReward) || 0,
        drops,
      };
    });
  }

  function buildPayload(includeBase = true) {
    const base: Record<string, unknown> = {
      stages: buildStagesPayload(),
      imageBase64: form.imageData.base64 ?? undefined,
      imageMimeType: form.imageData.mimeType || undefined,
    };
    if (includeBase) {
      base.name = form.name.trim();
      base.description = form.description.trim();
      base.type = form.type;
      base.bitsReward = Number(form.bitsReward) || 0;
      base.isPermanent = form.isPermanent;
      base.expiresAt = (!form.isPermanent && form.expiresAt.trim()) ? form.expiresAt.trim() : null;
    }
    return base;
  }

  async function handleNew() {
    if (!form.name.trim()) { Alert.alert('Erro', 'Nome da fase obrigatório.'); return; }
    if (!form.isPermanent && !form.expiresAt.trim()) { Alert.alert('Erro', 'Informe a data de expiração da fase provisória.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/maps`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildPayload(true)),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error ?? 'Falha'); return; }
      Alert.alert('Criado!', `Fase "${form.name}" adicionada.`);
      setForm(emptyMapForm());
    } catch (e) { Alert.alert('Erro', String(e)); }
    finally { setLoading(false); }
  }

  async function handleSaveEdit() {
    if (editingDbId === null) return;
    setLoading(true);
    try {
      const payload = isPermanentEdit
        ? buildPayload(false)
        : buildPayload(true);
      const res = await fetch(`${getApiUrl()}/maps/${editingDbId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error ?? 'Falha'); return; }
      Alert.alert('Salvo!', `Fase atualizada.`);
      setEditingDbId(null); setForm(emptyMapForm()); loadMaps();
    } catch (e) { Alert.alert('Erro', String(e)); }
    finally { setLoading(false); }
  }

  function loadMapForEdit(m: CustomMapEntry) {
    const stages = (m.stages as any[]).map((s) => {
      const bitsDrop = (s.drops ?? []).find((d: any) => d.type === 'bits');
      const itemDropsRaw = (s.drops ?? []).filter((d: any) => d.type === 'item');
      return {
        name: s.name ?? '',
        enemies: (s.enemies ?? [{ characterId: '', level: 10 }]).map((e: any) => ({
          characterId: e.characterId ?? '',
          characterName: CHARACTERS[e.characterId]?.name ?? e.characterId ?? '',
          level: String(e.level ?? 10),
        })),
        expReward: String(s.expReward ?? 80),
        bitsReward: String(s.bitsReward ?? 0),
        bitsDropEnabled: !!bitsDrop,
        bitsDropAmount: String(bitsDrop?.amount ?? 50),
        itemDrops: itemDropsRaw.map((d: any) => ({
          itemId: d.itemId ?? '',
          itemName: d.itemId ?? '',
          chance: String(d.chance ?? 0.5),
        })),
      };
    });
    setEditingDbId(m.dbId);
    setForm({
      name: m.name, description: '', type: m.type as MapType, bitsReward: '0',
      isPermanent: m.isPermanent,
      expiresAt: m.expiresAt ? m.expiresAt.substring(0, 16).replace('T', ' ') : '',
      stages: stages.length > 0 ? stages : [emptyStage()],
      imageData: { base64: null, mimeType: 'image/png', previewUri: null },
    });
  }

  const MapFormUI = ({ locked }: { locked?: boolean }) => (
    <>
      {!locked && (
        <>
          <FieldInput label="Nome da Fase *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Ex: Floresta Digital" />
          <FieldInput label="Descrição" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} multiline />
          <PickerRow label="Tipo" options={[{key:'normal',label:'Normal'},{key:'dungeon',label:'Masmorra'}]} selected={form.type} onSelect={(v) => setForm((f) => ({ ...f, type: v as MapType }))} />
          <FieldInput label="Bits de recompensa (mapa)" value={form.bitsReward} onChange={(v) => setForm((f) => ({ ...f, bitsReward: v }))} numeric />
        </>
      )}
      {locked && (
        <View style={[ms.lockedBanner, { backgroundColor: '#3b82f620', borderColor: '#3b82f6' }]}>
          <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>🔒 Fase permanente — apenas digimons, imagem e drops podem ser editados.</Text>
        </View>
      )}

      {!locked && (
        <>
          <ToggleRow label="Fase Permanente" value={form.isPermanent} onChange={(v) => setForm((f) => ({ ...f, isPermanent: v }))} />
          {!form.isPermanent && (
            <FieldInput
              label="Expira em (AAAA-MM-DD HH:MM)"
              value={form.expiresAt}
              onChange={(v) => setForm((f) => ({ ...f, expiresAt: v }))}
              placeholder="Ex: 2026-06-30 23:59"
            />
          )}
        </>
      )}

      <ImagePickerBlock data={form.imageData} onChange={(d) => setForm((f) => ({ ...f, imageData: d }))} label="Imagem do Mapa (800×600px)" cropWidth={800} cropHeight={600} />

      <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Estágios ({form.stages.length})</Text>
      {form.stages.map((stage, sIdx) => (
        <View key={sIdx} style={[ms.stageCard, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: '700' }}>Estágio {sIdx + 1}</Text>
            {form.stages.length > 1 && !locked && (
              <TouchableOpacity onPress={() => removeStage(sIdx)} style={[ss.pill, { borderColor: '#ef4444' }]}>
                <Text style={{ color: '#ef4444', fontSize: 12 }}>Remover</Text>
              </TouchableOpacity>
            )}
          </View>

          {!locked && <FieldInput label="Nome do Estágio" value={stage.name} onChange={(v) => setStage(sIdx, { name: v })} placeholder={`Estágio ${sIdx + 1}`} />}

          <Text style={[ss.label, { color: colors.mutedForeground }]}>Digimons inimigos (max. 3)</Text>
          {stage.enemies.map((enemy, eIdx) => (
            <View key={eIdx} style={[ms.enemyRow, { borderColor: colors.border }, pixelStyle]}>
              <TouchableOpacity onPress={() => setPickerTarget({ stageIdx: sIdx, enemyIdx: eIdx })}
                style={[ms.enemyPicker, { backgroundColor: colors.background, borderColor: colors.border }, pixelStyle]}>
                {enemy.characterId ? (
                  <Text style={{ color: colors.foreground, fontSize: 12 }} numberOfLines={1}>
                    {enemy.characterName || enemy.characterId}
                  </Text>
                ) : (
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Selecionar...</Text>
                )}
              </TouchableOpacity>
              <FieldInput label="" value={enemy.level} onChange={(v) => setEnemy(sIdx, eIdx, { level: v })} numeric placeholder="Lv" />
              {stage.enemies.length > 1 && (
                <TouchableOpacity onPress={() => removeEnemy(sIdx, eIdx)}>
                  <Text style={{ color: '#ef4444', fontSize: 14 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {stage.enemies.length < 3 && (
            <TouchableOpacity onPress={() => addEnemy(sIdx)} style={[ss.pill, { borderColor: colors.border, alignSelf: 'flex-start', marginTop: 4 }]}>
              <Text style={{ color: colors.primary, fontSize: 12 }}>+ Inimigo</Text>
            </TouchableOpacity>
          )}

          {!locked && <FieldInput label="EXP Reward" value={stage.expReward} onChange={(v) => setStage(sIdx, { expReward: v })} numeric />}

          {/* Drops Section */}
          <View style={[ms.dropsBlock, { borderColor: colors.border }, pixelStyle]}>
            <Text style={[ss.label, { color: colors.mutedForeground, marginBottom: 6 }]}>Drops</Text>

            {/* Bits drop */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: colors.foreground, fontSize: 13 }}>💰 Drop de Bits</Text>
              <TouchableOpacity onPress={() => setStage(sIdx, { bitsDropEnabled: !stage.bitsDropEnabled })}
                style={[ss.toggleBtn, { backgroundColor: stage.bitsDropEnabled ? colors.primary : colors.card, borderColor: colors.border }]}>
                <Text style={{ color: stage.bitsDropEnabled ? '#fff' : colors.foreground, fontWeight: '600', fontSize: 12 }}>{stage.bitsDropEnabled ? 'Ativo' : 'Inativo'}</Text>
              </TouchableOpacity>
            </View>
            {stage.bitsDropEnabled && (
              <FieldInput label="Quantidade de Bits" value={stage.bitsDropAmount} onChange={(v) => setStage(sIdx, { bitsDropAmount: v })} numeric placeholder="50" />
            )}

            {/* Item drops */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 6 }}>
              <Text style={{ color: colors.foreground, fontSize: 13 }}>🎒 Drops de Itens ({stage.itemDrops.length})</Text>
              <TouchableOpacity onPress={() => addItemDrop(sIdx)} style={[ss.pill, { borderColor: colors.primary }]}>
                <Text style={{ color: colors.primary, fontSize: 12 }}>+ Item</Text>
              </TouchableOpacity>
            </View>
            {stage.itemDrops.map((drop, dIdx) => (
              <View key={dIdx} style={[ms.dropRow, { borderColor: colors.border, backgroundColor: colors.background }, pixelStyle]}>
                <TouchableOpacity
                  onPress={() => setItemPickerTarget({ stageIdx: sIdx, dropIdx: dIdx })}
                  style={[ms.itemPickerBtn, { borderColor: colors.border, backgroundColor: colors.card }, pixelStyle]}>
                  {drop.itemId ? (
                    <Text style={{ color: colors.foreground, fontSize: 12 }} numberOfLines={1}>{drop.itemName || drop.itemId}</Text>
                  ) : (
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Selecionar item...</Text>
                  )}
                </TouchableOpacity>
                <View style={{ width: 70 }}>
                  <FieldInput label="" value={drop.chance} onChange={(v) => setItemDrop(sIdx, dIdx, { chance: v })} numeric placeholder="0.5" />
                </View>
                <TouchableOpacity onPress={() => removeItemDrop(sIdx, dIdx)}>
                  <Text style={{ color: '#ef4444', fontSize: 14 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {stage.itemDrops.length > 0 && (
              <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 2 }}>Chance: 0 = nunca · 1 = sempre</Text>
            )}
          </View>
        </View>
      ))}
      {!locked && (
        <TouchableOpacity onPress={addStage} style={[ss.imageBtn, { borderColor: colors.border, marginBottom: 8 }]}>
          <Text style={{ color: colors.primary }}>+ Adicionar Estágio</Text>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <View style={{ flex: 1 }}>
      <DigimonPickerModal visible={pickerTarget !== null} onClose={() => setPickerTarget(null)}
        onSelect={(id, name) => {
          if (pickerTarget) {
            setEnemy(pickerTarget.stageIdx, pickerTarget.enemyIdx, { characterId: id, characterName: name });
            setPickerTarget(null);
          }
        }} />

      <ItemPickerModal
        visible={itemPickerTarget !== null}
        items={availableItems}
        onClose={() => setItemPickerTarget(null)}
        onSelect={(id, name) => {
          if (itemPickerTarget) {
            setItemDrop(itemPickerTarget.stageIdx, itemPickerTarget.dropIdx, { itemId: id, itemName: name });
            setItemPickerTarget(null);
          }
        }}
      />

      <View style={ss.tabRow}>
        {([['new','+ Nova Fase'],['edit','✏ Editar']] as const).map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => { setTab(key); setEditingDbId(null); setForm(emptyMapForm()); }}
            style={[ss.tabBtn, { backgroundColor: tab === key ? colors.primary : colors.card, borderColor: colors.border }]}>
            <Text style={{ color: tab === key ? '#fff' : colors.foreground, fontWeight: '600', fontSize: 12 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'new' && (
        <>
          <MapFormUI />
          {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : (
            <TouchableOpacity onPress={handleNew} style={[ms.submitBtn, { backgroundColor: colors.primary }, pixelStyle]}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Criar Fase</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {tab === 'edit' && (
        <>
          {editingDbId === null ? (
            <>
              <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Fases Customizadas ({customMaps.length})</Text>
              {loadingList ? <ActivityIndicator color={colors.primary} /> : (
                customMaps.map((m) => (
                  <TouchableOpacity key={m.dbId} onPress={() => loadMapForEdit(m)}
                    style={[ms.mapRow, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '600' }}>{m.name}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{m.type} · {m.stages.length} estágio(s)</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 3 }}>
                      <View style={[ms.typeBadge, { backgroundColor: m.isPermanent ? '#22c55e22' : '#f59e0b22', borderColor: m.isPermanent ? '#22c55e' : '#f59e0b' }]}>
                        <Text style={{ color: m.isPermanent ? '#22c55e' : '#f59e0b', fontSize: 10, fontWeight: '700' }}>{m.isPermanent ? 'PERMANENTE' : 'PROVISÓRIA'}</Text>
                      </View>
                      {!m.isPermanent && m.expiresAt && (
                        <Text style={{ color: colors.mutedForeground, fontSize: 9 }}>Expira: {new Date(m.expiresAt).toLocaleDateString('pt-BR')}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View>
                  <Text style={[ss.sectionTitle, { color: colors.foreground, marginTop: 0 }]}>Editando Fase</Text>
                  {isPermanentEdit && (
                    <Text style={{ color: '#22c55e', fontSize: 11 }}>Fase Permanente</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => { setEditingDbId(null); setForm(emptyMapForm()); }}
                  style={[ss.pill, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>← Voltar</Text>
                </TouchableOpacity>
              </View>
              <MapFormUI locked={isPermanentEdit} />
              {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : (
                <TouchableOpacity onPress={handleSaveEdit} style={[ms.submitBtn, { backgroundColor: '#a855f7' }, pixelStyle]}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Salvar Fase</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

const ms = StyleSheet.create({
  submitBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16, marginBottom: 8 },
  stageCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  enemyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  enemyPicker: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 40, justifyContent: 'center' },
  mapRow: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  dropsBlock: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 10 },
  dropRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, borderWidth: 1, borderRadius: 8, padding: 8 },
  itemPickerBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 38, justifyContent: 'center' },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  lockedBanner: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
});
