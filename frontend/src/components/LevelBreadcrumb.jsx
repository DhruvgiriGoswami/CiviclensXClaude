import React from 'react';
import { ChevronRight, Globe, Building, Home, LandPlot } from 'lucide-react';

export function LevelBreadcrumb({
  currentLevel,
  selectedState,
  selectedUnit,
  onResetToNational,
  onSelectState,
  onSelectDistrict,
  onSelectCorporation,
  onSelectWard
}) {
  // Resolve State object and display name
  const derivedStateId = selectedState?.stateId || selectedUnit?.stateId || (selectedUnit?.unitId ? selectedUnit.unitId.split('-')[1] : null);
  const stateObj = selectedState;
  const stateName = stateObj?.stateName || (derivedStateId ? `State (${derivedStateId})` : null);

  // Resolve District Name (Level 3)
  let rawDistrictName = null;
  if (selectedUnit) {
    if (selectedUnit.districtName) {
      rawDistrictName = selectedUnit.districtName;
    } else if (selectedUnit.parentCityDistrict) {
      const parts = selectedUnit.parentCityDistrict.split(',');
      rawDistrictName = parts[0].replace(/ \(.*?\)/, '').trim();
    } else {
      rawDistrictName = 'District';
    }
  }

  const cleanDistrictName = rawDistrictName ? rawDistrictName.replace(/\s+District$/i, '').trim() : null;
  const districtDisplay = cleanDistrictName ? `${cleanDistrictName} District` : null;

  // Resolve Corporation / Municipality (Level 4)
  let corpName = null;
  let corpObj = null;

  if (selectedUnit) {
    if (selectedUnit.unitType === 'MUNICIPAL_CORPORATION') {
      corpName = selectedUnit.unitName || selectedUnit.name;
      corpObj = {
        ...selectedUnit,
        stateId: selectedUnit.stateId || derivedStateId || 'GJ'
      };
    } else {
      // Derived from ward's parent city/corporation
      if (selectedUnit.corporationName) {
        corpName = selectedUnit.corporationName;
      } else if (selectedUnit.parentCityDistrict) {
        corpName = selectedUnit.parentCityDistrict.split(',')[0].trim();
      } else {
        corpName = 'Municipal Corporation';
      }

      const stCode = selectedUnit.stateId || derivedStateId || 'GJ';
      const corpId = selectedUnit.parent_unit_id || (selectedUnit.unitId?.includes('BHAVNAGAR') ? 'IN-GJ-BMC-BHAVNAGAR' : `IN-${stCode}-CORP`);
      corpObj = {
        unitId: corpId,
        id: corpId,
        unitName: corpName,
        unitType: 'MUNICIPAL_CORPORATION',
        stateId: stCode,
        parentCityDistrict: selectedUnit.parentCityDistrict || corpName,
        coordinates: selectedUnit.coordinates
      };
    }
  }

  // Check unit types
  const isWardUnit = selectedUnit && selectedUnit.unitType !== 'MUNICIPAL_CORPORATION' && selectedUnit.unitType !== 'DISTRICT' && !(selectedUnit.unitId && selectedUnit.unitId.includes('-DIST-'));
  const isCorpUnit = selectedUnit && selectedUnit.unitType === 'MUNICIPAL_CORPORATION';
  const isNationalActive = currentLevel === 'NATIONAL';
  const isStateActive = currentLevel === 'STATE';
  const isDistrictActive = currentLevel === 'DISTRICT';
  const isCorpActive = currentLevel === 'CORPORATION';
  const isWardActive = (currentLevel === 'WARD' || currentLevel === 'MICRO') && isWardUnit;

  return (
    <div className="bg-[#12151E]/95 light:bg-white/95 border-b border-slate-800 light:border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between z-20 shadow-md flex-shrink-0">
      <div className="flex items-center space-x-1 sm:space-x-1.5 text-xs overflow-x-auto no-scrollbar py-0.5">
        
        {/* LEVEL 1: National Macro */}
        <button
          onClick={onResetToNational}
          className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 min-h-[44px] rounded-lg transition-all flex-shrink-0 ${
            isNationalActive
              ? 'bg-crimson-500/20 text-crimson-400 border border-crimson-500/40 font-bold shadow-sm'
              : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
          <span>India <span className="hidden sm:inline">(Level 1 Macro)</span></span>
        </button>

        {/* LEVEL 2: State */}
        {stateName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <button
              onClick={() => stateObj && onSelectState && onSelectState(stateObj)}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 min-h-[44px] rounded-lg transition-all flex-shrink-0 ${
                isStateActive
                  ? 'bg-crimson-500/20 text-crimson-400 border border-crimson-500/40 font-bold shadow-sm'
                  : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 hover:bg-slate-800/60'
              }`}
            >
              <Building className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{stateName} <span className="hidden sm:inline">(Level 2 State)</span></span>
            </button>
          </>
        )}

        {/* LEVEL 3: District */}
        {districtDisplay && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <button
              onClick={() => onSelectDistrict && onSelectDistrict(cleanDistrictName, derivedStateId)}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 min-h-[44px] rounded-lg transition-all flex-shrink-0 ${
                isDistrictActive
                  ? 'bg-crimson-500/20 text-crimson-400 border border-crimson-500/40 font-bold shadow-sm'
                  : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 hover:bg-slate-800/60'
              }`}
            >
              <LandPlot className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{districtDisplay} <span className="hidden sm:inline">(Level 3 District)</span></span>
            </button>
          </>
        )}

        {/* LEVEL 4: Municipal Corporation / City */}
        {corpName && (isCorpActive || isWardActive) && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <button
              onClick={() => corpObj && onSelectCorporation && onSelectCorporation(corpObj)}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 min-h-[44px] rounded-lg transition-all flex-shrink-0 ${
                isCorpActive
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold shadow-sm'
                  : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 hover:bg-slate-800/60'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>{corpName} <span className="hidden sm:inline">(Level 4 Corporation)</span></span>
            </button>
          </>
        )}

        {/* LEVEL 5: Micro Tier Ward / Panchayat */}
        {isWardUnit && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <button
              onClick={() => onSelectWard && onSelectWard(selectedUnit)}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 min-h-[44px] rounded-lg transition-all flex-shrink-0 ${
                isWardActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold shadow-sm'
                  : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>{selectedUnit.unitName} <span className="hidden sm:inline">(Level 5 Micro Ward)</span></span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
