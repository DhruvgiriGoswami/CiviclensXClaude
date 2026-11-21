// Run with `npm test`. Covers the pure helpers used by the map, search and money views.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatINR, formatPct, humanizeEnum } from './format.js';
import { makeBreaks, bucketIndex, bucketColor, RAMP_LIGHT, NO_DATA_LIGHT } from './choropleth.js';
import { rankSearch } from './search.js';

test('formatINR uses lakh and crore', () => {
  assert.equal(formatINR(84000), '₹84,000');
  assert.equal(formatINR(400000), '₹4 lakh');
  assert.equal(formatINR(1260363), '₹12.6 lakh');
  assert.equal(formatINR(149100000), '₹14.91 cr');
  assert.equal(formatINR(-250000), '-₹2.5 lakh');
  assert.equal(formatINR(0), '₹0');
  assert.equal(formatINR(null), 'No data');
});

test('formatPct and humanizeEnum', () => {
  assert.equal(formatPct(0.156), '16%');
  assert.equal(formatPct(undefined), 'No data');
  assert.equal(humanizeEnum('IN_PROGRESS'), 'In progress');
  assert.equal(humanizeEnum('double_billing'), 'Double billing');
});

test('choropleth buckets cover the range and grey out missing values', () => {
  const breaks = makeBreaks([0, 10, 20, 30, 40, 50]);
  assert.equal(breaks.length, 6);
  assert.equal(bucketIndex(0, breaks), 0);
  assert.equal(bucketIndex(50, breaks), 4);
  assert.equal(bucketIndex(25, breaks), 2);
  assert.equal(bucketIndex(null, breaks), -1);
  assert.equal(bucketIndex(NaN, breaks), -1);
  assert.equal(bucketColor(50, breaks), RAMP_LIGHT[4]);
  assert.equal(bucketColor(undefined, breaks), NO_DATA_LIGHT);
  assert.deepEqual(makeBreaks([null, undefined]), []);
  assert.equal(bucketIndex(7, makeBreaks([7, 7])), 0);
});

test('rankSearch dedupes by id and ranks prefix matches first', () => {
  const items = [
    { id: 'PB', label: 'Punjab' },
    { id: 'PN', label: 'Pune' },
    { id: 'PN', label: 'Pune (duplicate)' },
    { id: 'X', label: 'Greater Pune Region' },
    { id: 'Y', label: 'Kopune' },
  ];
  const out = rankSearch(items, 'pune');
  assert.deepEqual(out.map((x) => x.label), ['Pune', 'Greater Pune Region', 'Kopune']);
  assert.deepEqual(rankSearch(items, 'pun').map((x) => x.id).slice(0, 2), ['PB', 'PN']);
  assert.deepEqual(rankSearch(items, ''), []);
});
