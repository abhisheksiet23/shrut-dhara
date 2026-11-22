import { AudioAsset, Recording } from './models';

export const MEANING_RECORDING_ID = 'shastraparijna:hindi-meaning:sample-v1';
export const FIRST_SUTRA_ID = 'acharanga:1:1:jacobi1884:1:1';

export interface Sutra {
  readonly id: string;
  readonly reference: string;
  readonly section: number;
  readonly number: number;
  readonly sectionTitle: string;
  readonly meaning: string | null;
  readonly reviewNote: string | null;
}

export interface StudySection {
  readonly number: number;
  readonly title: string;
  readonly sutras: readonly Sutra[];
}

interface StudyDocument {
  id: string;
  revision: string;
  title: string;
  source: { label: string; url: string; note: string };
  sections: Array<{ number: number; title: string; count: number }>;
  meanings: Array<{ reference: string; text: string; reviewNote?: string }>;
}

/** Source order and identity belong here, never in a page's list index or URL parser. */
export class StudyCatalog {
  readonly sections: readonly StudySection[];
  readonly sutras: readonly Sutra[];
  private readonly byId: ReadonlyMap<string, Sutra>;

  private constructor(readonly document: StudyDocument) {
    const meanings = new Map(document.meanings.map((item) => [item.reference, item]));

    this.sections = document.sections.map((section) => ({
      number: section.number,
      title: section.title,
      sutras: Array.from({ length: section.count }, (_, index) => {
        const number = index + 1;
        const reference = `1.${section.number}.${number}`;
        const meaning = meanings.get(reference);

        return {
          id: `${document.id}:${section.number}:${number}`,
          reference,
          section: section.number,
          number,
          sectionTitle: section.title,
          meaning: meaning?.text ?? null,
          reviewNote: meaning?.reviewNote ?? null,
        };
      }),
    }));

    this.sutras = this.sections.flatMap((section) => section.sutras);
    this.byId = new Map(this.sutras.map((sutra) => [sutra.id, sutra]));
  }

  static parse(value: unknown): StudyCatalog {
    const data = value as StudyDocument;
    const counts = [7, 6, 8, 7, 7, 6, 7];
    if (
      !data ||
      data.id !== 'acharanga:1:1:jacobi1884' ||
      data.revision !== 'hindi-meaning-draft-v1' ||
      typeof data.title !== 'string' ||
      typeof data.source?.label !== 'string' ||
      typeof data.source?.note !== 'string' ||
      typeof data.source?.url !== 'string' ||
      !data.source.url.startsWith('https://en.wikisource.org/') ||
      !Array.isArray(data.sections) ||
      data.sections.length !== counts.length ||
      data.sections.some(
        (section, index) =>
          section.number !== index + 1 ||
          section.count !== counts[index] ||
          typeof section.title !== 'string',
      ) ||
      !Array.isArray(data.meanings)
    ) {
      throw new Error('The study contents could not be read. Please try again.');
    }

    const references = new Set<string>();
    for (const meaning of data.meanings) {
      const match = /^1\.([1-7])\.([1-8])$/.exec(meaning.reference);
      if (
        !match ||
        Number(match[2]) > counts[Number(match[1]) - 1] ||
        references.has(meaning.reference) ||
        typeof meaning.text !== 'string' ||
        !meaning.text.trim() ||
        (meaning.reviewNote !== undefined && typeof meaning.reviewNote !== 'string')
      ) {
        throw new Error('A sutra meaning has an invalid or repeated reference.');
      }
      references.add(meaning.reference);
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
