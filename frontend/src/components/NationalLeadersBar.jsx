import React, { useState, useEffect } from 'react';
import { useDialog } from '../hooks/useDialog';
import { X, Award, Shield, UserCheck, ChevronRight, Star, ExternalLink, Activity, Sparkles, Building2, MapPin, MessageSquare, ThumbsUp } from 'lucide-react';
import { governanceApi, authorityApi } from '../services/api';
import { getPersonAvatar } from '../utils/avatarResolver';
import { normalizeParty } from '../utils/partyNormalizer';

const DEFAULT_NATIONAL_LEADERS = [
  {
    id: "prez",
    title: "President of India",
    name: "Droupadi Murmu",
    role: "Head of State & Commander-in-Chief",
    photo: "/leader_images/droupadi_murmu.jpg",
    jurisdiction: "Republic of India",
    authoritySummary: "Supreme Commander of Indian Armed Forces & Custodian of the Constitution of India.",
    office: "Rashtrapati Bhavan, New Delhi - 110004",
    email: "presidentofindia@rb.nic.in",
    phone: "+91-11-2301-5321",
  },
  {
    id: "pm",
    title: "Prime Minister of India",
    name: "Narendra Modi",
    role: "Head of Union Government & Cabinet Chair",
    photo: "/leader_images/narendra_modi.jpg",
    jurisdiction: "Republic of India",
    authoritySummary: "Leads the Union Cabinet, directs national policy, and oversees major central developmental programs.",
    office: "7, Lok Kalyan Marg, New Delhi - 110011",
    email: "connect@pmindia.gov.in",
    phone: "+91-11-2301-2312",
  },
  {
    id: "fm",
    title: "Union Minister of Finance",
    name: "Nirmala Sitharaman",
    role: "Union Minister of Finance & Corporate Affairs",
    photo: "/leader_images/nirmala-sitharaman_FinanceMinister.jpg",
    jurisdiction: "Republic of India",
    authoritySummary: "Formulates national fiscal policy, oversees the Union Budget, and directs economic & tax administration.",
    office: "North Block, Cabinet Secretariat, New Delhi - 110001",
    email: "appointment.fm@gov.in",
    phone: "+91-11-2309-3289",
  },
  {
    id: "cag",
    title: "Comptroller & Auditor General",
    name: "Shri K. Sanjay Murthy",
    role: "Comptroller & Auditor General of India",
    photo: "/leader_images/KSanjayMurthi_CAG.png",
    jurisdiction: "Republic of India",
    authoritySummary: "Head of Supreme Audit Institution of India & Custodian of Union and State Government Accounts.",
    office: "9, Deen Dayal Upadhyaya Marg, New Delhi - 110124",
    email: "cag@cag.gov.in",
    phone: "+91-11-2323-5797",
  },
  {
    id: "rbi",
    title: "Governor, Reserve Bank of India",
    name: "Shri Sanjay Malhotra",
    role: "Governor, Reserve Bank of India",
    photo: "/leader_images/Sanjay_Malhotra_RBI.jpg",
    jurisdiction: "Republic of India",
    authoritySummary: "Head of central banking authority, regulator of monetary policy & issuer of Indian Rupee.",
    office: "Central Office Building, Shahid Bhagat Singh Marg, Mumbai - 400001",
    email: "governor@rbi.org.in",
    phone: "+91-22-2266-0500",
  }
];

const UT_STATE_IDS = new Set(['AN', 'CH', 'DN', 'DH', 'DD', 'DL', 'JK', 'LA', 'LD', 'PY']);

