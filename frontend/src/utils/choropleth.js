// One sequential ramp, light to brand dark, 5 steps. Index -1 means no data (neutral grey).
export const RAMP_LIGHT = ['#FBE3E5', '#F3B0B6', '#E3707B', '#C23443', '#7A1420'];
export const RAMP_DARK = ['#3B1D22', '#6A2731', '#9E3140', '#D4505E', '#F4A3AB'];
export const NO_DATA_LIGHT = '#E2E8F0';
export const NO_DATA_DARK = '#334155';

// Equal-interval breaks between the smallest and largest real value.
export function makeBreaks(values, steps = 5) {
  const nums = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (!nums.length) return [];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return Array.from({ length: steps + 1 }, (_, i) => min + ((max - min) * i) / steps);
}

export function bucketIndex(value, breaks) {
  if (typeof value !== 'number' || !Number.isFinite(value) || breaks.length < 2) return -1;
  const steps = breaks.length - 1;
  if (breaks[steps] === breaks[0]) return 0;
  for (let i = 1; i <= steps; i += 1) {
    if (value <= breaks[i]) return i - 1;
  }
  return steps - 1;
}

export function bucketColor(value, breaks, dark = false) {
  const i = bucketIndex(value, breaks);
  if (i < 0) return dark ? NO_DATA_DARK : NO_DATA_LIGHT;
  return (dark ? RAMP_DARK : RAMP_LIGHT)[i];
}
