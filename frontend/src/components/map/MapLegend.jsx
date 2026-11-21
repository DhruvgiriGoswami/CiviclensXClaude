import React from 'react';
import { Layers } from 'lucide-react';

export function MapLegend({ selectedUnit, selectedState }) {
  const unitId = selectedUnit?.unitId || '';
  const unitName = (selectedUnit?.unitName || selectedUnit?.name || selectedUnit?.districtName || '').toLowerCase();
  const parentCityDistrict = (selectedUnit?.parentCityDistrict || '').toLowerCase();

  const isBengaluru = unitId.includes('BBMP') || 
                      unitId.includes('BENGALURU') || 
                      unitId.includes('BANGALORE') || 
                      unitName.includes('bengaluru') || 
                      unitName.includes('bangalore') ||
                      parentCityDistrict.includes('bengaluru') ||
                      parentCityDistrict.includes('bangalore');

  if (!isBengaluru) return null;

  return (
    <div className="absolute top-4 right-3 sm:right-4 z-20 glass-card p-2.5 sm:p-3 rounded-2xl border border-slate-800 light:border-slate-200 bg-slate-900/90 light:bg-white/95 backdrop-blur-md shadow-xl text-xs font-mono space-y-2 max-w-[200px] sm:max-w-[260px]">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 light:border-slate-200">
        <span className="font-bold text-white light:text-slate-900 flex items-center gap-1.5 text-[11px]">
          <Layers className="w-3.5 h-3.5 text-crimson-500" />
          Layers
        </span>
      </div>
      <div className="space-y-1.5 pt-0.5 text-[11px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-sm bg-[#3B82F6] flex-shrink-0 shadow-sm"></span>
            <span className="text-slate-200 light:text-slate-800 font-medium truncate">Bengaluru North</span>
          </div>
          <span className="text-slate-400 light:text-slate-500 font-mono text-[10px]">72 wards</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-sm bg-[#10B981] flex-shrink-0 shadow-sm"></span>
            <span className="text-slate-200 light:text-slate-800 font-medium truncate">Bengaluru South</span>
          </div>
          <span className="text-slate-400 light:text-slate-500 font-mono text-[10px]">72 wards</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-sm bg-[#EF4444] flex-shrink-0 shadow-sm"></span>
            <span className="text-slate-200 light:text-slate-800 font-medium truncate">Bengaluru East</span>
          </div>
          <span className="text-slate-400 light:text-slate-500 font-mono text-[10px]">50 wards</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-sm bg-[#F59E0B] flex-shrink-0 shadow-sm"></span>
            <span className="text-slate-200 light:text-slate-800 font-medium truncate">Bengaluru West</span>
          </div>
          <span className="text-slate-400 light:text-slate-500 font-mono text-[10px]">112 wards</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-sm bg-[#8B5CF6] flex-shrink-0 shadow-sm"></span>
            <span className="text-slate-200 light:text-slate-800 font-medium truncate">Bengaluru Central</span>
          </div>
          <span className="text-slate-400 light:text-slate-500 font-mono text-[10px]">63 wards</span>
        </div>
      </div>
    </div>
  );
}
