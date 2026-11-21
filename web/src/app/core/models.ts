export const FIXTURE_IDS = ['fixture:reflection:1', 'fixture:reflection:2', 'fixture:reflection:3'];
export const CALIBRATION_ID = 'fixture:calibration:v1';
export const NARRATION_ID = 'shastraparijna:hi:v1';
export const RECORDING_ID = NARRATION_ID;
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

export interface NarrationPart extends AudioAsset {
  title: string;
  reference: string;
  paragraphs: string[];
}

export type RecordingKind = 'narration' | 'calibration';

/** One ordered, prepared sequence of audio parts that the shared player can run. */
export interface Recording {
  id: string;
  kind: RecordingKind;
  title: string;
  /** Plain statement of what the listener is hearing, shown with the player. */
  label: string;
  parts: Array<AudioAsset & Partial<NarrationPart>>;
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
    listening: { recordingId: NARRATION_ID, part: 0, seconds: 0 },
    bookmarks: [],
    preferences: {
      font: 'noto',
      size: 21,
      theme: 'paper',
      meaning: true,
      explanation: true,
      speed: 1,
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
  if (
    !isRecord(value) ||
    !isRecord(value['reading']) ||
    !isRecord(value['listening']) ||
    !isRecord(value['preferences'])
  ) {
    throw new Error('This backup is missing your reading and listening progress.');
  }

  const reading = value['reading'];
  const listening = value['listening'];
  const preferences = value['preferences'];
  if (
    !isIdentifier(reading['sutraId']) ||
    !isIdentifier(reading['blockId']) ||
    !isIdentifier(reading['revision']) ||
    !finitePosition(reading['offset'])
  ) {
    throw new Error('The reading place in this backup couldn’t be understood.');
  }
  if (
    !isIdentifier(listening['recordingId']) ||
    !Number.isInteger(listening['part']) ||
    (listening['part'] as number) < 0 ||
    !finitePosition(listening['seconds'])
  ) {
    throw new Error('The listening place in this backup couldn’t be understood.');
  }

  const bookmarks = value['bookmarks'];
  if (
    !Array.isArray(bookmarks) ||
    bookmarks.some(
      (item) =>
        !isRecord(item) ||
        !isIdentifier(item['sutraId']) ||
        !isIdentifier(item['revision']) ||
        typeof item['title'] !== 'string' ||
        item['title'].length > 500,
    )
  ) {
    throw new Error('The bookmarks in this backup couldn’t be understood.');
  }
  if (new Set(bookmarks.map((item) => item.sutraId)).size !== bookmarks.length) {
    throw new Error('This backup lists the same bookmark twice.');
  }
  if (
    !['noto', 'mukta', 'hind'].includes(preferences['font'] as string) ||
    ![19, 21, 24, 27].includes(preferences['size'] as number) ||
    !['paper', 'night'].includes(preferences['theme'] as string) ||
    typeof preferences['meaning'] !== 'boolean' ||
    typeof preferences['explanation'] !== 'boolean' ||
    ![0.75, 1, 1.25, 1.5].includes(preferences['speed'] as number)
  ) {
    throw new Error('The reading settings in this backup couldn’t be understood.');
  }

  // Rebuild the payload: never copy imported epochs, locks or unknown properties.
  return {
    reading: {
      sutraId: reading['sutraId'],
      blockId: reading['blockId'],
      offset: reading['offset'],
      revision: reading['revision'],
    },
    listening: {
      recordingId: listening['recordingId'],
      part: listening['part'] as number,
      seconds: listening['seconds'],
    },
    bookmarks: bookmarks.map((item) => ({
      sutraId: item.sutraId,
      title: item.title,
      revision: item.revision,
    })),
    preferences: {
      font: preferences['font'] as Preferences['font'],
      size: preferences['size'] as number,
      theme: preferences['theme'] as Preferences['theme'],
      meaning: preferences['meaning'],
      explanation: preferences['explanation'],
      speed: preferences['speed'] as number,
    },
  };
}

export function parseBackup(text: string): Backup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error('This file is larger than 5 MB, so it can’t be a ShrutDhara backup.');
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('This doesn’t look like a ShrutDhara backup file.');
  }
  if (
    !isRecord(value) ||
    value['format'] !== 'shrutdhara-progress' ||
    value['version'] !== 1 ||
    typeof value['exportedAt'] !== 'string' ||
    !Number.isFinite(Date.parse(value['exportedAt']))
  ) {
    throw new Error('This backup comes from a different version of ShrutDhara and can’t be restored here.');
  }
  return {
    format: 'shrutdhara-progress',
    version: 1,
    exportedAt: value['exportedAt'],
    data: validatePersonalState(value['data']),
  };
}

