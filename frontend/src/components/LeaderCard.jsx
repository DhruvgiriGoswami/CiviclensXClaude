import React from 'react';
import { Star, Mail, Phone, MapPin, Award, CheckCircle2, AlertCircle, FileText, UserCheck, ShieldAlert, ArrowUpRight, MessageSquare } from 'lucide-react';
import { getPersonAvatar, INDIA_FLAG_AVATAR } from '../utils/avatarResolver';
import { normalizeParty } from '../utils/partyNormalizer';

export function LeaderCard({ leader, type, onRateClick, onViewReviews, aisScore, ratingsSummary }) {
  if (!leader) return null;

  const isPolitical = type === 'POLITICAL';
  const personType = isPolitical ? 'POLITICIAN' : 'BUREAUCRAT';
  const avatarUrl = getPersonAvatar({ ...leader, personType }, personType);
  const isPersonalPhoto = avatarUrl ? avatarUrl.startsWith('/leader_images/') : false;

  // Resolve dynamic live rating and review count from ratingsSummary if available
  const leaderName = (leader.name || leader.person_name || '').trim();
  const leaderId = leader.id || leader.person_id || leader.leader_id || leader.rep_id;

  let summary = null;
  if (ratingsSummary) {
    if (leaderName && ratingsSummary[leaderName]) {
      summary = ratingsSummary[leaderName];
    } else if (leaderName) {
      const lowerName = leaderName.toLowerCase();
      const foundKey = Object.keys(ratingsSummary).find(k => k.trim().toLowerCase() === lowerName);
      if (foundKey) summary = ratingsSummary[foundKey];
    }
    if (!summary && leaderId && ratingsSummary[String(leaderId)]) {
      summary = ratingsSummary[String(leaderId)];
    }
  }

  const effectiveRating = summary?.average_rating ?? leader.userRating ?? leader.user_rating;
  const effectiveVotes = summary?.total_reviews ?? leader.totalVotes ?? leader.total_votes ?? 0;

  return (
    <div className="glass-card rounded-2xl p-4 border border-slate-800 light:border-slate-200 light:bg-white transition-all relative overflow-hidden group shadow-sm">
      {/* Top Header Badge: Recommender vs Bureaucratic Sign-Off */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
          isPolitical 
            ? 'bg-crimson-500/10 text-crimson-400 light:text-crimson-600 border-crimson-500/30' 
            : 'bg-emerald-500/10 text-emerald-400 light:text-emerald-700 border-emerald-500/30'
        }`}>
          {isPolitical ? 'Political Candidate' : '⚙ Bureaucratic Sign-Off (Spender)'}
        </span>

        {/* Public Trust Star Score */}
        {effectiveVotes > 0 && effectiveRating ? (
          <button
            type="button"
            onClick={() => onViewReviews && onViewReviews(leader, type)}
            className="flex items-center space-x-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400 light:text-amber-600 text-xs font-bold transition-colors cursor-pointer"
            title="Click to view all citizen reviews"
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{Number(effectiveRating).toFixed(1)}</span>
            <span className="text-xs text-slate-400 light:text-slate-600">({effectiveVotes})</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onViewReviews && onViewReviews(leader, type)}
            className="text-xs text-slate-500 light:text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
            title="Click to view citizen reviews"
          >
            No reviews yet
          </button>
        )}
      </div>

      {/* Main Profile Info Row */}
      <div className="flex items-start space-x-3">
        {/* Portrait Photo with Fallback */}
        <div className="relative flex-shrink-0">
          <img
            src={avatarUrl}
            alt={leader.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = INDIA_FLAG_AVATAR;
            }}
            className="w-16 h-16 rounded-xl object-cover border-2 border-slate-700/80 light:border-slate-300 group-hover:border-crimson-500/60 transition-colors shadow-lg"
          />
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
            isPolitical ? 'bg-crimson-600 text-white' : 'bg-emerald-600 text-white'
          }`}>
            {isPolitical ? 'P' : 'A'}
          </div>
        </div>

        {/* Name & Role Details */}
        <div className="flex-1 min-w-0">
          <h4
            onClick={() => onViewReviews && onViewReviews(leader, type)}
            className="text-sm font-bold text-white light:text-slate-900 truncate font-sans group-hover:text-crimson-500 transition-colors cursor-pointer hover:underline"
            title={`Click to view citizen reviews for ${leader.name}`}
          >
            {leader.name}
          </h4>
          <p className="text-xs text-slate-300 light:text-slate-700 font-medium">{leader.title || leader.designation}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isPolitical && (
              <img
                src={normalizeParty(leader.party || '').flagUrl}
                alt={leader.party || 'Party'}
                onError={(e) => { e.target.onerror = null; e.target.src = INDIA_FLAG_AVATAR; }}
                className="w-3.5 h-3.5 object-contain rounded flex-shrink-0"
              />
            )}
            <p className="text-xs text-slate-400 light:text-slate-500 truncate">{leader.party || leader.reportsTo || leader.officeAddress}</p>
          </div>
        </div>
      </div>

      {/* Authority Matrix & Legal Power */}
      <div className="mt-3 bg-slate-900/90 light:bg-slate-50 rounded-xl p-2.5 border border-slate-800/80 light:border-slate-200 text-xs text-slate-300 light:text-slate-800 font-sans space-y-1">
        <div className="text-xs uppercase text-slate-500 light:text-slate-600 font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-crimson-500" />
          Jurisdiction & Sign-Off Power:
        </div>
        <p className="line-clamp-2 leading-relaxed font-medium">{leader.authority}</p>
      </div>

      {/* Statistics Row (Assets, Attendance, Debates) */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        {leader.declaredAssets && (
          <div className="bg-slate-900/60 light:bg-slate-100 p-1.5 rounded-lg border border-slate-800 light:border-slate-200">
            <span className="text-xs uppercase text-slate-500 light:text-slate-600 block font-bold">Assets</span>
            <span className="text-slate-200 light:text-slate-900 font-bold">{leader.declaredAssets}</span>
          </div>
        )}
        {leader.attendancePct && (
          <div className="bg-slate-900/60 light:bg-slate-100 p-1.5 rounded-lg border border-slate-800 light:border-slate-200">
            <span className="text-xs uppercase text-slate-500 light:text-slate-600 block font-bold">Attendance</span>
            <span className="text-emerald-400 light:text-emerald-700 font-bold">{leader.attendancePct}</span>
          </div>
        )}
        {leader.debates && (
          <div className="bg-slate-900/60 light:bg-slate-100 p-1.5 rounded-lg border border-slate-800 light:border-slate-200">
            <span className="text-xs uppercase text-slate-500 light:text-slate-600 block font-bold">Debates</span>
            <span className="text-amber-400 light:text-amber-700 font-bold">{leader.debates}</span>
          </div>
        )}
      </div>

      {/* Contacts & Interactive Rating Trigger */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 light:border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-400 light:text-slate-600 text-xs">
          <a href={`mailto:${leader.email}`} title={leader.email} className="hover:text-crimson-500 flex items-center gap-1 font-medium">
            <Mail className="w-3 h-3 text-crimson-500" />
            <span className="truncate max-w-[110px]">{leader.email}</span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewReviews && onViewReviews(leader, type)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-slate-100 hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title="View citizen reviews"
          >
            <MessageSquare className="w-3 h-3 text-slate-400" />
            <span>{effectiveVotes > 0 ? `${effectiveVotes} Reviews` : 'Reviews'}</span>
          </button>

          <button
            onClick={() => onRateClick(leader, type)}
            className="px-3 py-1 rounded-lg bg-crimson-500/15 light:bg-crimson-50 hover:bg-crimson-500/30 text-crimson-400 light:text-crimson-600 border border-crimson-500/40 text-xs font-medium font-sans flex items-center gap-1 transition-all shadow-sm font-bold"
          >
            <Star className="w-3 h-3 fill-crimson-500 text-crimson-500" />
            <span>Rate Leader</span>
          </button>
        </div>
      </div>
    </div>
  );
}
