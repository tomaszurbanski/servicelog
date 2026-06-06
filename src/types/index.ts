export type NoteStatus = 'open' | 'in_progress' | 'done' | 'waiting_parts';

export interface ServicePhoto {
  id: string;
  uri: string;
  caption: string;
}

export interface ServiceNote {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: NoteStatus;
  client: string;
  location: string;
  machine: string;
  machineNumber: string;
  date: string;       // DD.MM.YYYY
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  problem: string;
  workDone: string;
  parts: string;
  notes: string;
  photos: ServicePhoto[];
}
