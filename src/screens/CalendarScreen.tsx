import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getNotes, getCalendarEntries, saveCalendarEntry, deleteCalendarEntry } from '../utils/storage';
import { ServiceNote, CalendarEntry } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

const DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
const MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

function pad(n: number) { return n.toString().padStart(2, '0'); }
function toDMY(year: number, month: number, day: number) {
  return `${pad(day)}.${pad(month + 1)}.${year}`;
}

const makeStyles = (C: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  navBtn: { padding: 6 },
  monthTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  dayRow: {
    flexDirection: 'row', backgroundColor: C.card,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: C.muted },
  gridWrap: { paddingVertical: 8, paddingHorizontal: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  todayCell: { backgroundColor: C.primaryBg, borderRadius: 8 },
  dayNum: { fontSize: 15, color: C.text },
  todayNum: { fontWeight: '700', color: C.primary },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2, height: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: 20,
    padding: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 12, color: C.muted },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%', padding: 16, paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: C.muted, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 8, marginTop: 4,
  },
  reportRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: C.bg, borderRadius: 8, marginBottom: 6,
  },
  reportClient: { fontSize: 14, fontWeight: '600', color: C.text },
  reportDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  emptyText: { fontSize: 13, color: C.muted, marginBottom: 10 },
  entryRow: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    backgroundColor: C.primaryBg, borderRadius: 8, marginBottom: 6,
  },
  entryText: { flex: 1, fontSize: 14, color: C.text },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  input: {
    flex: 1, height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 8,
    paddingHorizontal: 12, fontSize: 14, color: C.text, backgroundColor: C.inputBg,
  },
  addBtn: {
    width: 44, height: 44, backgroundColor: C.primary,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
});

export default function CalendarScreen({ navigation }: any) {
  const { colors: C } = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [serviceNotes, setServiceNotes] = useState<ServiceNote[]>([]);
  const [entries, setEntries] = useState<Record<string, CalendarEntry[]>>({});
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');

  const load = useCallback(async () => {
    const [n, e] = await Promise.all([getNotes(), getCalendarEntries()]);
    setServiceNotes(n);
    setEntries(e);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const noteDates = new Set(serviceNotes.map(n => n.date));
  const todayStr = toDMY(now.getFullYear(), now.getMonth(), now.getDate());

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  };

  const openDay = (day: number) => {
    setSelectedDate(toDMY(year, month, day));
    setInputText('');
    setModalVisible(true);
  };

  const addEntry = async () => {
    if (!inputText.trim()) return;
    await saveCalendarEntry({ id: Date.now().toString(), date: selectedDate, text: inputText.trim() });
    setInputText('');
    load();
  };

  const removeEntry = async (id: string) => { await deleteCalendarEntry(id); load(); };

  const openNote = (noteId: string) => {
    setModalVisible(false);
    navigation.navigate('Notes', { screen: 'Note', params: { noteId } });
  };

  const selectedServiceNotes = serviceNotes.filter(n => n.date === selectedDate);
  const selectedEntries = entries[selectedDate] ?? [];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
          <Ionicons name="chevron-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      <View style={s.dayRow}>
        {DAYS.map(d => <Text key={d} style={s.dayLabel}>{d}</Text>)}
      </View>

      <ScrollView contentContainerStyle={s.gridWrap}>
        <View style={s.grid}>
          {cells.map((day, idx) => {
            if (!day) return <View key={`_${idx}`} style={s.cell} />;
            const dateStr = toDMY(year, month, day);
            const isToday = dateStr === todayStr;
            return (
              <TouchableOpacity key={idx} style={[s.cell, isToday && s.todayCell]} onPress={() => openDay(day)}>
                <Text style={[s.dayNum, isToday && s.todayNum]}>{day}</Text>
                <View style={s.dotRow}>
                  {noteDates.has(dateStr) && <View style={[s.dot, { backgroundColor: C.primary }]} />}
                  {(entries[dateStr]?.length ?? 0) > 0 && <View style={[s.dot, { backgroundColor: '#F59E0B' }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.dot, { backgroundColor: C.primary }]} />
          <Text style={s.legendText}>Raport serwisowy</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.dot, { backgroundColor: '#F59E0B' }]} />
          <Text style={s.legendText}>Notatka planera</Text>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{selectedDate}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={C.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {selectedServiceNotes.length > 0 && (
                <>
                  <Text style={s.sectionLabel}>Raporty serwisowe</Text>
                  {selectedServiceNotes.map(n => (
                    <TouchableOpacity key={n.id} style={s.reportRow} onPress={() => openNote(n.id)}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.reportClient}>{n.client || '—'}</Text>
                        <Text style={s.reportDesc} numberOfLines={1}>{n.problem || n.machine || '—'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={C.muted} />
                    </TouchableOpacity>
                  ))}
                </>
              )}
              <Text style={s.sectionLabel}>Notatki planera</Text>
              {selectedEntries.length === 0 && <Text style={s.emptyText}>Brak notatek na ten dzień</Text>}
              {selectedEntries.map(e => (
                <View key={e.id} style={s.entryRow}>
                  <Text style={s.entryText}>{e.text}</Text>
                  <TouchableOpacity onPress={() => removeEntry(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={18} color={C.danger} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={s.inputRow}>
                <TextInput
                  style={s.input}
                  placeholder="Dodaj notatkę (delegacja, urlop...)"
                  placeholderTextColor={C.muted}
                  value={inputText}
                  onChangeText={setInputText}
                  returnKeyType="done"
                  onSubmitEditing={addEntry}
                />
                <TouchableOpacity style={s.addBtn} onPress={addEntry}>
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
