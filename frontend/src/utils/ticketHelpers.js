/**
 * Resolves a backend storage URL (e.g. /storage/complaints/17/...) to a full absolute URL
 * pointing to the FastAPI backend host, preserving external or blob URLs as-is.
 */
export function getMediaUrl(storageUrl) {
  if (!storageUrl) return null;
  if (
    storageUrl.startsWith('http://') ||
    storageUrl.startsWith('https://') ||
    storageUrl.startsWith('blob:') ||
    storageUrl.startsWith('data:')
  ) {
    return storageUrl;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const cleanBase = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${cleanBase}${storageUrl.startsWith('/') ? '' : '/'}${storageUrl}`;
}

export function getFilteredTickets(tickets = [], unit, currentLevel) {
  if (!unit || !Array.isArray(tickets)) return [];

  const unitId = unit.unitId || '';
  const unitType = unit.unitType || currentLevel || '';

  // Extract clean name tokens
  const rawUnitName = (unit.unitName || '').toLowerCase();
  const cleanUnitName = rawUnitName.replace(/\s+district$/i, '').trim();
  
  const rawDistName = (unit.districtName || (rawUnitName.includes('district') ? rawUnitName : '')).toLowerCase();
  const cleanDistName = rawDistName.replace(/\s+district$/i, '').trim();
  
  const stateId = unit.stateId || (unitId ? unitId.split('-')[1] : null);

  // Short code helper (e.g. TMC, NMMC, BMC, KDMC, BBMP)
  const shortCode = unit.shortCode || 
    (unitId.includes('TMC') ? 'TMC' : 
     unitId.includes('NMMC') ? 'NMMC' : 
     unitId.includes('BMC') ? 'BMC' : 
     unitId.includes('KDMC') ? 'KDMC' : 
     unitId.includes('BBMP') ? 'BBMP' : '');

  // Determine hierarchical view level
  const isDistrict = currentLevel === 'DISTRICT' || unitType === 'DISTRICT' || unitId.includes('-DIST-');
  const isCorporation = !isDistrict && (currentLevel === 'CORPORATION' || unitType === 'MUNICIPAL_CORPORATION' || (unitId.startsWith('IN-') && !unitId.includes('-WARD-') && !unitId.includes('-DIST-')));
  const isWard = !isDistrict && !isCorporation;

  return tickets.filter(t => {
    if (!t) return false;

    const tUnitId = t.unitId || '';
    const tWard = (t.wardName || t.address_text || '').toLowerCase();
    const tDistrict = (t.districtName || t.districtId || '').toLowerCase();
    const tCity = (t.parentCityDistrict || t.address_text || '').toLowerCase();
    const tDesc = (t.description || '').toLowerCase();
    const tCategory = (t.category || '').toLowerCase();

    // 1. Direct unitId exact match always passes
    if (unitId && tUnitId === unitId) return true;

    // 2. WARD level filtering (strict to ward)
    if (isWard) {
      if (unitId && (tUnitId === unitId || tUnitId.startsWith(unitId))) return true;
      if (cleanUnitName && cleanUnitName.length > 2) {
        if (tWard.includes(cleanUnitName) || tDesc.includes(cleanUnitName)) return true;
      }
      return false;
    }

    // 3. CORPORATION level filtering (all constituent wards of corporation)
    if (isCorporation) {
      // Matches constituent ward IDs (e.g., IN-MH-TMC-WARD-15 starts with IN-MH-TMC)
      if (unitId && tUnitId.startsWith(unitId)) return true;
      if (t.corporationId && t.corporationId === unitId) return true;

      // Match by corporation short code (TMC, NMMC, BMC, KDMC, BBMP)
      if (shortCode) {
        if (tUnitId.includes(shortCode) || tCity.includes(shortCode.toLowerCase()) || tWard.includes(shortCode.toLowerCase())) return true;
      }

      // Match by corporation name (e.g. Thane Municipal Corporation, Thane)
      if (cleanUnitName && cleanUnitName.length > 2) {
        if (tCity.includes(cleanUnitName) || tWard.includes(cleanUnitName) || tDesc.includes(cleanUnitName)) return true;
      }
      return false;
    }

    // 4. DISTRICT level filtering (all constituent corporations, wards & panchayats in district)
    if (isDistrict) {
      // Match by district unitId prefix (e.g., IN-GJ-DIST-KACHCHH or IN-MH-DIST-THANE)
      if (unitId && (tUnitId === unitId || tUnitId.startsWith(unitId))) return true;
      if (t.districtId && (t.districtId === unitId || t.districtId.toLowerCase().includes(cleanDistName || cleanUnitName))) return true;

      // State safeguard check
      if (stateId && t.stateId && t.stateId !== stateId) {
        return false;
      }

      // Match by District Name (e.g. Kachchh, Thane, Mumbai, Bengaluru)
      const targetDist = cleanDistName || cleanUnitName;
      if (targetDist && targetDist.length > 2) {
        if (tDistrict.includes(targetDist) || tCity.includes(targetDist) || tWard.includes(targetDist) || tDesc.includes(targetDist)) return true;
        
        const cleanTUnitId = tUnitId.toLowerCase().replace(/[\s\-_]+/g, '');
        const cleanTarget = targetDist.replace(/[\s\-_]+/g, '');
        if (cleanTUnitId.includes(cleanTarget)) return true;
      }

      // Specific known district mappings for demo accuracy
      if (targetDist === 'thane') {
        if (tUnitId.includes('TMC') || tUnitId.includes('NMMC') || tUnitId.includes('KDMC') || tCity.includes('thane') || tWard.includes('thane')) return true;
      } else if (targetDist === 'kachchh' || targetDist === 'kutch') {
        if (tUnitId.includes('KACHCHH') || tCity.includes('kachchh') || tWard.includes('kachchh') || tCity.includes('kutch') || tWard.includes('kutch')) return true;
      } else if (targetDist.includes('mumbai')) {
        if (tUnitId.startsWith('IN-MH-BMC') || tUnitId === 'IN-MH-MUMBAI') return true;
      } else if (targetDist.includes('bengaluru') || targetDist.includes('bangalore')) {
        if (tUnitId.includes('BBMP') || tCity.includes('bengaluru') || tWard.includes('bengaluru')) return true;
      }

      return false;
    }

    return false;
  });
}

// A hackathon complaint from GET /audit/complaint-tickets, shaped like a citizen ticket.
export function auditTicket(r) {
  return {
    ticketId: r.complaint_id,
    source: 'audit',
    unitId: r.unit_id || '',
    category: r.category,
    description: r.description,
    latitude: r.lat,
    longitude: r.lon,
    status: r.status,
    issueState: r.issue_state,
    upvotes: r.upvotes || 0,
    reporter: 'BMC complaint record',
    addressText: r.locality || undefined,
    createdAt: r.received_at ? new Date(r.received_at).toLocaleDateString('en-IN') : '',
    media: [],
  };
}
