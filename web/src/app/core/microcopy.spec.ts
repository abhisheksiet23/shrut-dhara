import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Rule: the app speaks English; only content is Hindi (see docs/microcopy.md).
// Devanagari may appear only on a line that marks itself as content (lang="hi"),
// in the wordmark, or in the content-title allow-list below.
const ALLOWED = [
  /lang="hi"/,
  /<span>श्रुतधारा<small>/, // wordmark
  /title: '(प्रथम|द्वितीय) श्रुतस्कन्ध'/, // book titles (content)
  /: 'शस्त्रपरिज्ञा',/, // fallback narration title (content)
  /'आचारांग acharanga/, // search keywords (content names)
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|html)$/.test(name) && !/\.spec\.ts$/.test(name) ? [path] : [];
  });
}

describe('microcopy', () => {
  it('keeps Devanagari out of UI chrome', () => {
    const root = join(__dirname, '..');
    const offenders: string[] = [];
    for (const file of files(root)) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/[ऀ-ॿ]/.test(line) && !ALLOWED.some((rule) => rule.test(line)))
            offenders.push(`${file.replace(root, '')}:${i + 1}: ${line.trim().slice(0, 70)}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
