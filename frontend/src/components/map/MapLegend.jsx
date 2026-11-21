import React from 'react';
import { RAMP_LIGHT, RAMP_DARK, NO_DATA_LIGHT, NO_DATA_DARK } from '../../utils/choropleth';

// Legend for the ward layer on screen: one ramp with its count ranges, plus the grey "no complaints" swatch.
// shortcut: only ward-level polygons are coloured, so the legend shows only there; add state and district counts when the API has them.
export function MapLegend({ legend, isDark }) {
  if (!legend) return null;
  const ramp = isDark ? RAMP_DARK : RAMP_LIGHT;
  const round = (n) => Math.round(n);
  return (
    <div className="absolute top-4 right-3 sm:right-4 z-20 rounded-2xl border border-slate-700 light:border-slate-200 bg-[#12151E] light:bg-white shadow-lg p-3 text-xs max-w-[220px] space-y-2" aria-label="Map legend">
      <p className="font-semibold text-slate-100 light:text-slate-900">Complaints per ward</p>
      {legend.unavailable ? (
        <p className="text-slate-400 light:text-slate-600">Complaint counts are not available yet, so wards are shown in grey.</p>
      ) : (
        <ul className="space-y-1 tabular-nums text-slate-300 light:text-slate-700">
          {legend.breaks.length > 1 && ramp.map((c, i) => (
            <li key={c} className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ background: c }} aria-hidden="true" />
              {round(legend.breaks[i])} to {round(legend.breaks[i + 1])}
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ background: isDark ? NO_DATA_DARK : NO_DATA_LIGHT }} aria-hidden="true" />
            None filed yet
          </li>
        </ul>
      )}
      <p className="text-slate-400 light:text-slate-600">{legend.withComplaints} of {legend.wards} wards have complaints.</p>
    </div>
  );
}
