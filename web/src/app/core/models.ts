export const FIXTURE_IDS = ['fixture:reflection:1', 'fixture:reflection:2', 'fixture:reflection:3'];
export const RECORDING_ID = 'fixture:calibration:v1';
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export interface ReadingPosition {
  sutraId: string;
  blockId: string;
  offset: number;
  revision: string;
}

export interface ListeningPosition {
  recordingId: string;
  part: number;
  seconds: number;
}

export interface Bookmark {
  sutraId: string;
  title: string;
  revision: string;
}

export interface Preferences {
  font: 'noto' | 'mukta' | 'hind';
  size: number;
  theme: 'paper' | 'night';
  meaning: boolean;
  explanation: boolean;
  speed: number;
}

export interface PersonalState {
  reading: ReadingPosition;
  listening: ListeningPosition;
  bookmarks: Bookmark[];
  preferences: Preferences;
}

export interface Envelope {
  id: 'personal';
  epoch: number;
  revision: number;
  data: PersonalState;
}

export interface Backup {
  format: 'shrutdhara-progress';
  version: 1;
  exportedAt: string;
  data: PersonalState;
}

export interface Passage {
  id: string;
  reference: string;
  title: string;
  meaning: string;
  paragraphs: string[];
}

export interface AudioAsset {
  id: string;
  url: string;
  bytes: number;
  sha256: string;
  duration: number;
}

export interface Chapter {
  id: string;
  revision: string;
  title: string;
  status: 'interface-fixture';
  passages: Passage[];
  audio: AudioAsset[];
}

export function initialPersonalState(): PersonalState {
  return {
    reading: { sutraId: FIXTURE_IDS[0], blockId: 'meaning', offset: 0, revision: 'fixture-v1' },
    listening: { recordingId: RECORDING_ID, part: 0, seconds: 0 },
    bookmarks: [],
    preferences: {
      font: 'noto', size: 21, theme: 'paper', meaning: true, explanation: true, speed: 1,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && /^[\p{L}\p{N}:_.-]{1,200}$/u.test(value);
}

function finitePosition(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function validatePersonalState(value: unknown): PersonalState {
  if (!isRecord(value) || !isRecord(value['reading']) || !isRecord(value['listening']) || !isRecord(value['preferences'])) {
    throw new Error('बैकअप में आवश्यक journey डेटा नहीं है।');
  }

  const reading = value['reading'];
  const listening = value['listening'];
  const preferences = value['preferences'];
  if (!isIdentifier(reading['sutraId']) || !isIdentifier(reading['blockId']) || !isIdentifier(reading['revision']) || !finitePosition(reading['offset'])) {
    throw new Error('Reading position मान्य नहीं है।');
  }
  if (!isIdentifier(listening['recordingId']) || !Number.isInteger(listening['part']) || (listening['part'] as number) < 0 || !finitePosition(listening['seconds'])) {
    throw new Error('Listening position मान्य नहीं है।');
  }

  const bookmarks = value['bookmarks'];
  if (!Array.isArray(bookmarks) || bookmarks.some(item => !isRecord(item) || !isIdentifier(item['sutraId']) || !isIdentifier(item['revision']) || typeof item['title'] !== 'string' || item['title'].length > 500)) {
    throw new Error('Bookmarks मान्य नहीं हैं।');
  }
  if (new Set(bookmarks.map(item => item.sutraId)).size !== bookmarks.length) {
    throw new Error('बैकअप में duplicate bookmarks हैं।');
  }
  if (!['noto', 'mukta', 'hind'].includes(preferences['font'] as string) || ![19, 21, 24, 27].includes(preferences['size'] as number) || !['paper', 'night'].includes(preferences['theme'] as string) || typeof preferences['meaning'] !== 'boolean' || typeof preferences['explanation'] !== 'boolean' || ![0.75, 1, 1.25, 1.5].includes(preferences['speed'] as number)) {
    throw new Error('Reading preferences मान्य नहीं हैं।');
  }

  // Rebuild the payload: never copy imported epochs, locks or unknown properties.
  return {
    reading: { sutraId: reading['sutraId'], blockId: reading['blockId'], offset: reading['offset'], revision: reading['revision'] },
    listening: { recordingId: listening['recordingId'], part: listening['part'] as number, seconds: listening['seconds'] },
    bookmarks: bookmarks.map(item => ({ sutraId: item.sutraId, title: item.title, revision: item.revision })),
    preferences: {
      font: preferences['font'] as Preferences['font'], size: preferences['size'] as number,
      theme: preferences['theme'] as Preferences['theme'], meaning: preferences['meaning'],
      explanation: preferences['explanation'], speed: preferences['speed'] as number,
    },
  };
}

export function parseBackup(text: string): Backup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error('बैकअप 5 MiB से बड़ा है।');
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('यह मान्य JSON फ़ाइल नहीं है।');
  }
  if (!isRecord(value) || value['format'] !== 'shrutdhara-progress' || value['version'] !== 1 || typeof value['exportedAt'] !== 'string' || !Number.isFinite(Date.parse(value['exportedAt']))) {
    throw new Error('यह backup version समर्थित नहीं है।');
  }
  return { format: 'shrutdhara-progress', version: 1, exportedAt: value['exportedAt'], data: validatePersonalState(value['data']) };
}

export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
