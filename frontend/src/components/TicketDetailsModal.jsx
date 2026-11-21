import React from 'react';
import { X, MapPin, ThumbsUp, Calendar, AlertTriangle, ShieldAlert, Image, CheckCircle2, Navigation } from 'lucide-react';
import { getMediaUrl } from '../utils/ticketHelpers';

export function TicketDetailsModal({
  isOpen,
  onClose,
  ticket,
  onUpvoteTicket,
  upvotedTicketIds = [],
  onFocusOnMap,
}) {
  // Hooks must run on every render, so they come before the early return.
  // Calling them after it crashes React ("Rendered more hooks") when a ticket opens.
  const [hasUpvoted, setHasUpvoted] = React.useState(() => Boolean(ticket && upvotedTicketIds.includes(ticket.ticketId)));
  const [upvoteCount, setUpvoteCount] = React.useState(ticket?.upvotes || 0);

  React.useEffect(() => {
    if (!ticket) return;
    setHasUpvoted(upvotedTicketIds.includes(ticket.ticketId));
    setUpvoteCount(ticket.upvotes || 0);
  }, [ticket?.ticketId, ticket?.upvotes, upvotedTicketIds]);

  if (!isOpen || !ticket) return null;

  const handleUpvoteClick = () => {
    if (hasUpvoted) return;
    setHasUpvoted(true);
    setUpvoteCount(prev => prev + 1);
    if (onUpvoteTicket) {
      onUpvoteTicket(ticket.ticketId);
    }
  };

  // Resolve genuine photo preview only if custom media or storage_url is attached
  const getTicketPhotoPreview = () => {
    if (ticket.mediaUrl) return getMediaUrl(ticket.mediaUrl);
    if (ticket.photo) return getMediaUrl(ticket.photo);
    if (ticket.media && Array.isArray(ticket.media) && ticket.media.length > 0) {
      const first = ticket.media[0];
      if (first?.storage_url) return getMediaUrl(first.storage_url);
    }
    return null;
  };

  const imagePreview = getTicketPhotoPreview();

  return (
    <div role="dialog" aria-modal="true" aria-label="Ticket details" className="fixed inset-0 z-[9990] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto select-none">
      <div className="glass-panel-crimson light:bg-white light:border-slate-300 w-full max-w-xl rounded-3xl border border-slate-700/80 shadow-2xl p-5 sm:p-6 relative max-h-[90dvh] overflow-y-auto no-scrollbar my-auto text-slate-100 light:text-slate-900 space-y-4">
        
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 light:border-slate-200 pb-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-crimson-500/20 text-crimson-400 light:text-crimson-700 border border-crimson-500/40">
                Ticket #{ticket.ticketId}
              </span>
              <span className="text-[10px] font-mono text-slate-400 light:text-slate-600 font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                {ticket.createdAt || 'Recent'}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white light:text-slate-900 font-sans leading-snug">
              {ticket.category}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-300 light:text-slate-700 flex items-center justify-center transition-colors flex-shrink-0"
            title="Close Ticket Inspection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Priority & Status Badges Row */}
        <div className="flex items-center justify-between gap-2 text-xs font-mono bg-slate-950/80 light:bg-slate-100 p-3 rounded-2xl border border-slate-800 light:border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 light:text-slate-600 font-bold">Severity:</span>
            {upvoteCount >= 30 ? (
              <span className="px-2 py-0.5 rounded-md bg-crimson-500/20 text-crimson-400 border border-crimson-500/40 font-extrabold flex items-center gap-1 animate-pulse">
                <ShieldAlert className="w-3 h-3 text-crimson-500" />
                CRITICAL (30+ Upvotes)
              </span>
            ) : upvoteCount >= 15 ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-extrabold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                HIGH (15+ Upvotes)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-700 light:border-slate-300 font-semibold">
                NORMAL
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 light:text-slate-600 font-bold">Status:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-extrabold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {ticket.status || 'OPEN'}
            </span>
          </div>
        </div>

        {/* Location & Address Box */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 light:bg-slate-100 border border-slate-800 light:border-slate-200 space-y-1 font-mono text-xs">
          <div className="flex items-center space-x-2 text-crimson-400 light:text-crimson-700 font-bold">
            <MapPin className="w-4 h-4 text-crimson-500 flex-shrink-0" />
            <span>Location Tag:</span>
            <span className="text-slate-200 light:text-slate-800 font-sans truncate">
              {ticket.wardName || ticket.districtName || ticket.parentCityDistrict || 'Geo-Tagged Spot'}
            </span>
          </div>
          {ticket.addressText && (
            <p className="text-[11px] text-slate-300 light:text-slate-700 font-sans pl-6">
              📍 <strong>Address Details:</strong> {ticket.addressText}
            </p>
          )}
          {ticket.latitude && ticket.longitude && (
            <p className="text-[10px] text-slate-400 light:text-slate-500 pl-6">
              Coordinates: Lat {Number(ticket.latitude).toFixed(5)}, Lng {Number(ticket.longitude).toFixed(5)}
            </p>
          )}
        </div>

        {/* Detailed Issue Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold text-slate-300 light:text-slate-700 block">
            Grievance Description:
          </label>
          <div className="p-3.5 rounded-2xl bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-200 text-xs font-sans text-slate-200 light:text-slate-800 leading-relaxed">
            {ticket.description}
          </div>
        </div>

        {/* Citizen Photo Proofs & Media Preview Section - Only rendered when genuine evidence exists */}
        {imagePreview && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-crimson-400" />
                <span>Geo-Tagged Photo Evidence / Media Proof:</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-normal">Verifiable Media</span>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-800 light:border-slate-300 max-h-56 bg-slate-950 group">
              <img
                src={imagePreview}
                alt="Civic Issue Photo Proof"
                className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-slate-950/90 to-transparent text-[10px] font-mono text-slate-200 flex items-center justify-between">
                <span>📍 Geo-Stamped Photo Evidence</span>
                <span>CivicLens Verification Seal</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 light:border-slate-200 gap-2">
          {/* Focus on Map Button */}
          {onFocusOnMap && (
            <button
              onClick={() => {
                onClose();
                onFocusOnMap(ticket);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 light:bg-slate-100 light:hover:bg-slate-200 text-slate-200 light:text-slate-800 text-xs font-mono font-bold border border-slate-700 light:border-slate-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5 text-crimson-400 light:text-crimson-600" />
              <span>Focus on Map</span>
            </button>
          )}

          {/* Upvote Button */}
          <button
            onClick={handleUpvoteClick}
            disabled={hasUpvoted}
            className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              hasUpvoted
                ? 'bg-crimson-500/20 text-crimson-400 border-crimson-500/40 cursor-default opacity-90'
                : 'bg-gradient-to-r from-crimson-600 to-crimson-700 hover:from-crimson-500 hover:to-crimson-600 text-white border-crimson-500 shadow-md shadow-crimson-600/30 active:scale-95'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'text-crimson-400' : 'text-white'}`} />
            <span>{hasUpvoted ? `Upvoted (${upvoteCount})` : `Upvote (${upvoteCount})`}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
