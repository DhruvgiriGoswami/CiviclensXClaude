import { useEffect } from 'react';
import { auditApi } from '../pages/FollowTheRupee/auditApi';
import { DOT } from '../pages/FollowTheRupee/ComplaintCard';
import { formatINR } from '../utils/format';

const MIN_ZOOM = 10; // city level; at India zoom the dots would sit on top of Maharashtra's click target
const HIT_PX = 10;
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

// Hackathon complaints with GPS (complaints.csv lat/lon) on the main Google map.
// All ~3,800 dots go on one canvas: Google's Data layer and Markers make one DOM node per point,
// which froze the page for seconds when the map zoomed into Mumbai.
export function useAuditComplaintDots({ googleMapRef, isMapReady }) {
  useEffect(() => {
    const map = googleMapRef.current;
    const g = window.google?.maps;
    if (!map || !g || !isMapReady) return undefined;
    let live = true;
    let pts = []; // [{ id, state, ll }]
    const info = new g.InfoWindow();
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';

    const overlay = new g.OverlayView();
    overlay.onAdd = () => overlay.getPanes().overlayLayer.appendChild(canvas);
    overlay.onRemove = () => canvas.remove();
    overlay.draw = () => {
      const proj = overlay.getProjection();
      const div = map.getDiv();
      const visible = (map.getZoom() ?? 0) >= MIN_ZOOM && pts.length;
      canvas.style.display = visible ? 'block' : 'none';
      if (!proj || !visible) return;
      // Cover the viewport plus a margin so short pans don't show bare edges before 'idle' redraws.
      const w = div.clientWidth, h = div.clientHeight, m = 200;
      const tl = proj.fromLatLngToDivPixel(proj.fromContainerPixelToLatLng(new g.Point(-m, -m)));
      const dpr = window.devicePixelRatio || 1;
      const W = w + 2 * m, H = h + 2 * m;
      canvas.style.left = `${tl.x}px`; canvas.style.top = `${tl.y}px`;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#FFFFFF';
      for (const p of pts) {
        const d = proj.fromLatLngToDivPixel(p.ll);
        const x = d.x - tl.x, y = d.y - tl.y;
        if (x < -5 || y < -5 || x > W + 5 || y > H + 5) continue;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = DOT[p.state]?.color || '#94A3B8';
        ctx.fill();
        ctx.stroke();
      }
    };
    overlay.setMap(map);
    const idle = map.addListener('idle', () => overlay.draw());

    // The canvas ignores pointer events, so map dragging and ward clicks work as before.
    // A click near a dot is caught first (capture phase) and opens its card instead.
    const onClick = (e) => {
      const proj = overlay.getProjection();
      if (!proj || !pts.length || (map.getZoom() ?? 0) < MIN_ZOOM) return;
      const r = map.getDiv().getBoundingClientRect();
      const cx = e.clientX - r.left, cy = e.clientY - r.top;
      let best = null, bestD = HIT_PX * HIT_PX;
      for (const p of pts) {
        const c = proj.fromLatLngToContainerPixel(p.ll);
        const d = (c.x - cx) ** 2 + (c.y - cy) ** 2;
        if (d < bestD) { best = p; bestD = d; }
      }
      if (!best || e.target.closest?.('.gm-style-iw, .gm-control-active, button, a')) return;
      e.stopPropagation();
      info.setPosition(best.ll);
      info.setContent(cardHtml(best.id, best.state));
      info.open({ map });
      auditApi.complaint(best.id)
        .then((t) => live && info.setContent(cardHtml(best.id, best.state, t)))
        .catch((err) => live && info.setContent(cardHtml(best.id, best.state, null, err.status === 404 ? 'Full details need the audit server.' : err.message)));
    };
    const el = map.getDiv();
    el.addEventListener('click', onClick, true);

    auditApi.complaintPoints().then((p) => {
      if (!live) return;
      pts = p.rows.map(([id, lat, lng, , state]) => ({ id, state, ll: new g.LatLng(lat, lng) }));
      overlay.draw();
    }).catch(() => {}); // the main map works without the dots

    return () => {
      live = false;
      el.removeEventListener('click', onClick, true);
      g.event.removeListener(idle);
      info.close();
      overlay.setMap(null);
    };
  }, [googleMapRef, isMapReady]);
}
