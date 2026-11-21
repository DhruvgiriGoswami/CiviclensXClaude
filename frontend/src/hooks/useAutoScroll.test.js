// Run with `npm test`. The near-end check decides when the feed fetches its next page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNearEnd } from './useAutoScroll.js';

test('isNearEnd is true when little scroll room is left', () => {
  assert.equal(isNearEnd({ scrollHeight: 2000, clientHeight: 600, scrollTop: 1100 }, 400), true);
  assert.equal(isNearEnd({ scrollHeight: 2000, clientHeight: 600, scrollTop: 200 }, 400), false);
});

test('isNearEnd is true when the content does not fill a visible container yet', () => {
  assert.equal(isNearEnd({ scrollHeight: 300, clientHeight: 600, scrollTop: 0 }, 400), true);
});

test('isNearEnd is false for a hidden container, so a display:none copy never fetches', () => {
  assert.equal(isNearEnd({ scrollHeight: 0, clientHeight: 0, scrollTop: 0 }, 400), false);
});
