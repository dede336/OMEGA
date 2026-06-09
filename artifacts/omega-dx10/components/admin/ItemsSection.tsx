import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { EQUIPMENT_ITEMS, CRAFT_RECIPES } from '@/constants/gameData';
import { pixelStyle } from '@/constants/pixelStyle';
import {
  RarityKey, RARITIES, PickerRow, ToggleRow, FieldInput,
  ImagePickerBlock, ImageData, ss,
} from './AdminShared';

type ItemTab = 'new' | 'edit' | 'send';
type ItemType = 'equipment' | 'fragment';
type EquipSlotKey = 'blusa' | 'calca' | 'sapato' | 'brasao' | 'digivice' | 'pulseira' | 'oculos';
type ObtainMethod = 'drop' | 'craft' | 'admin';

const SLOTS: { key: EquipSlotKey; label: string }[] = [
  { key: 'blusa', label: 'Blusa' }, { key: 'calca', label: 'Calça' },
  { key: 'sapato', label: 'Sapato' }, { key: 'brasao', label: 'Brasão' },
  { key: 'digivice', label: 'Digivice' }, { key: 'pulseira', label: 'Pulseira' },
  { key: 'oculos', label: 'Óculos' },
];
const OBTAIN_METHODS: { key: ObtainMethod; label: string }[] = [
  { key: 'drop', label: 'Drop (batalha)' }, { key: 'craft', label: 'Craftar' }, { key: 'admin', label: 'Admin' },
];
const ITEM_TYPES: { key: ItemType; label: string }[] = [
  { key: 'equipment', label: 'Equipamento' }, { key: 'fragment', label: 'Fragmento' },
];

interface ItemForm {
  name: string; type: ItemType; slot: EquipSlotKey;
  description: string; rarity: RarityKey; howToObtain: ObtainMethod;
  hp: string; mp: string; atk: string; def: string; spt: string; spd: string;
  imageData: ImageData;
}

const emptyItemForm = (): ItemForm => ({
  name: '', type: 'equipment', slot: 'blusa',
  description: '', rarity: 'COMMON', howToObtain: 'drop',
  hp: '0', mp: '0', atk: '0', def: '0', spt: '0', spd: '0',
  imageData: { base64: null, mimeType: 'image/png', previewUri: null },
});

interface CustomItemEntry { dbId: number; id: string; name: string; type: string; slot?: string; rarity: string; isActive: boolean; hasImage: boolean; }

