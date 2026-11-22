import { AudioAsset, Recording } from './models';

export const MEANING_RECORDING_ID = 'shastraparijna:hindi-meaning:sample-v1';
export const BOOK_ID = 'acharanga:1:jacobi1884';
export const FIRST_SUTRA_ID = 'acharanga:1:1:jacobi1884:1:1';

export interface Sutra {
  readonly id: string;
  readonly reference: string;
  readonly chapter: number;
  readonly chapterTitle: string;
  readonly section: number;
  readonly number: number;
  readonly sectionTitle: string;
  readonly meaning: string | null;
  /** Original Prakrit in Devanagari, when it has been matched to this unit. */
  readonly prakrit: string | null;
}

export interface StudySection {
  readonly chapter: number;
  readonly number: number;
  readonly title: string;
  readonly sutras: readonly Sutra[];
}

export interface StudyChapter {
  readonly number: number;
  readonly title: string;
  /** A chapter that has not survived has no units. */
  readonly note: string | null;
  readonly sections: readonly StudySection[];
}

interface UnitRecord {
  n: number;
  meaning: string;
  prakrit?: string;
  /** Internal editorial state. Never shown to readers. */
  status?: string;
}

interface StudyDocument {
  id: string;
  revision: string;
  title: string;
  source: { label: string; url: string; note: string };
  chapters: Array<{
    number: number;
    title: string;
    note?: string;
    sections: Array<{ number: number; title: string; units: UnitRecord[] }>;
  }>;
}

const SOURCE_PREFIX = 'https://en.wikisource.org/';

/** Source order and identity belong here, never in a page's list index or URL parser. */
export class StudyCatalog {
  readonly chapters: readonly StudyChapter[];
  readonly sections: readonly StudySection[];
  readonly sutras: readonly Sutra[];
  private readonly byId: ReadonlyMap<string, Sutra>;

  private constructor(readonly document: StudyDocument) {
    this.chapters = document.chapters.map((chapter) => ({
      number: chapter.number,
      title: chapter.title,
      note: chapter.note ?? null,
      sections: chapter.sections.map((section) => ({
        chapter: chapter.number,
        number: section.number,
        title: section.title,
        sutras: section.units.map((unit) => ({
          id: `acharanga:1:${chapter.number}:jacobi1884:${section.number}:${unit.n}`,
          reference: `${chapter.number}.${section.number}.${unit.n}`,
          chapter: chapter.number,
          chapterTitle: chapter.title,
          section: section.number,
          number: unit.n,
          sectionTitle: section.title,
          meaning: unit.meaning,
          prakrit: unit.prakrit ?? null,
        })),
      })),
    }));
    this.sections = this.chapters.flatMap((chapter) => chapter.sections);
    this.sutras = this.sections.flatMap((section) => section.sutras);
    this.byId = new Map(this.sutras.map((sutra) => [sutra.id, sutra]));
  }

  static parse(value: unknown): StudyCatalog {
    const data = value as StudyDocument;
    const fail = (): never => {
      throw new Error('The study contents could not be read. Please try again.');
    };
    if (
      !data ||
      data.id !== BOOK_ID ||
      typeof data.revision !== 'string' ||
      !data.revision ||
      typeof data.title !== 'string' ||
      typeof data.source?.label !== 'string' ||
      typeof data.source?.note !== 'string' ||
      typeof data.source?.url !== 'string' ||
      !data.source.url.startsWith(SOURCE_PREFIX) ||
      !Array.isArray(data.chapters) ||
      !data.chapters.length
    )
      return fail();

    let previousChapter = 0;
    for (const chapter of data.chapters) {
      if (
        !Number.isInteger(chapter.number) ||
        chapter.number <= previousChapter ||
        typeof chapter.title !== 'string' ||
        !chapter.title ||
        !Array.isArray(chapter.sections) ||
        (chapter.note !== undefined && typeof chapter.note !== 'string')
      )
        return fail();
      previousChapter = chapter.number;
      chapter.sections.forEach((section, sectionIndex) => {
        if (
          section.number !== sectionIndex + 1 ||
          typeof section.title !== 'string' ||
          !Array.isArray(section.units) ||
          !section.units.length
        )
          fail();
        section.units.forEach((unit, unitIndex) => {
          if (
            unit.n !== unitIndex + 1 ||
            typeof unit.meaning !== 'string' ||
            !unit.meaning.trim() ||
            (unit.prakrit !== undefined && (typeof unit.prakrit !== 'string' || !unit.prakrit.trim()))
          )
            throw new Error('A sutra meaning has an invalid or repeated reference.');
        });
      });
    }

    return new StudyCatalog(data);
  }

  find(id: string): Sutra | null {
    return this.byId.get(id) ?? null;
  }

  adjacent(id: string, direction: -1 | 1): Sutra | null {
    const index = this.sutras.findIndex((sutra) => sutra.id === id);
    return index < 0 ? null : (this.sutras[index + direction] ?? null);
  }

  /** A recording maps by stable identity; a missing unit is never replaced by a nearby one. */
  audioIndex(recording: Recording | null, sutraId: string): number {
    return recording?.parts.findIndex((part) => part.id === sutraId) ?? -1;
  }
}

/** Only a consecutive source prefix can auto-play. Gaps stop the sequence. */
export function parseMeaningRecording(value: unknown, catalog: StudyCatalog): Recording {
  const data = value as { recordingId: string; sourceRevision: string; parts: AudioAsset[] };
  if (
    !data ||
    data.recordingId !== MEANING_RECORDING_ID ||
    data.sourceRevision !== catalog.document.revision ||
    !Array.isArray(data.parts) ||
    !data.parts.length ||
    data.parts.length > catalog.sutras.length
  ) {
    throw new Error('The sutra audio list could not be read.');
  }

  const parts = data.parts.map((asset, index) => {
    const sutra = catalog.sutras[index];
    if (
      !asset ||
      asset.id !== sutra.id ||
      !sutra.meaning ||
      asset.url !== `/narration/meaning-v1/u${sutra.section}-s${sutra.number}.mp3` ||
      !Number.isSafeInteger(asset.bytes) ||
      asset.bytes <= 0 ||
      !/^[a-f0-9]{64}$/.test(asset.sha256) ||
      !Number.isFinite(asset.duration) ||
      asset.duration <= 0
    ) {
      throw new Error('Sutra audio does not match its source reference.');
    }

    return {
      ...asset,
      title: `Sutra ${sutra.reference}`,
      reference: sutra.reference,
      paragraphs: [sutra.meaning],
    };
  });

  return {
    id: MEANING_RECORDING_ID,
    kind: 'meaning',
    title: catalog.document.title,
    label: 'Hindi meaning · AI voice · draft for review',
    parts,
  };
}
