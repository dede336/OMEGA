import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Modal, FlatList, Alert, StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useColors } from '@/hooks/useColors';
import { CHARACTERS } from '@/constants/gameData';
import { getCustomCharacters } from '@/constants/extendedCharacters';
import ImageCropEditor from './ImageCropEditor';
import { pixelStyle } from '@/constants/pixelStyle';

export type AttrKey = 'VC' | 'VR' | 'DA' | 'NO' | 'UN' | 'FR';
export type RarityKey = 'EGG' | 'BABY' | 'TRAINING' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'BURST';
export type ElemKey = 'FIRE' | 'PLANT' | 'WATER' | 'WIND' | 'EARTH' | 'LIGHTNING' | 'LIGHT' | 'DARK' | 'NULL' | 'ICE' | 'METAL';

export const ATTRS: { key: AttrKey; label: string }[] = [
  { key: 'VC', label: 'Vacina' }, { key: 'VR', label: 'Vírus' },
  { key: 'DA', label: 'Data' }, { key: 'NO', label: 'Nulo' },
  { key: 'UN', label: 'Desconhecido' }, { key: 'FR', label: 'Livre' },
];
export const RARITIES: { key: RarityKey; label: string }[] = [
  { key: 'EGG', label: '🥚 Ovo' }, { key: 'BABY', label: '🍼 Bebê' }, { key: 'TRAINING', label: '🌱 Treinamento' },
  { key: 'COMMON', label: 'Rookie' }, { key: 'RARE', label: 'Champion' },
  { key: 'EPIC', label: 'Ultimate' }, { key: 'LEGENDARY', label: 'Mega' }, { key: 'BURST', label: 'Burst' },
];
export const PRE_ROOKIE_RARITIES: RarityKey[] = ['EGG', 'BABY', 'TRAINING'];
export const ELEMENTS: { key: ElemKey; label: string }[] = [
  { key: 'FIRE', label: 'Fogo' }, { key: 'PLANT', label: 'Planta' },
  { key: 'WATER', label: 'Água' }, { key: 'WIND', label: 'Vento' },
  { key: 'EARTH', label: 'Terra' }, { key: 'LIGHTNING', label: 'Trovão' },
  { key: 'LIGHT', label: 'Luz' }, { key: 'DARK', label: 'Trevas' },
  { key: 'NULL', label: 'Nulo' }, { key: 'ICE', label: 'Gelo' }, { key: 'METAL', label: 'Metal' },
];
export const ELEM_ATTACK: { key: ElemKey | ''; label: string }[] = [{ key: '', label: '(padrão)' }, ...ELEMENTS];

const COLOR_PRESETS: { hex: string; label: string }[] = [
  { hex: '#ef4444', label: 'Fogo' },
  { hex: '#f97316', label: 'Laranja' },
  { hex: '#eab308', label: 'Trovão' },
  { hex: '#22c55e', label: 'Planta' },
  { hex: '#84cc16', label: 'Vento' },
  { hex: '#3b82f6', label: 'Água' },
  { hex: '#67e8f9', label: 'Gelo' },
  { hex: '#7c3aed', label: 'Trevas' },
  { hex: '#a855f7', label: 'Roxo' },
  { hex: '#ec4899', label: 'Rosa' },
  { hex: '#f8fafc', label: 'Luz' },
  { hex: '#6b7280', label: 'Nulo' },
  { hex: '#94a3b8', label: 'Metal' },
  { hex: '#a16207', label: 'Terra' },
  { hex: '#1e293b', label: 'Sombra' },
];

