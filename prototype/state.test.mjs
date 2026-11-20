import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, validateState, moveReading, toggleBookmark } from './state.mjs';

test('journeys stay independent and navigation cannot skip the content boundary', () => {
  const state = { ...initialState(), listening: 491 };
  assert.equal(moveReading(state, 2).listening, 491);
  assert.equal(moveReading(state, 9).reading, 2);
  assert.equal(moveReading(state, -1).reading, 0);
});

test('backup round trip preserves both positions, reading offset and bookmarks', () => {
  const state = { ...initialState(), reading: 2, readingOffsets: { 2: 340 }, listening: 213, bookmarks: [0, 2] };
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
});

test('restore rejects malformed state rather than applying partial data', () => {
  for (const patch of [{ version: 2 }, { listening: -1 }, { bookmarks: [9] }, { reading: 0.5 }]) {
    assert.throws(() => validateState({ ...initialState(), ...patch }));
  }
  const state = initialState();
  assert.throws(() => validateState(null));
  assert.deepEqual(state, initialState());
});

test('bookmark toggling is reversible', () => {
  assert.deepEqual(toggleBookmark(toggleBookmark(initialState(), 1), 1).bookmarks, []);
});

test('old backups receive a reading-font default and chosen fonts survive restore', () => {
  const old = initialState();
  delete old.fontFamily;
  assert.equal(validateState(old).fontFamily, 'noto');
  assert.equal(validateState({ ...old, fontFamily: 'hind' }).fontFamily, 'hind');
  assert.equal(validateState({ ...old, fontFamily: '<invalid>' }).fontFamily, 'noto');
});
