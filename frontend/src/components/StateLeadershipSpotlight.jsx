import React, { useState, useEffect } from 'react';
import { Building, Shield, UserCheck, Star, Award, ChevronRight, Mail, Phone } from 'lucide-react';
import { governanceApi } from '../services/api';
import { DistrictLeadershipTree } from './DistrictLeadershipTree';
import { getPersonAvatar } from '../utils/avatarResolver';
import { normalizeParty } from '../utils/partyNormalizer';
import { onRecord, NotOnRecord } from './NotOnRecord';

export function StateLeadershipSpotlight({ selectedState, onSelectUnit, units, onHoverDistrict, onSelectDistrict }) {
  const rawStateId = selectedState?.stateId || 'MH';
  let stateId = rawStateId.replace(/^IN-/, '');
  if (stateId.includes('-')) {
    stateId = stateId.split('-')[0];
  }
  const [apiCM, setApiCM] = useState(null);

  useEffect(() => {
    governanceApi.getStateLeadership(stateId)
      .then(res => setApiCM(res))
      .catch(() => setApiCM(null));
  }, [stateId]);

  const stateName = apiCM?.state_name || selectedState?.stateName || 'State';

  const cmName = onRecord(selectedState?.cmName || apiCM?.leader?.name, 'Chief Minister');
  const cmParty = onRecord(selectedState?.party || apiCM?.party_name) || '';
  const cmPhoto = getPersonAvatar({ name: cmName, party: cmParty, stateId: stateId, photo: selectedState?.photo || apiCM?.leader?.photo_url, isChiefMinister: true }, 'POLITICIAN');
  const cmEmail = onRecord(apiCM?.leader?.email);

  // No source for these yet, so they render as missing rather than as their own labels.
  const governorName = onRecord(apiCM?.governor?.name, 'Governor');
  const chiefSecretaryName = onRecord(apiCM?.chief_secretary?.name, 'Chief Secretary (IAS)');
  const deputyCMs = [];

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* State Top Banner */}
      <div className="glass-panel-crimson light:bg-crimson-50 light:border-crimson-200 p-4 rounded-2xl border border-crimson-500/40 relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-crimson-500/20 text-crimson-400 light:text-crimson-800 border border-crimson-500/40">
            {stateName} Executive Cabinet
          </span>
        </div>
        <h3 className="text-lg font-bold text-white light:text-slate-900 font-sans">{stateName} Executive Directory</h3>
        <p className="text-xs text-slate-300 light:text-slate-700">Constitutional Governor, Chief Minister & State Administration</p>
      </div>

      {/* Chief Minister & Cabinet Cards */}
      <div className="space-y-3 font-sans">

        {/* Chief Minister Card */}
        <div className="glass-card light:bg-white light:border-slate-200 p-4 rounded-2xl border border-slate-800 hover:border-crimson-500/50 transition-all space-y-3 group shadow-sm">
          <div className="flex items-start space-x-3">
            <img
              src={cmPhoto}
              alt={cmName || 'Chief Minister'}
              onError={(e) => { e.target.src = getPersonAvatar({ party: cmParty }, 'POLITICIAN'); }}
              className="w-16 h-16 rounded-xl object-cover border-2 border-crimson-500/60 shadow-lg group-hover:scale-105 transition-transform"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-crimson-500/20 light:bg-crimson-100 text-crimson-400 light:text-crimson-800 border border-crimson-500/30">
                Chief Minister
              </span>
              <h4 className="text-sm font-bold text-white light:text-slate-900 mt-1">{cmName || <NotOnRecord />}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-slate-400 light:text-slate-600 truncate">{cmParty}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 light:border-slate-200">
            <span className="text-slate-400 light:text-slate-600 font-medium">Email: {cmEmail ? <a href={`mailto:${cmEmail}`} className="font-semibold text-slate-200 light:text-slate-900 underline">{cmEmail}</a> : <NotOnRecord />}</span>
          </div>
        </div>

        {/* Deputy Chief Ministers List */}
        {deputyCMs.map((dep, idx) => (
          <div key={idx} className="glass-card light:bg-white light:border-slate-200 p-3 rounded-xl border border-slate-800 flex items-center space-x-3 shadow-sm">
            <img
              src={getPersonAvatar(dep, 'POLITICIAN')}
              alt={dep.name}
              onError={(e) => { e.target.src = '/PartyImages/India.jpg'; }}
              className="w-12 h-12 rounded-xl object-cover border border-slate-700 light:border-slate-300"
            />
            <div className="flex-1 min-w-0 font-sans">
              <span className="text-xs font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-800">
                Deputy Chief Minister
              </span>
              <h5 className="text-xs font-bold text-white light:text-slate-900 truncate mt-0.5">{dep.name}</h5>
              <p className="text-xs text-slate-400 light:text-slate-600 truncate">{dep.title}</p>
            </div>
          </div>
        ))}

        {/* Governor & Chief Secretary Row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/90 light:bg-slate-100 p-2.5 rounded-xl border border-slate-800 light:border-slate-200">
            <span className="text-xs uppercase text-slate-500 light:text-slate-600 block font-bold">Governor</span>
            <span className="text-slate-200 light:text-slate-900 font-bold block truncate">{governorName || <NotOnRecord />}</span>
          </div>
          <div className="bg-slate-900/90 light:bg-slate-100 p-2.5 rounded-xl border border-slate-800 light:border-slate-200">
            <span className="text-xs uppercase text-slate-500 light:text-slate-600 block font-bold">Chief Secretary (IAS)</span>
            <span className="text-slate-200 light:text-slate-900 font-bold block truncate">{chiefSecretaryName || <NotOnRecord />}</span>
          </div>
        </div>

      </div>

      {/* State Districts & MLAs Tree View */}
      <DistrictLeadershipTree
        stateId={stateId}
        stateName={stateName}
        units={units}
        onSelectUnit={onSelectUnit}
        onHoverDistrict={onHoverDistrict}
        onSelectDistrict={onSelectDistrict}
      />

    </div>
  );
}
