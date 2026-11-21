// District name labels drawn over the main map, placed the way Google places its own:
// biggest area first, and a label that would touch one already placed is dropped.

// Every ring ([{lat,lng}, ...]) inside any nesting of arrays.
export function ringsOf(paths, out = []) {
  if (!Array.isArray(paths) || !paths.length) return out;
  if (typeof paths[0]?.lat === 'number') out.push(paths);
  else paths.forEach((p) => ringsOf(p, out));
  return out;
}

const ringArea = (r) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j].lng + r[i].lng) * (r[j].lat - r[i].lat);
  return Math.abs(a / 2);
};

export function insideRing(p, r) {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i], b = r[j];
    if ((a.lat > p.lat) !== (b.lat > p.lat) && p.lng < ((b.lng - a.lng) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lng) inside = !inside;
  }
  return inside;
}

// Label anchor for a district: the centroid of its largest ring, or, for a curved shape whose
// centroid falls outside, the inside grid point nearest to it. Returns { at, area } or null.
export function anchorOf(paths) {
  const rings = ringsOf(paths).filter((r) => r.length >= 3);
  if (!rings.length) return null;
  const areas = rings.map(ringArea);
  const r = rings[areas.indexOf(Math.max(...areas))];
  let cx = 0, cy = 0, a2 = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j].lng * r[i].lat - r[i].lng * r[j].lat;
    a2 += f; cx += (r[j].lng + r[i].lng) * f; cy += (r[j].lat + r[i].lat) * f;
  }
  let at = a2 ? { lat: cy / (3 * a2), lng: cx / (3 * a2) } : r[0];
  if (!insideRing(at, r)) {
    const lats = r.map((p) => p.lat), lngs = r.map((p) => p.lng);
    const [s, n, w, e] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
    let best = null, bestD = Infinity;
    for (let i = 1; i < 12; i++) for (let k = 1; k < 12; k++) {
      const p = { lat: s + ((n - s) * i) / 12, lng: w + ((e - w) * k) / 12 };
      const d = (p.lat - at.lat) ** 2 + (p.lng - at.lng) ** 2;
      if (d < bestD && insideRing(p, r)) { best = p; bestD = d; }
    }
    at = best || r[0];
  }
  return { at, area: areas.reduce((x, y) => x + y, 0) };
}

// Greedy placement in screen pixels. items: [{ x, y, w, h, fit }] sorted by priority, where
// fit is the shape's own pixel width. Returns the indexes that get drawn.
export function placeLabels(items, gap = 6) {
  const boxes = [];
  const shown = [];
  items.forEach((it, i) => {
    if (it.w > it.fit * 1.15) return; // name wider than its district: wait for more zoom
    const b = { l: it.x - it.w / 2 - gap, r: it.x + it.w / 2 + gap, t: it.y - it.h / 2 - gap, btm: it.y + it.h / 2 + gap };
    if (boxes.some((o) => b.l < o.r && b.r > o.l && b.t < o.btm && b.btm > o.t)) return;
    boxes.push(b);
    shown.push(i);
  });
  return shown;
}

// "Pune District" reads as "PUNE", the way Google writes its admin-area names.
export const labelText = (s) => String(s).replace(/\s+district$/i, '').trim().toUpperCase();
const MAX_ZOOM = 8; // past this Google's own town names take over

// Google OverlayView with one absolutely placed div per district name. setMap(null) removes it,
// so it can sit in the same cleanup list as the polygons.
// stylesFor(showStateNames) returns the map styles to switch to.
export function createDistrictLabels(map, districts, isDark, stylesFor) {
  const g = window.google.maps;
  const font = '500 11px Roboto, Arial, sans-serif';
  const spacing = 0.8;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = font;
  const halo = isDark ? '#2A2A2A' : '#FFFFFF';
  const items = districts
    .map((d) => {
      const a = anchorOf(d.paths);
      if (!a || !d.name) return null;
      const rings = ringsOf(d.paths);
      const lngs = rings.flat().map((p) => p.lng);
      const text = labelText(d.name);
      return { ...a, text, w: ctx.measureText(text).width + spacing * text.length, west: Math.min(...lngs), east: Math.max(...lngs), ll: new g.LatLng(a.at.lat, a.at.lng) };
    })
    .filter(Boolean)
    .sort((x, y) => y.area - x.area);

  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none';
  const els = items.map((it) => {
    const el = document.createElement('div');
    el.textContent = it.text;
    el.style.cssText = `position:absolute;transform:translate(-50%,-50%);white-space:nowrap;font:${font};letter-spacing:${spacing}px;`
      + `color:${isDark ? '#BDBDBD' : '#5F6368'};text-shadow:${[[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1.5], [0, 1.5], [-1.5, 0], [1.5, 0]].map(([x, y]) => `${x}px ${y}px 0 ${halo}`).join(',')};`;
    root.appendChild(el);
    return el;
  });

  const overlay = new g.OverlayView();
  // Google's state names would land on top of these, so they are off while district names show.
  overlay.onAdd = () => {
    overlay.getPanes().floatPane.appendChild(root);
    map.setOptions({ styles: stylesFor(false) });
  };
  overlay.onRemove = () => {
    root.remove();
    map.setOptions({ styles: stylesFor(true) });
  };
  overlay.draw = () => {
    const proj = overlay.getProjection();
    root.style.display = (map.getZoom() ?? 0) < MAX_ZOOM ? 'block' : 'none';
    if (!proj || root.style.display === 'none') return;
    const pts = items.map((it) => proj.fromLatLngToDivPixel(it.ll));
    const shown = new Set(placeLabels(items.map((it, i) => ({
      x: pts[i].x, y: pts[i].y, w: it.w, h: 14,
      fit: Math.abs(proj.fromLatLngToDivPixel(new g.LatLng(it.at.lat, it.east)).x - proj.fromLatLngToDivPixel(new g.LatLng(it.at.lat, it.west)).x),
    }))));
    els.forEach((el, i) => {
      el.style.display = shown.has(i) ? 'block' : 'none';
      el.style.left = `${pts[i].x}px`;
      el.style.top = `${pts[i].y}px`;
    });
  };
  overlay.setMap(map);
  return overlay;
}
