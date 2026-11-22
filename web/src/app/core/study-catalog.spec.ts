import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FIRST_SUTRA_ID, MEANING_RECORDING_ID, StudyCatalog } from './study-catalog';
import { initialPersonalState, validatePersonalState } from './models';

const document = () =>
  JSON.parse(readFileSync('public/content/acharanga-book1/book.json', 'utf8'));

describe('source-aligned study', () => {
  it('keeps every unit in source order across uddeshaka and chapter boundaries', () => {
    const catalog = StudyCatalog.parse(document());
    expect(catalog.find(FIRST_SUTRA_ID)?.reference).toBe('1.1.1');
    expect(catalog.adjacent(FIRST_SUTRA_ID, -1)).toBeNull();
    const last = catalog.sections[0].sutras.at(-1)!;
    expect(last.reference).toBe('1.1.7');
    expect(catalog.adjacent(last.id, 1)?.reference).toBe('1.2.1');
    expect(catalog.adjacent('unknown', 1)).toBeNull();
    expect(catalog.adjacent(catalog.sutras.at(-1)!.id, 1)).toBeNull();
    const ids = new Set(catalog.sutras.map((sutra) => sutra.id));
    expect(ids.size).toBe(catalog.sutras.length);
    expect(catalog.sutras.every((sutra) => sutra.meaning)).toBe(true);
  });

  it('carries chapter 1 with its seven uddeshakas of 7, 6, 8, 7, 7, 6 and 7 units', () => {
    const chapter = StudyCatalog.parse(document()).chapters[0];
    expect(chapter.number).toBe(1);
    expect(chapter.sections.map((section) => section.sutras.length)).toEqual([7, 6, 8, 7, 7, 6, 7]);
  });

  it('never shows editorial status and reads Prakrit only where it was matched', () => {
    const catalog = StudyCatalog.parse(document());
    expect(JSON.stringify(catalog.sutras)).not.toMatch(/draft|status/i);
    expect(catalog.find(FIRST_SUTRA_ID)?.prakrit).toContain('सुयं मे आउसं');
  });

  it('rejects broken numbering, empty meanings and foreign documents', () => {
    const gap = document();
    gap.chapters[0].sections[0].units[2].n = 9;
    expect(() => StudyCatalog.parse(gap)).toThrow();
    const empty = document();
    empty.chapters[0].sections[0].units[0].meaning = ' ';
    expect(() => StudyCatalog.parse(empty)).toThrow();
    const foreign = document();
    foreign.id = 'other';
    expect(() => StudyCatalog.parse(foreign)).toThrow();
    const unordered = document();
    if (unordered.chapters.length > 1) unordered.chapters[1].number = 1;
    else unordered.chapters.push({ number: 1, title: 'x', sections: [] });
    expect(() => StudyCatalog.parse(unordered)).toThrow();
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
