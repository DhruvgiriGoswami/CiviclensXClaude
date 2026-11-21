// Run with `npm test`. The offline mock pages social posts the same way the backend does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageSocialPosts } from './socialPosts.js';

const list25 = Array.from({ length: 25 }, (_, i) => ({ post_id: `SOC${i}` }));

test('pageSocialPosts returns a page and the next offset', () => {
  const p = pageSocialPosts(list25, 10, 0);
  assert.equal(p.items.length, 10);
  assert.equal(p.next_offset, 10);
  assert.equal(p.total, 25);
});

test('pageSocialPosts ends with a null next offset', () => {
  const p = pageSocialPosts(list25, 10, 20);
  assert.deepEqual(p.items.map((x) => x.post_id), ['SOC20', 'SOC21', 'SOC22', 'SOC23', 'SOC24']);
  assert.equal(p.next_offset, null);
});

test('pageSocialPosts clamps limit to 1..50 and offset to >= 0', () => {
  const many = Array.from({ length: 80 }, (_, i) => ({ post_id: `P${i}` }));
  assert.equal(pageSocialPosts(many, 999, 0).items.length, 50);
  assert.equal(pageSocialPosts(many, 0, 0).items.length, 1);
  assert.equal(pageSocialPosts(many, 10, -5).items[0].post_id, 'P0');
});
