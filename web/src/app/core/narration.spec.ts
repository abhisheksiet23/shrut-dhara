import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CALIBRATION_ID,
  NARRATION_ID,
  initialPersonalState,
  parseNarrationManifest,
  recordingProgress,
  resolveListeningStart,
} from './models';

const manifest = () =>
  JSON.parse(readFileSync('public/narration/shastraparijna/manifest.json', 'utf8'));

describe('narration recording', () => {
  it('accepts the shipped manifest: seven ordered sections with transcript text', () => {
    const rec = parseNarrationManifest(manifest());
    expect(rec.parts).toHaveLength(7);
    expect(rec.parts.every((part) => part.paragraphs && part.paragraphs.length > 0)).toBe(true);
    expect(rec.parts.map((part) => part.url)).toEqual(
      [1, 2, 3, 4, 5, 6, 7].map((n) => `/narration/shastraparijna/s${n}.mp3`),
    );
  });

  it('rejects a path outside the narration folder, a bad digest and a duplicate id', () => {
    const traversal = manifest();
    traversal.parts[0].url = '/narration/../secret.mp3';
    expect(() => parseNarrationManifest(traversal)).toThrow();
    const digest = manifest();
    digest.parts[1].sha256 = 'abc';
    expect(() => parseNarrationManifest(digest)).toThrow();
    const duplicate = manifest();
    duplicate.parts[1].id = duplicate.parts[0].id;
    expect(() => parseNarrationManifest(duplicate)).toThrow();
  });

  it('every part file matches its manifest bytes', () => {
    for (const part of manifest().parts) {
      expect(readFileSync('public' + part.url).byteLength).toBe(part.bytes);
    }
  });
});

describe('listening start', () => {
  const rec = parseNarrationManifest(manifest());
  it('new installs open the narration at its beginning', () => {
    expect(resolveListeningStart(initialPersonalState().listening, rec)).toEqual({
      kind: 'resume',
      part: 0,
      seconds: 0,
    });
  });
  it('never reuses a timestamp saved against another recording', () => {
    expect(
      resolveListeningStart({ recordingId: CALIBRATION_ID, part: 1, seconds: 400 }, rec),
    ).toEqual({ kind: 'start', part: 0, seconds: 0 });
  });
  it('resumes the same recording and reports a part that no longer exists', () => {
    expect(resolveListeningStart({ recordingId: NARRATION_ID, part: 3, seconds: 12 }, rec)).toEqual(
      { kind: 'resume', part: 3, seconds: 12 },
    );
    expect(resolveListeningStart({ recordingId: NARRATION_ID, part: 9, seconds: 1 }, rec)).toEqual(
      { kind: 'unavailable' },
    );
  });
  it('whole-recording progress spans sections', () => {
    expect(recordingProgress(rec, 0, 0)).toBe(0);
    const total = rec.parts.reduce((sum, part) => sum + part.duration, 0);
    expect(recordingProgress(rec, 1, 10)).toBeCloseTo((rec.parts[0].duration + 10) / total, 5);
    expect(recordingProgress(rec, 6, 1e9)).toBe(1);
  });
});
