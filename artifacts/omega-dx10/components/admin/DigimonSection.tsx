import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image, StyleSheet,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { CHARACTERS } from '@/constants/gameData';
import { getCustomCharacters, CustomDigimonRaw } from '@/constants/extendedCharacters';
import {
  AttrKey, RarityKey, ElemKey, ATTRS, RARITIES, ELEMENTS, ELEM_ATTACK, PRE_ROOKIE_RARITIES,
  PickerRow, ToggleRow, FieldInput, ImagePickerBlock, ImageData,
  DigimonPickerModal, DigiPickerField, ss,
} from './AdminShared';
import { useGame } from '@/context/GameContext';
import { pixelStyle } from '@/constants/pixelStyle';

type DigiTab = 'new' | 'edit' | 'send';

interface FormState {
  name: string; attribute: AttrKey; rarity: RarityKey; element: ElemKey;
  hp: string; mp: string; atk: string; def: string; spt: string; spd: string;
  description: string; attackName: string; attackElement: ElemKey | '';
  spiritName: string; spiritElement: ElemKey | '';
  isBaseForm: boolean; evolvesFromId: string; evolvesFromName: string;
  requiredLevel: string; requiredItem: string;
  requiredSacrifice: string; requiredSacrificeName: string;
  isFusion: boolean; fusionPartner: string; fusionPartnerName: string;
  scannable: boolean; imageScale: string;
  imageData: ImageData;
}

const emptyForm = (): FormState => ({
  name: '', attribute: 'VC', rarity: 'LEGENDARY', element: 'LIGHT',
  hp: '', mp: '', atk: '', def: '', spt: '', spd: '',
  description: '', attackName: '', attackElement: '',
  spiritName: '', spiritElement: '',
  isBaseForm: false, evolvesFromId: '', evolvesFromName: '',
  requiredLevel: '', requiredItem: '',
  requiredSacrifice: '', requiredSacrificeName: '',
  isFusion: false, fusionPartner: '', fusionPartnerName: '',
  scannable: true, imageScale: '0.8',
  imageData: { base64: null, mimeType: 'image/gif', previewUri: null },
});

type PickerTarget = 'evolvesFrom' | 'sacrifice' | 'fusionPartner' | 'sendDigimon' | null;

interface AllCharEntry { id: string; name: string; isBase: boolean; dbId?: number; rawData?: CustomDigimonRaw; isActive?: boolean; }

