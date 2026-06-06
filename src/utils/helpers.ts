import { NoteStatus } from '../types';

export const STATUS_LABELS: Record<NoteStatus, string> = {
  open: 'Otwarte',
  in_progress: 'W trakcie',
  done: 'Zakończone',
  waiting_parts: 'Czeka na części',
};

export const STATUS_COLORS: Record<NoteStatus, string> = {
  open: '#2563EB',
  in_progress: '#D97706',
  done: '#15803D',
  waiting_parts: '#EA580C',
};

export const STATUS_BG: Record<NoteStatus, string> = {
  open: '#EFF6FF',
  in_progress: '#FEF3C7',
  done: '#F0FDF4',
  waiting_parts: '#FFF7ED',
};

export const formatDate = (date: Date): string => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
};

export const formatTime = (date: Date): string => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
