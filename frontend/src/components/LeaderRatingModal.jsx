import React, { useState } from 'react';
import { useDialog } from '../hooks/useDialog';
import { Star, X, CheckCircle, ShieldCheck, ThumbsUp, MessageSquare, AlertCircle } from 'lucide-react';
import { authorityApi } from '../services/api';

export function LeaderRatingModal({ isOpen, onClose, leader, leaderType, unit, onRatingSubmitted }) {
  // Nothing is preselected: a default would nudge every quick submission to the same score.
  const [responsivenessScore, setResponsivenessScore] = useState(0);
  const [transparencyScore, setTransparencyScore] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [citizenName, setCitizenName] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const dialogRef = useDialog(isOpen && !!leader, onClose);
  if (!isOpen || !leader) return null;

  const handleResponsivenessChange = (val) => {
    const num = parseInt(val, 10);
    setResponsivenessScore(num);
    setRating(Math.round((num + (transparencyScore || num)) / 2));
  };

  const handleTransparencyChange = (val) => {
    const num = parseInt(val, 10);
    setTransparencyScore(num);
    setRating(Math.round(((responsivenessScore || num) + num) / 2));
  };

  const handleStarClick = (star) => {
    setRating(star);
    setResponsivenessScore(star);
    setTransparencyScore(star);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setIsSubmitting(true);

    try {
      const leaderName = leader.name || leader.title || 'Representative';
      const cleanCitizenName = citizenName.trim() || 'Anonymous';
      const calculatedRating = Math.round(((responsivenessScore || rating) + (transparencyScore || rating)) / 2);

      const res = await authorityApi.rateRepresentative({
        leader_name: leaderName,
        leader_id: leader.id || leader.rep_id || leader.person_id || undefined,
        leader_type: leaderType === 'POLITICAL' ? 'POLITICAL' : 'ADMINISTRATIVE',
        geo_unit_id: unit?.unitId || unit?.id || undefined,
        citizen_name: cleanCitizenName,
        rating: calculatedRating,
        responsiveness_score: responsivenessScore || rating,
        transparency_score: transparencyScore || rating,
        feedback_text: feedbackText.trim() || undefined,
      }).catch(err => {
        console.warn('API rating submit error:', err);
        return null;
      });

      const newAvgRating = res?.average_rating ?? calculatedRating;
      const newVotes = res?.total_reviews ?? ((leader.totalVotes || 0) + 1);
      
      setIsSuccess(true);
      setTimeout(() => {
        if (onRatingSubmitted) {
          onRatingSubmitted({
            leaderId: leader.id || leader.name,
            leaderName: leaderName,
            leaderType,
            newRating: newAvgRating,
            newVotes
          });
        }
        setIsSuccess(false);
        setCitizenName('');
        setFeedbackText('');
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed rating submit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="rating-heading" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="glass-panel-crimson w-full max-w-lg rounded-3xl border border-slate-700/80 light:border-slate-300 shadow-2xl p-4 sm:p-6 relative max-h-[90dvh] overflow-y-auto no-scrollbar my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-300 light:text-slate-800 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 id="rating-heading" className="text-xl font-bold text-white light:text-slate-900 font-sans">Rating recorded</h3>
            <p className="text-xs text-slate-300 light:text-slate-700">
              Thanks. Your rating now counts toward the score for {unit?.unitName}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Header */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-crimson-500/20 text-crimson-400 light:text-crimson-700 border border-crimson-500/40">
                Your rating
              </span>
              <h3 id="rating-heading" className="text-lg font-bold text-white light:text-slate-900 mt-1 font-sans">
                Rate {leader.name}
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600">{leader.title || leader.designation} • {unit?.unitName}</p>
            </div>

            {/* Star Rating Widget */}
            <div className="bg-slate-900/80 light:bg-slate-100 p-4 rounded-2xl border border-slate-800 light:border-slate-300 text-center space-y-2">
              <label className="text-xs text-slate-300 light:text-slate-800 block uppercase font-bold">Overall rating, 1 to 5 stars</label>
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    aria-pressed={rating === star}
                    className="w-11 h-11 inline-flex items-center justify-center rounded-lg"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400 drop-'
                          : 'text-slate-700 light:text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-xs font-bold text-amber-400 light:text-amber-700">
                {rating ? `${rating} of 5` : 'Choose a star rating to continue.'}
              </div>
            </div>

            {/* Granular Sub-Metrics Sliders */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 light:text-slate-800 mb-1 font-bold">
                  <span>Responds to complaints</span>
                  <span className="text-slate-200 light:text-slate-800 font-bold">{responsivenessScore ? `${responsivenessScore} of 5` : 'Not set'}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={responsivenessScore || 3}
                  aria-label="Responds to complaints, 1 to 5"
                  onChange={(e) => handleResponsivenessChange(e.target.value)}
                  className="w-full accent-slate-500 bg-slate-800"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 light:text-slate-800 mb-1 font-bold">
                  <span>Open about how money is spent</span>
                  <span className="text-slate-200 light:text-slate-800 font-bold">{transparencyScore ? `${transparencyScore} of 5` : 'Not set'}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={transparencyScore || 3}
                  aria-label="Open about how money is spent, 1 to 5"
                  onChange={(e) => handleTransparencyChange(e.target.value)}
                  className="w-full accent-slate-500 bg-slate-800"
                />
              </div>
            </div>

            {/* Citizen Name Input */}
            <div>
              <label className="text-xs text-slate-300 light:text-slate-800 block mb-1 font-bold">Your Name (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma (leave blank for Anonymous)"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="w-full bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl p-2.5 text-xs text-slate-100 light:text-slate-900 placeholder-slate-500 focus:border-crimson-500 font-sans"
              />
            </div>

            {/* Written Citizen Feedback Textarea */}
            <div>
              <label className="text-xs text-slate-300 light:text-slate-800 block mb-1 font-bold">Comments (optional)</label>
              <textarea
                rows="2"
                placeholder="Share specific observations about local roads, drainage work, or officer response time..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl p-2.5 text-xs text-slate-100 light:text-slate-900 placeholder-slate-500 focus:border-crimson-500"
              />
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || !rating}
              className="w-full min-h-[44px] rounded-xl bg-crimson-700 hover:bg-crimson-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-sans font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <span>Submitting your rating</span>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4" />
                  <span>Submit rating</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
