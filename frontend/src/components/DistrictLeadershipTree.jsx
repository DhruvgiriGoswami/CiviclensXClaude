import React, { useState, useEffect } from 'react';
import {
  Building2, UserCheck, ShieldCheck, ChevronDown, ChevronRight,
  MapPin, Phone, Mail, Award, Star, ExternalLink, Layers, GitFork, Vote, FileCode, Printer, CheckCircle2, Loader2
} from 'lucide-react';

import { governanceApi } from '../services/api';
import { getPersonAvatar } from '../utils/avatarResolver';
import { getLoadedStateDistrictsData } from '../utils/mapHelpers';

export function canonicalDistrictName(name, stateId) {
  if (!name) return "";
  let clean = String(name).trim();

  clean = clean.replace(/,\s*(Gujarat|Karnataka|Maharashtra|Haryana|Tamil Nadu|Telangana|Andhra Pradesh|Madhya Pradesh|Uttar Pradesh|Rajasthan|West Bengal)/gi, "");
  clean = clean.replace(/\s+(Municipal Corporation|MC)$/gi, "");

  if (/bengaluru|bangalore|bbmp/i.test(clean)) {
    if (/rural/i.test(clean)) return "Bengaluru Rural";
    return "Bengaluru Urban";
  }

  if (/ahmedabad|ahmadabad|amdavad|amc/i.test(clean)) {
    return "Ahmedabad";
  }

  if (/brihanmumbai|mumbai city|mumbai suburban|bmc/i.test(clean)) {
    if (/suburban/i.test(clean)) return "Mumbai Suburban";
    return "Brihanmumbai (BMC)";
  }

  if (/pune|pmc|pcmc|pimpri/i.test(clean)) {
    if (/pimpri|pcmc/i.test(clean)) return "Pimpri Chinchwad";
    return "Pune";
  }

  if (/thane|tmc/i.test(clean)) return "Thane";
  if (/bhavnagar/i.test(clean)) return "Bhavnagar";

  clean = clean.replace(/\s*\([^)]*\)/g, "").trim();
  return clean;
}

