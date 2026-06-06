import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Image, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File as FSFile, Paths } from 'expo-file-system';
import { RootStackParamList } from '../../App';
import { ServiceNote, ServicePhoto, NoteStatus, WorkSession } from '../types';
import { getNote, saveNote } from '../utils/storage';
import { exportToPDF } from '../utils/export';
import {
  STATUS_LABELS, STATUS_COLORS, STATUS_BG,
  formatDate, formatTime, generateId,
  formatTimeInput, calcTotalMinutes, formatDuration,
} from '../utils/helpers';

type Props = NativeStackScreenProps<RootStackParamList, 'Note'>;

const C = {
  primary: '#1D4ED8', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#1E293B', muted: '#64748B', border: '#E2E8F0',
  danger: '#DC2626', success: '#15803D',
};

const PHOTOS_DIR = new Directory(Paths.document, 'servicelog', 'photos');
const STATUSES: NoteStatus[] = ['open', 'in_progress', 'done', 'waiting_parts'];

const emptyNote = (): Omit<ServiceNote, 'id' | 'createdAt' | 'updatedAt'> => ({
  status: 'open',
  client: '',
  location: '',
  kraj: '',
  machine: '',
  machineNumber: '',
  date: formatDate(new Date()),
  sessions: [{ start: formatTime(new Date()), end: '' }],
  problem: '',
  workDone: '',
  parts: '',
  notes: '',
  photos: [],
});

