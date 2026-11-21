// Indian money format: crore above 1 crore, lakh above 1 lakh, else grouped rupees.
export function formatINR(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'No data';
  const n = Number(value);
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  const trim = (x) => x.toFixed(2).replace(/\.?0+$/, '');
  if (a >= 1e7) return `${sign}₹${trim(a / 1e7)} cr`;
  if (a >= 1e5) return `${sign}₹${trim(a / 1e5)} lakh`;
  return `${sign}₹${Math.round(a).toLocaleString('en-IN')}`;
}

export function formatPct(share, digits = 0) {
  if (share === null || share === undefined || Number.isNaN(Number(share))) return 'No data';
  return `${(Number(share) * 100).toFixed(digits)}%`;
}

// Turns API enums like IN_PROGRESS or sla_misreported into "In progress" / "Sla misreported".
export function humanizeEnum(value) {
  if (!value) return '';
  const s = String(value).replace(/[_-]+/g, ' ').trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// One short label for a geographic unit, whichever path (map click or search) produced it.
// "PMC Corporation Region" gives "PMC", "Pune District" gives "Pune", "Urban Municipal Ward 28" gives "Ward 28".
export function shortUnitLabel(name) {
  return String(name || '')
    .replace(/\s*\((?:Level \d[^)]*|[A-Z]{2})\)\s*/g, ' ')
    .replace(/\b(?:Urban Municipal|Municipal|Urban)\s+(?=Ward\b)/i, '')
    .replace(/\s+(?:Corporation Region|Region|District|Municipal Corporation)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2025-06-12T14:01" gives "12 Jun 2025". Read from the string so the viewer's timezone can't move the day.
export function formatPostDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  const month = m && MONTHS[Number(m[2]) - 1];
  return month ? `${Number(m[3])} ${month} ${m[1]}` : '';
}

// Social-style counts: 867, 1.2K, 15K.
export function formatCount(n) {
  const v = Number(n) || 0;
  return v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(v);
}
