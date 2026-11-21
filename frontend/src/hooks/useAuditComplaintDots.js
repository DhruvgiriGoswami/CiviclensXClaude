import { useEffect } from 'react';
import { auditApi } from '../pages/FollowTheRupee/auditApi';
import { DOT } from '../pages/FollowTheRupee/ComplaintCard';
import { formatINR } from '../utils/format';

const MIN_ZOOM = 10; // city level; at India zoom the dots would sit on top of Maharashtra's click target
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function cardHtml(id, state, t, error) {
  const st = DOT[state];
  const head = `<div style="font:13px/1.45 system-ui,sans-serif;color:#0F172A;max-width:260px">
    <div style="font-weight:600"><span style="font-family:monospace">${esc(id)}</span></div>
    ${st ? `<div style="font-size:12px;margin:2px 0 6px"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${st.color};margin-right:5px"></span>${esc(st.label)}</div>` : ''}`;
  if (error) return `${head}<p style="margin:0">${esc(error)}</p></div>`;
  if (!t) return `${head}<p style="margin:0;color:#475569">Loading the complaint.</p></div>`;
  const c = t.complaint;
  const w = t.work_orders.at(-1);
  return `${head}
    <p style="margin:0 0 4px">${esc(c.category_clean)} at ${esc(c.locality_text)}, ward ${esc(c.ward_code || 'unknown')}. ${esc(c.received_at?.replace('T', ' '))}, ${esc(c.channel)}. Status: ${esc(c.status)}.</p>
    <p style="margin:0 0 4px;color:#475569">&ldquo;${esc(c.description)}&rdquo;</p>
    <p style="margin:0 0 6px">${w ? `${esc(w.contractor_name)}, ${esc(w.wo_id)}, ${esc(formatINR(w.cost_inr))}. ${w.reopened_within_30d ? 'Failed within 30 days.' : 'Holding so far.'}${w.flags.length ? ` ${w.flags.length} audit flag${w.flags.length > 1 ? 's' : ''}.` : ''}` : 'No work order linked.'}</p>
    <a href="/follow-the-rupee" style="color:#B91C1C;text-decoration:underline">Open the Mumbai audit</a></div>`;
}

// Hackathon complaints with GPS (complaints.csv lat/lon) as dots on the main Google map.
export function useAuditComplaintDots({ googleMapRef, isMapReady }) {
  useEffect(() => {
    const map = googleMapRef.current;
    const g = window.google?.maps;
    if (!map || !g || !isMapReady) return undefined;
    const layer = new g.Data();
    const info = new g.InfoWindow();
    let live = true;
    layer.setStyle((f) => ({
      icon: { path: g.SymbolPath.CIRCLE, scale: 4, fillColor: DOT[f.getProperty('state')]?.color || '#94A3B8', fillOpacity: 0.9, strokeColor: '#FFFFFF', strokeWeight: 1 },
    }));
    const sync = () => layer.setMap((map.getZoom() ?? 0) >= MIN_ZOOM ? map : null);
    const zoomListener = map.addListener('zoom_changed', sync);
    layer.addListener('click', (e) => {
      const id = e.feature.getProperty('id');
      const state = e.feature.getProperty('state');
      info.setPosition(e.latLng);
      info.setContent(cardHtml(id, state));
      info.open({ map });
      auditApi.complaint(id)
        .then((t) => live && info.setContent(cardHtml(id, state, t)))
        .catch((err) => live && info.setContent(cardHtml(id, state, null, err.status === 404 ? 'Full details need the audit server.' : err.message)));
    });
    auditApi.complaintPoints().then((p) => {
      if (!live) return;
      p.rows.forEach(([id, lat, lon, , state]) => layer.add({ geometry: new g.Data.Point({ lat, lng: lon }), properties: { id, state } }));
      sync();
    }).catch(() => {}); // the main map works without the dots
    return () => {
      live = false;
      g.event.removeListener(zoomListener);
      info.close();
      layer.setMap(null);
    };
  }, [googleMapRef, isMapReady]);
}