const DEFAULT_STATES_AND_UTS = [
  // 28 STATES
  { stateId: 'AP', stateName: 'Andhra Pradesh', cmName: 'N. Chandrababu Naidu', party: 'TDP', capital: 'Amaravati', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/N_Chandrababu_Naidu_Andhra_Pradesh.webp', budget: '₹3,32,205 Cr (FY 2026-27)' },
  { stateId: 'AR', stateName: 'Arunachal Pradesh', cmName: 'Pema Khandu', party: 'BJP', capital: 'Itanagar', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Pema_Khandu_Arunachal_Pradesh.webp', budget: '₹36,607 Cr (FY 2026-27)' },
  { stateId: 'AS', stateName: 'Assam', cmName: 'Himanta Biswa Sarma', party: 'BJP', capital: 'Dispur', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Himanta_Biswa_Sarma_Assam.webp', budget: '₹1,55,985 Cr (FY 2025-26)' },
  { stateId: 'BR', stateName: 'Bihar', cmName: 'Samrat Choudhary', party: 'BJP', capital: 'Patna', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Samrat_Choudhary_Bihar.webp', budget: '₹3,47,589 Cr (FY 2026-27)' },
  { stateId: 'CG', stateName: 'Chhattisgarh', cmName: 'Vishnu Deo Sai', party: 'BJP', capital: 'Raipur', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Vishnu_Deo_Sai_Chhattisgarh.webp', budget: '₹1,72,000 Cr (FY 2026-27)' },
  { stateId: 'GA', stateName: 'Goa', cmName: 'Pramod Sawant', party: 'BJP', capital: 'Panaji', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Pramod_Sawant_Goa.webp', budget: '₹30,195 Cr (FY 2026-27)' },
  { stateId: 'GJ', stateName: 'Gujarat', cmName: 'Bhupendra Patel', party: 'BJP', capital: 'Gandhinagar', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Bhupendra_Patel_Gujarat.webp', budget: '₹4,08,053 Cr (FY 2026-27)' },
  { stateId: 'HR', stateName: 'Haryana', cmName: 'Nayab Singh Saini', party: 'BJP', capital: 'Chandigarh', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Nayab_Singh_Saini_Haryana.jpg', budget: '₹2,23,658 Cr (FY 2026-27)' },
  { stateId: 'HP', stateName: 'Himachal Pradesh', cmName: 'Sukhvinder Singh Sukhu', party: 'INC', capital: 'Shimla', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Sukhvinder_Singh_Sukhu_Himachal_Pradesh.jpg', budget: '₹54,928 Cr (FY 2026-27)' },
  { stateId: 'JH', stateName: 'Jharkhand', cmName: 'Hemant Soren', party: 'JMM', capital: 'Ranchi', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Hemant_Soren_Jharkhand.png', budget: '₹1,50,106 Cr (FY 2026-27)' },
  { stateId: 'KA', stateName: 'Karnataka', cmName: 'D.K. Shivakumar', party: 'INC', capital: 'Bengaluru', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/DK_Shivakumar_Karnataka.png', budget: '₹4,48,004 Cr (FY 2026-27)' },
  { stateId: 'KL', stateName: 'Kerala', cmName: 'V. D. Satheesan', party: 'INC', capital: 'Thiruvananthapuram', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/VD_Satheesan_Kerala.png', budget: '₹3,13,543 Cr (FY 2025-26)' },
  { stateId: 'MP', stateName: 'Madhya Pradesh', cmName: 'Mohan Yadav', party: 'BJP', capital: 'Bhopal', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Mohan_Yadav_Madhya_Pradesh.jpg', budget: '₹4,38,317 Cr (FY 2026-27)' },
  { stateId: 'MH', stateName: 'Maharashtra', cmName: 'Devendra Fadnavis', party: 'BJP', capital: 'Mumbai', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Devendra_Fadnavis_Maharashtra.png', budget: '₹7,69,467 Cr (FY 2026-27)' },
  { stateId: 'MN', stateName: 'Manipur', cmName: 'Yumnam Khemchand Singh', party: 'BJP', capital: 'Imphal', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Yumnam_Khemchand_Singh_Manipur.jpg', budget: '₹32,339 Cr (FY 2026-27)' },
  { stateId: 'ML', stateName: 'Meghalaya', cmName: 'Conrad Kongkal Sangma', party: 'NPP', capital: 'Shillong', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Conrad_Kongkal_Sangma_Meghalaya.jpg', budget: '₹32,023 Cr (FY 2026-27)' },
  { stateId: 'MZ', stateName: 'Mizoram', cmName: 'Lalduhoma', party: 'ZPM', capital: 'Aizawl', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Lalduhoma_Mizoram.jpg', budget: '₹17,469 Cr (FY 2026-27)' },
  { stateId: 'NL', stateName: 'Nagaland', cmName: 'Neiphiu Rio', party: 'NDPP', capital: 'Kohima', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Neiphiu_Rio_Nagaland.jpg', budget: '₹24,699 Cr (FY 2025-26)' },
  { stateId: 'OD', stateName: 'Odisha', cmName: 'Mohan Charan Majhi', party: 'BJP', capital: 'Bhubaneswar', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Mohan_Charan_Majhi_Odisha.jpg', budget: '₹3,10,000 Cr (FY 2026-27)' },
  { stateId: 'PB', stateName: 'Punjab', cmName: 'Bhagwant Singh Mann', party: 'AAP', capital: 'Chandigarh', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Bhagwant_Singh_Mann_Punjab.jpg', budget: '₹2,60,437 Cr (FY 2026-27)' },
  { stateId: 'RJ', stateName: 'Rajasthan', cmName: 'Bhajan Lal Sharma', party: 'BJP', capital: 'Jaipur', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Bhajan_Lal_Sharma_Rajasthan.jpg', budget: '₹6,10,956 Cr (FY 2026-27)' },
  { stateId: 'SK', stateName: 'Sikkim', cmName: 'Prem Singh Tamang', party: 'SKM', capital: 'Gangtok', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Prem_Singh_Tamang_Sikkim.jpg', budget: '₹16,196 Cr (FY 2025-26)' },
  { stateId: 'TN', stateName: 'Tamil Nadu', cmName: 'C. Joseph Vijay', party: 'TVK', capital: 'Chennai', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/C_Joseph_Vijay_Tamil_Nadu.png', budget: '₹4,86,332 Cr (FY 2025-26)' },
  { stateId: 'TG', stateName: 'Telangana', cmName: 'A. Revanth Reddy', party: 'INC', capital: 'Hyderabad', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/A_Revanth_Reddy_Telangana.jpg', budget: '₹3,24,324 Cr (FY 2026-27)' },
  { stateId: 'TR', stateName: 'Tripura', cmName: 'Manik Saha', party: 'BJP', capital: 'Agartala', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Manik_Saha_Tripura.jpg', budget: '₹34,212 Cr (FY 2026-27)' },
  { stateId: 'UP', stateName: 'Uttar Pradesh', cmName: 'Yogi Adityanath', party: 'BJP', capital: 'Lucknow', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Yogi_Adityanath_Uttar_Pradesh.jpg', budget: '₹9,12,696 Cr (FY 2026-27)' },
  { stateId: 'UK', stateName: 'Uttarakhand', cmName: 'Pushkar Singh Dhami', party: 'BJP', capital: 'Dehradun', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Pushkar_Singh_Dhami_Uttarakhand.jpg', budget: '₹1,11,703 Cr (FY 2026-27)' },
  { stateId: 'WB', stateName: 'West Bengal', cmName: 'Suvendu Adhikari', party: 'BJP', capital: 'Kolkata', type: 'STATE', headTitle: 'Chief Minister', photo: '/leader_images/Suvendu_Adhikari_West_Bengal.png', budget: '₹4,06,000 Cr (FY 2026-27)' },

  // 8 UNION TERRITORIES
  { stateId: 'AN', stateName: 'Andaman & Nicobar Islands', cmName: 'Adm. D. K. Joshi', party: 'Independent', capital: 'Port Blair', type: 'UNION_TERRITORY', headTitle: 'Lieutenant Governor', budget: 'UT Central Allocation' },
  { stateId: 'CH', stateName: 'Chandigarh', cmName: 'Gulab Chand Kataria', party: 'Independent', capital: 'Chandigarh', type: 'UNION_TERRITORY', headTitle: 'Administrator', budget: 'UT Central Allocation' },
  { stateId: 'DN', stateName: 'Dadra & Nagar Haveli and Daman & Diu', cmName: 'Praful Patel', party: 'Independent', capital: 'Daman', type: 'UNION_TERRITORY', headTitle: 'Administrator', budget: 'UT Central Allocation' },
  { stateId: 'DL', stateName: 'Delhi (NCT)', cmName: 'Rekha Gupta', party: 'BJP', capital: 'New Delhi', type: 'UNION_TERRITORY', headTitle: 'Chief Minister', photo: '/leader_images/Rekha_Gupta_Delhi.webp', budget: '₹1,00,000 Cr (FY 2025-26)' },
  { stateId: 'JK', stateName: 'Jammu & Kashmir', cmName: 'Omar Abdullah', party: 'JKNC', capital: 'Srinagar / Jammu', type: 'UNION_TERRITORY', headTitle: 'Chief Minister', photo: '/leader_images/Omar_Abdullah_Jammu_and_Kashmir.jpg', budget: '₹1,27,767 Cr (FY 2026-27)' },
  { stateId: 'LA', stateName: 'Ladakh', cmName: 'Brig. (Dr.) B. D. Mishra', party: 'Independent', capital: 'Leh', type: 'UNION_TERRITORY', headTitle: 'Lieutenant Governor', budget: 'UT Central Allocation' },
  { stateId: 'LD', stateName: 'Lakshadweep', cmName: 'Praful Patel', party: 'Independent', capital: 'Kavaratti', type: 'UNION_TERRITORY', headTitle: 'Administrator', budget: 'UT Central Allocation' },
  { stateId: 'PY', stateName: 'Puducherry', cmName: 'N. Rangaswamy', party: 'AINRC', capital: 'Puducherry', type: 'UNION_TERRITORY', headTitle: 'Chief Minister', photo: '/leader_images/N_Rangaswamy_Puducherry.jpg', budget: '₹11,600 Cr (FY 2025-26)' }
];

export function NationalLeadersBar({ isOpen, onClose, onSelectState, onViewReviews, onRateLeader, ratingsSummary = {} }) {
  // API data wins; the hardcoded entry with the same title only fills fields the API lacks.
  const toLeaderCard = (l) => {
    const fallback = DEFAULT_NATIONAL_LEADERS.find(d => d.title === l.designation) || {};
    return {
      ...fallback,
      id: l.assignment_id || fallback.id || l.designation,
      title: l.designation || fallback.title,
      name: l.leader?.name || fallback.name,
      role: fallback.role || l.designation,
      jurisdiction: 'Republic of India',
      photo: l.leader?.photo_url || fallback.photo,
      authoritySummary: l.authority_description || fallback.authoritySummary || l.designation,
      email: l.leader?.email || fallback.email,
      phone: l.leader?.phone || fallback.phone,
      // Only a date the API gives. We never show an invented one.
      verifiedAt: l.updated_at || l.as_of || l.leader?.updated_at || null,
    };
  };

  const [activeTab, setActiveTab] = useState('NATIONAL'); // 'NATIONAL' | 'CMS'
  const [apiNationalLeaders, setApiNationalLeaders] = useState([]);
  const [apiStateCMs, setApiStateCMs] = useState([]);
  const [selectedNationalLeader, setSelectedNationalLeader] = useState(DEFAULT_NATIONAL_LEADERS[1]);
  const [cmFilter, setCmFilter] = useState('ALL'); // 'ALL' | 'STATE' | 'UT'
  const [localRatings, setLocalRatings] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    governanceApi.getNationalLeaders()
      .then(res => {
        setApiNationalLeaders(res || []);
        if (res && res.length > 0) {
          const pm = res.find(l => l.designation?.includes('Prime Minister')) || res[0];
          setSelectedNationalLeader(toLeaderCard(pm));
        }
      })
      .catch(err => console.warn('National leaders API error:', err));

    governanceApi.getStatesLeadership()
      .then(res => setApiStateCMs(res || []))
      .catch(err => console.warn('State leadership list API error:', err));

    authorityApi.getRatingsSummary()
      .then(res => setLocalRatings(res?.ratings || {}))
      .catch(err => console.warn('Ratings summary API error:', err));
  }, [isOpen]);

  const effectiveRatings = { ...localRatings, ...ratingsSummary };

  const dialogRef = useDialog(isOpen, onClose);
  if (!isOpen) return null;

  const effectiveNationalLeaders = apiNationalLeaders.length > 0 ? apiNationalLeaders.map(toLeaderCard) : DEFAULT_NATIONAL_LEADERS;

  const activeLeader = selectedNationalLeader || effectiveNationalLeaders[1];

  const effectiveStateCMs = apiStateCMs.length > 0 ? apiStateCMs.map(s => {
    let rawStId = (s.state_id || '').replace('IN-', '').toUpperCase();
    let stName = s.state_name || '';

    if (rawStId.includes('NAGPUR') || stName === 'Nagpur District') {
      rawStId = 'MH';
      stName = 'Maharashtra';
    }

    const defaultMatch = DEFAULT_STATES_AND_UTS.find(d => d.stateId === rawStId);

    const isUt = UT_STATE_IDS.has(rawStId) ||
      stName.toLowerCase().includes('union territory') ||
      stName.toLowerCase().includes('delhi') ||
      stName.toLowerCase().includes('puducherry') ||
      stName.toLowerCase().includes('chandigarh') ||
      stName.toLowerCase().includes('andaman') ||
      stName.toLowerCase().includes('daman') ||
      stName.toLowerCase().includes('dadra') ||
      stName.toLowerCase().includes('ladakh') ||
      stName.toLowerCase().includes('lakshadweep') ||
      stName.toLowerCase().includes('jammu');

    return {
      stateId: rawStId,
      stateName: defaultMatch?.stateName || stName,
      cmName: s.leader?.name || defaultMatch?.cmName || 'Chief Minister',
      party: s.party_name || defaultMatch?.party || 'State Government',
      capital: defaultMatch?.capital || s.office_address || 'Capital',
      photo: s.leader?.photo_url || defaultMatch?.photo,
      budget: s.budget || s.stats?.stateBudgetCapEx || defaultMatch?.budget || 'UT Central Allocation',
      type: defaultMatch?.type || (isUt ? 'UNION_TERRITORY' : 'STATE'),
      headTitle: defaultMatch?.headTitle || (isUt ? 'Lieutenant Governor' : 'Chief Minister'),
    };
  }) : DEFAULT_STATES_AND_UTS;

  const filteredStates = effectiveStateCMs.filter(item => {
    if (cmFilter === 'STATE') return item.type === 'STATE';
    if (cmFilter === 'UT') return item.type === 'UNION_TERRITORY';
    return true;
  });

  const sortedStates = [...filteredStates].sort((a, b) =>
    (a.stateName || '').localeCompare(b.stateName || '')
  );

  const statesCount = effectiveStateCMs.filter(s => s.type === 'STATE').length;
  const utCount = effectiveStateCMs.filter(s => s.type === 'UNION_TERRITORY').length;

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="leaders-heading" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="glass-panel-crimson w-full max-w-5xl h-[90dvh] max-h-[90dvh] rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden my-auto">

        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 light:border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/90 light:bg-white gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-crimson-500/20 border border-crimson-500/40 flex items-center justify-center text-crimson-400 light:text-crimson-600 flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 id="leaders-heading" className="text-base sm:text-lg font-bold text-white light:text-slate-900 font-sans flex items-center gap-2">
                National Constitutional & Executive Leadership Directory
              </h2>
            </div>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto space-x-3">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-950 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-300 text-xs sm:text-xs">
              <button
                onClick={() => setActiveTab('NATIONAL')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${activeTab === 'NATIONAL' ? 'bg-crimson-600 text-white font-bold' : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                  }`}
              >
                Union Heads (5)
              </button>
              <button
                onClick={() => setActiveTab('CMS')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${activeTab === 'CMS' ? 'bg-crimson-600 text-white font-bold' : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                  }`}
              >
                All States/UTs ({effectiveStateCMs.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 light:bg-slate-100 hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 flex items-center justify-center transition-colors flex-shrink-0 border border-slate-700/50 light:border-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/60 light:bg-slate-50/50">
          {activeTab === 'NATIONAL' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* National Leaders Selector List (5 Columns) */}
              <div className="lg:col-span-4 space-y-3">
                <div className="text-xs uppercase text-slate-400 light:text-slate-700 font-bold px-1">Constitutional & Executive Heads</div>
                {effectiveNationalLeaders.map((leader) => {
                  const isSelected = activeLeader.id === leader.id;
                  const leaderAvatar = getPersonAvatar(leader, 'POLITICIAN');
                  return (
                    <button
                      key={leader.id}
                      onClick={() => setSelectedNationalLeader(leader)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center space-x-3 ${isSelected
                          ? 'bg-crimson-500/15 light:bg-crimson-50 border-crimson-500/60 shadow-lg'
                          : 'glass-card border-slate-800/80 light:border-slate-200 light:bg-white hover:border-slate-700 light:hover:border-slate-300'
                        }`}
                    >
                      <img
                        src={leaderAvatar}
                        alt={leader.name}
                        onError={(e) => { e.target.src = '/PartyImages/India.jpg'; }}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 light:border-slate-300 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white light:text-slate-900 truncate">{leader.name}</div>
                        <div className="text-xs text-crimson-400 light:text-crimson-700 font-bold truncate">{leader.title}</div>
                        <div className="text-xs text-slate-400 light:text-slate-600 mt-0.5 truncate">{leader.role}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-crimson-400 light:text-crimson-600' : 'text-slate-600 light:text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Leader Detailed Profile Panel */}
              <div className="lg:col-span-8 glass-panel light:bg-white p-6 rounded-3xl border border-slate-800 light:border-slate-200 flex flex-col justify-between shadow-sm">
                <div>
                  {/* Top Profile Card */}
                  <div className="flex items-start space-x-4 pb-6 border-b border-slate-800 light:border-slate-200">
                    <img
                      src={getPersonAvatar(activeLeader, 'POLITICIAN')}
                      alt={activeLeader.name}
                      onError={(e) => { e.target.src = '/PartyImages/India.jpg'; }}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-crimson-500/60 shadow-2xl flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-crimson-500/20 text-crimson-400 light:text-crimson-800 border border-crimson-500/40 text-xs font-bold">
                          {activeLeader.title}
                        </span>
                      </div>
                      <h3 className="text-2xl font-extrabold text-white light:text-slate-900 mt-1 font-sans">
                        {activeLeader.name}
                      </h3>
                      <p className="text-xs text-slate-300 light:text-slate-700 font-medium">{activeLeader.role}</p>
                      <p className="text-xs text-slate-400 light:text-slate-600 mt-1">{activeLeader.jurisdiction}</p>
                      {activeLeader.verifiedAt && (
                        <p className="text-xs text-slate-400 light:text-slate-600 mt-1">Last verified {new Date(activeLeader.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      )}
                    </div>
                  </div>


                  {/* Key Financial Statistics & Auditing Performance */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    {Object.entries(activeLeader.stats || {}).map(([key, val]) => (
                      <div key={key} className="bg-slate-900/60 light:bg-slate-50 p-3 rounded-xl border border-slate-800 light:border-slate-200">
                        <span className="text-xs uppercase text-slate-500 light:text-slate-600 block truncate font-bold">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-sm font-bold text-emerald-400 light:text-emerald-700">{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Office Contacts */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-900/50 light:bg-slate-50 border border-slate-800 light:border-slate-200 text-xs space-y-1 text-slate-300 light:text-slate-700">
                    <div>Official Office: <span className="text-slate-200 light:text-slate-900 font-medium">{activeLeader.office}</span></div>
                    <div>Official Email: <span className="text-crimson-400 light:text-crimson-700 font-medium">{activeLeader.email}</span> | Phone: <span className="text-slate-200 light:text-slate-900">{activeLeader.phone}</span></div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* All 28 States + 8 UTs Grid View */
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center space-x-2 text-xs pb-2 border-b border-slate-800 light:border-slate-200">
                <button
                  onClick={() => setCmFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-all ${cmFilter === 'ALL' ? 'bg-crimson-600 text-white font-bold' : 'bg-slate-900 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 border border-slate-800 light:border-slate-200'
                    }`}
                >
                  All ({effectiveStateCMs.length})
                </button>
                <button
                  onClick={() => setCmFilter('STATE')}
                  className={`px-3 py-1 rounded-lg transition-all ${cmFilter === 'STATE' ? 'bg-crimson-600 text-white font-bold' : 'bg-slate-900 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 border border-slate-800 light:border-slate-200'
                    }`}
                >
                  States ({statesCount})
                </button>
                <button
                  onClick={() => setCmFilter('UT')}
                  className={`px-3 py-1 rounded-lg transition-all ${cmFilter === 'UT' ? 'bg-crimson-600 text-white font-bold' : 'bg-slate-900 light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 border border-slate-800 light:border-slate-200'
                    }`}
                >
                  Union Territories ({utCount})
                </button>
              </div>

              {/* Grid of States & UTs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedStates.map((cm) => (
                  <div
                    key={cm.stateId}
                    className="glass-card light:bg-white p-4 rounded-2xl border border-slate-800 light:border-slate-200 hover:border-crimson-500/50 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-crimson-400 light:text-crimson-700 uppercase truncate pr-1">{cm.stateName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 font-bold ${cm.type === 'UNION_TERRITORY'
                            ? 'bg-amber-500/20 text-amber-400 light:text-amber-800 border border-amber-500/30'
                            : 'bg-slate-800 light:bg-slate-100 text-slate-400 light:text-slate-700 border border-slate-700/50 light:border-slate-200'
                          }`}>
                          {cm.type === 'UNION_TERRITORY' ? 'UT' : 'STATE'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <img
                          src={getPersonAvatar({ name: cm.cmName, party: cm.party, photo: cm.photo }, 'POLITICIAN')}
                          alt={cm.cmName || 'Chief Minister'}
                          onError={(e) => { e.target.src = '/PartyImages/India.jpg'; }}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 light:border-slate-300 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewReviews && onViewReviews({ name: cm.cmName, title: cm.headTitle, photo: cm.photo, party: cm.party }, 'POLITICAL');
                            }}
                            className="text-sm font-bold text-white light:text-slate-900 group-hover:text-crimson-500 transition-colors truncate cursor-pointer hover:underline"
                            title={`Click to view citizen reviews for ${cm.cmName}`}
                          >
                            {cm.cmName}
                          </h4>
                          <p className="text-xs text-slate-400 light:text-slate-600 truncate">{cm.headTitle || 'Chief Minister'}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <img
                              src={normalizeParty(cm.party).flagUrl}
                              alt={cm.party || 'Party'}
                              onError={(e) => { e.target.src = '/PartyImages/India.jpg'; }}
                              className="w-3.5 h-3.5 object-contain rounded flex-shrink-0"
                            />
                            <p className="text-xs text-slate-400 light:text-slate-600 truncate font-medium">{cm.party}</p>
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const cmSummary = effectiveRatings[cm.cmName];
                        return (
                          <div className="mt-3 bg-slate-900/80 light:bg-slate-50 p-2.5 rounded-xl border border-slate-800 light:border-slate-200 text-xs space-y-1 text-slate-300 light:text-slate-700">
                            <div>State Budget: <span className="text-emerald-400 light:text-emerald-700 font-bold">{cm.budget || cm.stats?.stateBudgetCapEx || 'UT Central Allocation'}</span></div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Citizen Reviews:</span>
                              {cmSummary?.total_reviews > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewReviews && onViewReviews({ name: cm.cmName, title: cm.headTitle, photo: cm.photo, party: cm.party }, 'POLITICAL');
                                  }}
                                  className="text-amber-400 light:text-amber-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  <span>{Number(cmSummary.average_rating).toFixed(1)} ({cmSummary.total_reviews})</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewReviews && onViewReviews({ name: cm.cmName, title: cm.headTitle, photo: cm.photo, party: cm.party }, 'POLITICAL');
                                  }}
                                  className="text-slate-500 hover:text-amber-400 italic cursor-pointer"
                                >
                                  No reviews yet
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <button
                      onClick={() => {
                        onSelectState(cm);
                        onClose();
                      }}
                      className="mt-3 w-full py-2 rounded-xl bg-slate-800 light:bg-slate-900 hover:bg-crimson-600 light:hover:bg-crimson-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <MapPin className="w-3.5 h-3.5 text-crimson-400 light:text-crimson-400 group-hover:text-white" />
                      <span>Focus Map & Wards</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Credit */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 light:border-slate-200 text-center text-xs text-slate-400 light:text-slate-600 flex-shrink-0">
          Made with ❤️ by{' '}
          <a
            href="https://www.linkedin.com/in/dhruvgiri-goswami-745b01159/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-crimson-400 light:text-crimson-600 hover:text-crimson-300 font-bold hover:underline"
          >
            Dhruvgiri Goswami
          </a>
        </div>

      </div>
    </div>
  );
}
