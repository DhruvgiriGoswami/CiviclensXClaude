import React from 'react';
import {
  Search, X, ChevronLeft, ChevronRight,
  Eye, MapPin, AlertTriangle, RefreshCw, Download, FileText, Trash2
} from 'lucide-react';
import { statusBadgeClass, priorityBadgeClass } from '../../utils/statusStyles';
import { humanizeEnum } from '../../utils/format';

export function TicketTable({
  tickets,
  totalTickets,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  categoriesList,
  sortBy,
  onSortChange,
  onClearFilters,
  onSelectTicket,
  onPurgeTestData,
  onDeleteTicket,
  isLoading,
  error,
  onRetry,
}) {
  const totalPages = Math.max(1, Math.ceil(totalTickets / pageSize));
  const startItem = totalTickets === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalTickets, currentPage * pageSize);

  const formatStatusBadge = statusBadgeClass;
  const formatPriorityBadge = priorityBadgeClass;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
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

  const exportToCSV = () => {
    if (!tickets || tickets.length === 0) return;

    const headers = ['Ticket ID', 'Title', 'Category', 'Status', 'Priority', 'Address/Location', 'Geo Unit ID', 'Created At'];
    const rows = tickets.map(t => [
      `CL-${t.complaint_id}`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.status || 'OPEN',
      t.priority || 'MEDIUM',
      `"${(t.address_text || '').replace(/"/g, '""')}"`,
      t.resolved_geo_unit_id || '',
      t.created_at || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CivicLens_Authority_Tickets_Page${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = !!(searchQuery || statusFilter || categoryFilter || (sortBy && sortBy !== 'created_at_desc'));

  return (
    <div className="flex-1 min-h-[650px] flex flex-col bg-[#0B0D12] ca-bg-main transition-colors overflow-hidden">
      {/* Table Search & Filter Toolbar */}
      <div className="bg-[#12161F]/90 ca-panel-bg border-b border-slate-800 p-3 sm:px-6 flex flex-col gap-2.5 transition-colors">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Ticket ID, keyword, address, or location..."
              className="w-full bg-[#0B0D12] ca-input-select text-slate-200 border border-slate-700/80 rounded-lg pl-9 pr-8 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 font-sans transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Selects & CSV Export */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-[#0B0D12] ca-input-select text-slate-300 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-sans cursor-pointer transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-[#0B0D12] ca-input-select text-slate-300 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-sans cursor-pointer max-w-[150px] truncate transition-colors"
            >
              <option value="">All Categories</option>
              {(categoriesList || []).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-[#0B0D12] ca-input-select text-slate-300 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-sans cursor-pointer transition-colors"
            >
              <option value="created_at_desc">Sort: Newest First</option>
              <option value="created_at_asc">Sort: Oldest First</option>
              <option value="priority">Sort: Priority</option>
              <option value="status">Sort: Status</option>
              <option value="category">Sort: Category</option>
            </select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 ca-panel-bg hover:bg-slate-700 text-rose-300 text-xs border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset search and filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}

            {/* CSV Export */}
            <button
              onClick={exportToCSV}
              disabled={!tickets || tickets.length === 0}
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium border border-blue-500/40 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              title="Export visible table page to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>


          </div>
        </div>
      </div>

      {/* Main Table Scroll Container */}
      <div className="flex-1 overflow-auto relative">
        {/* API Error State */}
        {error ? (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-100 mb-1">Unable to Load CivicLens Tickets</h4>
            <p className="text-xs text-slate-400 max-w-md mb-4">{error}</p>
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-2 transition-colors shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry API Connection</span>
            </button>
          </div>
        ) : isLoading ? (
          /* Loading Skeleton State */
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-11 bg-slate-800/40 ca-panel-bg rounded-lg animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          /* Empty State (API returned 0 results) */
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-slate-800 ca-panel-bg border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">No Tickets Found</h4>
            <p className="text-xs text-slate-400 max-w-md mb-4">
              There are no registered complaints matching your current geographic scope or filter parameters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 ca-panel-bg hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
              >
                Clear Search Filters
              </button>
            )}
          </div>
        ) : (
          /* Data Table */
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead className="bg-[#12161F] ca-table-header uppercase text-xs tracking-wider sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 w-28">Ticket ID</th>
                <th className="py-2.5 px-4 min-w-[200px]">Complaint Details</th>
                <th className="py-2.5 px-4 min-w-[140px]">Category</th>
                <th className="py-2.5 px-4 min-w-[180px]">Location / Jurisdiction</th>
                <th className="py-2.5 px-4 w-28">Created Date</th>
                <th className="py-2.5 px-4 w-24">Priority</th>
                <th className="py-2.5 px-4 w-28">Status</th>
                <th className="py-2.5 px-4 w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.complaint_id}
                  onClick={() => onSelectTicket(ticket)}
                  className="hover:bg-slate-800/40 ca-table-row transition-colors cursor-pointer group"
                >
                  {/* Ticket ID */}
                  <td className="py-2.5 px-4 font-bold text-blue-400 whitespace-nowrap">
                    CL-{ticket.complaint_id}
                  </td>

                  {/* Complaint Title & Description */}
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                      {ticket.title}
                    </div>
                    {ticket.description && (
                      <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {ticket.description}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 ca-panel-bg text-slate-300 border border-slate-700 max-w-[150px] truncate">
                      {ticket.category}
                    </span>
                  </td>

                  {/* Location / Jurisdiction */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[220px]">
                        {ticket.address_text || ticket.resolved_geo_unit_id || 'GPS Coordinated'}
                      </span>
                    </div>
                    {ticket.resolved_geo_unit_id && (
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        Unit: {ticket.resolved_geo_unit_id}
                      </div>
                    )}
                  </td>

                  {/* Created Date */}
                  <td className="py-2.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(ticket.created_at)}
                  </td>

                  {/* Priority */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs uppercase border ${formatPriorityBadge(ticket.priority)}`}>
                      {ticket.priority || 'MEDIUM'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${formatStatusBadge(ticket.status)}`}>
                      {ticket.status || 'OPEN'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(ticket);
                      }}
                      className="p-1.5 rounded-md bg-slate-800 ca-panel-bg hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 transition-colors border border-slate-700/80 inline-flex items-center gap-1 text-xs cursor-pointer"
                      title="Inspect full operational detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!error && totalTickets > 0 && (
        <div className="bg-[#12161F] ca-panel-bg border-t border-slate-800 px-4 py-2.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs transition-colors">
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <span>
              Showing <strong className="text-slate-200">{startItem}</strong> to <strong className="text-slate-200">{endItem}</strong> of <strong className="text-slate-200">{totalTickets}</strong> complaints
            </span>

            <div className="flex items-center gap-2 border-l border-slate-700/60 pl-4">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-[#0B0D12] ca-input-select text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-xs focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded-md bg-slate-800 ca-panel-bg hover:bg-slate-700 text-slate-300 disabled:opacity-40 border border-slate-700 transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-[#0B0D12] ca-input-select text-slate-200 border border-slate-700 rounded-md text-xs">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1.5 rounded-md bg-slate-800 ca-panel-bg hover:bg-slate-700 text-slate-300 disabled:opacity-40 border border-slate-700 transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
