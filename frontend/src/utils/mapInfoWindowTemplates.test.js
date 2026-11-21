// Run with `npm test` (Node's built-in test runner, no extra dependency).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTicketInfoWindowContent,
  getWardInfoWindowContent,
  getStateInfoWindowContent,
  getOutsideBoundaryWarningContent,
} from './mapInfoWindowTemplates.js';

const evil = '<img src=x onerror=alert(1)>';

test('ticket pop-up escapes user-submitted text', () => {
  const html = getTicketInfoWindowContent({ category: evil, description: evil, status: evil, upvotes: '1"><script>' });
  assert.ok(!html.includes('<img'), 'raw <img> leaked');
  assert.ok(!html.includes('<script'), 'raw <script> leaked');
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('ward, state and boundary pop-ups escape names', () => {
  const unit = { unitName: evil, parentCityDistrict: evil, politicalVoice: { name: evil, party: evil }, administrativeSpender: { name: evil } };
  for (const html of [
    getWardInfoWindowContent(unit),
    getStateInfoWindowContent({ stateName: evil, cmName: evil, party: evil }),
    getOutsideBoundaryWarningContent(evil),
  ]) {
    assert.ok(!html.includes('<img'));
  }
});

test('missing ward data shows placeholders, not invented names', () => {
  const html = getWardInfoWindowContent(null, null);
  assert.ok(html.includes('Ward not identified'));
  assert.ok(!html.includes('Central Ward 01'));
});
