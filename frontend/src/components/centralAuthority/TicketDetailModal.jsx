import React from 'react';
import {
  X, MapPin, ArrowUpRight
} from 'lucide-react';
import { getMediaUrl } from '../../utils/ticketHelpers';

export function TicketDetailModal({ ticket, onClose }) {
  if (!ticket) return null;


  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Complaint details" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#12161F] light:bg-white border border-slate-700/80 light:border-slate-300 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 light:border-slate-200 flex items-center justify-between bg-[#0B0D12] light:bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-500/20 light:bg-blue-100 text-blue-400 light:text-blue-800 border border-blue-500/30 light:border-blue-300">
              CL-{ticket.complaint_id}
            </span>
            <h3 className="font-bold text-slate-100 light:text-slate-900 text-base truncate max-w-md">
              Complaint Detail Inspection
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-slate-400 light:text-slate-700 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 light:text-slate-700">
          {/* Operational Status & Priority Badges */}
          <div className="p-4 rounded-xl bg-[#0B0D12] light:bg-slate-50 border border-slate-800 light:border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 light:text-slate-600 mb-1.5">
                Operational Status
              </label>
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold font-mono text-xs">
                {ticket.status || 'OPEN'}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 light:text-slate-600 mb-1.5">
                Priority Severity Level
              </label>
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono text-xs">
                {ticket.priority || 'MEDIUM'}
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 light:text-slate-600 block mb-1">
              Title & Category
            </span>
            <h4 className="text-sm font-bold text-slate-100 light:text-slate-900 mb-2">{ticket.title}</h4>
            <div className="inline-block px-2.5 py-0.5 rounded bg-blue-500/10 light:bg-blue-50 text-blue-300 light:text-blue-800 border border-blue-500/20 light:border-blue-300 font-mono text-[11px] mb-3">
              Category: {ticket.category}
            </div>

            {ticket.description && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 light:bg-slate-100 border border-slate-800/80 light:border-slate-200 text-slate-300 light:text-slate-800 leading-relaxed">
                {ticket.description}
              </div>
            )}
          </div>

          {/* Location & Geographic Hierarchy */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 light:text-slate-600 block">
              Geographic Location & Boundary Assignment
            </span>
            <div className="p-3.5 rounded-xl bg-[#0B0D12] light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 light:text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-200 light:text-slate-800">
                    {ticket.address_text || 'Exact Address Not Provided'}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 light:text-slate-600 mt-0.5">
                    Coordinates: {ticket.latitude}, {ticket.longitude}
                  </div>
                </div>
              </div>

              {ticket.resolved_geo_unit_id && (
                <div className="pt-2 border-t border-slate-800/80 light:border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-300 light:text-slate-700">
                  <span>Assigned Jurisdiction Unit:</span>
                  <span className="text-blue-400 light:text-blue-700 font-bold">{ticket.resolved_geo_unit_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps & Reporter Meta */}
          <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
            <div className="p-3 rounded-lg bg-slate-900/40 light:bg-slate-100 border border-slate-800 light:border-slate-200">
              <span className="text-slate-400 light:text-slate-600 block mb-1">Created Date:</span>
              <span className="text-slate-200 light:text-slate-800 font-bold">{formatDate(ticket.created_at)}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/40 light:bg-slate-100 border border-slate-800 light:border-slate-200">
              <span className="text-slate-400 light:text-slate-600 block mb-1">Last Updated:</span>
              <span className="text-slate-200 light:text-slate-800 font-bold">{formatDate(ticket.updated_at || ticket.created_at)}</span>
            </div>
          </div>

          {/* Attached Media Assets */}
          {ticket.media && ticket.media.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 light:text-slate-600 block mb-2">
                Attached Media Assets ({ticket.media.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ticket.media.map((item, idx) => {
                  const mediaUrl = getMediaUrl(item.storage_url);
                  return (
                    <a
                      key={item.media_id || idx}
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-xl border border-slate-800 light:border-slate-200 overflow-hidden bg-black/40 light:bg-slate-200 block aspect-video"
                    >
                      <img
                        src={mediaUrl}
                        alt={`Attachment ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 font-mono">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>View</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 light:border-slate-200 bg-[#0B0D12] light:bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-slate-200 light:text-slate-800 text-xs font-medium border border-slate-700 light:border-slate-300 transition-colors cursor-pointer"
          >
            Close Detail Window
          </button>
        </div>
      </div>
    </div>
  );
}
