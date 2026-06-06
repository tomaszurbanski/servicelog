import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceNote } from '../types';

const NOTES_KEY = '@servicelog_notes';

const migrate = (note: any): ServiceNote => {
  if (!note.sessions) {
    note.sessions = [{ start: note.startTime ?? '', end: note.endTime ?? '' }];
  }
  if (note.kraj === undefined) note.kraj = '';
  return note as ServiceNote;
};

export const getNotes = async (): Promise<ServiceNote[]> => {
  const data = await AsyncStorage.getItem(NOTES_KEY);
  return data ? (JSON.parse(data) as any[]).map(migrate) : [];
};

export const getNote = async (id: string): Promise<ServiceNote | null> => {
  const notes = await getNotes();
  return notes.find(n => n.id === id) ?? null;
};

export const saveNote = async (note: ServiceNote): Promise<void> => {
  const notes = await getNotes();
  const idx = notes.findIndex(n => n.id === note.id);
  if (idx !== -1) {
    notes[idx] = note;
  } else {
    notes.unshift(note);
  }
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

export const deleteNote = async (id: string): Promise<void> => {
  const notes = await getNotes();
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes.filter(n => n.id !== id)));
};