export function DistrictLeadershipTree({ stateId, stateName, units, onSelectUnit, onSelectDistrict, onHoverDistrict }) {
  const cleanStCode = (stateId || 'MH').replace(/^IN-/, '').split('-')[0].toUpperCase();
  const fullStateId = `IN-${cleanStCode}`;

  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDistKey, setExpandedDistKey] = useState(null);
  const [apiCollectorsMap, setApiCollectorsMap] = useState({});

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Fetch dynamic district boundary features directly from backend API
    getLoadedStateDistrictsData(fullStateId)
      .then((data) => {
        if (!isMounted) return;
        if (data && Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort((a, b) => (a.districtName || '').localeCompare(b.districtName || ''));
          setDistricts(sorted);
        } else {
          setDistricts([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[CivicLens API] Dynamic district fetch error:', err);
        setDistricts([]);
        setLoading(false);
      });

    // Fetch official collector details from API
    governanceApi.getCollectors(cleanStCode)
      .then((list) => {
        if (!isMounted) return;
        const cmap = {};
        (list || []).forEach((item) => {
          const leader = item.leader || {};
          const rawDesignation = item.designation || '';
          const matchedName = rawDesignation.replace(/District Magistrate & Collector \((.*)\)/i, '$1').trim() || leader.name;
          const cDist = canonicalDistrictName(matchedName, cleanStCode);
          cmap[cDist] = {
            collectorName: leader.name,
            title: item.designation,
            phone: item.phone || leader.phone,
            email: item.email || leader.email,
            authority: item.authority_description,
            dataStatus: item.verification_status || 'verified_sep_2026',
          };
        });
        setApiCollectorsMap(cmap);
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [fullStateId, cleanStCode]);

  const toggleNode = (distKey) => {
    setExpandedDistKey(prev => (prev === distKey ? null : distKey));
  };

  // Group registered municipal units under matching district
  const registeredMap = {};
  (units || []).forEach(unit => {
    if (!unit) return;
    const rawDist = unit.parentCityDistrict || `${stateName} Central District`;
    const cDist = canonicalDistrictName(rawDist, cleanStCode);
    if (!registeredMap[cDist]) {
      registeredMap[cDist] = [];
    }
    registeredMap[cDist].push(unit);
  });

  return (
    <div className="bg-slate-900/90 light:bg-slate-100 p-4 rounded-2xl border border-slate-800 light:border-slate-200 space-y-3 font-sans text-xs">

      {/* Tree Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 light:border-slate-200">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-crimson-500" />
          <h4 className="font-bold text-white light:text-slate-900 text-xs tracking-wide">
            {stateName} District Leadership Tree
          </h4>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700">
          {districts.length} District{districts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <p className="text-[10px] font-mono text-slate-400 light:text-slate-600">
        District Collector & District Magistrate (DC/DM - IAS) serves as the primary executive head of each district. Click any district to focus on map.
      </p>

      {/* Tree Nodes List */}
      <div className="space-y-3 mt-3">
        {loading ? (
          <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-crimson-500 animate-spin" />
            <span className="text-[10px] font-mono">Loading API District Boundaries...</span>
          </div>
        ) : districts.length > 0 ? (
          districts.map((dist) => {
            const distName = dist.districtName || dist.name || dist.districtId || 'District';
            const distIdKey = dist.districtId || dist.id || distName;
            const distUnitId = dist.rawUnitId || `IN-${cleanStCode}-DIST-${distIdKey.toUpperCase().replace(/[\s\-_]+/g, '')}`;
            const isExpanded = expandedDistKey === distIdKey;

            // Registered units for district
            const registeredUnits = registeredMap[canonicalDistrictName(distName, cleanStCode)] || registeredMap[distName] || [];
            const hasRegisteredUnits = registeredUnits && registeredUnits.length > 0;
            const primaryUnit = hasRegisteredUnits ? registeredUnits[0] : null;

            // Check if official Collector exists in API map
            const collectorInfo = apiCollectorsMap[canonicalDistrictName(distName, cleanStCode)] || apiCollectorsMap[distName] || null;

            const dcName = collectorInfo?.collectorName || primaryUnit?.administrativeSpender?.name || `District Collector & Magistrate`;
            const dcTitle = collectorInfo?.title || primaryUnit?.administrativeSpender?.title || `District Collector & District Magistrate (DC/DM)`;
            // Never invent contact details: a made-up number or address sends citizens nowhere.
            const dcPhone = collectorInfo?.phone || primaryUnit?.administrativeSpender?.phone || 'Not available';
            const dcFax = collectorInfo?.fax || null;
            const dcEmail = collectorInfo?.email || primaryUnit?.administrativeSpender?.email || 'Not available';
            const dcAuthority = collectorInfo?.authority || primaryUnit?.administrativeSpender?.authority || `Holds District Executive & Financial Sign-Off Authority for ${distName} District.`;
            const isVerifiedSource = collectorInfo?.dataStatus === 'verified_from_current_government_source';

            const districtUnitPayload = {
              unitId: distUnitId,
              id: distUnitId,
              unitName: `${distName} District`,
              districtName: distName,
              unitType: 'DISTRICT',
              stateId: cleanStCode,
              polygons: dist.polygons,
            };

            return (
              <div
                key={distIdKey}
                onMouseEnter={() => onHoverDistrict && onHoverDistrict(distName)}
                onMouseLeave={() => onHoverDistrict && onHoverDistrict(null)}
                className="rounded-xl border border-slate-800 light:border-slate-300 bg-slate-950/80 light:bg-white overflow-hidden shadow-sm transition-all group hover:border-crimson-500/60"
              >
                {/* District Level Header Button */}
                <div className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-900 light:hover:bg-slate-50 transition-colors">
                  <div
                    className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectDistrict) {
                        onSelectDistrict(distName, cleanStCode, districtUnitPayload);
                      } else if (onSelectUnit) {
                        onSelectUnit(districtUnitPayload);
                      }
                    }}
                  >
                    <Building2 className="w-4 h-4 text-emerald-400 group-hover:text-crimson-400 flex-shrink-0 transition-colors" />
                    <span className="font-bold text-white light:text-slate-900 text-xs truncate group-hover:text-crimson-400 transition-colors">
                      {distName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {isVerifiedSource ? (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 light:text-emerald-700 border border-emerald-500/30 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Official DC/DM Verified
                      </span>
                    ) : hasRegisteredUnits ? (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-crimson-500/20 text-crimson-400 light:text-crimson-700 border border-crimson-500/30 font-bold">
                        {registeredUnits.length} Registered Unit{registeredUnits.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 light:bg-slate-200 light:text-slate-700 border border-slate-700 font-bold flex items-center gap-1">
                        <FileCode className="w-2.5 h-2.5" />
                        District
                      </span>
                    )}

                    <button
                      onClick={() => toggleNode(distIdKey)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 ml-1 transition-colors"
                      title="Toggle DC/DM IAS Details"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-crimson-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Tree Body */}
                {isExpanded && (
                  <div className="p-3 border-t border-slate-800/80 light:border-slate-200 bg-slate-900/40 light:bg-slate-50/50 space-y-3 pl-3 border-l-2 border-l-emerald-500/60 ml-2">

                    {/* PRIMARY DISTRICT HEAD: District Collector & District Magistrate (DC/DM - IAS) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 light:text-emerald-700">
                            District Executive Head (DC / DM)
                          </span>
                        </div>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          IAS Officer
                        </span>
                      </div>

                      <div className="glass-card light:bg-white light:border-slate-200 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
                        <div className="flex items-start space-x-3">
                          <img
                            src={getPersonAvatar({ name: dcName, title: dcTitle, personType: 'BUREAUCRAT' })}
                            alt={dcName}
                            onError={(e) => {
                              e.target.src = '/PartyImages/India.jpg';
                            }}
                            className="w-11 h-11 rounded-lg object-cover border-2 border-emerald-500/40 shadow flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <h5 className="font-extrabold text-white light:text-slate-900 text-xs leading-snug">{dcName}</h5>
                            <p className="text-[10px] text-slate-300 light:text-slate-700 font-mono font-medium leading-snug">
                              {dcTitle}
                            </p>
                            <p className="text-[9px] text-slate-400 light:text-slate-600 italic leading-relaxed pt-0.5">
                              "{dcAuthority}"
                            </p>
                          </div>
                        </div>

                        {/* Contact info bar */}
                        <div className="pt-2 border-t border-slate-800/80 light:border-slate-200 space-y-1 text-[10px] font-mono">
                          <div className="flex items-center justify-between text-slate-300 light:text-slate-700 gap-2">
                            <span className="flex items-center gap-1 text-slate-400 light:text-slate-600 flex-shrink-0">
                              <Phone className="w-3 h-3 text-emerald-400" /> Phone:
                            </span>
                            <strong className="text-white light:text-slate-900 truncate">{dcPhone}</strong>
                          </div>

                          {dcFax && (
                            <div className="flex items-center justify-between text-slate-300 light:text-slate-700 gap-2">
                              <span className="flex items-center gap-1 text-slate-400 light:text-slate-600 flex-shrink-0">
                                <Printer className="w-3 h-3 text-amber-400" /> Fax:
                              </span>
                              <strong className="text-amber-400 light:text-amber-700 truncate">{dcFax}</strong>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-slate-300 light:text-slate-700 gap-2">
                            <span className="flex items-center gap-1 text-slate-400 light:text-slate-600 flex-shrink-0">
                              <Mail className="w-3 h-3 text-crimson-400" /> Email:
                            </span>
                            <strong className="text-crimson-400 light:text-crimson-700 truncate break-all">{dcEmail}</strong>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Registered Municipal Wards (if present) */}
                    {hasRegisteredUnits && (
                      <div className="pt-1">
                        <span className="text-[9px] uppercase font-mono text-slate-500 light:text-slate-600 block font-bold mb-1">
                          Registered Municipal Wards ({registeredUnits.length} Total):
                        </span>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {registeredUnits.map(u => (
                            <button
                              key={u.unitId}
                              onClick={() => onSelectUnit && onSelectUnit(u)}
                              className="w-full p-2 rounded-lg bg-slate-950 light:bg-white hover:bg-crimson-600/20 border border-slate-800 light:border-slate-200 hover:border-crimson-500/40 text-slate-200 light:text-slate-800 hover:text-white transition-all text-left flex items-center justify-between group text-[11px]"
                            >
                              <span className="font-bold truncate group-hover:text-crimson-500">{u.unitName}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-crimson-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-[11px] text-slate-400 italic p-2 text-center">
            No district units found for {stateName}.
          </div>
        )}
      </div>

    </div>
  );
}