export function PickerRow<T extends string>({ label, options, selected, onSelect }: {
  label: string; options: { key: T; label: string }[]; selected: T; onSelect: (v: T) => void;
}) {
  const colors = useColors();
  return (
    <View style={ss.fieldGroup}>
      <Text style={[ss.label, { color: colors.mutedForeground }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }} keyboardShouldPersistTaps="always">
        {options.map((o) => (
          <TouchableOpacity key={o.key} onPress={() => onSelect(o.key)}
            style={[ss.pill, { borderColor: colors.border, backgroundColor: selected === o.key ? colors.primary : colors.card }]}>
            <Text style={{ color: selected === o.key ? '#fff' : colors.foreground, fontSize: 12 }}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const colors = useColors();
  return (
    <View style={[ss.fieldGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
      <Text style={[ss.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TouchableOpacity onPress={() => onChange(!value)}
        style={[ss.toggleBtn, { backgroundColor: value ? colors.primary : colors.card, borderColor: colors.border }]}>
        <Text style={{ color: value ? '#fff' : colors.foreground, fontWeight: '600' }}>{value ? 'Sim' : 'Não'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function FieldInput({ label, value, onChange, numeric, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  numeric?: boolean; multiline?: boolean; placeholder?: string;
}) {
  const colors = useColors();
  return (
    <View style={ss.fieldGroup}>
      <Text style={[ss.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[ss.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, height: multiline ? 70 : 40 }, pixelStyle]}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        placeholder={placeholder ?? ''}
        placeholderTextColor={colors.mutedForeground}
        textAlignVertical={multiline ? 'top' : 'auto'}
        autoCorrect={false}
        autoCapitalize={numeric ? 'none' : 'sentences'}
        blurOnSubmit={false}
        returnKeyType={multiline ? 'default' : 'next'}
      />
    </View>
  );
}

export function ColorPickerField({ label, value, onChange }: {
  label: string; value: string; onChange: (hex: string) => void;
}) {
  const colors = useColors();
  const isPreset = COLOR_PRESETS.some((c) => c.hex === value);
  return (
    <View style={ss.fieldGroup}>
      <Text style={[ss.label, { color: colors.mutedForeground }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }} keyboardShouldPersistTaps="always">
        {COLOR_PRESETS.map((c) => {
          const selected = value === c.hex;
          return (
            <TouchableOpacity key={c.hex} onPress={() => onChange(c.hex)} style={{ marginRight: 10, alignItems: 'center' }}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: c.hex,
                borderWidth: selected ? 3 : 1.5,
                borderColor: selected ? colors.primary : colors.border,
                alignItems: 'center', justifyContent: 'center',
              }}>
                {selected && <Text style={{ fontSize: 14, color: c.hex === '#f8fafc' ? '#000' : '#fff', fontWeight: '700' }}>✓</Text>}
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 3 }}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: value, borderWidth: 1, borderColor: colors.border }} />
        <TextInput
          style={[ss.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, height: 36 }, pixelStyle]}
          value={value}
          onChangeText={onChange}
          placeholder="#3b82f6"
          placeholderTextColor={colors.mutedForeground}
          autoCorrect={false}
          autoCapitalize="none"
          blurOnSubmit={false}
        />
      </View>
    </View>
  );
}

export interface ImageData { base64: string | null; mimeType: string; previewUri: string | null; }

export function ImagePickerBlock({ data, onChange, label, cropWidth, cropHeight }: {
  data: ImageData; onChange: (d: ImageData) => void; label?: string;
  cropWidth?: number; cropHeight?: number;
}) {
  const colors = useColors();
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permissão negada', 'Precisa de acesso à galeria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 1 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const rawMime = asset.mimeType ?? '';
    const isGif = rawMime.toLowerCase().includes('gif') || asset.uri.toLowerCase().includes('.gif');
    const mime = isGif ? 'image/gif' : (rawMime || 'image/png');
    if (cropWidth && cropHeight && !isGif) {
      setPendingUri(asset.uri);
    } else if (isGif) {
      // asset.base64 from ImagePicker is only the first frame (JPEG) for GIFs
      // Read the actual GIF file to preserve animation
      try {
        const cacheUri = `${(FileSystem as any).cacheDirectory}upload_gif_${Date.now()}.gif`;
        await FileSystem.copyAsync({ from: asset.uri, to: cacheUri });
        const gifBase64 = await FileSystem.readAsStringAsync(cacheUri, { encoding: FileSystem.EncodingType.Base64 });
        await FileSystem.deleteAsync(cacheUri, { idempotent: true });
        onChange({ base64: gifBase64, previewUri: asset.uri, mimeType: 'image/gif' });
      } catch {
        onChange({ base64: asset.base64 ?? null, previewUri: asset.uri, mimeType: mime });
      }
    } else {
      onChange({ base64: asset.base64 ?? null, previewUri: asset.uri, mimeType: mime });
    }
  }

  return (
    <View style={ss.fieldGroup}>
      <Text style={[ss.label, { color: colors.mutedForeground }]}>{label ?? 'Imagem'}</Text>
      {data.previewUri ? (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Image source={{ uri: data.previewUri }} style={{ width: 80, height: 80 }} contentFit="contain" />
          <TouchableOpacity onPress={() => onChange({ base64: null, previewUri: null, mimeType: 'image/png' })}
            style={[ss.pill, { borderColor: colors.border }]}>
            <Text style={{ color: colors.foreground, fontSize: 12 }}>Trocar imagem</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={pickImage} style={[ss.imageBtn, { borderColor: colors.border, backgroundColor: colors.card }, pixelStyle]}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>
            {cropWidth && cropHeight ? `Selecionar e recortar (${cropWidth}×${cropHeight}px)` : 'Selecionar da galeria'}
          </Text>
        </TouchableOpacity>
      )}

      {pendingUri && cropWidth && cropHeight && (
        <ImageCropEditor
          visible
          imageUri={pendingUri}
          targetWidth={cropWidth}
          targetHeight={cropHeight}
          onConfirm={(base64, mimeType) => {
            onChange({ base64, mimeType, previewUri: `data:${mimeType};base64,${base64}` });
            setPendingUri(null);
          }}
          onCancel={() => setPendingUri(null)}
        />
      )}
    </View>
  );
}

interface DigiEntry { id: string; name: string; isCustom: boolean; }
export function DigimonPickerModal({ visible, onClose, onSelect, customDigimons }: {
  visible: boolean; onClose: () => void; onSelect: (id: string, name: string) => void;
  customDigimons?: { id: string; name: string }[];
}) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const customEntries = customDigimons ?? getCustomCharacters().map((c) => ({ id: c.id, name: c.name }));
  const allDigimons: DigiEntry[] = [
    ...Object.values(CHARACTERS).map((c) => ({ id: c.id, name: c.name, isCustom: false })),
    ...customEntries.map((c) => ({ id: c.id, name: c.name, isCustom: true })),
  ].filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i).sort((a, b) => a.name.localeCompare(b.name));
  const filtered = search.trim()
    ? allDigimons.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : allDigimons;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ss.modalOverlay}>
        <View style={[ss.modalBox, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
          <Text style={[ss.modalTitle, { color: colors.foreground }]}>Selecionar Digimon</Text>
          <TextInput style={[ss.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginBottom: 8 }, pixelStyle]}
            placeholder="Buscar..." placeholderTextColor={colors.mutedForeground} value={search} onChangeText={setSearch}
            autoCorrect={false} autoCapitalize="none" blurOnSubmit={false} />
          <FlatList data={filtered} keyExtractor={(d) => d.id} style={{ maxHeight: 320 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={[ss.digiRow, { borderBottomColor: colors.border }]}
                onPress={() => { onSelect(item.id, item.name); onClose(); setSearch(''); }}>
                {!item.isCustom && <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{item.id}</Text>}
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{item.name}</Text>
              </TouchableOpacity>
            )} />
          <TouchableOpacity onPress={onClose} style={[ss.pill, { borderColor: colors.border, backgroundColor: colors.background, alignSelf: 'center', marginTop: 12 }]}>
            <Text style={{ color: colors.foreground }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function DigiPickerField({ label, value, name, onPick, onClear }: {
  label: string; value: string; name: string; onPick: () => void; onClear: () => void;
}) {
  const colors = useColors();
  const isCustom = value.startsWith('custom_');
  return (
    <View style={ss.fieldGroup}>
      <Text style={[ss.label, { color: colors.mutedForeground }]}>{label}</Text>
      {value ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[ss.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }, pixelStyle]}>
            <Text style={{ color: colors.foreground }}>
              {name || value}
              {!isCustom && <Text style={{ color: colors.mutedForeground, fontSize: 11 }}> ({value})</Text>}
            </Text>
          </View>
          <TouchableOpacity onPress={onClear} style={[ss.pill, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={{ color: colors.foreground, fontSize: 12 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={onPick} style={[ss.imageBtn, { borderColor: colors.border, backgroundColor: colors.card }, pixelStyle]}>
          <Text style={{ color: colors.primary, fontSize: 13 }}>Selecionar Digimon...</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export const ss = StyleSheet.create({
  fieldGroup: { marginBottom: 12 },
  label: { fontSize: 12, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, height: 40 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 6 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  imageBtn: { borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderStyle: 'dashed' },
  modalOverlay: { flex: 1, backgroundColor: '#000a', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, padding: 16, maxHeight: '80%' },
  modalTitle: { fontWeight: '700', fontSize: 14, marginBottom: 12 },
  digiRow: { paddingVertical: 10, borderBottomWidth: 1, gap: 2 },
  sectionTitle: { fontWeight: '700', fontSize: 12, marginTop: 16, marginBottom: 8 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statField: { width: '30%' },
  statInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, height: 36, fontSize: 13 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  circlePreview: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
});
