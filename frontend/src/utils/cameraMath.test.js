import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitCamera, cameraAt } from './cameraMath.js';

const MH = { north: 22.03, south: 15.6, west: 72.6, east: 80.9 };
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test('fitCamera centres the bounds with even padding and fits them', () => {
  const { center, zoom } = fitCamera(MH, { width: 1000, height: 800 }, { top: 48, right: 48, bottom: 48, left: 48 });
  near(center.lng, (MH.west + MH.east) / 2);
  assert.ok(center.lat > MH.south && center.lat < MH.north);
  // One side fills its padded length exactly and the other fits inside.
  const s = 256 * 2 ** zoom;
  const wpx = ((MH.east - MH.west) / 360) * s;
  const y = (lat) => 0.5 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / (2 * Math.PI);
  const hpx = (y(MH.south) - y(MH.north)) * s;
  assert.ok(wpx <= 904 + 1e-6 && hpx <= 704 + 1e-6);
  assert.ok(Math.abs(wpx - 904) < 1e-3 || Math.abs(hpx - 704) < 1e-3);
});

test('fitCamera clamps zoom and shifts the centre for uneven padding', () => {
  assert.equal(fitCamera({ north: 19.01, south: 19, west: 72.8, east: 72.81 }, { width: 800, height: 600 }).zoom, 16);
  const even = fitCamera(MH, { width: 1000, height: 800 });
  const right = fitCamera(MH, { width: 1000, height: 800 }, { right: 200 });
  assert.ok(right.center.lng > even.center.lng);
});

test('cameraAt hits both ends exactly', () => {
  const a = { center: { lat: 22.5, lng: 79 }, zoom: 4.6 };
  const b = { center: { lat: 19, lng: 76.8 }, zoom: 6.4 };
  const s = cameraAt(a, b, 0), e = cameraAt(a, b, 1);
  near(s.zoom, a.zoom); near(s.center.lat, a.center.lat); near(s.center.lng, a.center.lng);
  near(e.zoom, b.zoom); near(e.center.lat, b.center.lat); near(e.center.lng, b.center.lng);
  const mid = cameraAt(a, b, 0.5);
  assert.ok(mid.zoom > a.zoom && mid.zoom < b.zoom);
});
