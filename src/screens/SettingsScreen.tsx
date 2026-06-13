import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTechnician, saveTechnician, TechnicianInfo } from '../utils/technicianStorage';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

const makeStyles = (C: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 1, paddingHorizontal: 4, marginTop: 8, marginBottom: 4,
  },
  card: {
    backgroundColor: C.card, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 16 },
  fieldGroup: { paddingHorizontal: 16, paddingVertical: 10 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase',
  },
  textInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 15,
    color: C.text, backgroundColor: C.inputBg,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, marginHorizontal: 16, marginBottom: 8, borderRadius: 8,
    backgroundColor: C.primaryBg,
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },
  themePicker: { flexDirection: 'row', padding: 10, gap: 8 },
  themeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.border, gap: 4,
  },
  themeBtnActive: { backgroundColor: C.primaryBg, borderColor: C.primary },
  themeIcon: { fontSize: 20 },
  themeBtnLabel: { fontSize: 12, fontWeight: '600', color: C.muted },
  themeBtnLabelActive: { color: C.primary },
  hint: { fontSize: 12, color: C.muted, paddingHorizontal: 4, lineHeight: 18 },
  version: { textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 16, marginBottom: 8 },
});

export default function SettingsScreen() {
  const { colors: C, mode, setMode } = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
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

  const themeOptions: { m: ThemeMode; icon: string; label: string }[] = [
    { m: 'system', icon: '📱', label: 'Systemowy' },
    { m: 'light', icon: '☀️', label: 'Jasny' },
    { m: 'dark', icon: '🌙', label: 'Ciemny' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Wygląd */}
        <Text style={s.sectionLabel}>WYGLĄD</Text>
        <View style={s.card}>
          <View style={s.themePicker}>
            {themeOptions.map(opt => (
              <TouchableOpacity
                key={opt.m}
                style={[s.themeBtn, mode === opt.m && s.themeBtnActive]}
                onPress={() => setMode(opt.m)}
              >
                <Text style={s.themeIcon}>{opt.icon}</Text>
                <Text style={[s.themeBtnLabel, mode === opt.m && s.themeBtnLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dane technika */}
        <Text style={s.sectionLabel}>DANE TECHNIKA</Text>
        <View style={s.card}>
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>IMIĘ I NAZWISKO</Text>
            <TextInput
              style={s.textInput}
              value={form.name}
              onChangeText={v => set('name', v)}
              placeholder="np. Jan Kowalski"
              placeholderTextColor={C.muted}
              autoCapitalize="words"
            />
          </View>
          <View style={s.divider} />
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>FIRMA</Text>
            <TextInput
              style={s.textInput}
              value={form.company}
              onChangeText={v => set('company', v)}
              placeholder="np. AutoService Sp. z o.o."
              placeholderTextColor={C.muted}
              autoCapitalize="words"
            />
          </View>
          <View style={s.divider} />
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>TELEFON</Text>
            <TextInput
              style={s.textInput}
              value={form.phone}
              onChangeText={v => set('phone', v)}
              placeholder="np. +48 600 000 000"
              placeholderTextColor={C.muted}
              keyboardType="phone-pad"
            />
          </View>
          <View style={s.divider} />
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons
              name={saved ? 'checkmark-circle' : 'save-outline'}
              size={16}
              color={saved ? C.success : C.primary}
            />
            <Text style={[s.saveBtnText, saved && { color: C.success }]}>
              {saved ? 'Zapisano' : 'Zapisz dane'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={s.hint}>
          Dane technika pojawią się na każdym wygenerowanym raporcie PDF.
        </Text>

        <Text style={s.version}>ServiceLog v1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
