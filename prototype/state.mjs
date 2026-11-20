export const initialState = () => ({ version: 1, reading: 0, readingOffsets: {}, listening: 0, bookmarks: [], font: 21, fontFamily: 'noto', meaning: true, explanation: true, theme: 'paper', speed: 1, queue: true });

export function validateState(value) {
  if (!value || value.version !== 1 || !Number.isInteger(value.reading) || value.reading < 0 || value.reading > 2 || !Number.isFinite(value.listening) || value.listening < 0 || value.listening > 1320) {
    throw new Error('यह बैकअप इस प्रोटोटाइप के अनुकूल नहीं है।');
  }
  if (!Array.isArray(value.bookmarks) || value.bookmarks.some(id => !Number.isInteger(id) || id < 0 || id > 2)) {
    throw new Error('बुकमार्क डेटा सही नहीं है।');
  }
  const clean = initialState();
  clean.reading = value.reading;
  clean.listening = value.listening;
  clean.bookmarks = [...new Set(value.bookmarks)];
  clean.font = [19, 21, 24, 27].includes(value.font) ? value.font : 21;
  clean.fontFamily = ['noto', 'mukta', 'hind'].includes(value.fontFamily) ? value.fontFamily : 'noto';
  clean.theme = value.theme === 'night' ? 'night' : 'paper';
  clean.speed = [0.75, 1, 1.25, 1.5].includes(value.speed) ? value.speed : 1;
  for (const key of ['meaning', 'explanation', 'queue']) {
    if (typeof value[key] === 'boolean') clean[key] = value[key];
  }
  for (const [id, offset] of Object.entries(value.readingOffsets || {})) {
    if (['0', '1', '2'].includes(id) && Number.isFinite(offset) && offset >= 0) clean.readingOffsets[id] = offset;
  }
  return clean;
}

export function moveReading(state, next) {
  return { ...state, reading: Math.max(0, Math.min(2, next)) };
}

export function toggleBookmark(state, id) {
  return { ...state, bookmarks: state.bookmarks.includes(id) ? state.bookmarks.filter(item => item !== id) : [...state.bookmarks, id] };
}
