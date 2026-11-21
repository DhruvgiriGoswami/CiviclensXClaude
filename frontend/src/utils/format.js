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
