import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mdBlocks } from './markdown.js';

test('a heading directly followed by bullets splits into a heading and a list', () => {
  assert.deepEqual(mdBlocks('## Where the money went\n- one\n- two\nAfter.'), [
    { type: 'h', level: 2, text: 'Where the money went' },
    { type: 'ul', items: ['one', 'two'] },
    { type: 'p', text: 'After.' },
  ]);
});

test('numbered lists, paragraphs and rules', () => {
  assert.deepEqual(mdBlocks('# T\nIntro line\nmore\n\n1. a\n2) b\n---\nEnd'), [
    { type: 'h', level: 1, text: 'T' },
    { type: 'p', text: 'Intro line more' },
    { type: 'ol', items: ['a', 'b'] },
    { type: 'p', text: 'End' },
  ]);
});

test('a blank line between bullets keeps one list', () => {
  assert.deepEqual(mdBlocks('- a\n\n- b'), [{ type: 'ul', items: ['a', 'b'] }]);
});
