import { NoteStatus, WorkSession } from '../types';

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

export const formatTimeInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
};

export const clampTimeInput = (val: string): string => {
  if (!val || !val.includes(':')) return val;
  const [hStr, mStr] = val.split(':');
  const h = Math.min(Math.max(0, parseInt(hStr, 10) || 0), 23);
  const m = Math.min(Math.max(0, parseInt(mStr, 10) || 0), 59);
  return h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
};

const parseMinutes = (time: string): number => {
  const parts = time.split(':');
  if (parts.length !== 2) return -1;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return -1;
  return h * 60 + m;
};

export const calcTotalMinutes = (sessions: WorkSession[]): number => {
  return sessions.reduce((sum, s) => {
    if (!s.start || !s.end) return sum;
    const startMin = parseMinutes(s.start);
    let endMin = parseMinutes(s.end);
    if (startMin < 0 || endMin < 0) return sum;
    if (endMin < startMin) endMin += 24 * 60; // overnight
    return sum + Math.max(0, endMin - startMin);
  }, 0);
};

export const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
};
