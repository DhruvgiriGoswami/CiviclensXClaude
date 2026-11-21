import React, { useState, useEffect } from 'react';
import { Star, X, MessageSquare, ThumbsUp, ShieldCheck, UserCheck, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { authorityApi } from '../services/api';
import { getPersonAvatar, INDIA_FLAG_AVATAR } from '../utils/avatarResolver';

export function LeaderReviewsModal({ isOpen, onClose, leader, leaderType, onRateClick }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !leader) return;

    setIsLoading(true);
    setError(null);
    const leaderName = leader.name || leader.person_name || leader.title;
    const leaderId = leader.id || leader.person_id || leader.rep_id;

    authorityApi.getLeaderFeedbacks(leaderName, leaderId)
      .then(res => {
        if (res) {
          setFeedbacks(res.feedbacks || []);
          const calculatedAvg = res.feedbacks && res.feedbacks.length > 0
            ? res.feedbacks.reduce((acc, f) => {
                const fRating = (f.responsiveness_score != null && f.transparency_score != null)
                  ? (f.responsiveness_score + f.transparency_score) / 2
                  : (f.rating || 5);
                return acc + fRating;
              }, 0) / res.feedbacks.length
            : (res.average_rating || 0.0);

          setSummary({
            averageRating: calculatedAvg,
            totalReviews: res.total_reviews || 0,
            avgResponsiveness: res.avg_responsiveness || 0.0,
            avgTransparency: res.avg_transparency || 0.0,
          });
        }
      })
      .catch(err => {
        console.warn('Failed to fetch leader feedbacks:', err);
        setError('Unable to load live reviews at this moment.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, leader?.name, leader?.id]);

  if (!isOpen || !leader) return null;

  const isPolitical = leaderType === 'POLITICAL' || leader.roleType !== 'BUREAUCRAT';
  const personType = isPolitical ? 'POLITICIAN' : 'BUREAUCRAT';
  const avatarUrl = getPersonAvatar({ ...leader, personType }, personType);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Leader reviews" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="glass-panel-crimson w-full max-w-2xl max-h-[90dvh] rounded-3xl border border-slate-700/80 light:border-slate-300 shadow-2xl flex flex-col overflow-hidden my-auto">
        
        {/* Modal Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 light:border-slate-200 flex items-start justify-between bg-slate-900/95 light:bg-white flex-shrink-0">
          <div className="flex items-center space-x-3.5 min-w-0">
            <img
              src={avatarUrl}
              alt={leader.name}
              onError={(e) => {
                e.target.src = isPolitical ? getPersonAvatar(leader, 'POLITICIAN') : INDIA_FLAG_AVATAR;
              }}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 light:border-slate-300 shadow-lg flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isPolitical
                    ? 'bg-crimson-500/10 text-crimson-400 light:text-crimson-600 border-crimson-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 light:text-emerald-700 border-emerald-500/30'
                }`}>
                  {isPolitical ? 'Elected Leader' : 'Administrative Officer'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white light:text-slate-900 font-sans truncate mt-0.5">
                {leader.name}
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 truncate">
                {leader.title || leader.designation || 'Civic Authority'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-300 light:text-slate-800 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-950/60 light:bg-slate-50/50">

          {/* Aggregated Real Scores Summary Card */}
          <div className="bg-slate-900/90 light:bg-white p-4 rounded-2xl border border-slate-800/80 light:border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 light:text-slate-500 font-bold">
                  Verified Resident Accountability Index
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center text-amber-400 light:text-amber-600 font-extrabold text-2xl">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-400 mr-1.5" />
                    <span>{summary?.totalReviews > 0 ? summary.averageRating.toFixed(1) : '0.0'}</span>
                    <span className="text-xs text-slate-500 light:text-slate-400 font-normal ml-1">/ 5.0</span>
                  </div>
                  <span className="text-xs text-slate-400 light:text-slate-600 font-bold bg-slate-800 light:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-700/50 light:border-slate-200">
                    {summary?.totalReviews > 0 ? `${summary.totalReviews} Citizen Reviews` : '0 Reviews'}
                  </span>
                </div>
              </div>

              {onRateClick && (
                <button
                  onClick={() => {
                    onClose();
                    onRateClick(leader, leaderType);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-crimson-600 to-crimson-700 hover:from-crimson-500 hover:to-crimson-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all flex-shrink-0"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Rate This Leader</span>
                </button>
              )}
            </div>

            {/* Granular Sub-metrics Breakdown */}
            {summary?.totalReviews > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 light:border-slate-200 text-xs">
                <div className="bg-slate-950/50 light:bg-slate-50 p-2.5 rounded-xl border border-slate-800 light:border-slate-200">
                  <span className="text-xs text-slate-400 light:text-slate-500 block uppercase font-bold">Grievance Responsiveness</span>
                  <span className="text-crimson-400 light:text-crimson-600 font-bold text-sm">{summary.avgResponsiveness.toFixed(1)} / 5</span>
                </div>
                <div className="bg-slate-950/50 light:bg-slate-50 p-2.5 rounded-xl border border-slate-800 light:border-slate-200">
                  <span className="text-xs text-slate-400 light:text-slate-500 block uppercase font-bold">Fund Usage Transparency</span>
                  <span className="text-emerald-400 light:text-emerald-700 font-bold text-sm">{summary.avgTransparency.toFixed(1)} / 5</span>
                </div>
              </div>
            )}
          </div>

          {/* Citizen Reviews Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 light:text-slate-700">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-crimson-500" />
                Citizen Reviews & Feedback
              </span>
              <span>{feedbacks.length} Entries</span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                Loading authentic citizen feedback from database...
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-xs text-center">
                {error}
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="py-10 px-4 text-center rounded-2xl bg-slate-900/60 light:bg-white border border-slate-800 light:border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 light:bg-slate-100 text-slate-400 light:text-slate-600 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white light:text-slate-900 font-sans">No Reviews Recorded Yet</h4>
                <p className="text-xs text-slate-400 light:text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Be the first resident to rate {leader.name} and share public accountability feedback for civic work, responsiveness, and fund usage.
                </p>
                {onRateClick && (
                  <button
                    onClick={() => {
                      onClose();
                      onRateClick(leader, leaderType);
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Be The First To Rate</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((fb, idx) => (
                  <div
                    key={fb.feedback_id || idx}
                    className="p-4 rounded-2xl bg-slate-900/80 light:bg-white border border-slate-800/80 light:border-slate-200 shadow-sm space-y-2.5 transition-all hover:border-slate-700 light:hover:border-slate-300"
                  >
                    {/* User and Rating header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-800 font-bold text-xs flex items-center justify-center uppercase">
                          {(fb.citizen_name || 'A')[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white light:text-slate-900 font-sans">
                            {fb.citizen_name || 'Anonymous Resident'}
                          </div>
                          <div className="text-xs text-slate-500 light:text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(fb.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center space-x-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400 light:text-amber-600 text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{Number((fb.responsiveness_score != null && fb.transparency_score != null) ? ((fb.responsiveness_score + fb.transparency_score) / 2) : fb.rating).toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Sub-ratings pills */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700">
                        Responsiveness: <strong className="text-crimson-400 light:text-crimson-600">{fb.responsiveness_score || 5}/5</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-950 light:bg-slate-100 border border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700">
                        Fund Transparency: <strong className="text-emerald-400 light:text-emerald-700">{fb.transparency_score || 5}/5</strong>
                      </span>
                    </div>

                    {/* Written Feedback Text */}
                    {fb.feedback_text ? (
                      <p className="text-xs text-slate-200 light:text-slate-800 font-sans leading-relaxed pt-1 border-t border-slate-800/50 light:border-slate-100">
                        "{fb.feedback_text}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 italic font-sans pt-1">
                        (No written feedback provided with this rating)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
