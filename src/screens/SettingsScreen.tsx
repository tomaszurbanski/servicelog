import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTechnician, saveTechnician, TechnicianInfo } from '../utils/technicianStorage';

const C = {
  primary: '#1D4ED8', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#1E293B', muted: '#64748B', border: '#E2E8F0',
  success: '#15803D', successBg: '#F0FDF4',
};

export default function SettingsScreen() {
  const [form, setForm] = useState<TechnicianInfo>({ name: '', company: '', phone: '' });
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    getTechnician().then(setForm);
  }, []));

  const set = (key: keyof TechnicianInfo, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    await saveTechnician(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionLabel}>DANE TECHNIKA</Text>
        <View style={styles.card}>
          <Field label="IMIĘ I NAZWISKO" value={form.name} onChangeText={v => set('name', v)} placeholder="np. Jan Kowalski" />
          <Divider />
          <Field label="FIRMA" value={form.company} onChangeText={v => set('company', v)} placeholder="np. AutoService Sp. z o.o." />
          <Divider />
          <Field label="TELEFON" value={form.phone} onChangeText={v => set('phone', v)} placeholder="np. +48 600 000 000" keyboardType="phone-pad" />
        </View>

        <Text style={styles.hint}>
          Dane technika pojawią się na każdym wygenerowanym raporcie PDF.
        </Text>

        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnDone]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={[styles.saveBtnText, saved && styles.saveBtnTextDone]}>
            {saved ? '✓ Zapisano' : 'Zapisz dane'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>ServiceLog v1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType}
        autoCapitalize="words"
      />
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: -16, marginVertical: 2 }} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1, marginTop: 4, paddingHorizontal: 4 },
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  fieldWrap: { paddingVertical: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase' },
  fieldInput: { fontSize: 15, color: C.text, paddingVertical: 2 },
  hint: { fontSize: 12, color: C.muted, paddingHorizontal: 4, lineHeight: 18 },
  saveBtn: {
    backgroundColor: C.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 4,
    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnDone: { backgroundColor: C.success },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  saveBtnTextDone: { color: '#fff' },
  versionText: { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 8 },
});