export default function DigimonSection() {
  const colors = useColors();
  const { token, getApiUrl } = useAuth();
  const { isAdmin } = useGame();
  const [tab, setTab] = useState<DigiTab>('new');
  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [customList, setCustomList] = useState<CustomDigimonRaw[]>([]);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isBaseEdit, setIsBaseEdit] = useState(false);
  const [baseEditCharId, setBaseEditCharId] = useState('');

  const [sendUsername, setSendUsername] = useState('');
  const [sendDigimonId, setSendDigimonId] = useState('');
  const [sendDigimonName, setSendDigimonName] = useState('');
  const [sendLevel, setSendLevel] = useState('1');
  const [sendLoading, setSendLoading] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) { setForm((f) => ({ ...f, [k]: v })); }

  const loadCustomList = useCallback(async () => {
    setLoadingEdit(true);
    try {
      const r = await fetch(`${getApiUrl()}/digimons/custom`);
      const data = await r.json();
      if (data.digimons) setCustomList(data.digimons);
    } catch {} finally { setLoadingEdit(false); }
  }, [getApiUrl]);

  useEffect(() => { loadCustomList(); }, [loadCustomList]);
  useEffect(() => { if (tab === 'edit') loadCustomList(); }, [tab, loadCustomList]);

  function buildBody() {
    return {
      name: form.name.trim(), attribute: form.attribute, rarity: form.rarity, element: form.element,
      hp: Number(form.hp), mp: Number(form.mp), atk: Number(form.atk),
      def: Number(form.def), spt: Number(form.spt), spd: Number(form.spd),
      description: form.description.trim(),
      attackName: form.attackName.trim() || undefined,
      attackElement: form.attackElement || undefined,
      spiritName: form.spiritName.trim() || undefined,
      spiritElement: form.spiritElement || undefined,
      isBaseForm: form.isBaseForm,
      evolvesFromId: form.evolvesFromId || undefined,
      requiredLevel: form.requiredLevel ? Number(form.requiredLevel) : undefined,
      requiredItem: form.requiredItem.trim() || undefined,
      requiredSacrificeCharacter: form.requiredSacrifice || undefined,
      isFusion: form.isFusion, fusionPartner: form.fusionPartner || undefined,
      scannable: form.scannable,
      imageBase64: form.imageData.base64 ?? undefined,
      imageMimeType: form.imageData.mimeType || undefined,
      imageScale: parseFloat(form.imageScale) || 0.8,
    };
  }

  const isPreRookie = PRE_ROOKIE_RARITIES.includes(form.rarity);

  async function handleNew() {
    if (!form.name.trim()) { Alert.alert('Erro', 'Nome obrigatório.'); return; }
    if (!isPreRookie && (!form.hp || !form.mp || !form.atk || !form.def || !form.spt || !form.spd)) {
      Alert.alert('Erro', 'Preencha todos os status.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/digimons`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildBody()),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error ?? 'Falha'); return; }
      Alert.alert('Criado!', `${form.name} adicionado com ID ${data.id}`);
      setForm(emptyForm());
    } catch (e) { Alert.alert('Erro', String(e)); }
    finally { setLoading(false); }
  }

  async function handleSaveEdit() {
    if (!form.name.trim()) { Alert.alert('Erro', 'Nome obrigatório.'); return; }
    setLoading(true);
    try {
      let url = ''; let body: Record<string, unknown> = {};
      if (isBaseEdit) {
        url = `${getApiUrl()}/overrides/${baseEditCharId}`;
        body = {
          name: form.name.trim(), attribute: form.attribute, rarity: form.rarity, element: form.element,
          hp: Number(form.hp) || undefined, mp: Number(form.mp) || undefined,
          atk: Number(form.atk) || undefined, def: Number(form.def) || undefined,
          spt: Number(form.spt) || undefined, spd: Number(form.spd) || undefined,
          description: form.description.trim() || undefined,
          attackName: form.attackName.trim() || undefined,
          attackElement: form.attackElement || undefined,
          spiritName: form.spiritName.trim() || undefined,
          spiritElement: form.spiritElement || undefined,
          scannable: form.scannable,
          imageBase64: form.imageData.base64 ?? undefined,
          imageMimeType: form.imageData.mimeType || undefined,
          imageScale: parseFloat(form.imageScale) || 0.8,
        };
      } else {
        url = `${getApiUrl()}/digimons/${editingId}`;
        body = buildBody();
      }
      const res = await fetch(url, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error ?? 'Falha'); return; }
      Alert.alert('Salvo!', `${form.name} atualizado.`);
      setEditingId(null); setIsBaseEdit(false); setBaseEditCharId(''); setForm(emptyForm());
      loadCustomList();
    } catch (e) { Alert.alert('Erro', String(e)); }
    finally { setLoading(false); }
  }

  async function loadBaseForEdit(charId: string) {
    const base = CHARACTERS[charId];
    if (!base) return;
    setLoading(true);
    try {
      const r = await fetch(`${getApiUrl()}/overrides/${charId}`);
      const data = await r.json();
      const ov = data.override;
      setForm({
        ...emptyForm(),
        name: ov?.name ?? base.name, attribute: (ov?.attribute ?? base.attribute) as AttrKey,
        rarity: (ov?.rarity ?? base.rarity) as RarityKey, element: (ov?.element ?? base.element) as ElemKey,
        hp: String(ov?.hp ?? base.baseStats.hp), mp: String(ov?.mp ?? base.baseStats.mp),
        atk: String(ov?.atk ?? base.baseStats.atk), def: String(ov?.def ?? base.baseStats.def),
        spt: String(ov?.spt ?? base.baseStats.spt), spd: String(ov?.spd ?? base.baseStats.spd),
        description: ov?.description ?? base.description ?? '',
        attackName: ov?.attackName ?? base.attackName ?? '',
        attackElement: (ov?.attackElement ?? base.attackElement ?? '') as ElemKey | '',
        spiritName: ov?.spiritName ?? base.spiritName ?? '',
        spiritElement: (ov?.spiritElement ?? base.spiritElement ?? '') as ElemKey | '',
        scannable: ov?.scannable ?? true,
        imageScale: String(ov?.imageScale ?? 0.8),
        imageData: { base64: null, mimeType: 'image/png', previewUri: ov?.hasImage ? `${getApiUrl()}/overrides/${charId}/image` : null },
      });
      setIsBaseEdit(true); setBaseEditCharId(charId); setEditingId(null);
    } catch (e) { Alert.alert('Erro', String(e)); }
    finally { setLoading(false); }
  }

  function resolveDigimonName(id: string): string {
    if (!id) return '';
    const found = allChars.find((c) => c.id === id);
    if (found) return found.name;
    return id;
  }

  function loadCustomForEdit(d: CustomDigimonRaw) {
    setEditingId(d.dbId); setIsBaseEdit(false); setBaseEditCharId('');
    setForm({
      ...emptyForm(),
      name: d.name, attribute: d.attribute as AttrKey, rarity: d.rarity as RarityKey, element: d.element as ElemKey,
      hp: String(d.baseStats.hp), mp: String(d.baseStats.mp), atk: String(d.baseStats.atk),
      def: String(d.baseStats.def), spt: String(d.baseStats.spt), spd: String(d.baseStats.spd),
      description: d.description, attackName: d.attackName ?? '', attackElement: (d.attackElement ?? '') as ElemKey | '',
      spiritName: d.spiritName ?? '', spiritElement: (d.spiritElement ?? '') as ElemKey | '',
      isBaseForm: d.isBaseForm,
      evolvesFromId: d.evolvesFromId ?? '',
      evolvesFromName: resolveDigimonName(d.evolvesFromId ?? ''),
      requiredLevel: d.requiredLevel ? String(d.requiredLevel) : '',
      requiredItem: d.requiredItem ?? '',
      requiredSacrifice: d.requiredSacrificeCharacter ?? '',
      requiredSacrificeName: resolveDigimonName(d.requiredSacrificeCharacter ?? ''),
      isFusion: d.isFusion,
      fusionPartner: d.fusionPartner ?? '',
      fusionPartnerName: resolveDigimonName(d.fusionPartner ?? ''),
      scannable: d.scannable, imageScale: String(d.imageScale ?? 0.8),
      imageData: { base64: null, mimeType: 'image/gif', previewUri: d.hasImage ? `${getApiUrl()}/digimons/custom/${d.dbId}/image` : null },
    });
  }

  async function handleToggle(dbId: number, currentActive: boolean, name: string) {
    try {
      const res = await fetch(`${getApiUrl()}/digimons/${dbId}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error ?? 'Falha'); return; }
      Alert.alert(
        data.isActive ? '✅ Ativado' : '🔴 Desativado',
        `${name} agora está ${data.isActive ? 'visível para jogadores' : 'oculto para jogadores'}.`
      );
      loadCustomList();
    } catch (e) { Alert.alert('Erro', String(e)); }
  }

  async function handleSend() {
    if (!sendUsername.trim() || !sendDigimonId) { Alert.alert('Erro', 'Username e Digimon obrigatórios.'); return; }
    setSendLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/digimons/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: sendUsername.trim(), characterId: sendDigimonId, characterName: sendDigimonName, level: Number(sendLevel) || 1 }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.error ?? 'Falha'); return; }
      Alert.alert('Enviado!', `${sendDigimonName} lv${sendLevel} → ${sendUsername}`);
      setSendUsername(''); setSendDigimonId(''); setSendDigimonName(''); setSendLevel('1');
    } catch (e) { Alert.alert('Erro', String(e)); }
    finally { setSendLoading(false); }
  }

  const allBaseChars: AllCharEntry[] = Object.values(CHARACTERS).map((c) => ({ id: c.id, name: c.name, isBase: true, isActive: true })).sort((a, b) => a.name.localeCompare(b.name));
  const allCustomChars: AllCharEntry[] = customList.map((c) => ({ id: c.id, name: c.name, isBase: false, dbId: c.dbId, rawData: c, isActive: (c as any).isActive !== false }));
  const allChars: AllCharEntry[] = [...allBaseChars, ...allCustomChars].sort((a, b) => a.name.localeCompare(b.name));

  const isEditing = editingId !== null || isBaseEdit;

  const DigimonForm = () => (
    <>
      <FieldInput label="Nome *" value={form.name} onChange={(v) => set('name', v)} placeholder="Ex: Agumon" />
      <PickerRow label="Atributo *" options={ATTRS} selected={form.attribute} onSelect={(v) => set('attribute', v)} />
      <PickerRow label="Fase *" options={RARITIES} selected={form.rarity} onSelect={(v) => set('rarity', v)} />
      {isPreRookie && (
        <View style={[{ backgroundColor: '#fef9c3', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#fde047' }, pixelStyle]}>
          <Text style={{ color: '#854d0e', fontSize: 12, fontWeight: '600' }}>
            🥚 Estágio pré-Rookie: sem status de batalha. Evolução ocorre na DigiFarm:{'\n'}
            Ovo → 1 dia → Bebê → 1 dia → Treinamento → Lv 5 → Rookie
          </Text>
        </View>
      )}
      <PickerRow label="Elemento *" options={ELEMENTS} selected={form.element} onSelect={(v) => set('element', v)} />
      {!isPreRookie && (
        <>
          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Status Base</Text>
          <View style={ss.statsRow}>
            {(['hp','mp','atk','def','spt','spd'] as const).map((k) => (
              <View key={k} style={ss.statField}>
                <Text style={[ss.label, { color: colors.mutedForeground, fontSize: 11 }]}>{k.toUpperCase()}</Text>
                <TextInput style={[ss.statInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={form[k] as string} onChangeText={(v) => set(k, v as any)} keyboardType="decimal-pad" />
              </View>
            ))}
          </View>
        </>
      )}
      <FieldInput label="Descrição" value={form.description} onChange={(v) => set('description', v)} multiline />
      <FieldInput label="Ataque Base" value={form.attackName} onChange={(v) => set('attackName', v)} placeholder="Ex: Pepper Breath 🔥" />
      <PickerRow label="Elemento Ataque" options={ELEM_ATTACK as any} selected={form.attackElement} onSelect={(v) => set('attackElement', v as any)} />
      <FieldInput label="Ataque Especial" value={form.spiritName} onChange={(v) => set('spiritName', v)} placeholder="Ex: Nova Blast 🔥" />
      <PickerRow label="Elemento Especial" options={ELEM_ATTACK as any} selected={form.spiritElement} onSelect={(v) => set('spiritElement', v as any)} />
      {!isBaseEdit && (
        <>
          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Evolução / Fusão</Text>
          <ToggleRow label="É forma base?" value={form.isBaseForm} onChange={(v) => set('isBaseForm', v)} />
          <DigiPickerField label="Evolui de" value={form.evolvesFromId} name={form.evolvesFromName}
            onPick={() => setPickerTarget('evolvesFrom')}
            onClear={() => setForm((f) => ({ ...f, evolvesFromId: '', evolvesFromName: '' }))} />
          <FieldInput label="Level necessário" value={form.requiredLevel} onChange={(v) => set('requiredLevel', v)} numeric />
          <FieldInput label="Item necessário (ID)" value={form.requiredItem} onChange={(v) => set('requiredItem', v)} placeholder="Ex: anel_sagrado" />
          <DigiPickerField label="Digimon sacrificado" value={form.requiredSacrifice} name={form.requiredSacrificeName}
            onPick={() => setPickerTarget('sacrifice')}
            onClear={() => setForm((f) => ({ ...f, requiredSacrifice: '', requiredSacrificeName: '' }))} />
          <ToggleRow label="É fusão?" value={form.isFusion} onChange={(v) => set('isFusion', v)} />
          {form.isFusion && (
            <DigiPickerField label="Parceiro da fusão" value={form.fusionPartner} name={form.fusionPartnerName}
              onPick={() => setPickerTarget('fusionPartner')}
              onClear={() => setForm((f) => ({ ...f, fusionPartner: '', fusionPartnerName: '' }))} />
          )}
        </>
      )}
      <ToggleRow label="Pode ser escaneado?" value={form.scannable} onChange={(v) => set('scannable', v)} />
      <ImagePickerBlock data={form.imageData} onChange={(d) => set('imageData', d)} label="Imagem do Digimon (GIF/PNG — 256×256px)" cropWidth={256} cropHeight={256} />
      {form.imageData.previewUri && (
        <FieldInput label="Escala da imagem (0.2–2.5)" value={form.imageScale} onChange={(v) => set('imageScale', v)} numeric placeholder="0.8" />
      )}
    </>
  );

  return (
    <View style={{ flex: 1 }}>
      <DigimonPickerModal visible={pickerTarget !== null && pickerTarget !== 'sendDigimon'} onClose={() => setPickerTarget(null)}
        customDigimons={customList.map((c) => ({ id: c.id, name: c.name }))}
        onSelect={(id, name) => {
          if (pickerTarget === 'evolvesFrom') setForm((f) => ({ ...f, evolvesFromId: id, evolvesFromName: name }));
          else if (pickerTarget === 'sacrifice') setForm((f) => ({ ...f, requiredSacrifice: id, requiredSacrificeName: name }));
          else if (pickerTarget === 'fusionPartner') setForm((f) => ({ ...f, fusionPartner: id, fusionPartnerName: name }));
        }} />
      <DigimonPickerModal visible={pickerTarget === 'sendDigimon'} onClose={() => setPickerTarget(null)}
        customDigimons={customList.map((c) => ({ id: c.id, name: c.name }))}
        onSelect={(id, name) => { setSendDigimonId(id); setSendDigimonName(name); }} />

      <View style={ss.tabRow}>
        {([['new','+ Novo'],['edit','✏ Editar']] as const).map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => { setTab(key); setEditingId(null); setIsBaseEdit(false); setBaseEditCharId(''); setForm(emptyForm()); }}
            style={[ss.tabBtn, { backgroundColor: tab === key ? colors.primary : colors.card, borderColor: colors.border }]}>
            <Text style={{ color: tab === key ? '#fff' : colors.foreground, fontWeight: '600', fontSize: 12 }}>{label}</Text>
          </TouchableOpacity>
        ))}
        {isAdmin && (
          <TouchableOpacity onPress={() => { setTab('send'); setEditingId(null); setIsBaseEdit(false); setBaseEditCharId(''); setForm(emptyForm()); }}
            style={[ss.tabBtn, { backgroundColor: tab === 'send' ? colors.primary : colors.card, borderColor: colors.border }]}>
            <Text style={{ color: tab === 'send' ? '#fff' : colors.foreground, fontWeight: '600', fontSize: 12 }}>🎁 Enviar</Text>
          </TouchableOpacity>
        )}
      </View>

      {tab === 'new' && (
        <>
          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Novo Digimon</Text>
          {DigimonForm()}
          {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : (
            <TouchableOpacity onPress={handleNew} style={[ds.submitBtn, { backgroundColor: colors.primary }, pixelStyle]}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Criar Digimon</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {tab === 'edit' && (
        <>
          {!isEditing ? (
            <>
              <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Todos os Digimons ({allChars.length})</Text>
              {loadingEdit ? <ActivityIndicator color={colors.primary} /> : (
                allChars.map((c) => (
                  <View key={c.id} style={[ds.charRow, { backgroundColor: colors.card, borderColor: c.isActive === false ? '#ef444444' : colors.border }, pixelStyle]}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => c.isBase ? loadBaseForEdit(c.id) : loadCustomForEdit(c.rawData!)}>
                      <Text style={{ color: colors.foreground, fontWeight: '600' }}>{c.name}</Text>
                      {c.isBase && <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{c.id}</Text>}
                    </TouchableOpacity>
                    <View style={[ds.badge, { backgroundColor: c.isBase ? '#3b82f622' : '#a855f722', borderColor: c.isBase ? '#3b82f6' : '#a855f7' }]}>
                      <Text style={{ color: c.isBase ? '#3b82f6' : '#a855f7', fontSize: 10 }}>{c.isBase ? 'BASE' : 'CRIADO'}</Text>
                    </View>
                  </View>
                ))
              )}
              {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[ss.sectionTitle, { color: colors.foreground, marginTop: 0 }]}>
                  Editando: {form.name} {isBaseEdit && <Text style={{ color: '#3b82f6', fontSize: 11 }}>(BASE)</Text>}
                </Text>
                <TouchableOpacity onPress={() => { setEditingId(null); setIsBaseEdit(false); setBaseEditCharId(''); setForm(emptyForm()); }}
                  style={[ss.pill, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>← Voltar</Text>
                </TouchableOpacity>
              </View>
              {DigimonForm()}
              {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : (
                <TouchableOpacity onPress={handleSaveEdit} style={[ds.submitBtn, { backgroundColor: '#a855f7' }, pixelStyle]}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Salvar Alterações</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      )}

      {tab === 'send' && (
        <>
          <Text style={[ss.sectionTitle, { color: colors.foreground }]}>Enviar Digimon</Text>
          <FieldInput label="Username do jogador" value={sendUsername} onChange={setSendUsername} placeholder="Ex: dede336" />
          <View style={ss.fieldGroup}>
            <Text style={[ss.label, { color: colors.mutedForeground }]}>Digimon</Text>
            {sendDigimonId ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: colors.foreground, flex: 1 }}>
                  {sendDigimonName}
                  {!sendDigimonId.startsWith('custom_') && <Text style={{ color: '#6b7280', fontSize: 11 }}> ({sendDigimonId})</Text>}
                </Text>
                <TouchableOpacity onPress={() => { setSendDigimonId(''); setSendDigimonName(''); }}
                  style={[ss.pill, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.foreground, fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setPickerTarget('sendDigimon')}
                style={[ss.imageBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={{ color: colors.primary }}>Selecionar Digimon...</Text>
              </TouchableOpacity>
            )}
          </View>
          <FieldInput label="Level" value={sendLevel} onChange={setSendLevel} numeric placeholder="1" />
          {sendLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : (
            <TouchableOpacity onPress={handleSend} style={[ds.submitBtn, { backgroundColor: '#22c55e' }, pixelStyle]}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Enviar Digimon</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const ds = StyleSheet.create({
  submitBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16, marginBottom: 8 },
  charRow: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
});
