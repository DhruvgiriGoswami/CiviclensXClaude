import React, { useState, useEffect } from 'react';
import { MapPin, Layers, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

const districtToCorpMap = [
  {
    distKeys: [
      'IN-MH-MUMBAI', 'IN-MH-MUMBAICITY', 'IN-MH-DIST-MUMBAI_CITY', 'IN-MH-DIST-MUMBAICITY',
      'IN-MH-MUMBAISUBURBAN', 'IN-MH-DIST-MUMBAI_SUBURBAN', 'IN-MH-DIST-MUMBAISUBURBAN',
      'IN-MH-DIST-SUB_URBAN_MUMBAI', 'IN-MH-SUBURBANMUMBAI'
    ],
    distNames: ['mumbai', 'mumbai city', 'mumbai suburban', 'sub urban mumbai'],
    corporations: [
      { corpId: 'IN-MH-BMC', corpName: 'BMC (Brihanmumbai Municipal Corporation)', count: '227 Wards', center: { lat: 18.9220, lng: 72.8347 } }
    ]
  },
  {
    distKeys: ['IN-MH-THANE', 'IN-MH-DIST-THANE'],
    distNames: ['thane'],
    corporations: [
      { corpId: 'IN-MH-NMMC', corpName: 'NMMC (Navi Mumbai Municipal Corporation)', count: '28 Wards', center: { lat: 19.1031, lng: 73.0125 } },
      { corpId: 'IN-MH-TMC', corpName: 'TMC (Thane Municipal Corporation)', count: '33 Wards', center: { lat: 19.2183, lng: 72.9781 } },
      { corpId: 'IN-MH-KDMC', corpName: 'KDMC (Kalyan Dombivli Municipal Corporation)', count: '123 Wards', center: { lat: 19.2403, lng: 73.1305 } }
    ]
  },
  {
    distKeys: ['IN-MH-NAGPUR', 'IN-MH-DIST-NAGPUR'],
    distNames: ['nagpur'],
    corporations: [
      { corpId: 'IN-MH-NMC', corpName: 'NMC (Nagpur Municipal Corporation)', count: '38 Wards', center: { lat: 21.1458, lng: 79.0882 } }
    ]
  },
  {
    distKeys: ['IN-MH-PUNE', 'IN-MH-DIST-PUNE'],
    distNames: ['pune'],
    corporations: [
      { corpId: 'IN-MH-PMC', corpName: 'PMC (Pune Municipal Corporation)', count: '41 Wards', center: { lat: 18.5204, lng: 73.8567 } },
      { corpId: 'IN-MH-PCMC', corpName: 'PCMC (Pimpri Chinchwad Municipal Corporation)', count: '32 Wards', center: { lat: 18.6298, lng: 73.7997 } }
    ]
  },
  {
    distKeys: ['IN-KA-BENGALURU', 'IN-KA-DIST-BENGALURU', 'IN-KA-DIST-BANGALORE'],
    distNames: ['bengaluru', 'bangalore'],
    corporations: [
      { corpId: 'IN-KA-BBMP', corpName: 'BBMP (Bruhat Bengaluru Mahanagara Palike)', count: '369 Wards', center: { lat: 12.9716, lng: 77.5946 } }
    ]
  },
  {
    distKeys: ['IN-TG-HYDERABAD', 'IN-TG-DIST-HYDERABAD'],
    distNames: ['hyderabad'],
    corporations: [
      { corpId: 'IN-TG-GHMC', corpName: 'GHMC (Greater Hyderabad Municipal Corporation)', count: '155 Wards', center: { lat: 17.3850, lng: 78.4867 } }
    ]
  },
  {
    distKeys: ['IN-TN-CHENNAI', 'IN-TN-DIST-CHENNAI'],
    distNames: ['chennai'],
    corporations: [
      { corpId: 'IN-TN-GCC', corpName: 'GCC (Greater Chennai Corporation)', count: '600 Wards', center: { lat: 13.0418, lng: 80.2341 } }
    ]
  },
  {
    distKeys: [
      'IN-GJ-AHMEDABAD', 'IN-GJ-DIST-AHMEDABAD', 'IN-GJ-AMDAVAD', 'IN-GJ-DIST-AMDAVAD',
      'IN-GJ-AHMADABAD', 'IN-GJ-DIST-AHMADABAD', 'IN-GJ-AMDHAVAD', 'IN-GJ-DIST-AMDHAVAD',
      'IN-GJ-AMEDABAD', 'IN-GJ-DIST-AMEDABAD', 'IN-GJ-AMC', 'IN-GJ-DIST-AMC',
      'IN-GJ-DIST-AHMEDABAD_CITY', 'IN-GJ-DIST-AHMEDABAD_RURAL'
    ],
    distNames: [
      'ahmedabad', 'amdavad', 'ahmadabad', 'amedabad', 'amadavad', 'ahmadavad',
      'amc', 'ahmedabad district', 'ahmadabad district', 'amdavad district',
      'ahmedabad city', 'amdavad city', 'amc municipal corporation'
    ],
    corporations: [
      { corpId: 'IN-GJ-AMC', corpName: 'AMC (Ahmedabad Municipal Corporation)', count: '48 Wards', center: { lat: 23.0225, lng: 72.5714 } }
    ]
  },
  {
    distKeys: ['IN-GJ-BHAVNAGAR', 'IN-GJ-DIST-BHAVNAGAR'],
    distNames: ['bhavnagar'],
    corporations: [
      { corpId: 'IN-GJ-BMC-BHAVNAGAR', corpName: 'BMC (Bhavnagar Municipal Corporation)', count: '13 Wards', center: { lat: 21.7645, lng: 72.1519 } }
    ]
  },
  {
    distKeys: ['IN-AP-VISAKHAPATNAM', 'IN-AP-DIST-VISAKHAPATNAM'],
    distNames: ['visakhapatnam', 'vizag'],
    corporations: [
      { corpId: 'IN-AP-GVMC', corpName: 'GVMC (Greater Visakhapatnam Municipal Corporation)', count: '98 Wards', center: { lat: 17.6868, lng: 83.2185 } }
    ]
  },
  {
    distKeys: ['IN-MP-INDORE', 'IN-MP-DIST-INDORE'],
    distNames: ['indore'],
    corporations: [
      { corpId: 'IN-MP-IMC', corpName: 'IMC (Indore Municipal Corporation)', count: '85 Wards', center: { lat: 22.7196, lng: 75.8577 } }
    ]
  },
  {
    distKeys: ['IN-MP-BHOPAL', 'IN-MP-DIST-BHOPAL'],
    distNames: ['bhopal'],
    corporations: [
      { corpId: 'IN-MP-BMC', corpName: 'BMC (Bhopal Municipal Corporation)', count: '85 Wards', center: { lat: 23.2599, lng: 77.4126 } }
    ]
  },
  {
    distKeys: ['IN-KL-ERNAKULAM', 'IN-KL-DIST-ERNAKULAM', 'IN-KL-COCHIN'],
    distNames: ['ernakulam', 'cochin', 'kochi'],
    corporations: [
      { corpId: 'IN-KL-COCHIN', corpName: 'Cochin Corporation', count: '74 Wards', center: { lat: 9.9312, lng: 76.2673 } }
    ]
  },
  {
    distKeys: ['IN-TN-COIMBATORE', 'IN-TN-DIST-COIMBATORE'],
    distNames: ['coimbatore'],
    corporations: [
      { corpId: 'IN-TN-CMC', corpName: 'CMC (Coimbatore Municipal Corporation)', count: '100 Wards', center: { lat: 11.0168, lng: 76.9558 } }
    ]
  },
  {
    distKeys: ['IN-RJ-JAIPUR', 'IN-RJ-DIST-JAIPUR'],
    distNames: ['jaipur'],
    corporations: [
      { corpId: 'IN-RJ-JMC', corpName: 'JMC (Jaipur Municipal Corporation)', count: '150 Wards', center: { lat: 26.9124, lng: 75.7873 } }
    ]
  },
  {
    distKeys: ['IN-TN-MADURAI', 'IN-TN-DIST-MADURAI'],
    distNames: ['madurai'],
    corporations: [
      { corpId: 'IN-TN-MMC', corpName: 'MMC (Madurai Municipal Corporation)', count: '100 Wards', center: { lat: 9.9252, lng: 78.1198 } }
    ]
  },
  {
    distKeys: ['IN-HR-FARIDABAD', 'IN-HR-DIST-FARIDABAD'],
    distNames: ['faridabad'],
    corporations: [
      { corpId: 'IN-HR-MCF', corpName: 'MCF (Municipal Corporation of Faridabad)', count: '40 Wards', center: { lat: 28.4089, lng: 77.3178 } }
    ]
  },
  {
    distKeys: ['IN-HR-GURUGRAM', 'IN-HR-DIST-GURUGRAM'],
    distNames: ['gurugram', 'gurgaon'],
    corporations: [
      { corpId: 'IN-HR-MCG', corpName: 'MCG (Municipal Corporation of Gurugram)', count: '35 Wards', center: { lat: 28.4595, lng: 77.0266 } }
    ]
  }
];

export function MapBanner({
  currentLevel,
  selectedState,
  selectedUnit,
  onSelectUnit,
  isSidebarCollapsed = true,
  googleMapRef = null,
  isMapReady = false,
}) {
  const [isCorpsExpanded, setIsCorpsExpanded] = useState(true);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    setIsCorpsExpanded(true);
  }, [selectedUnit?.unitId, selectedUnit?.id]);

  const normUnitId = (selectedUnit?.unitId || selectedUnit?.id || '').toUpperCase().replace(/[\s\-_]+/g, '');
  const normUnitName = (selectedUnit?.unitName || selectedUnit?.name || selectedUnit?.districtName || '').toLowerCase();
  const unitLat = selectedUnit?.coordinates?.lat || selectedUnit?.center?.lat;
  const unitLng = selectedUnit?.coordinates?.lng || selectedUnit?.center?.lng;

  const matchedGroup = (selectedUnit && (normUnitId || normUnitName || (typeof unitLat === 'number' && typeof unitLng === 'number'))) ? districtToCorpMap.find(group => {
    // 1. Direct Corporation Match (If selectedUnit is one of the corporations in this group)
    const hasCorpMatch = group.corporations.some(corp => {
      const normCorpId = corp.corpId.toUpperCase().replace(/[\s\-_]+/g, '');
      const cleanCorpName = corp.corpName.toLowerCase();
      return (
        (normUnitId.length > 0 && (normUnitId.includes(normCorpId) || normCorpId.includes(normUnitId))) ||
        (normUnitName.length > 0 && (cleanCorpName.includes(normUnitName) || normUnitName.includes(cleanCorpName)))
      );
    });
    if (hasCorpMatch) return true;

    // 2. Match by District Key
    const hasIdMatch = normUnitId.length > 0 && group.distKeys.some(key => {
      const normKey = key.toUpperCase().replace(/[\s\-_]+/g, '');
      return normUnitId.includes(normKey) || normKey.includes(normUnitId);
    });
    if (hasIdMatch) return true;

    // 3. Match by District Name / Aliases
    const hasNameMatch = normUnitName.length > 0 && group.distNames.some(dName => {
      const cleanDName = dName.toLowerCase();
      return normUnitName.includes(cleanDName) || cleanDName.includes(normUnitName);
    });
    if (hasNameMatch) return true;

    return false;
  }) || (typeof unitLat === 'number' && typeof unitLng === 'number' ? districtToCorpMap.find(group => {
    // 4. Tight Proximity Fallback ONLY if no ID/Name matched (~18 km radius)
    return group.corporations.some(corp => {
      if (!corp.center) return false;
      const dLat = Math.abs(corp.center.lat - unitLat);
      const dLng = Math.abs(corp.center.lng - unitLng);
      return dLat < 0.18 && dLng < 0.18;
    });
  }) : null) : null;

  const matchedCorps = matchedGroup ? matchedGroup.corporations : [];

  const parseCorpInfo = (corp) => {
    const rawName = corp.corpName || '';
    const match = rawName.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return {
        shortCode: match[1].trim(),
        fullName: match[2].trim(),
        count: corp.count || ''
      };
    }
    const parts = rawName.split(' ');
    return {
      shortCode: parts[0] || 'Corp',
      fullName: rawName,
      count: corp.count || ''
    };
  };

  const handleCorpClick = (corp) => {
    if (corp && onSelectUnit) {
      const stId = selectedState?.stateId || selectedUnit?.stateId || (corp.corpId.startsWith('IN-GJ-') ? 'GJ' : 'MH');
      onSelectUnit({
        unitId: corp.corpId,
        id: corp.corpId,
        unitName: corp.corpName,
        unitType: 'MUNICIPAL_CORPORATION',
        parentCityDistrict: `${selectedUnit?.unitName || 'City'}, ${stId}`,
        stateId: stId,
        coordinates: corp.center || selectedUnit?.coordinates
      });
    }
  };

  const hasCorps = matchedCorps.length > 0 && currentLevel !== 'CORPORATION' && currentLevel !== 'WARD';

  // Highlight corporation buttons for 3 seconds when they come on screen
  useEffect(() => {
    if (hasCorps && isCorpsExpanded) {
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsHighlighted(false);
    }
  }, [hasCorps, isCorpsExpanded, selectedUnit?.unitId, selectedUnit?.id]);

  // Collapse corporation dropdown automatically when user moves/drags/pans the map
  useEffect(() => {
    if (!googleMapRef?.current || !isMapReady) return;
    const map = googleMapRef.current;

    const dragListener = map.addListener('dragstart', () => {
      setIsCorpsExpanded(false);
    });

    const dragListener2 = map.addListener('drag', () => {
      setIsCorpsExpanded(false);
    });

    const mapDiv = typeof map.getDiv === 'function' ? map.getDiv() : null;
    let onWheel = null;
    if (mapDiv) {
      onWheel = () => {
        setIsCorpsExpanded(false);
      };
      mapDiv.addEventListener('wheel', onWheel, { passive: true });
    }

    return () => {
      if (window.google?.maps?.event) {
        if (dragListener) window.google.maps.event.removeListener(dragListener);
        if (dragListener2) window.google.maps.event.removeListener(dragListener2);
      }
      if (mapDiv && onWheel) {
        mapDiv.removeEventListener('wheel', onWheel);
      }
    };
  }, [googleMapRef, isMapReady]);

  return (
    <div
      className={`absolute top-3 sm:top-4 inset-x-0 z-10 flex flex-col items-center gap-2 pointer-events-none px-3 transition-all duration-300 ${
        isSidebarCollapsed ? '' : 'lg:pr-[420px]'
      }`}
    >
      {/* Top Banner Pill with Collapsible Dropdown Toggle */}
      <div
        onClick={() => hasCorps && setIsCorpsExpanded(!isCorpsExpanded)}
        className={`pointer-events-auto px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full border border-slate-700/80 light:border-slate-300/90 shadow-2xl backdrop-blur-md bg-slate-950/90 light:bg-white/95 max-w-[94vw] sm:max-w-md md:max-w-lg flex items-center justify-between gap-1.5 sm:gap-2.5 transition-all ${
          hasCorps ? 'cursor-pointer hover:border-red-500/60 light:hover:border-red-500/60 hover:bg-slate-900/95 light:hover:bg-slate-50' : ''
        }`}
        title={hasCorps ? (isCorpsExpanded ? "Click to collapse corporation popups" : "Click to expand corporation popups") : undefined}
      >
        <div className="text-[11px] sm:text-xs md:text-sm font-sans font-semibold text-slate-200 light:text-slate-800 flex items-center justify-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
          <span className="truncate">
            {currentLevel === 'NATIONAL' ? (
              <>
                <span className="sm:hidden">Tap India to view state leadership</span>
                <span className="hidden sm:inline">Click anywhere on India to see state leadership</span>
              </>
            ) : currentLevel === 'STATE' ? (
              <>
                <span className="sm:hidden">{selectedState?.stateName || 'State'} — tap district to inspect</span>
                <span className="hidden sm:inline">{selectedState?.stateName || 'State'} selected — click a district to inspect</span>
              </>
            ) : (
              `${selectedUnit?.unitName || 'Unit'} selected`
            )}
          </span>
        </div>

        {hasCorps && (
          <span className="flex items-center gap-1 text-[10px] sm:text-[10px] md:text-xs font-bold text-red-400 light:text-red-600 bg-red-500/20 light:bg-red-500/10 px-2 sm:px-2 md:px-2.5 py-0.5 sm:py-0.5 rounded-full border border-red-500/40 light:border-red-500/30 ml-1 flex-shrink-0 transition-colors">
            <span>{matchedCorps.length} {matchedCorps.length === 1 ? 'Corp' : 'Corps'}</span>
            {isCorpsExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 light:text-red-600" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 light:text-red-600" />
            )}
          </span>
        )}
      </div>

      {/* Expanded 3-Line Wider Corporation Cards */}
      {hasCorps && isCorpsExpanded && (
        <div className="flex flex-col items-center gap-2 md:gap-2.5 max-w-2xl w-full animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto">
          {matchedCorps.map((corp) => {
            const { shortCode, fullName, count } = parseCorpInfo(corp);
            return (
              <button
                key={corp.corpId}
                onClick={() => handleCorpClick(corp)}
                className={`w-full sm:w-80 md:w-96 max-w-md px-4.5 py-3 sm:px-4 sm:py-2.5 md:px-5 md:py-3.5 rounded-2xl border text-slate-100 light:text-slate-900 hover:text-white light:hover:text-slate-900 hover:bg-slate-900 light:hover:bg-slate-100 shadow-2xl backdrop-blur-xl transition-all duration-500 group cursor-pointer border-t-red-400/80 light:border-t-red-500 flex items-center justify-between gap-3 sm:gap-3.5 text-left hover:border-red-500 hover:shadow-red-950/40 light:hover:shadow-red-500/20 active:scale-[0.98] ${
                  isHighlighted
                    ? 'ring-2 ring-red-500 border-red-500 shadow-[0_0_22px_rgba(239,68,68,0.5)] light:shadow-[0_0_18px_rgba(239,68,68,0.35)] bg-slate-900/95 light:bg-red-50/70 scale-[1.015] sm:scale-100'
                    : 'border-red-500/60 light:border-red-500/40 bg-slate-950/95 light:bg-white/95'
                }`}
              >
                <div className={`w-9 h-9 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${
                  isHighlighted
                    ? 'bg-red-500/30 light:bg-red-500/20 border-red-400 light:border-red-500 text-white'
                    : 'bg-red-500/20 light:bg-red-500/10 border-red-500/40 light:border-red-500/30 group-hover:bg-red-600 light:group-hover:bg-red-600 group-hover:border-red-400'
                }`}>
                  <Layers className={`w-4.5 h-4.5 sm:w-4 sm:h-4 md:w-5 md:h-5 transition-colors ${
                    isHighlighted ? 'text-red-300 light:text-red-600' : 'text-red-400 light:text-red-600 group-hover:text-white'
                  }`} />
                </div>

                <div className="flex-1 flex flex-col min-w-0 font-mono">
                  {/* Line 1: View ShortCode */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[13px] sm:text-xs md:text-sm font-extrabold uppercase tracking-wider truncate transition-colors ${
                      isHighlighted
                        ? 'text-red-400 light:text-red-600'
                        : 'text-red-400 light:text-red-600 group-hover:text-red-300 light:group-hover:text-red-700'
                    }`}>
                      View {shortCode}
                    </span>
                    {isHighlighted && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500 text-white animate-pulse">
                        TAP
                      </span>
                    )}
                  </div>
                  {/* Line 2: Full Corporation Name */}
                  <span className="text-xs sm:text-[11px] md:text-xs font-semibold text-slate-200 light:text-slate-900 group-hover:text-white light:group-hover:text-slate-900 leading-snug mt-0.5 break-words">
                    {fullName}
                  </span>
                  {/* Line 3: Ward Count */}
                  <span className="text-[11px] sm:text-[10px] md:text-[11px] font-medium text-slate-400 light:text-slate-600 group-hover:text-slate-300 light:group-hover:text-slate-700 mt-0.5">
                    ({count})
                  </span>
                </div>

                <ArrowRight className={`w-4.5 h-4.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-400 light:text-red-600 group-hover:text-white light:group-hover:text-red-700 transition-transform flex-shrink-0 ${
                  isHighlighted ? 'translate-x-1' : 'group-hover:translate-x-1'
                }`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

