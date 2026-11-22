import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  FIRST_SUTRA_ID,
  MEANING_RECORDING_ID,
  StudyCatalog,
  parseMeaningRecording,
} from './study-catalog';
import { initialPersonalState, validatePersonalState } from './models';

const document = () =>
  JSON.parse(readFileSync('public/content/shastraparijna-v2/study.json', 'utf8'));
const manifest = () =>
  JSON.parse(readFileSync('public/narration/meaning-v1/manifest.json', 'utf8'));

describe('source-aligned study', () => {
  it('keeps all 48 source references, including pending meanings, in order across boundaries', () => {
    const catalog = StudyCatalog.parse(document());
    expect(catalog.sutras).toHaveLength(48);
    expect(catalog.sutras.filter((sutra) => sutra.meaning)).toHaveLength(7);
    expect(catalog.find(FIRST_SUTRA_ID)?.reference).toBe('1.1.1');
    expect(catalog.adjacent(FIRST_SUTRA_ID, -1)).toBeNull();
    const last = catalog.sections[0].sutras.at(-1)!;
    expect(catalog.adjacent(last.id, 1)?.reference).toBe('1.2.1');
    expect(catalog.adjacent(last.id, 1)?.meaning).toBeNull();
    expect(catalog.adjacent('unknown', 1)).toBeNull();
    expect(catalog.adjacent(catalog.sutras.at(-1)!.id, 1)).toBeNull();
  });

  it('rejects duplicated meanings and changed edition boundaries', () => {
    const duplicate = document();
    duplicate.meanings.push(duplicate.meanings[0]);
    expect(() => StudyCatalog.parse(duplicate)).toThrow();
    const invalid = document();
    invalid.sections[1].count = 7;
    expect(() => StudyCatalog.parse(invalid)).toThrow();
  });

  it('maps each audio asset to its exact source unit and rejects silent gaps', () => {
    const catalog = StudyCatalog.parse(document());
    const recording = parseMeaningRecording(manifest(), catalog);
    expect(recording.id).toBe(MEANING_RECORDING_ID);
    expect(catalog.audioIndex(recording, FIRST_SUTRA_ID)).toBe(0);
    expect(catalog.audioIndex(recording, catalog.sections[1].sutras[0].id)).toBe(-1);
    const skipped = manifest();
    skipped.parts.splice(2, 1);
    expect(() => parseMeaningRecording(skipped, catalog)).toThrow();
    for (const part of recording.parts) {
      const bytes = readFileSync('public' + part.url);
      expect(bytes.length).toBe(part.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(part.sha256);
    }
  });

  it('round-trips retained recording positions and accepts old backups without history', () => {
    const state = initialPersonalState();
    expect(validatePersonalState(state)).toEqual(state);
    state.listeningHistory = {
      'shastraparijna:hi:v1': { recordingId: 'shastraparijna:hi:v1', part: 3, seconds: 37 },
    };
    expect(validatePersonalState(state)).toEqual(state);
    state.listeningHistory['shastraparijna:hi:v1'].recordingId = MEANING_RECORDING_ID;
    expect(() => validatePersonalState(state)).toThrow();
  });
});
