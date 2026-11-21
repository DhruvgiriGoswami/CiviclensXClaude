import React, { useState, useEffect } from 'react';
import { MapPin, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { geographyApi } from '../../services/api';

// Helper to get clean name without " District" suffix
const getCleanDistrictName = (name) => {
  return (name || '').replace(/\s+District$/i, '').trim();
};

export function GeographicScopeFilters({
  selectedState,
  selectedDistrict,
  selectedCorp,
  selectedWard,
  onGeoChange,
  defaultOpen = true,
}) {
  const [isCollapsed, setIsCollapsed] = useState(!defaultOpen);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]); // Deduplicated districts
  const [allCorps, setAllCorps] = useState([]); // All corps for selected state
  const [filteredCorps, setFilteredCorps] = useState([]); // Corps filtered by selected district
  const [wards, setWards] = useState([]);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCorps, setLoadingCorps] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [errorGeo, setErrorGeo] = useState(null);

  // 1. Fetch States on Mount
  useEffect(() => {
    let isMounted = true;
    setLoadingStates(true);
    setErrorGeo(null);

    geographyApi.getGeoUnits({ unit_type_id: 'STATE', limit: 100 })
      .then(res => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : (res?.items || []);
        list.sort((a, b) => a.name.localeCompare(b.name));
        setStates(list);
      })
      .catch(err => {
        if (!isMounted) return;
        console.warn('Failed to load states:', err.message);
        setErrorGeo('Failed to load states hierarchy from API.');
      })
      .finally(() => {
        if (isMounted) setLoadingStates(false);
      });

    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Districts & Corporations when State changes
  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      setAllCorps([]);
      setFilteredCorps([]);
      setWards([]);
      return;
    }

    let isMounted = true;
    setLoadingDistricts(true);
    setLoadingCorps(true);

    const stateObj = states.find(s => s.unit_id === selectedState || s.state_code === selectedState);
    const stateCode = stateObj?.state_code || selectedState.replace('IN-', '');

    // Fetch Districts & Deduplicate by Clean Name
    geographyApi.getGeoUnits({ state_code: stateCode, unit_type_id: 'DISTRICT', limit: 200 })
      .then(res => {
        if (!isMounted) return;
        const rawList = Array.isArray(res) ? res : (res?.items || []);

        const districtMap = new Map();

        rawList.forEach(item => {
          const cleanName = getCleanDistrictName(item.name);
          const key = cleanName.toLowerCase();

          if (!districtMap.has(key)) {
            districtMap.set(key, {
              unit_id: item.unit_id,
              name: `${cleanName} District`,
              cleanName: cleanName,
              district_code: item.district_code || cleanName.toUpperCase(),
              alt_ids: [item.unit_id],
              level: item.level || 3,
            });
          } else {
            const existing = districtMap.get(key);
            existing.alt_ids.push(item.unit_id);
            if (
              (item.level === 2 || item.district_code || !item.unit_id.includes('-DIST-')) &&
              existing.unit_id.includes('-DIST-')
            ) {
              existing.unit_id = item.unit_id;
              if (item.district_code) existing.district_code = item.district_code;
            }
          }
        });

        const dedupedList = Array.from(districtMap.values());
        dedupedList.sort((a, b) => a.cleanName.localeCompare(b.cleanName));
        setDistricts(dedupedList);
      })
      .catch(err => console.warn('Failed to load districts:', err.message))
      .finally(() => { if (isMounted) setLoadingDistricts(false); });

    // Fetch Corporations / Local Authorities for this State
    Promise.all([
      geographyApi.getCorporations().catch(() => []),
      geographyApi.getGeoUnits({ state_code: stateCode, limit: 200 }).catch(() => []),
    ])
      .then(([provisionedCorps, rawUnits]) => {
        if (!isMounted) return;

        const corpMap = new Map();

        // Provisioned corporations matching state
        (provisionedCorps || []).forEach(c => {
          if (c.stateId === stateCode || c.state_code === stateCode) {
            corpMap.set(c.unitId || c.id, {
              unit_id: c.unitId || c.id,
              name: c.name,
              code: c.code,
              city: c.city,
              parent_unit_id: c.parent_unit_id || (c.city ? `IN-${stateCode}-${c.city.toUpperCase()}` : null),
              district_code: c.district_code || (c.city ? c.city.toUpperCase() : null),
            });
          }
        });

        // Units from geo-units endpoint
        const geoMunicipal = (rawUnits || []).filter(u =>
          ['MUNICIPAL_CORPORATION', 'MUNICIPALITY', 'CITY', 'LOCAL_AUTHORITY'].includes(u.unit_type_id)
        );

        geoMunicipal.forEach(u => {
          if (!corpMap.has(u.unit_id)) {
            corpMap.set(u.unit_id, {
              unit_id: u.unit_id,
              name: u.name,
              code: u.official_code || u.unit_id.replace(`IN-${stateCode}-`, ''),
              city: u.name.replace(/Municipal Corporation|Corporation|\(.*\)/gi, '').trim(),
              parent_unit_id: u.parent_unit_id,
              district_code: u.district_code,
            });
          }
        });

        const combinedList = Array.from(corpMap.values());
        combinedList.sort((a, b) => a.name.localeCompare(b.name));
        setAllCorps(combinedList);
      })
      .catch(err => console.warn('Failed to load corporations:', err.message))
      .finally(() => { if (isMounted) setLoadingCorps(false); });

    return () => { isMounted = false; };
  }, [selectedState, states]);

  // 3. Filter Corporations when selectedDistrict or allCorps changes
  useEffect(() => {
    if (!selectedDistrict) {
      setFilteredCorps(allCorps);
      return;
    }

    const distObj = districts.find(d => d.unit_id === selectedDistrict || d.alt_ids?.includes(selectedDistrict));
    const targetCleanName = (distObj?.cleanName || '').toLowerCase();
    const targetAltIds = distObj?.alt_ids || [selectedDistrict];
    const targetDistCode = (distObj?.district_code || targetCleanName).toUpperCase();

    const filtered = allCorps.filter(c => {
      if (c.parent_unit_id && targetAltIds.includes(c.parent_unit_id)) return true;
      if (c.parent_unit_id && c.parent_unit_id.toLowerCase().includes(targetCleanName)) return true;
      if (c.district_code && c.district_code.toUpperCase() === targetDistCode) return true;
      const corpNameLower = (c.name || '').toLowerCase();
      const corpCityLower = (c.city || '').toLowerCase();
      if (targetCleanName && (corpNameLower.includes(targetCleanName) || corpCityLower.includes(targetCleanName))) {
        return true;
      }
      return false;
    });

    setFilteredCorps(filtered);
  }, [selectedDistrict, allCorps, districts]);

  // 4. Fetch Wards when Local Authority or District changes
  useEffect(() => {
    const parentId = selectedCorp || selectedDistrict;
    if (!parentId) {
      setWards([]);
      return;
    }

    let isMounted = true;
    setLoadingWards(true);

    geographyApi.getGeoUnits({ parent_unit_id: parentId, limit: 300 })
      .then(res => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : (res?.items || []);
        list.sort((a, b) => a.name.localeCompare(b.name));
        setWards(list);
      })
      .catch(err => console.warn('Failed to load wards:', err.message))
      .finally(() => { if (isMounted) setLoadingWards(false); });

    return () => { isMounted = false; };
  }, [selectedCorp, selectedDistrict]);

  const handleStateSelect = (e) => {
    const val = e.target.value;
    onGeoChange({
      state: val,
      district: '',
      corp: '',
      ward: '',
      effectiveGeoUnitId: val || ''
    });
  };

  const handleDistrictSelect = (e) => {
    const val = e.target.value;
    onGeoChange({
      state: selectedState,
      district: val,
      corp: '',
      ward: '',
      effectiveGeoUnitId: val || selectedState || ''
    });
  };

  const handleCorpSelect = (e) => {
    const val = e.target.value;
    onGeoChange({
      state: selectedState,
      district: selectedDistrict,
      corp: val,
      ward: '',
      effectiveGeoUnitId: val || selectedDistrict || selectedState || ''
    });
  };

  const handleWardSelect = (e) => {
    const val = e.target.value;
    onGeoChange({
      state: selectedState,
      district: selectedDistrict,
      corp: selectedCorp,
      ward: val,
      effectiveGeoUnitId: val || selectedCorp || selectedDistrict || selectedState || ''
    });
  };

  const handleClearGeo = () => {
    onGeoChange({
      state: '',
      district: '',
      corp: '',
      ward: '',
      effectiveGeoUnitId: ''
    });
  };

  const hasAnyFilter = !!(selectedState || selectedDistrict || selectedCorp || selectedWard);

  return (
    <div className="bg-[#0E121B] light:bg-[#F1F5F9] border-b border-slate-800 light:border-slate-300 p-3 sm:px-6 transition-colors shadow-sm">
      <div className="flex items-center justify-between">
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <MapPin className="w-3.5 h-3.5 text-blue-400 light:text-blue-600" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 light:text-slate-800 group-hover:text-white light:group-hover:text-blue-600 transition-colors">
            Geographic Scope Filter
          </h2>
          {hasAnyFilter && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 light:bg-blue-100 text-blue-300 light:text-blue-800 border border-blue-500/30 light:border-blue-300 font-bold">
              Scoped Search Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasAnyFilter && (
            <button
              onClick={handleClearGeo}
              className="text-xs text-slate-400 light:text-slate-600 hover:text-rose-400 light:hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Scope</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs font-bold text-slate-400 light:text-slate-700 hover:text-white light:hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            <span>{isCollapsed ? 'Expand Scope' : 'Collapse Scope'}</span>
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {errorGeo && (
        <div className="mt-2 p-2 rounded bg-rose-950/40 light:bg-rose-50 border border-rose-800/60 light:border-rose-200 text-rose-300 light:text-rose-700 text-xs">
          {errorGeo}
        </div>
      )}

      {/* Cascading Dropdowns Grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 animate-fadeIn">
          {/* 1. State */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 light:text-slate-600 mb-1 font-bold">
              1. State / Union Territory
            </label>
            <div className="relative">
              <select
                value={selectedState || ''}
                onChange={handleStateSelect}
                disabled={loadingStates}
                className="w-full bg-[#0B0D12] light:bg-white text-slate-200 light:text-slate-900 border border-slate-700/80 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 disabled:opacity-50 appearance-none font-sans cursor-pointer transition-colors shadow-sm"
              >
                <option value="">All India (National View)</option>
                {states.map(s => (
                  <option key={s.unit_id} value={s.unit_id}>
                    {s.name} ({s.state_code || s.unit_id.replace('IN-', '')})
                  </option>
                ))}
              </select>
              {loadingStates && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 light:text-blue-600 absolute right-3 top-2 pointer-events-none" />
              )}
            </div>
          </div>

          {/* 2. Region / District */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 light:text-slate-600 mb-1 font-bold">
              2. Region / District
            </label>
            <div className="relative">
              <select
                value={selectedDistrict || ''}
                onChange={handleDistrictSelect}
                disabled={!selectedState || loadingDistricts}
                className="w-full bg-[#0B0D12] light:bg-white text-slate-200 light:text-slate-900 border border-slate-700/80 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 disabled:opacity-40 appearance-none font-sans cursor-pointer transition-colors shadow-sm"
              >
                <option value="">
                  {!selectedState ? 'Select State First' : 'All Districts'}
                </option>
                {districts.map(d => (
                  <option key={d.unit_id} value={d.unit_id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {loadingDistricts && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 light:text-blue-600 absolute right-3 top-2 pointer-events-none" />
              )}
            </div>
          </div>

          {/* 3. Local Authority / Corporation */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 light:text-slate-600 mb-1 font-bold">
              3. Local Authority / Municipality
            </label>
            <div className="relative">
              <select
                value={selectedCorp || ''}
                onChange={handleCorpSelect}
                disabled={!selectedState || loadingCorps}
                className="w-full bg-[#0B0D12] light:bg-white text-slate-200 light:text-slate-900 border border-slate-700/80 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 disabled:opacity-40 appearance-none font-sans cursor-pointer transition-colors shadow-sm"
              >
                <option value="">
                  {!selectedState ? 'Select State First' : 'All Local Authorities'}
                </option>
                {filteredCorps.map(c => (
                  <option key={c.unit_id} value={c.unit_id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {loadingCorps && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 light:text-blue-600 absolute right-3 top-2 pointer-events-none" />
              )}
            </div>
          </div>

          {/* 4. Ward / Jurisdiction */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 light:text-slate-600 mb-1 font-bold">
              4. Ward / Jurisdiction Unit
            </label>
            <div className="relative">
              <select
                value={selectedWard || ''}
                onChange={handleWardSelect}
                disabled={(!selectedCorp && !selectedDistrict) || loadingWards}
                className="w-full bg-[#0B0D12] light:bg-white text-slate-200 light:text-slate-900 border border-slate-700/80 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 disabled:opacity-40 appearance-none font-sans cursor-pointer transition-colors shadow-sm"
              >
                <option value="">
                  {!selectedCorp && !selectedDistrict ? 'Select Authority / District First' : 'All Wards'}
                </option>
                {wards.map(w => (
                  <option key={w.unit_id} value={w.unit_id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {loadingWards && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 light:text-blue-600 absolute right-3 top-2 pointer-events-none" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
