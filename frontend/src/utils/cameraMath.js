// Pure Web Mercator camera math for the main map's smooth flights (no DOM, no Google).
const TILE = 256;
const wx = (lng) => (lng + 180) / 360;
const wy = (lat) => {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};
const lngOf = (x) => x * 360 - 180;
const latOf = (y) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;

// Camera that fits `bounds` inside the map div minus `pad`, centred in the padded area.
export function fitCamera(bounds, size, pad = {}, { minZoom = 3, maxZoom = 16 } = {}) {
  const { top = 0, right = 0, bottom = 0, left = 0 } = pad;
  const x0 = wx(bounds.west), x1 = wx(bounds.east);
  const y0 = wy(bounds.north), y1 = wy(bounds.south);
  const w = Math.max(1, size.width - left - right);
  const h = Math.max(1, size.height - top - bottom);
  const fit = Math.log2(Math.min(w / (TILE * Math.max(x1 - x0, 1e-9)), h / (TILE * Math.max(y1 - y0, 1e-9))));
  const zoom = Math.max(minZoom, Math.min(maxZoom, fit));
  const scale = TILE * 2 ** zoom;
  // Uneven padding moves the visible middle, so shift the centre the other way.
  const cx = (x0 + x1) / 2 + (right - left) / 2 / scale;
  const cy = (y0 + y1) / 2 + (bottom - top) / 2 / scale;
  return { center: { lat: latOf(cy), lng: lngOf(cx) }, zoom };
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Camera at progress t (0..1). The centre moves in step with the scale, which reads as
// zooming into the target instead of sliding past it.
export function cameraAt(from, to, t) {
  const e = ease(Math.max(0, Math.min(1, t)));
  const zoom = from.zoom + (to.zoom - from.zoom) * e;
  const dz = to.zoom - from.zoom;
  const u = Math.abs(dz) < 1e-6 ? e : (1 - 2 ** (from.zoom - zoom)) / (1 - 2 ** -dz);
  const x = wx(from.center.lng) + (wx(to.center.lng) - wx(from.center.lng)) * u;
  const y = wy(from.center.lat) + (wy(to.center.lat) - wy(from.center.lat)) * u;
  return { center: { lat: latOf(y), lng: lngOf(x) }, zoom };
}

// Bounds of any nesting of {lat, lng} arrays, or null when there are no points.
export function boundsOf(paths) {
  const b = { north: -90, south: 90, east: -180, west: 180 };
  const add = (p) => {
    if (Array.isArray(p)) return p.forEach(add);
    if (typeof p?.lat !== 'number') return;
    b.north = Math.max(b.north, p.lat); b.south = Math.min(b.south, p.lat);
    b.east = Math.max(b.east, p.lng); b.west = Math.min(b.west, p.lng);
  };
  add(paths);
  return b.north >= b.south ? b : null;
}

export const flightMs = (from, to) => Math.min(1200, 500 + 140 * Math.abs(to.zoom - from.zoom));
