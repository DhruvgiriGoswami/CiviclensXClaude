import React from 'react';

// A value that is empty, or just repeats its own label, is a placeholder. Show it as missing.
export function onRecord(value, label) {
  const v = typeof value === 'string' ? value.trim() : value;
  if (!v || v === 'Not available') return null;
  if (label && String(v).toLowerCase() === String(label).toLowerCase()) return null;
  return v;
}

export function NotOnRecord() {
  return <span className="font-normal text-slate-500 light:text-slate-500">Not yet on record</span>;
}
