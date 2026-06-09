import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { pixelStyle } from '@/constants/pixelStyle';

export default function FarmSection() {
  const colors = useColors();
  const { token, getApiUrl } = useAuth();
  const apiUrl = getApiUrl();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [xpPerHour, setXpPerHour] = useState('10');
  const [maxHours, setMaxHours] = useState('8');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/config`)
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          setXpPerHour(data.config.farmXpPerHour ?? '10');
          setMaxHours(data.config.farmMaxHours ?? '8');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    const xp = Number(xpPerHour);
    const hours = Number(maxHours);
    if (isNaN(xp) || xp <= 0) { Alert.alert('Erro', 'XP por hora deve ser um número positivo'); return; }
    if (isNaN(hours) || hours <= 0 || hours > 24) { Alert.alert('Erro', 'Horas máximas deve ser entre 1 e 24'); return; }
    setSaving(true);
    try {
      await Promise.all([
        fetch(`${apiUrl}/config/farmXpPerHour`, { method: 'PUT', headers, body: JSON.stringify({ value: String(xp) }) }),
        fetch(`${apiUrl}/config/farmMaxHours`, { method: 'PUT', headers, body: JSON.stringify({ value: String(hours) }) }),
      ]);
      Alert.alert('Sucesso', 'Configurações da Digifarm salvas!');
    } catch {
      Alert.alert('Erro', 'Falha ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>🌿 Configurações da Digifarm</Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
          Ajuste o XP que os Digimons ganham passivamente na Digifarm. O XP é calculado por hora para cada Digimon na fazenda.
        </Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>XP por hora (base)</Text>
          <Text style={[styles.sublabel, { color: colors.mutedForeground }]}>Multiplicado pelo nível do tamer. Padrão: 10</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            value={xpPerHour}
            onChangeText={setXpPerHour}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>Horas máximas offline</Text>
          <Text style={[styles.sublabel, { color: colors.mutedForeground }]}>Máximo de horas acumuladas sem coletar. Padrão: 8</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            value={maxHours}
            onChangeText={setMaxHours}
            keyboardType="numeric"
            placeholder="8"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={[styles.previewBox, { backgroundColor: colors.background, borderColor: colors.border }, pixelStyle]}>
          <Text style={[styles.previewTitle, { color: colors.mutedForeground }]}>📊 Estimativa de XP</Text>
          {[1, 5, 10, 20, 30].map((lv) => {
            const xpH = Number(xpPerHour) * (1 + lv * 0.1);
            const total = xpH * Number(maxHours);
            return (
              <Text key={lv} style={[styles.previewRow, { color: colors.foreground }]}>
                Lv {lv}: {xpH.toFixed(1)} XP/h → {total.toFixed(0)} XP máx
              </Text>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: '#22c55e', opacity: saving ? 0.6 : 1 }, pixelStyle]}
          onPress={save}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? <ActivityIndicator size={16} color="#fff" /> : <Text style={styles.saveBtnText}>Salvar Configurações</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 14 },
  cardTitle: { fontSize: 14, fontWeight: '800' as const },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  field: { gap: 4 },
  label: { fontSize: 12, fontWeight: '700' as const },
  sublabel: { fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  previewBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  previewTitle: { fontSize: 12, fontWeight: '700' as const, marginBottom: 4 },
  previewRow: { fontSize: 13 },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800' as const, fontSize: 13 },
});
