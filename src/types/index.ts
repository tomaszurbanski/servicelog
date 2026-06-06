export type NoteStatus = 'open' | 'in_progress' | 'done' | 'waiting_parts';

export interface ServicePhoto {
  id: string;
  uri: string;
  caption: string;
}

export interface WorkSession {
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface ServiceNote {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: NoteStatus;
  client: string;
  location: string;
  kraj: string;
  machine: string;
  machineNumber: string;
  date: string;         // DD.MM.YYYY
  sessions: WorkSession[];
  problem: string;
  workDone: string;
  parts: string;
  notes: string;
  photos: ServicePhoto[];
}