export default function ItemsSection() {
  const colors = useColors();
  const { token, getApiUrl } = useAuth();
  const [tab, setTab] = useState<ItemTab>('new');
  const [form, setForm] = useState<ItemForm>(emptyItemForm());
  const [loading, setLoading] = useState(false);
  const [customItems, setCustomItems] = useState<CustomItemEntry[]>([]);
  const [editingDbId, setEditingDbId] = useState<number | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  // Send state
  const [sendUsername, setSendUsername] = useState('');
  const [sendType, setSendType] = useState<'item' | 'fragment'>('item');
  const [sendItemId, setSendItemId] = useState('');
  const [sendFragId, setSendFragId] = useState('');
  const [sendFragAmt, setSendFragAmt] = useState('1');
  const [sendLoading, setSendLoading] = useState(false);

  function set<K extends keyof ItemForm>(k: K, v: ItemForm[K]) { setForm((f) => ({ ...f, [k]: v })); }

  const loadItems = useCallback(async () => {
    setLoadingList(true);
    try {
      const r = await fetch(`${getApiUrl()}/items`);
      const data = await r.json();
      if (data.items) setCustomItems(data.items);
    } catch {} finally { setLoadingList(false); }
  }, [getApiUrl]);

  useEffect(() => { if (tab === 'edit') loadItems(); }, [tab, loadItems]);

  function buildItemBody() {
    return {
      name: form.name.trim(), type: form.type,
      slot: form.type === 'equipment' ? form.slot : null,
      description: form.description.trim(), rarity: form.rarity,
      howToObtain: form.howToObtain,
      bonuses: {
        hp: Number(form.hp) || 0, mp: Number(form.mp) || 0, atk: Number(form.atk) || 0,
        def: Number(form.def) || 0, spt: Number(form.spt) || 0, spd: Number(form.spd) || 0,
      },
      imageBase64: form.imageData.base64 ?? undefined,
      imageMimeType: form.imageData.mimeType || undefined,
    };
  }

  async function handleNew() {
    if (!form.name.trim()) { Alert.alert('Erro', 'Nome obrigatório.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildItemBody()),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error ?? 'Falha'); return; }
      Alert.alert('Criado!', `${form.name} adicionado.`);
      setForm(emptyItemForm());
    } catch (e) { Alert.alert('Erro', String(e)); }
    finally { setLoading(false); }
  }

  async function handleSaveEdit() {
    if (editingDbId === null) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/items/${editingDbId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildItemBody()),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error ?? 'Falha'); return; }
      Alert.alert('Salvo!', `${form.name} atualizado.`);
      setEditingDbId(null); setForm(emptyItemForm()); loadItems();
    } catch (e) { Alert.alert('Erro', String(e)); }
    finally { setLoading(false); }
  }

  async function handleSend() {
    if (!sendUsername.trim()) { Alert.alert('Erro', 'Username obrigatório.'); return; }
    if (sendType === 'item' && !sendItemId.trim()) { Alert.alert('Erro', 'Selecione um item.'); return; }
    if (sendType === 'fragment' && !sendFragId.trim()) { Alert.alert('Erro', 'Selecione um fragmento.'); return; }
    setSendLoading(true);
    try {
      const body: Record<string, unknown> = { username: sendUsername.trim() };
      if (sendType === 'item') body.items = [sendItemId.trim()];
      else body.fragments = [{ pieceId: sendFragId.trim(), amount: Number(sendFragAmt) || 1 }];
      const res = await fetch(`${getApiUrl()}/digimons/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error ?? 'Falha'); return; }
      Alert.alert('Enviado!', data.message);
      setSendUsername(''); setSendItemId(''); setSendFragId(''); setSendFragAmt('1');
    } catch (e) { Alert.alert('Erro', String(e)); }
    finally { setSendLoading(false); }
  }

  // All item IDs for the send picker (base + custom)
  const allItemIds = [...EQUIPMENT_ITEMS.map((i) => ({ id: i.id, name: i.name })), ...customItems.map((i) => ({ id: i.id, name: i.name }))];
  const allFragIds = CRAFT_RECIPES.map((r) => ({ id: r.pieceId, name: r.pieceName })).filter((f, i, a) => a.findIndex((x) => x.id === f.id) === i);

  const ItemFormUI = () => (
    <>
      <FieldInput label="Nome *" value={form.name} onChange={(v) => set('name', v)} placeholder="Ex: Armadura Dragão" />
      <PickerRow label="Tipo" options={ITEM_TYPES} selected={form.type} onSelect={(v) => set('type', v)} />
      {form.type === 'equipment' && (
        <PickerRow label="Slot" options={SLOTS} selected={form.slot} onSelect={(v) => set('slot', v)} />
      )}
      <FieldInput label="Descrição" value={form.description} onChange={(v) => set('description', v)} multiline />
      <PickerRow label="Raridade" options={RARITIES} selected={form.rarity} onSelect={(v) => set('rarity', v)} />
      <PickerRow label="Como obter" options={OBTAIN_METHODS} selected={form.howToObtain} onSelect={(v) => set('howToObtain', v)} />
      {form.type === 'equipment' && (
        <>
          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Bônus de Status (flat)</Text>
          <View style={ss.statsRow}>
            {(['hp','mp','atk','def','spt','spd'] as const).map((k) => (
              <View key={k} style={ss.statField}>
                <Text style={[ss.label, { color: colors.mutedForeground, fontSize: 11 }]}>{k.toUpperCase()}</Text>
                <FieldInput label="" value={form[k] as string} onChange={(v) => set(k, v as any)} numeric />
              </View>
            ))}
          </View>
        </>
      )}
      <ImagePickerBlock data={form.imageData} onChange={(d) => set('imageData', d)} label="Imagem do Item (128×128px)" cropWidth={128} cropHeight={128} />
    </>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={ss.tabRow}>
        {([['new','+ Novo'],['edit','✏ Editar'],['send','📦 Enviar']] as const).map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => { setTab(key); setEditingDbId(null); setForm(emptyItemForm()); }}
            style={[ss.tabBtn, { backgroundColor: tab === key ? colors.primary : colors.card, borderColor: colors.border }]}>
            <Text style={{ color: tab === key ? '#fff' : colors.foreground, fontWeight: '600', fontSize: 12 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'new' && (
        <>
          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Novo Item</Text>
          <ItemFormUI />
          {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : (
            <TouchableOpacity onPress={handleNew} style={[is.submitBtn, { backgroundColor: colors.primary }, pixelStyle]}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Criar Item</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {tab === 'edit' && (
        <>
          {editingDbId === null ? (
            <>
              <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Itens Customizados ({customItems.length})</Text>
              {loadingList ? <ActivityIndicator color={colors.primary} /> : (
                customItems.map((item) => (
                  <TouchableOpacity key={item.dbId} onPress={() => {
                    setEditingDbId(item.dbId);
                    setForm({ ...emptyItemForm(), name: item.name, type: item.type as ItemType, slot: (item.slot ?? 'blusa') as EquipSlotKey, rarity: item.rarity as RarityKey,
                      imageData: { base64: null, mimeType: 'image/png', previewUri: item.hasImage ? `${getApiUrl()}/items/${item.dbId}/image` : null } });
                  }} style={[is.itemRow, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
                    <Text style={{ color: colors.foreground, fontWeight: '600' }}>{item.name}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{item.type} · {item.rarity}</Text>
                  </TouchableOpacity>
                ))
              )}
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[ss.sectionTitle, { color: colors.foreground, marginTop: 0 }]}>Editando Item</Text>
                <TouchableOpacity onPress={() => { setEditingDbId(null); setForm(emptyItemForm()); }}
                  style={[ss.pill, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>← Voltar</Text>
                </TouchableOpacity>
              </View>
              <ItemFormUI />
              {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : (
                <TouchableOpacity onPress={handleSaveEdit} style={[is.submitBtn, { backgroundColor: '#a855f7' }, pixelStyle]}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Salvar Item</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      )}

      {tab === 'send' && (
        <>
          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Enviar Item / Fragmento</Text>
          <FieldInput label="Username do jogador" value={sendUsername} onChange={setSendUsername} placeholder="Ex: dede336" />
          <PickerRow label="Tipo de envio" options={[{key:'item',label:'Item'},{key:'fragment',label:'Fragmento'}]} selected={sendType} onSelect={(v) => setSendType(v as any)} />

          {sendType === 'item' && (
            <>
              <FieldInput label="ID do Item" value={sendItemId} onChange={setSendItemId} placeholder="Ex: blusa_tamer" />
              <View style={ss.fieldGroup}>
                <Text style={[ss.label, { color: colors.mutedForeground }]}>Itens disponíveis:</Text>
                <ScrollView style={{ maxHeight: 150 }}>
                  {allItemIds.map((i) => (
                    <TouchableOpacity key={i.id} onPress={() => setSendItemId(i.id)}
                      style={[is.itemRow, { backgroundColor: sendItemId === i.id ? colors.primary + '33' : colors.card, borderColor: colors.border }, pixelStyle]}>
                      <Text style={{ color: colors.foreground, fontSize: 12 }}>{i.name}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{i.id}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {sendType === 'fragment' && (
            <>
              <FieldInput label="ID do Fragmento (pieceId)" value={sendFragId} onChange={setSendFragId} placeholder="Ex: piece_coragem" />
              <FieldInput label="Quantidade" value={sendFragAmt} onChange={setSendFragAmt} numeric placeholder="1" />
              <View style={ss.fieldGroup}>
                <Text style={[ss.label, { color: colors.mutedForeground }]}>Fragmentos disponíveis:</Text>
                <ScrollView style={{ maxHeight: 150 }}>
                  {allFragIds.map((f) => (
                    <TouchableOpacity key={f.id} onPress={() => setSendFragId(f.id)}
                      style={[is.itemRow, { backgroundColor: sendFragId === f.id ? colors.primary + '33' : colors.card, borderColor: colors.border }, pixelStyle]}>
                      <Text style={{ color: colors.foreground, fontSize: 12 }}>{f.name}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{f.id}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {sendLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : (
            <TouchableOpacity onPress={handleSend} style={[is.submitBtn, { backgroundColor: '#22c55e' }, pixelStyle]}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Enviar</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const is = StyleSheet.create({
  submitBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16, marginBottom: 8 },
  itemRow: { padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
});
