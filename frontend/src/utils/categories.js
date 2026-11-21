import { humanizeEnum } from './format.js';

// Display labels for complaint categories. ROAD, ROADS and "Road Pavement & Potholes" all read as one label.
const RULES = [
  [/road|pothole|pavement|footpath/i, 'Roads and footpaths'],
  [/garbage|waste|trash|litter/i, 'Garbage and waste'],
  [/drain|sewage|sewer|nullah|waterlog/i, 'Drains and sewage'],
  [/street ?light|lighting/i, 'Street lights'],
  [/water supply|pipeline|water/i, 'Water supply'],
  [/traffic|parking/i, 'Traffic and parking'],
  [/encroach/i, 'Encroachment'],
  [/bribe|corrupt/i, 'Bribery'],
  [/women|safety/i, 'Public safety'],
];

export function normalizeCategory(raw) {
  const s = String(raw || '').trim();
  if (!s) return 'Other';
  const hit = RULES.find(([re]) => re.test(s));
  return hit ? hit[1] : humanizeEnum(s.replace(/&/g, 'and'));
}

// Merge [category, count] pairs that share a display label, largest first.
export function mergeCategoryCounts(entries) {
  const out = new Map();
  entries.forEach(([cat, n]) => {
    const key = normalizeCategory(cat);
    out.set(key, (out.get(key) || 0) + Number(n || 0));
  });
  return [...out.entries()].sort((a, b) => b[1] - a[1]);
}
