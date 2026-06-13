import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { ServiceNote } from '../types';
import { getNotes, deleteNote } from '../utils/storage';
import { STATUS_LABELS, STATUS_COLORS, STATUS_BG } from '../utils/helpers';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const makeStyles = (C: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    margin: 12, backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: C.text },
  list: { paddingHorizontal: 12, paddingBottom: 90 },
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  cardMain: { flex: 1 },
  client: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 2 },
  machine: { fontSize: 13, color: C.muted },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: C.muted },
  photoBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 10 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptyText: { fontSize: 14, color: C.muted },
  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
});

export default function HomeScreen({ navigation }: Props) {
  const { colors: C } = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const [notes, setNotes] = useState<ServiceNote[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => {
    getNotes().then(setNotes);
  }, []));

  const filtered = notes.filter(n =>
    !search ||
    n.client.toLowerCase().includes(search.toLowerCase()) ||
    n.machine.toLowerCase().includes(search.toLowerCase()) ||
    n.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    Alert.alert('Usuń notatkę', 'Czy na pewno chcesz usunąć tę notatkę?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive', onPress: async () => {
          await deleteNote(id);
          setNotes(prev => prev.filter(n => n.id !== id));
        }
      },
    ]);
  };

  const renderItem = ({ item }: { item: ServiceNote }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate('Note', { noteId: item.id })}
      onLongPress={() => handleDelete(item.id)}
      activeOpacity={0.75}
    >
      <View style={s.cardTop}>
        <View style={s.cardMain}>
          <Text style={s.client} numberOfLines={1}>{item.client || '—'}</Text>
          <Text style={s.machine} numberOfLines={1}>{item.machine || '—'}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: STATUS_BG[item.status] }]}>
          <Text style={[s.badgeText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>
      <View style={s.cardBottom}>
        <Ionicons name="calendar-outline" size={12} color={C.muted} />
        <Text style={s.dateText}>{item.date}</Text>
        {item.location ? (
          <>
            <Ionicons name="location-outline" size={12} color={C.muted} style={{ marginLeft: 10 }} />
            <Text style={s.dateText}>{item.location}</Text>
          </>
        ) : null}
        {item.photos.length > 0 ? (
          <View style={s.photoBadge}>
            <Ionicons name="image-outline" size={12} color={C.muted} />
            <Text style={s.dateText}>{item.photos.length}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={18} color={C.muted} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Szukaj klienta, maszyny…"
          placeholderTextColor={C.muted}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="document-text-outline" size={56} color={C.muted} />
            <Text style={s.emptyTitle}>Brak notatek</Text>
            <Text style={s.emptyText}>Dodaj pierwszą notatkę serwisową</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={s.fab}
        onPress={() => navigation.navigate('Note', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
