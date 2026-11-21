import React, { useMemo, useState } from 'react';
import { makeBreaks, bucketIndex, bucketColor, RAMP_LIGHT, RAMP_DARK, NO_DATA_LIGHT, NO_DATA_DARK } from '../../utils/choropleth';
import { formatINR, formatPct } from '../../utils/format';

export const MEASURES = {
  failed_fix_share: { label: 'Failed-fix share', long: 'of spend went on repairs that failed within 30 days', fmt: (v) => formatPct(v) },
  amount_at_risk_inr: { label: 'Amount at risk', long: 'in bills that need a closer look', fmt: (v) => formatINR(v) },
};

const W = 400;

function project(geojson) {
  const pts = geojson.features.flatMap((f) => f.geometry.coordinates.flat(f.geometry.type === 'MultiPolygon' ? 2 : 1));
  const lons = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const k = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const scale = W / ((maxLon - minLon) * k);
  const H = Math.round((maxLat - minLat) * scale);
  const xy = ([lon, lat]) => [(lon - minLon) * k * scale, (maxLat - lat) * scale];
  const shapes = geojson.features.map((f) => {
    const rings = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.flat() : f.geometry.coordinates;
    const outer = rings[0].map(xy);
    const d = rings.map((r) => `M${r.map((p) => xy(p).map((n) => n.toFixed(1)).join(',')).join('L')}Z`).join('');
    // Shoelace area and centroid of the outer ring, for placing labels on the bigger wards.
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < outer.length - 1; i += 1) {
      const [x0, y0] = outer[i];
      const [x1, y1] = outer[i + 1];
      const c = x0 * y1 - x1 * y0;
      a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
    }
    a /= 2;
    return { code: f.properties.ward_code, name: f.properties.ward_name, d, area: Math.abs(a), cx: cx / (6 * a), cy: cy / (6 * a) };
  });
  return { shapes, H };
}

export function WardMap({ geojson, wards, measure, onMeasure, selected, onSelect, dark }) {
  const [hover, setHover] = useState(null);
  const { shapes, H } = useMemo(() => (geojson ? project(geojson) : { shapes: [], H: 600 }), [geojson]);
  const byCode = useMemo(() => Object.fromEntries((wards || []).map((w) => [w.ward_code, w])), [wards]);
  const breaks = useMemo(() => makeBreaks((wards || []).map((w) => w[measure])), [wards, measure]);
  const m = MEASURES[measure];
  const ramp = dark ? RAMP_DARK : RAMP_LIGHT;
  const focus = byCode[hover] || byCode[selected];
  const sorted = useMemo(() => [...(wards || [])].sort((a, b) => (b[measure] ?? -1) - (a[measure] ?? -1)), [wards, measure]);
  const sel = shapes.find((s) => s.code === selected);

  return (
    <section aria-labelledby="map-heading" className="ftr-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="map-heading" className="text-base font-semibold">Wards</h2>
        <div role="group" aria-label="Colour wards by" className="inline-flex rounded-lg border border-slate-700 light:border-slate-300 p-0.5">
          {Object.entries(MEASURES).map(([key, v]) => (
            <button
              key={key}
              type="button"
              aria-pressed={measure === key}
              onClick={() => onMeasure(key)}
              className={`min-h-[44px] px-3 rounded-md text-sm font-medium ${measure === key ? 'bg-slate-100 text-slate-900 light:bg-slate-900 light:text-white' : 'text-slate-300 light:text-slate-700 hover:bg-white/10 light:hover:bg-slate-900/5'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 min-h-[2.5rem] text-sm text-slate-300 light:text-slate-700" aria-live="polite">
        {focus
          ? <><span className="font-semibold text-slate-100 light:text-slate-900">Ward {focus.ward_code}</span>, {focus.ward_name}: <span className="font-semibold tabular-nums">{m.fmt(focus[measure])}</span> {m.long}.</>
          : 'Point at a ward to see its number. Click it, or pick it from the list, to open the details.'}
      </p>

      <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} className="w-full h-auto max-h-[70vh] mt-2" role="img" aria-label={`Map of Mumbai's 24 wards coloured by ${m.label.toLowerCase()}. Use the ward list below to choose a ward with the keyboard.`}>
        {shapes.map((s) => {
          const v = byCode[s.code]?.[measure];
          return (
            <path
              key={s.code}
              d={s.d}
              data-ward={s.code}
              fill={bucketColor(v, breaks, dark)}
              stroke={dark ? '#0B0D12' : '#FFFFFF'}
              strokeWidth="1.5"
              className="cursor-pointer"
              onMouseEnter={() => setHover(s.code)}
              onMouseLeave={() => setHover((h) => (h === s.code ? null : h))}
              onClick={() => onSelect(s.code)}
            >
              <title>{`Ward ${s.code}: ${m.fmt(v)}`}</title>
            </path>
          );
        })}
        {hover && shapes.filter((s) => s.code === hover).map((s) => (
          <path key="hover" d={s.d} fill={dark ? '#FFFFFF' : '#0F172A'} fillOpacity="0.1" pointerEvents="none" />
        ))}
        {sel && <path d={sel.d} fill="none" stroke="var(--role-select)" strokeWidth="3.5" strokeLinejoin="round" pointerEvents="none" />}
        {shapes.filter((s) => s.area > 900).map((s) => {
          const idx = bucketIndex(byCode[s.code]?.[measure], breaks);
          return (
            <text key={`t-${s.code}`} x={s.cx} y={s.cy} textAnchor="middle" dominantBaseline="middle" fontSize="17" fontWeight="600" pointerEvents="none" fill={(dark ? idx < 3 : idx >= 3) ? '#FFFFFF' : '#0F172A'}>
              {s.code}
            </text>
          );
        })}
      </svg>

      <div className="mt-3" aria-label="Legend">
        <p className="text-xs text-slate-400 light:text-slate-600 mb-1.5">{m.label}, in five equal steps</p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs tabular-nums">
          {ramp.map((c, i) => (
            <li key={c} className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded-sm" style={{ background: c }} aria-hidden="true" />
              {breaks.length ? `${m.fmt(breaks[i])} to ${m.fmt(breaks[i + 1])}` : 'No data'}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded-sm" style={{ background: dark ? NO_DATA_DARK : NO_DATA_LIGHT }} aria-hidden="true" />
            No data
          </li>
        </ul>
      </div>

      <h3 className="mt-5 text-sm font-semibold">All wards, highest first</h3>
      <ul className="mt-2 max-h-80 overflow-y-auto pr-1 space-y-1" aria-label="Ward list">
        {sorted.map((w) => (
          <li key={w.ward_code}>
            <button
              type="button"
              aria-pressed={selected === w.ward_code}
              onClick={() => onSelect(w.ward_code)}
              onMouseEnter={() => setHover(w.ward_code)}
              onMouseLeave={() => setHover(null)}
              className={`w-full min-h-[44px] flex items-center gap-3 px-3 rounded-lg text-left text-sm ${selected === w.ward_code ? 'ring-2 ring-[color:var(--role-select)] bg-white/5 light:bg-slate-900/5' : 'hover:bg-white/5 light:hover:bg-slate-900/5'}`}
            >
              <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ background: bucketColor(w[measure], breaks, dark) }} aria-hidden="true" />
              <span className="font-semibold w-10 shrink-0">{w.ward_code}</span>
              <span className="flex-1 truncate text-slate-300 light:text-slate-700">{w.ward_name}</span>
              <span className="tabular-nums font-medium">{m.fmt(w[measure])}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
