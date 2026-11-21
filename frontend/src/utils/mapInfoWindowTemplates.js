// InfoWindow HTML Template Generators for Map Features
// google.maps.InfoWindow parses these strings as HTML, and ticket text comes from anonymous users.
// Every interpolated value must go through esc() or it becomes stored XSS.

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function getStateInfoWindowContent(cmEntry) {
  if (!cmEntry) return '';
  const stateName = cmEntry.stateName || cmEntry.state_name || 'State';
  const cmName = cmEntry.cmName || 'Chief Minister';
  const party = cmEntry.party || 'State Executive';

  return `
    <div style="font-family:Inter,sans-serif;padding:8px 10px;max-width:240px;color:#0F172A;">
      <div style="font-size:10px;color:#64748B;margin-bottom:2px;">📍 ${esc(stateName)}</div>
      <div style="font-size:14px;font-weight:700;color:#E63946;">${esc(cmName)}</div>
      <div style="font-size:11px;color:#475569;margin-top:2px;">
        Chief Minister &bull; ${esc(party)}
      </div>
    </div>
  `;
}

export function getWardInfoWindowContent(matchedUnit, fallbackStateId) {
  const wardName = matchedUnit?.unitName || 'Ward not identified';
  const areaName = matchedUnit?.parentCityDistrict || (fallbackStateId ? `Region (${fallbackStateId})` : 'Region unknown');
  const mlaName = matchedUnit?.politicalVoice?.name || 'Not on record';
  const mlaParty = matchedUnit?.politicalVoice?.party || '';
  const adminName = matchedUnit?.administrativeSpender?.name || 'Not on record';

  return `
    <div style="font-family:Inter,sans-serif;padding:8px 10px;max-width:240px;color:#0F172A;">
      <div style="font-size:10px;font-weight:700;color:#E63946;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:2px;">
        🏢 WARD & AREA IDENTIFIED
      </div>
      <div style="font-size:13px;font-weight:700;color:#0F172A;line-height:1.2;">
        ${esc(wardName)}
      </div>
      <div style="font-size:11px;color:#475569;margin-top:2px;font-weight:600;">
        📍 ${esc(areaName)}
      </div>
      <div style="margin-top:6px;padding-top:6px;border-top:1px solid #E2E8F0;font-size:10px;color:#334155;line-height:1.5;">
        👤 <strong>MLA:</strong> ${esc(mlaName)} ${mlaParty ? `(${esc(mlaParty)})` : ''}<br/>
        👔 <strong>Admin:</strong> ${esc(adminName)}
      </div>
    </div>
  `;
}

export function getOutsideBoundaryWarningContent(unitName) {
  return `
    <div style="font-family:Inter,sans-serif;padding:8px 10px;max-width:240px;color:#E63946;">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;margin-bottom:2px;">⚠️ Outside Ward Boundary</div>
      <div style="font-size:11px;color:#334155;line-height:1.3;">
        Issue pin must be placed inside <strong>${esc(unitName)}</strong>! Please click within the highlighted red boundary.
      </div>
    </div>
  `;
}

export function getPinnedLocationInfoWindowContent(lat, lng) {
  return `
    <div style="font-family:Inter,sans-serif;padding:6px 8px;font-size:11px;font-weight:700;color:#E63946;">
      📍 PINPOINTED CIVIC ISSUE LOCATION<br/>
      <span style="font-size:10px;color:#475569;font-weight:normal;">
        ${Number(lat).toFixed(5)}°N, ${Number(lng).toFixed(5)}°E
      </span>
    </div>
  `;
}

export function getTicketInfoWindowContent(ticket) {
  return `
    <div style="font-family:Inter,sans-serif;padding:6px 8px;max-width:200px;color:#0F172A;">
      <div style="font-size:10px;font-weight:700;color:#E63946;text-transform:uppercase;">${esc(ticket.category || 'Grievance')}</div>
      <div style="font-size:11px;margin-top:2px;font-weight:600;">${esc(ticket.description)}</div>
      <div style="font-size:10px;color:#64748B;margin-top:4px;">
        👍 ${Number(ticket.upvotes) || 0} Upvotes &bull; ${esc(ticket.status || 'OPEN')}
      </div>
    </div>
  `;
}
