import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Award, FileText, Layers, UserCheck, Activity, Zap, Sun, Moon, Type, Eye, Building, Landmark, ChevronRight, HelpCircle, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { geographyApi, searchApi, systemApi } from '../services/api';
import { CapexBreakdownModal, outlayTotalRange } from './CapexBreakdownModal';
import { rankSearch } from '../utils/search';

export function Header({
  onOpenNationalLeaders,
  onOpenTour,
  onOpenFollowRupee,
  onSelectUnit,
  onSelectState,
  allUnits,
  activeFilter,
  setActiveFilter,
  selectedUnit
}) {
  const {
    theme,
    toggleTheme,
    fontScale,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    highContrast,
    toggleHighContrast
  } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [isCapexModalOpen, setIsCapexModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const isUp = await systemApi.checkHealth();
        if (isMounted) {
          setIsBackendHealthy(isUp);
        }
      } catch {
        if (isMounted) {
          setIsBackendHealthy(false);
        }
      }
    };

    // Poll only while the tab is visible; a background tab shouldn't hit /health every 20s forever.
    checkHealth();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') checkHealth();
    }, 20000);
    const onVisible = () => { if (document.visibilityState === 'visible') checkHealth(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  const [municipalCorps, setMunicipalCorps] = useState([
    { id: "IN-MH-NMMC", unitId: "IN-MH-NMMC", code: "NMMC", name: "Navi Mumbai Municipal Corporation (NMMC)", city: "Navi Mumbai", stateId: "MH", center: { lat: 19.1031, lng: 73.0125 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-MH-BMC", unitId: "IN-MH-BMC", code: "BMC", name: "Brihanmumbai Municipal Corporation (BMC)", city: "Mumbai", stateId: "MH", center: { lat: 18.9220, lng: 72.8347 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-MH-PMC", unitId: "IN-MH-PMC", code: "PMC", name: "Pune Municipal Corporation (PMC)", city: "Pune", stateId: "MH", center: { lat: 18.5204, lng: 73.8567 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-MH-PCMC", unitId: "IN-MH-PCMC", code: "PCMC", name: "Pimpri Chinchwad Municipal Corporation (PCMC)", city: "Pimpri-Chinchwad", stateId: "MH", center: { lat: 18.6298, lng: 73.7997 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-MH-NMC", unitId: "IN-MH-NMC", code: "NMC", name: "Nagpur Municipal Corporation (NMC)", city: "Nagpur", stateId: "MH", center: { lat: 21.1458, lng: 79.0882 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-MH-KDMC", unitId: "IN-MH-KDMC", code: "KDMC", name: "Kalyan Dombivli Municipal Corporation (KDMC)", city: "Kalyan-Dombivli", stateId: "MH", center: { lat: 19.2403, lng: 73.1305 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-KA-BBMP", unitId: "IN-KA-BBMP", code: "BBMP", name: "Bruhat Bengaluru Mahanagara Palike (BBMP)", city: "Bengaluru", stateId: "KA", center: { lat: 12.9716, lng: 77.5946 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-MH-TMC", unitId: "IN-MH-TMC", code: "TMC", name: "Thane Municipal Corporation (TMC)", city: "Thane", stateId: "MH", center: { lat: 19.2183, lng: 72.9781 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-TG-GHMC", unitId: "IN-TG-GHMC", code: "GHMC", name: "Greater Hyderabad Municipal Corporation (GHMC)", city: "Hyderabad", stateId: "TG", center: { lat: 17.3850, lng: 78.4867 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-GJ-AMC", unitId: "IN-GJ-AMC", code: "AMC", name: "Ahmedabad Municipal Corporation (AMC)", city: "Ahmedabad", stateId: "GJ", center: { lat: 23.0225, lng: 72.5714 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-GJ-BMC-BHAVNAGAR", unitId: "IN-GJ-BMC-BHAVNAGAR", code: "BMC", name: "Bhavnagar Municipal Corporation (BMC)", city: "Bhavnagar", stateId: "GJ", center: { lat: 21.765, lng: 72.15 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-GJ-SMC", unitId: "IN-GJ-SMC", code: "SMC", name: "Surat Municipal Corporation (SMC)", city: "Surat", stateId: "GJ", center: { lat: 21.1702, lng: 72.8311 }, unitType: "MUNICIPAL_CORPORATION" },
    { id: "IN-TN-GCC", unitId: "IN-TN-GCC", code: "GCC", name: "Greater Chennai Corporation (GCC)", city: "Chennai", stateId: "TN", center: { lat: 13.0418, lng: 80.2341 }, unitType: "MUNICIPAL_CORPORATION" },
  ]);

  useEffect(() => {
    geographyApi.getCorporations()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMunicipalCorps(data);
        }
      })
      .catch(err => console.warn('Using fallback corporations:', err));
  }, []);

  const [apiSearchResults, setApiSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchOffline, setSearchOffline] = useState(false);

  // PostgreSQL GIN-indexed pg_trgm trigram search with 250ms debounce
  useEffect(() => {
    const queryTerm = searchQuery.trim();
    if (queryTerm.length < 2) {
      setApiSearchResults([]);
      setIsSearchLoading(false);
      return;
    }

    setIsSearchLoading(true);
    const timer = setTimeout(() => {
      searchApi.searchFuzzy(queryTerm, 20)
        .then(data => {
          // One row per unit, and names that start with the query first ("Pune" before "Punjab").
          const results = data?.results || [];
          const keyOf = (r) => r.geo_unit_id || `${r.entity_type}-${r.id}`;
          const ranked = rankSearch(results, queryTerm, { key: keyOf, label: (r) => r.name || r.geo_unit_name || '', limit: 20 });
          const seen = new Set(ranked.map(keyOf));
          const rest = results.filter((r) => !seen.has(keyOf(r)) && seen.add(keyOf(r)));
          setApiSearchResults([...ranked, ...rest]);
          setSearchOffline(false);
        })
        .catch(() => {
          setApiSearchResults([]);
          setSearchOffline(true);
        })
        .finally(() => setIsSearchLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const q = searchQuery.trim().toLowerCase();

  // AMC Ahmedabad / Amdavad Fuzzy Search Aliases
  const amcAliases = [
    'ahmedabad', 'amdavad', 'ahmadabad', 'amc', 'amdavad municipal corporation',
    'ahmedabad municipal corporation', 'amc municipal corporation', 'amdavad city',
    'ahmedabad city', 'ahmedabad ward', 'amdavad ward', 'gujarat amc', 'amc amdavad'
  ];

  const isAmcFuzzyMatch = q !== '' && amcAliases.some(alias => alias.includes(q) || q.includes(alias));

  // Bhavnagar Fuzzy Search Aliases
  const bhavnagarAliases = [
    'bhavnagar', 'bhavnagar municipal corporation', 'bmc bhavnagar', 'bmcb',
    'bhavnagar mc', 'bhavnagar city', 'bhavnagar ward', 'gujarat bhavnagar'
  ];

  const isBhavnagarFuzzyMatch = q !== '' && bhavnagarAliases.some(alias => alias.includes(q) || q.includes(alias));

  const INDIAN_STATES = [
    { stateId: 'AP', stateName: 'Andhra Pradesh', type: 'STATE', capital: 'Amaravati' },
    { stateId: 'AR', stateName: 'Arunachal Pradesh', type: 'STATE', capital: 'Itanagar' },
    { stateId: 'AS', stateName: 'Assam', type: 'STATE', capital: 'Dispur' },
    { stateId: 'BR', stateName: 'Bihar', type: 'STATE', capital: 'Patna' },
    { stateId: 'CG', stateName: 'Chhattisgarh', type: 'STATE', capital: 'Raipur' },
    { stateId: 'GA', stateName: 'Goa', type: 'STATE', capital: 'Panaji' },
    { stateId: 'GJ', stateName: 'Gujarat', type: 'STATE', capital: 'Gandhinagar' },
    { stateId: 'HR', stateName: 'Haryana', type: 'STATE', capital: 'Chandigarh' },
    { stateId: 'HP', stateName: 'Himachal Pradesh', type: 'STATE', capital: 'Shimla' },
    { stateId: 'JH', stateName: 'Jharkhand', type: 'STATE', capital: 'Ranchi' },
    { stateId: 'KA', stateName: 'Karnataka', type: 'STATE', capital: 'Bengaluru' },
    { stateId: 'KL', stateName: 'Kerala', type: 'STATE', capital: 'Thiruvananthapuram' },
    { stateId: 'MP', stateName: 'Madhya Pradesh', type: 'STATE', capital: 'Bhopal' },
    { stateId: 'MH', stateName: 'Maharashtra', type: 'STATE', capital: 'Mumbai' },
    { stateId: 'MN', stateName: 'Manipur', type: 'STATE', capital: 'Imphal' },
    { stateId: 'ML', stateName: 'Meghalaya', type: 'STATE', capital: 'Shillong' },
    { stateId: 'MZ', stateName: 'Mizoram', type: 'STATE', capital: 'Aizawl' },
    { stateId: 'NL', stateName: 'Nagaland', type: 'STATE', capital: 'Kohima' },
    { stateId: 'OD', stateName: 'Odisha', type: 'STATE', capital: 'Bhubaneswar' },
    { stateId: 'PB', stateName: 'Punjab', type: 'STATE', capital: 'Chandigarh' },
    { stateId: 'RJ', stateName: 'Rajasthan', type: 'STATE', capital: 'Jaipur' },
    { stateId: 'SK', stateName: 'Sikkim', type: 'STATE', capital: 'Gangtok' },
    { stateId: 'TN', stateName: 'Tamil Nadu', type: 'STATE', capital: 'Chennai' },
    { stateId: 'TG', stateName: 'Telangana', type: 'STATE', capital: 'Hyderabad' },
    { stateId: 'TR', stateName: 'Tripura', type: 'STATE', capital: 'Agartala' },
    { stateId: 'UP', stateName: 'Uttar Pradesh', type: 'STATE', capital: 'Lucknow' },
    { stateId: 'UK', stateName: 'Uttarakhand', type: 'STATE', capital: 'Dehradun' },
    { stateId: 'WB', stateName: 'West Bengal', type: 'STATE', capital: 'Kolkata' },
    { stateId: 'DL', stateName: 'Delhi', type: 'UNION_TERRITORY', capital: 'New Delhi' },
  ];

  const getSearchResultCategory = (res) => {
    if (!res) return 'OTHER';
    const entityType = (res.entity_type || '').toUpperCase();
    const unitId = (res.id || res.unitId || '').toUpperCase();

    if (entityType === 'PERSON') return 'PERSON';
    if (entityType === 'STATE' || /^IN-[A-Z]{2}$/.test(unitId)) return 'STATE';
    if (
      entityType === 'MUNICIPAL_CORPORATION' ||
      entityType === 'MUNICIPALITY' ||
      entityType === 'CITY' ||
      unitId.includes('-MC') ||
      unitId.includes('-CORP') ||
      unitId.includes('-BMC') ||
      unitId.includes('-NMMC') ||
      unitId.includes('-PMC') ||
      unitId.includes('-TMC') ||
      unitId.includes('-KDMC') ||
      unitId.includes('-AMC') ||
      unitId.includes('-BBMP') ||
      unitId.includes('-GHMC') ||
      unitId.includes('-GCC') ||
      unitId.includes('-SMC') ||
      unitId.includes('-NMC') ||
      unitId.includes('-PCMC')
    ) return 'MUNICIPAL_CORPORATION';
    if (entityType === 'DISTRICT' || unitId.includes('-DIST-')) return 'DISTRICT';
    if (entityType === 'WARD' || entityType === 'URBAN_WARD' || unitId.includes('-WARD-')) return 'WARD';
    if (unitId.startsWith('IN-')) return 'STATE';
    return 'OTHER';
  };

  const matchedStates = rankSearch(INDIAN_STATES, q, { key: (st) => st.stateId, label: (st) => st.stateName, limit: 40 });

  const matchedCorps = q === '' ? [] : municipalCorps.filter(c => {
    const codeLower = (c.code || '').toLowerCase();
    const nameLower = (c.name || '').toLowerCase();
    const cityLower = (c.city || '').toLowerCase();
    const idLower = (c.id || c.unitId || '').toLowerCase();

    if (codeLower === 'amc' || idLower === 'in-gj-amc' || nameLower.includes('ahmedabad') || nameLower.includes('amdavad')) {
      if (isAmcFuzzyMatch) return true;
    }
    if (idLower === 'in-gj-bmc-bhavnagar' || nameLower.includes('bhavnagar') || cityLower.includes('bhavnagar')) {
      if (isBhavnagarFuzzyMatch) return true;
    }

    return codeLower.includes(q) || nameLower.includes(q) || cityLower.includes(q) || idLower.includes(q);
  });

  const matchedLeaders = q === '' ? [] : (allUnits || []).filter(u =>
    (u.politicalVoice?.name || '').toLowerCase().includes(q) ||
    (u.administrativeSpender?.name || '').toLowerCase().includes(q)
  );

  const matchedWards = q === '' ? [] : [...new Map((allUnits || []).map((u) => [u.unitId, u])).values()].filter(u => {
    const nameLower = (u.unitName || '').toLowerCase();
    const parentLower = (u.parentCityDistrict || '').toLowerCase();
    const idLower = (u.unitId || '').toLowerCase();

    if (idLower.startsWith('in-gj-amc')) {
      if (isAmcFuzzyMatch) return true;
    }
    if (idLower.startsWith('in-gj-bmc-bhavnagar')) {
      if (isBhavnagarFuzzyMatch) return true;
    }

    return nameLower.includes(q) || parentLower.includes(q) || idLower.includes(q);
  });

  const hasAnyResults = apiSearchResults.length > 0 || matchedStates.length > 0 || matchedCorps.length > 0 || matchedLeaders.length > 0 || matchedWards.length > 0;

  return (
    <div className="w-full flex-shrink-0 z-30 pt-[env(safe-area-inset-top)] bg-dark-800 light:bg-[#F8FAFC] flex flex-col">
      {/* ─── Main Header Navigation ─── */}
      <header className="min-h-14 lg:h-16 bg-dark-800 light:bg-white border-b border-slate-800/80 light:border-slate-200 px-3 sm:px-4 py-2 lg:py-0 flex flex-col lg:flex-row lg:items-center justify-between relative shadow-sm gap-2 lg:gap-0">
        <div className="flex items-center justify-between w-full lg:w-auto relative">
          {/* Logo on Left */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg border border-crimson-400/40 flex-shrink-0 bg-white flex items-center justify-center p-0.5">
            <img
              src="/hand_Fav.jpg"
              alt="CivicLens Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>

          {/* Title "CivicLens India" in the Middle on Mobile, Left-aligned next to Logo on Desktop */}
          <div className="flex-1 sm:flex-initial text-center sm:text-left sm:ml-4 min-w-0 px-2 sm:px-0">
            <div className="flex items-center justify-center sm:justify-start space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-base sm:text-lg tracking-wider text-slate-100 light:text-slate-900 font-sans truncate">
                CivicLens <span className="text-crimson-300 light:text-crimson-700 text-xs sm:text-sm uppercase px-1 sm:px-1.5 py-0.5 rounded bg-crimson-500/10 border border-crimson-500/30 ml-1 inline-block">India</span>
              </span>
            </div>
            {!isBackendHealthy && (
              <span role="status" className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-700 text-slate-100 light:bg-slate-200 light:text-slate-800">Offline</span>
            )}
          </div>

          {/* Quick Mobile Theme Toggle Button on Far Right */}
          <div className="flex sm:hidden items-center justify-end flex-shrink-0">
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="w-11 h-11 inline-flex items-center justify-center rounded-lg bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-800 border border-slate-700 light:border-slate-300"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-amber-600" />}
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div id="search-bar-step" className="relative w-full lg:flex-1 lg:max-w-md z-30 mx-0 lg:mx-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 light:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Search for a place, corporation, ward or leader"
              placeholder="Search a city, ward or leader"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearching(true)}
              className="w-full bg-slate-800/90 light:bg-slate-100 border border-slate-600/60 light:border-slate-300 rounded-lg pl-9 pr-4 min-h-[44px] text-sm text-white light:text-slate-900 placeholder-slate-400 light:placeholder-slate-500 focus:border-slate-400 transition-colors font-sans"
            />
          </div>

          {/* Categorized Search Results Dropdown */}
          {isSearching && hasAnyResults && (
            <div className="absolute top-full mt-2 left-0 right-0 glass-panel light:bg-white light:border-slate-300 rounded-xl border border-slate-700/80 shadow-2xl max-h-[60vh] md:max-h-80 overflow-y-auto z-50 p-2 space-y-2">
              {searchOffline && <p className="px-2 py-1 text-xs text-slate-400 light:text-slate-600">Showing offline results. We could not reach the server.</p>}

              {/* CATEGORY: Search Results */}
              {apiSearchResults.length > 0 && (
                <div className="border-b border-slate-700/60 light:border-slate-200 pb-2 mb-2">
                  <div className="text-xs uppercase font-bold text-sky-400 light:text-sky-700 px-2 py-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-sky-400 light:text-sky-700" />
                      Search Results
                    </span>
                  </div>
                  {apiSearchResults.map((res) => (
                    <button
                      key={`${res.entity_type}-${res.id}`}
                      onClick={() => {
                        if (res.entity_type === 'PERSON') {
                          const stCode = res.state_id || (res.geo_unit_id?.startsWith('IN-') ? res.geo_unit_id.split('-')[1] : null);
                          const isStateLeader = res.role_title?.toLowerCase().includes('chief minister') || res.role_title?.toLowerCase().includes('governor') || (res.geo_unit_id && res.geo_unit_id === `IN-${stCode}`);

                          if (isStateLeader && stCode && onSelectState) {
                            onSelectState({
                              stateId: stCode,
                              stateName: res.geo_unit_name || `State (${stCode})`,
                              cmName: res.name
                            });
                          } else {
                            const targetUnitId = res.geo_unit_id || (stCode ? `IN-${stCode}-MC` : 'IN-MH-NMMC');
                            const existingUnit = (allUnits || []).find(u => u.unitId === targetUnitId || u.id === targetUnitId);

                            let coords = existingUnit?.coordinates;
                            if (!coords) {
                              const corpMatch = municipalCorps.find(c => c.id === targetUnitId || c.unitId === targetUnitId || targetUnitId.includes(c.code));
                              if (corpMatch) {
                                coords = corpMatch.center;
                              }
                            }

                            const selectedLeaderObj = {
                              name: res.name,
                              title: res.role_title || 'Governance Representative',
                              party: res.party_or_dept || 'Public Authority',
                              photo: res.photo_url || null,
                              userRating: null,
                              totalVotes: 0,
                              approvalStatus: 'VERIFIED',
                              roleType: res.person_type || 'POLITICIAN',
                              authority: `Representative & executive authority for ${res.geo_unit_name || targetUnitId}.`
                            };

                            const unitToSelect = existingUnit ? {
                              ...existingUnit,
                              coordinates: existingUnit.coordinates || coords,
                              politicalVoice: res.person_type === 'POLITICIAN' ? selectedLeaderObj : (existingUnit.politicalVoice || selectedLeaderObj),
                              administrativeSpender: res.person_type === 'BUREAUCRAT' ? selectedLeaderObj : (existingUnit.administrativeSpender || selectedLeaderObj),
                              highlightedLeader: selectedLeaderObj
                            } : {
                              unitId: targetUnitId,
                              id: targetUnitId,
                              unitName: res.geo_unit_name || `${res.name}'s Governance Region`,
                              unitType: res.unit_type || 'MUNICIPAL_CORPORATION',
                              parentCityDistrict: res.geo_unit_name || 'Municipal Corporation',
                              stateId: stCode || 'MH',
                              coordinates: coords,
                              politicalVoice: res.person_type === 'POLITICIAN' ? selectedLeaderObj : undefined,
                              administrativeSpender: res.person_type === 'BUREAUCRAT' ? selectedLeaderObj : undefined,
                              highlightedLeader: selectedLeaderObj
                            };

                            onSelectUnit(unitToSelect);
                          }
                        } else {
                          const category = getSearchResultCategory(res);
                          if (category === 'STATE' && onSelectState) {
                            const stCode = res.id ? res.id.replace('IN-', '').split('-')[0].toUpperCase() : 'MH';
                            onSelectState({ stateId: stCode, stateName: res.name, cmName: res.parent_name || 'Chief Minister' });
                          } else if (category === 'MUNICIPAL_CORPORATION') {
                            const corpMatch = municipalCorps.find(c => c.id === res.id || c.unitId === res.id || (res.id && res.id.includes(c.code)));
                            const code = corpMatch?.code || (res.id ? res.id.split('-').pop() : 'MC');
                            const stCode = corpMatch?.stateId || (res.id ? res.id.split('-')[1] : 'MH');
                            const city = corpMatch?.city || (res.name ? res.name.split(' ')[0] : 'Municipal Corporation');

                            onSelectUnit({
                              unitId: res.id,
                              id: res.id,
                              unitName: res.name || corpMatch?.name,
                              unitType: 'MUNICIPAL_CORPORATION',
                              parentCityDistrict: corpMatch ? `${corpMatch.city}, ${corpMatch.stateId}` : `${city}, ${stCode}`,
                              stateId: stCode,
                              coordinates: corpMatch?.center,
                              budgetAllocatedCapEx: corpMatch?.budgetAllocatedCapEx,
                              budgetSpentOnTime: corpMatch?.budgetSpentOnTime,
                              totalTicketsCount: corpMatch?.totalTicketsCount,
                              resolvedTicketsCount: corpMatch?.resolvedTicketsCount,
                              politicalVoice: corpMatch?.politicalVoice,
                              administrativeSpender: corpMatch?.administrativeSpender,
                              projects: corpMatch?.projects || []
                            });
                          } else if (category === 'DISTRICT') {
                            const stCode = (res.id ? res.id.split('-')[1] : null) || 'MH';
                            onSelectUnit({
                              unitId: res.id,
                              id: res.id,
                              unitName: res.name,
                              unitType: 'DISTRICT',
                              districtName: res.name,
                              parentCityDistrict: `${res.name}, ${stCode}`,
                              stateId: stCode,
                            });
                          } else if (category === 'WARD') {
                            const stCode = (res.id ? res.id.split('-')[1] : null) || 'MH';
                            onSelectUnit({
                              unitId: res.id,
                              id: res.id,
                              unitName: res.name,
                              unitType: 'URBAN_WARD',
                              parentCityDistrict: res.parent_name || 'Municipal Corporation',
                              stateId: stCode,
                            });
                          } else if (onSelectState && res.id && res.id.startsWith('IN-')) {
                            const stCode = res.id.replace('IN-', '').split('-')[0].toUpperCase();
                            onSelectState({ stateId: stCode, stateName: res.name });
                          }
                        }
                        setSearchQuery('');
                        setIsSearching(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-sky-500/10 light:hover:bg-sky-50 hover:border hover:border-sky-500/30 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-100 light:text-slate-900 group-hover:text-sky-400 light:group-hover:text-sky-700 font-sans flex items-center gap-1.5">
                          <span>{res.name}</span>
                          {res.entity_type === 'PERSON' && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-crimson-500/20 light:bg-crimson-100 text-crimson-300 light:text-crimson-800 border border-crimson-500/30 light:border-crimson-300">
                              {res.person_type || 'LEADER'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 light:text-slate-600 font-medium">
                          {res.entity_type === 'MUNICIPAL_CORPORATION' || res.entity_type === 'MUNICIPALITY'
                            ? 'Municipal Corporation'
                            : res.entity_type === 'PERSON'
                              ? res.parent_name || res.role_title
                              : res.entity_type} &bull; {res.geo_unit_name || res.parent_name || res.id}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 light:text-slate-500 group-hover:text-sky-400 light:group-hover:text-sky-600" />
                    </button>
                  ))}
                </div>
              )}

              {/* CATEGORY 0: States & Union Territories */}
              {matchedStates.length > 0 && (
                <div>
                  <div className="text-xs uppercase font-bold text-emerald-400 light:text-emerald-700 px-2 py-1 flex items-center gap-1">
                    <Landmark className="w-3 h-3 text-emerald-400 light:text-emerald-700" />
                    <span>States & Union Territories</span>
                  </div>
                  {matchedStates.map((st) => (
                    <button
                      key={st.stateId}
                      onClick={() => {
                        if (onSelectState) {
                          onSelectState(st);
                        }
                        setSearchQuery('');
                        setIsSearching(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-500/10 light:hover:bg-emerald-50 hover:border hover:border-emerald-500/30 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-100 light:text-slate-900 group-hover:text-emerald-400 light:group-hover:text-emerald-700">{st.stateName}</div>
                        <div className="text-xs text-slate-400 light:text-slate-600 font-medium">
                          {st.type === 'UNION_TERRITORY' ? 'Union Territory' : 'State'} &bull; Capital: {st.capital} &bull; {st.cmName}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 light:bg-emerald-100 text-emerald-400 light:text-emerald-800 border border-emerald-500/40 light:border-emerald-300 font-bold">
                          {st.stateId}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 light:text-slate-500 group-hover:text-emerald-400 light:group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* CATEGORY 1: Municipal Corporations */}
              {matchedCorps.length > 0 && (
                <div>
                  <div className="text-xs uppercase font-bold text-amber-400 light:text-amber-700 px-2 py-1 flex items-center gap-1">
                    <Building className="w-3 h-3 text-amber-400 light:text-amber-700" />
                    <span>Municipal Corporations — Highlight All Wards</span>
                  </div>
                  {matchedCorps.map((corp) => (
                    <button
                      key={corp.id}
                      onClick={() => {
                        onSelectUnit({
                          unitId: corp.id,
                          id: corp.id,
                          unitName: corp.name,
                          unitType: "MUNICIPAL_CORPORATION",
                          parentCityDistrict: `${corp.city}, ${corp.stateId}`,
                          stateId: corp.stateId,
                          coordinates: corp.center,
                          // Only the corporation's own data; no placeholder budgets, leaders or projects.
                          budgetAllocatedCapEx: corp.budgetAllocatedCapEx,
                          budgetSpentOnTime: corp.budgetSpentOnTime,
                          totalTicketsCount: corp.totalTicketsCount,
                          resolvedTicketsCount: corp.resolvedTicketsCount,
                          politicalVoice: corp.politicalVoice,
                          administrativeSpender: corp.administrativeSpender,
                          projects: corp.projects || []
                        });
                        setSearchQuery('');
                        setIsSearching(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-500/10 light:hover:bg-amber-50 hover:border hover:border-amber-500/30 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-100 light:text-slate-900 group-hover:text-amber-400 light:group-hover:text-amber-700">{corp.name}</div>
                        <div className="text-xs text-slate-400 light:text-slate-600 font-medium">Highlight all wards under {corp.code} ({corp.city})</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 light:bg-amber-100 text-amber-400 light:text-amber-800 border border-amber-500/40 light:border-amber-300 font-bold">
                        {corp.code} Corporation
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* CATEGORY 2: Politicians & Bureaucrats */}
              {matchedLeaders.length > 0 && (
                <div>
                  <div className="text-xs uppercase font-bold text-crimson-400 light:text-crimson-700 px-2 py-1 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-crimson-400 light:text-crimson-700" />
                    <span>Politicians & Civic Bureaucrats</span>
                  </div>
                  {matchedLeaders.map((unit) => {
                    const matchPol = unit.politicalVoice?.name.toLowerCase().includes(q);
                    const matchAdmin = unit.administrativeSpender?.name.toLowerCase().includes(q);
                    const leaderName = matchPol ? unit.politicalVoice?.name : unit.administrativeSpender?.name;
                    const leaderTitle = matchPol ? unit.politicalVoice?.title : unit.administrativeSpender?.title;

                    return (
                      <button
                        key={`leader-${unit.unitId}`}
                        onClick={() => {
                          const leaderObj = matchPol ? unit.politicalVoice : unit.administrativeSpender;
                          onSelectUnit({
                            ...unit,
                            highlightedLeader: leaderObj
                          });
                          setSearchQuery('');
                          setIsSearching(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-crimson-500/10 light:hover:bg-crimson-50 hover:border hover:border-crimson-500/30 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-100 light:text-slate-900 group-hover:text-crimson-400 light:group-hover:text-crimson-700">{leaderName}</div>
                          <div className="text-xs text-slate-400 light:text-slate-600 font-medium">{leaderTitle} &bull; {unit.unitName}</div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-crimson-500/20 light:bg-crimson-100 text-crimson-400 light:text-crimson-800 border border-crimson-500/40 light:border-crimson-300 font-bold">
                          {matchPol ? 'Politician' : 'Bureaucrat'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* CATEGORY 3: Wards & Gram Panchayats */}
              {matchedWards.length > 0 && (
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400 light:text-slate-700 px-2 py-1">Matching Wards & Panchayats</div>
                  {matchedWards.map((unit) => (
                    <button
                      key={unit.unitId}
                      onClick={() => {
                        onSelectUnit(unit);
                        setSearchQuery('');
                        setIsSearching(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 light:hover:bg-slate-100 hover:border hover:border-slate-700 light:hover:border-slate-300 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-100 light:text-slate-900 group-hover:text-crimson-400 light:group-hover:text-crimson-700">{unit.unitName}</div>
                        <div className="text-xs text-slate-400 light:text-slate-600 font-medium">{unit.parentCityDistrict}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-900 light:bg-slate-200 text-slate-300 light:text-slate-800 border border-slate-700 light:border-slate-300 font-bold">
                        {unit.unitType === 'MUNICIPAL_CORPORATION' || unit.unitType === 'MUNICIPALITY' || unit.unitType === 'CITY'
                          ? 'Municipal Corporation'
                          : unit.unitType === 'URBAN_WARD' || unit.unitType === 'WARD'
                            ? 'Urban Ward'
                            : 'Gram Panchayat'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Action Controls & Top Stats */}
        <div className="flex flex-wrap items-center justify-start sm:justify-end w-full lg:w-auto gap-2">
          {/* How It Works / Guided Tour Button */}
          {onOpenTour && (
            <button
              onClick={onOpenTour}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-crimson-500/15 light:bg-crimson-50 hover:bg-crimson-500/25 border border-crimson-500/40 text-xs font-bold text-crimson-400 light:text-crimson-700 transition-all shadow-md group flex-shrink-0"
              title="How it Works (3-Step Tour)"
            >
              <HelpCircle className="w-3.5 h-3.5 text-crimson-400 light:text-crimson-600 group-hover:rotate-12 transition-transform flex-shrink-0" />
              <span className="inline">How it Works</span>
            </button>
          )}

          {onOpenFollowRupee && (
            <a
              href="/follow-the-rupee"
              onClick={(e) => { e.preventDefault(); onOpenFollowRupee(); }}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg bg-crimson-700 hover:bg-crimson-800 text-white text-xs font-semibold flex-shrink-0"
            >
              <Landmark className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>Follow the Rupee: Mumbai audit</span>
            </a>
          )}

          {/* National Leadership Directory Trigger */}
          <button
            onClick={onOpenNationalLeaders}
            className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 light:bg-slate-100 hover:bg-slate-800 border border-slate-700/70 light:border-slate-300 text-xs font-medium text-slate-200 light:text-slate-800 transition-all shadow-md group flex-shrink-0 ml-auto sm:ml-0"
          >
            <UserCheck className="w-3.5 h-3.5 text-crimson-400 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span>National Directory <span className="hidden xl:inline">(PM / CM / Prez)</span></span>
          </button>

          {/* System Metric Counters */}
          <div className="hidden lg:flex items-center space-x-4 pl-3 border-l border-slate-800 light:border-slate-200 text-xs">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400 light:text-slate-600">Annual budget outlay</span>
                <button
                  onClick={() => setIsCapexModalOpen(true)}
                  title="See the budget breakdown"
                  aria-label="See the budget breakdown"
                  className="w-11 h-11 -my-3 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-400 light:text-slate-500 light:hover:text-amber-600 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <span className="font-bold text-slate-200 light:text-slate-800 text-xs">{outlayTotalRange()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── ReBIT / RBI Style Top Accessibility & Utility Toolbar ─── */}
      <div className="order-first hidden sm:flex min-h-7 py-0.5 bg-dark-900 light:bg-[#F1F5F9] text-slate-300 light:text-slate-800 border-b border-slate-800/80 light:border-slate-300 px-3 sm:px-4 items-center justify-between text-xs sm:text-xs select-none flex-wrap gap-1">
        <div className="flex items-center space-x-2 min-w-0">

        </div>

        {/* Accessibility & Font Controls Toolbar */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Font Controls (A- / A / A+) */}
          <div className="flex items-center space-x-1 bg-slate-900/90 light:bg-white px-1.5 py-0.5 rounded-lg border border-slate-700/60 light:border-slate-300 text-xs">
            <span className="text-slate-400 light:text-slate-600 mr-0.5 hidden md:inline-flex items-center gap-0.5">
              <Type className="w-3 h-3 text-slate-400 light:text-slate-600" />
              Font:
            </span>
            <button
              onClick={decreaseFontSize}
              title="Decrease Font Size"
              aria-label="Smaller text"
              className="min-w-[44px] min-h-[44px] rounded-lg hover:bg-amber-500/20 text-slate-300 light:text-slate-700 hover:text-amber-400 font-bold transition-colors"
            >
              A-
            </button>
            <button
              onClick={resetFontSize}
              title="Reset Font Size (100%)"
              aria-label="Default text size"
              className={`min-w-[44px] min-h-[44px] rounded-lg hover:bg-amber-500/20 font-bold transition-colors ${fontScale === 100 ? 'text-amber-400 light:text-amber-700 bg-amber-500/10' : 'text-slate-300 light:text-slate-700'}`}
            >
              A
            </button>
            <button
              onClick={increaseFontSize}
              title="Increase Font Size"
              aria-label="Larger text"
              className="min-w-[44px] min-h-[44px] rounded-lg hover:bg-amber-500/20 text-slate-300 light:text-slate-700 hover:text-amber-400 font-bold transition-colors"
            >
              A+
            </button>
            <span className="text-xs text-amber-400 light:text-amber-700 font-bold ml-0.5">({fontScale}%)</span>
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="min-h-[44px] px-2.5 rounded-lg bg-slate-900 light:bg-white text-slate-300 light:text-slate-800 border border-slate-700 light:border-slate-300 hover:border-amber-400 transition-colors flex items-center gap-1 text-xs"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3 h-3 text-amber-400" />
                <span className="hidden md:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-amber-500" />
                <span className="hidden md:inline">Dark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CapEx Outlay Breakdown Modal */}
      <CapexBreakdownModal
        isOpen={isCapexModalOpen}
        onClose={() => setIsCapexModalOpen(false)}
      />
    </div>
  );
}