export default function NoteScreen({ route, navigation }: Props) {
  const noteId = route.params?.noteId;
  const isNew = !noteId;

  const [form, setForm] = useState(emptyNote());
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew && noteId) {
      getNote(noteId).then(n => {
        if (n) setForm(n);
        setLoading(false);
      });
    }
  }, [noteId, isNew]);

  const set = (key: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const updateSession = (idx: number, key: 'start' | 'end', val: string) => {
    const sessions = [...form.sessions];
    sessions[idx] = { ...sessions[idx], [key]: formatTimeInput(val) };
    set('sessions', sessions);
  };

  const addSession = () => set('sessions', [...form.sessions, { start: '', end: '' }]);

  const removeSession = (idx: number) =>
    set('sessions', form.sessions.filter((_, i) => i !== idx));

  const totalMinutes = calcTotalMinutes(form.sessions);

  const handleSave = useCallback(async () => {
    if (!form.client.trim() && !form.machine.trim()) {
      Alert.alert('Brak danych', 'Podaj co najmniej klienta lub maszynę.');
      return;
    }
    setSaving(true);
    const note: ServiceNote = {
      id: noteId ?? generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...form,
    };
    await saveNote(note);
    setSaving(false);
    navigation.goBack();
  }, [form, noteId, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isNew ? 'Nowa notatka' : 'Edytuj notatkę',
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ paddingHorizontal: 4 }}>
          {saving
            ? <ActivityIndicator size="small" color={C.primary} />
            : <Text style={{ color: C.primary, fontWeight: '700', fontSize: 16 }}>Zapisz</Text>}
        </TouchableOpacity>
      ),
    });
  }, [navigation, isNew, handleSave, saving]);

  const ensurePhotosDir = () => {
    if (!PHOTOS_DIR.exists) PHOTOS_DIR.create({ intermediates: true });
  };

  const pickPhoto = async (source: 'camera' | 'library') => {
    const { status } = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Brak uprawnień', 'Aplikacja potrzebuje dostępu do aparatu/galerii.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.75 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.75 });

    if (!result.canceled && result.assets[0]) {
      ensurePhotosDir();
      const destFile = new FSFile(PHOTOS_DIR, generateId() + '.jpg');
      await new FSFile(result.assets[0].uri).copy(destFile);
      const photo: ServicePhoto = { id: generateId(), uri: destFile.uri, caption: '' };
      set('photos', [...form.photos, photo]);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert('Dodaj zdjęcie', '', [
      { text: 'Aparat', onPress: () => pickPhoto('camera') },
      { text: 'Galeria', onPress: () => pickPhoto('library') },
      { text: 'Anuluj', style: 'cancel' },
    ]);
  };

  const removePhoto = (id: string) => {
    Alert.alert('Usuń zdjęcie', 'Czy usunąć to zdjęcie?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive',
        onPress: () => set('photos', form.photos.filter(p => p.id !== id)),
      },
    ]);
  };

  const updateCaption = (id: string, caption: string) =>
    set('photos', form.photos.map(p => p.id === id ? { ...p, caption } : p));

  const handleExport = async () => {
    if (!form.client.trim() && !form.machine.trim()) {
      Alert.alert('Brak danych', 'Uzupełnij notatkę przed eksportem.');
      return;
    }
    setExporting(true);
    try {
      const note: ServiceNote = {
        id: noteId ?? generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...form,
      };
      await exportToPDF(note);
    } catch {
      Alert.alert('Błąd', 'Nie udało się wygenerować raportu PDF.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Klient / Lokalizacja / Kraj / Maszyna */}
        <View style={styles.card}>
          <Field label="KLIENT" value={form.client} onChangeText={v => set('client', v)} placeholder="np. Polipol" />
          <Divider />
          <Field label="LOKALIZACJA" value={form.location} onChangeText={v => set('location', v)} placeholder="np. Wągrowiec" />
          <Divider />
          <Field label="KRAJ" value={form.kraj} onChangeText={v => set('kraj', v)} placeholder="np. Polska" />
          <Divider />
          <Field label="MASZYNA" value={form.machine} onChangeText={v => set('machine', v)} placeholder="np. Linia produkcyjna" />
          <Divider />
          <Field label="NR MASZYNY" value={form.machineNumber} onChangeText={v => set('machineNumber', v)} placeholder="np. SN-2024-001" />
        </View>

        {/* Data */}
        <View style={styles.card}>
          <Field label="DATA" value={form.date} onChangeText={v => set('date', v)} placeholder="DD.MM.RRRR" keyboardType="numeric" />
        </View>

        {/* Sesje pracy */}
        <Text style={styles.sectionLabel}>CZAS PRACY</Text>
        <View style={styles.card}>
          {form.sessions.map((session, idx) => (
            <View key={idx}>
              {idx > 0 && <Divider />}
              <View style={styles.sessionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>OD</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={session.start}
                    onChangeText={v => updateSession(idx, 'start', v)}
                    placeholder="08:00"
                    keyboardType="numeric"
                    placeholderTextColor={C.muted}
                  />
                </View>
                <View style={styles.timeSep} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>DO</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={session.end}
                    onChangeText={v => updateSession(idx, 'end', v)}
                    placeholder="16:00"
                    keyboardType="numeric"
                    placeholderTextColor={C.muted}
                  />
                </View>
                {form.sessions.length > 1 && (
                  <TouchableOpacity onPress={() => removeSession(idx)} style={styles.sessionRemove}>
                    <Ionicons name="close-circle" size={22} color={C.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {totalMinutes > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Łącznie:</Text>
              <Text style={styles.totalValue}>{formatDuration(totalMinutes)}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.addSessionBtn} onPress={addSession}>
            <Ionicons name="add-circle-outline" size={18} color={C.primary} />
            <Text style={styles.addSessionText}>Dodaj przerwę / kolejną sesję</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <Text style={styles.sectionLabel}>STATUS</Text>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            {STATUSES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusBtn, form.status === s && { backgroundColor: STATUS_BG[s], borderColor: STATUS_COLORS[s] }]}
                onPress={() => set('status', s)}
              >
                <Text style={[styles.statusBtnText, form.status === s && { color: STATUS_COLORS[s] }]}>
                  {STATUS_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Opisy */}
        <Text style={styles.sectionLabel}>SZCZEGÓŁY</Text>
        <View style={styles.card}>
          <TextAreaField label="OPIS USTERKI" value={form.problem} onChangeText={v => set('problem', v)} placeholder="Opisz problem, objawy, okoliczności…" />
          <Divider />
          <TextAreaField label="WYKONANE PRACE" value={form.workDone} onChangeText={v => set('workDone', v)} placeholder="Co zostało sprawdzone / naprawione / wymienione…" />
          <Divider />
          <TextAreaField label="CZĘŚCI DO WYMIANY" value={form.parts} onChangeText={v => set('parts', v)} placeholder="np. Czujnik indukcyjny M12 PNP, przewód M12 5m…" height={80} />
          <Divider />
          <TextAreaField label="UWAGI / ZALECENIA" value={form.notes} onChangeText={v => set('notes', v)} placeholder="Dodatkowe uwagi, zalecenia dla klienta…" height={80} />
        </View>

        {/* Zdjęcia */}
        <Text style={styles.sectionLabel}>ZDJĘCIA ({form.photos.length})</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.photoBtn} onPress={showPhotoOptions}>
            <Ionicons name="camera-outline" size={18} color={C.primary} />
            <Text style={styles.photoBtnText}>Dodaj zdjęcie</Text>
          </TouchableOpacity>
          {form.photos.length > 0 && (
            <View style={styles.photoGrid}>
              {form.photos.map(photo => (
                <View key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImg} />
                  <TouchableOpacity style={styles.photoDelete} onPress={() => removePhoto(photo.id)}>
                    <Ionicons name="close-circle" size={22} color={C.danger} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.captionInput}
                    value={photo.caption}
                    onChangeText={v => updateCaption(photo.id, v)}
                    placeholder="Opis zdjęcia…"
                    placeholderTextColor={C.muted}
                    multiline
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Generuj PDF */}
        <TouchableOpacity style={styles.pdfBtn} onPress={handleExport} disabled={exporting} activeOpacity={0.85}>
          {exporting
            ? <ActivityIndicator color="#fff" />
            : <Ionicons name="document-text-outline" size={20} color="#fff" />}
          <Text style={styles.pdfBtnText}>{exporting ? 'Generowanie…' : 'Generuj raport PDF'}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
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
        autoCapitalize="sentences"
      />
    </View>
  );
}

function TextAreaField({ label, value, onChangeText, placeholder, height = 110 }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; height?: number;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.textarea, { height }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        multiline
        textAlignVertical="top"
        autoCapitalize="sentences"
      />
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: -16, marginVertical: 2 }} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 12, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1, marginTop: 4, paddingHorizontal: 4 },
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  fieldWrap: { paddingVertical: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase' },
  fieldInput: { fontSize: 15, color: C.text, paddingVertical: 2 },
  textarea: { fontSize: 15, color: C.text, lineHeight: 22 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  timeSep: { width: 1, height: 36, backgroundColor: C.border, marginHorizontal: 12 },
  sessionRemove: { paddingLeft: 12 },
  totalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border,
  },
  totalLabel: { fontSize: 12, fontWeight: '700', color: C.muted },
  totalValue: { fontSize: 16, fontWeight: '700', color: C.primary },
  addSessionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border,
  },
  addSessionText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg,
  },
  statusBtnText: { fontSize: 12, fontWeight: '600', color: C.muted },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.primary, borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  photoBtnText: { color: C.primary, fontWeight: '600', fontSize: 14 },
  photoGrid: { gap: 12, marginTop: 12 },
  photoItem: { position: 'relative' },
  photoImg: { width: '100%', height: 200, borderRadius: 10, backgroundColor: C.border },
  photoDelete: { position: 'absolute', top: 6, right: 6 },
  captionInput: {
    marginTop: 6, borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7, fontSize: 13, color: C.text,
    backgroundColor: C.bg, minHeight: 38,
  },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.primary, padding: 16, borderRadius: 14, marginTop: 4,
    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  pdfBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
