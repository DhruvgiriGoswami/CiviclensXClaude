import React, { useState, useEffect } from 'react';
import { Award, Shield, UserCheck, Star, Sparkles, Building, ChevronRight, Mail } from 'lucide-react';
import { governanceApi } from '../services/api';

export function NationalSpotlight({ onSelectState, onOpenNationalLeaders }) {
  const [statesList, setStatesList] = useState([]);

  useEffect(() => {
    governanceApi.getStatesLeadership()
      .then(res => setStatesList(res || []))
      .catch(err => console.warn('State list fetch info:', err.message));
  }, []);

  const prez = {
    name: "Droupadi Murmu",
    title: "President of India",
    role: "Head of State & Commander-in-Chief",
    photo: "/leader_images/droupadi_murmu.jpg",
    authoritySummary: "Supreme Commander of Indian Armed Forces & Custodian of the Constitution of India.",
  };

  const pm = {
    name: "Narendra Modi",
    title: "Prime Minister of India",
    role: "Head of Union Government & Cabinet Chair",
    photo: "/leader_images/narendra_modi.jpg",
    authoritySummary: "Leads the Union Cabinet, directs national policy, and oversees major central developmental programs.",
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Banner */}
      <div className="glass-panel-crimson light:bg-crimson-50 light:border-crimson-200 p-4 rounded-2xl border border-crimson-500/40 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-crimson-500/20 light:bg-crimson-100 text-crimson-400 light:text-crimson-700 border border-crimson-500/40">
            <Sparkles className="w-3 h-3 inline mr-1 animate-spin" style={{ animationDuration: '4s' }} />
            Pan-India Macro Governance (Level 1)
          </span>
          <button
            onClick={onOpenNationalLeaders}
            className="text-[10px] font-mono text-crimson-400 light:text-crimson-700 hover:underline flex items-center gap-0.5 font-bold"
          >
            <span>View All 5 Union Heads</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <h3 className="text-sm font-bold text-white light:text-slate-900 font-sans">National Leadership Spotlight</h3>
        <p className="text-[11px] text-slate-300 light:text-slate-700 font-mono mt-0.5">Constitutional Head of State & Executive Head of Union Cabinet</p>
      </div>

      {/* President & PM Cards Grid */}
      <div className="grid grid-cols-1 gap-3 font-sans">

        {/* Prime Minister Narendra Modi Card */}
        <div className="glass-card light:bg-white light:border-slate-200 p-4 rounded-2xl border border-slate-800 hover:border-crimson-500/50 transition-all space-y-3 group shadow-sm">
          <div className="flex items-start space-x-3">
            <img
              src={pm.photo}
              alt={pm.name}
              onError={(e) => { e.target.src = '/PartyImages/India.jpg'; }}
              className="w-16 h-16 rounded-xl object-cover border-2 border-crimson-500/60 shadow-lg group-hover:scale-105 transition-transform"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-crimson-500/20 light:bg-crimson-100 text-crimson-400 light:text-crimson-800 border border-crimson-500/30">
                {pm.title}
              </span>
              <h4 className="text-sm font-bold text-white light:text-slate-900 mt-1 group-hover:text-crimson-600 transition-colors">{pm.name}</h4>
              <p className="text-[10px] text-slate-400 light:text-slate-600 font-mono">{pm.role}</p>
            </div>
          </div>

          <div className="bg-slate-900/90 light:bg-slate-100 p-2.5 rounded-xl border border-slate-800 light:border-slate-200 text-[11px] text-slate-300 light:text-slate-800 space-y-1">
            <span className="text-[9px] font-mono uppercase text-slate-500 light:text-slate-600 block font-bold">Union Executive Power:</span>
            <p className="line-clamp-2 leading-relaxed font-medium">{pm.authoritySummary}</p>
          </div>
        </div>

        {/* President Droupadi Murmu Card */}
        <div className="glass-card light:bg-white light:border-slate-200 p-4 rounded-2xl border border-slate-800 hover:border-crimson-500/50 transition-all space-y-3 group shadow-sm">
          <div className="flex items-start space-x-3">
            <img
              src={prez.photo}
              alt={prez.name}
              onError={(e) => { e.target.src = '/PartyImages/India.jpg'; }}
              className="w-16 h-16 rounded-xl object-cover border-2 border-slate-700 light:border-slate-300 shadow-lg group-hover:scale-105 transition-transform"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-800 border border-slate-700">
                {prez.title}
              </span>
              <h4 className="text-sm font-bold text-white light:text-slate-900 mt-1 group-hover:text-crimson-600 transition-colors">{prez.name}</h4>
              <p className="text-[10px] text-slate-400 light:text-slate-600 font-mono">{prez.role}</p>
            </div>
          </div>

          <div className="bg-slate-900/90 light:bg-slate-100 p-2.5 rounded-xl border border-slate-800 light:border-slate-200 text-[11px] text-slate-300 light:text-slate-800 space-y-1">
            <span className="text-[9px] font-mono uppercase text-slate-500 light:text-slate-600 block font-bold">Constitutional Power:</span>
            <p className="line-clamp-2 leading-relaxed font-medium">{prez.authoritySummary}</p>
          </div>
        </div>

      </div>

      {/* Quick State Selection Helper */}
      <div className="bg-slate-900/90 light:bg-slate-100 p-3 rounded-2xl border border-slate-800 light:border-slate-200 text-xs font-mono">
        <div className="text-[10px] uppercase text-slate-400 light:text-slate-600 font-bold mb-2 flex items-center justify-between">
          <span>Click any State to view Chief Minister & Wards:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {statesList.slice(0, 4).map((st) => (
            <button
              key={st.state_id}
              onClick={() => onSelectState({ stateId: st.state_id, stateName: st.state_name, cmName: st.leader?.name })}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 light:bg-white hover:bg-crimson-600 text-slate-200 light:text-slate-800 hover:text-white text-[11px] transition-colors text-left font-sans flex items-center justify-between border border-slate-800 light:border-slate-200 shadow-sm font-medium"
            >
              <span>{st.state_name}</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