export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

/** Validate the narration manifest at the trust boundary; throws a Hindi message on any defect. */
export function parseNarrationManifest(value: unknown): Recording {
  const bad = () => new Error('The listening list couldn’t be read. Connect to the internet and try again.');
  if (!isRecord(value) || value['recordingId'] !== NARRATION_ID || !Array.isArray(value['parts']))
    throw bad();
  const parts = value['parts'];
  if (parts.length < 1 || parts.length > 20) throw bad();
  const seen = new Set<string>();
  const result: NarrationPart[] = parts.map((item) => {
    if (
      !isRecord(item) ||
      !isIdentifier(item['id']) ||
      seen.has(item['id'] as string) ||
      typeof item['url'] !== 'string' ||
      !/^\/narration\/shastraparijna\/s[0-9]{1,2}\.mp3$/.test(item['url']) ||
      typeof item['sha256'] !== 'string' ||
      !/^[a-f0-9]{64}$/.test(item['sha256']) ||
      !Number.isSafeInteger(item['bytes']) ||
      (item['bytes'] as number) <= 0 ||
      typeof item['duration'] !== 'number' ||
      !(item['duration'] > 0) ||
      typeof item['title'] !== 'string' ||
      typeof item['reference'] !== 'string' ||
      !Array.isArray(item['paragraphs']) ||
      item['paragraphs'].some((paragraph) => typeof paragraph !== 'string')
    )
      throw bad();
    seen.add(item['id'] as string);
    return {
      id: item['id'] as string,
      url: item['url'],
      sha256: item['sha256'],
      bytes: item['bytes'] as number,
      duration: item['duration'],
      title: item['title'],
      reference: item['reference'],
      paragraphs: item['paragraphs'] as string[],
    };
  });
  return {
    id: NARRATION_ID,
    kind: 'narration',
    title: typeof value['title'] === 'string' ? value['title'] : 'शस्त्रपरिज्ञा',
    label: 'AI voice · unreviewed draft',
    parts: result,
  };
}

export type ListeningStart =
  | { kind: 'start'; part: number; seconds: number }
  | { kind: 'resume'; part: number; seconds: number }
  | { kind: 'unavailable' };

/**
 * Decide where a recording opens. A position saved against another recording is never
 * reused (no timestamp inheritance); the recording simply starts at its beginning.
 * Same recording with a part that no longer exists is reported, never silently reset.
 */
export function resolveListeningStart(saved: ListeningPosition, recording: Recording): ListeningStart {
  if (saved.recordingId !== recording.id) return { kind: 'start', part: 0, seconds: 0 };
  if (saved.part >= recording.parts.length) return { kind: 'unavailable' };
  return { kind: 'resume', part: saved.part, seconds: saved.seconds };
}

/** Whole-recording progress 0..1 from a part index and position. */
export function recordingProgress(recording: Recording, part: number, seconds: number): number {
  const total = recording.parts.reduce((sum, item) => sum + item.duration, 0);
  if (!total) return 0;
  const before = recording.parts.slice(0, part).reduce((sum, item) => sum + item.duration, 0);
  return Math.min(1, (before + Math.min(seconds, recording.parts[part]?.duration ?? 0)) / total);
}
