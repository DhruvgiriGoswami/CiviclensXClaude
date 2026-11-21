import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anchorOf, placeLabels, labelText, insideRing } from './mapLabels.js';

const sq = (x, y, s) => [{ lat: y, lng: x }, { lat: y, lng: x + s }, { lat: y + s, lng: x + s }, { lat: y + s, lng: x }];

test('anchor sits inside the largest ring, even for a U shape', () => {
  const a = anchorOf([[sq(0, 0, 1)], [sq(10, 10, 4)]]);
  assert.ok(Math.abs(a.at.lat - 12) < 1e-9 && Math.abs(a.at.lng - 12) < 1e-9);
  const u = [{ lat: 0, lng: 0 }, { lat: 0, lng: 3 }, { lat: 3, lng: 3 }, { lat: 3, lng: 2 }, { lat: 1, lng: 2 }, { lat: 1, lng: 1 }, { lat: 3, lng: 1 }, { lat: 3, lng: 0 }];
  assert.ok(insideRing(anchorOf([u]).at, u));
});

test('placement drops overlapping and too-wide labels, keeps order', () => {
  const shown = placeLabels([
    { x: 100, y: 100, w: 60, h: 14, fit: 200 },
    { x: 120, y: 104, w: 60, h: 14, fit: 200 }, // overlaps the first
    { x: 300, y: 100, w: 80, h: 14, fit: 40 }, // wider than its district
    { x: 100, y: 200, w: 60, h: 14, fit: 200 },
  ]);
  assert.deepEqual(shown, [0, 3]);
});

test('label text drops the District suffix', () => {
  assert.equal(labelText('Pune District'), 'PUNE');
  assert.equal(labelText('Mumbai Suburban'), 'MUMBAI SUBURBAN');
});
