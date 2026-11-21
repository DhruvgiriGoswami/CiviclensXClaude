import React, { useState, useEffect, useCallback } from 'react';

// Older builds saved the admin key in localStorage, where it stays forever. Wipe it.
try { localStorage.removeItem('civiclens_admin_key'); } catch { /* storage blocked */ }
import { useDialog } from '../../hooks/useDialog';
import { AuthorityHeader } from './AuthorityHeader';
import { GeographicScopeFilters } from './GeographicScopeFilters';
import { AuthorityStatsBar } from './AuthorityStatsBar';
import { AnalyticsPanel } from './AnalyticsPanel';
import { TicketTable } from './TicketTable';
import { TicketDetailModal } from './TicketDetailModal';

import { complaintsApi } from '../../services/api';

export function CentralAuthorityDashboard({ onBackToMap }) {
  // Read initial params from URL search query
  const getInitialParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      state: params.get('state') || '',
      district: params.get('district') || '',
      corp: params.get('corp') || '',
      ward: params.get('ward') || '',
      geo_unit_id: params.get('geo_unit_id') || params.get('ward') || params.get('corp') || params.get('district') || params.get('state') || '',
      status: params.get('status') || '',
      category: params.get('category') || '',
      search: params.get('search') || '',
      page: parseInt(params.get('page') || '1', 10),
      pageSize: parseInt(params.get('pageSize') || '20', 10),
      sortBy: params.get('sortBy') || 'created_at_desc',
    };
  };

  const initial = getInitialParams();

  // Geographic Scope State
  const [geoScope, setGeoScope] = useState({
    state: initial.state,
    district: initial.district,
    corp: initial.corp,
    ward: initial.ward,
    effectiveGeoUnitId: initial.geo_unit_id,
  });

  // Ticket Search, Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState(initial.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initial.search);
  const [statusFilter, setStatusFilter] = useState(initial.status);
  const [categoryFilter, setCategoryFilter] = useState(initial.category);
  const [sortBy, setSortBy] = useState(initial.sortBy);
  const [currentPage, setCurrentPage] = useState(initial.page);
  const [pageSize, setPageSize] = useState(initial.pageSize);

  // Live Data State
  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [ticketError, setTicketError] = useState(null);

  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [categoriesList, setCategoriesList] = useState([]);
  const [inspectedTicket, setInspectedTicket] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounce search input changes (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync state to URL Query Parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (geoScope.state) params.set('state', geoScope.state);
    if (geoScope.district) params.set('district', geoScope.district);
    if (geoScope.corp) params.set('corp', geoScope.corp);
    if (geoScope.ward) params.set('ward', geoScope.ward);
    if (geoScope.effectiveGeoUnitId) params.set('geo_unit_id', geoScope.effectiveGeoUnitId);
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (pageSize !== 20) params.set('pageSize', pageSize.toString());
    if (sortBy && sortBy !== 'created_at_desc') params.set('sortBy', sortBy);

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [geoScope, statusFilter, categoryFilter, debouncedSearch, currentPage, pageSize, sortBy]);

  // 1. Fetch Categories List on Mount
  useEffect(() => {
    complaintsApi.getCategories()
      .then((cats) => {
        if (Array.isArray(cats)) setCategoriesList(cats);
      })
      .catch((err) => console.warn('Categories API fetch note:', err.message));
  }, []);

  // 2. Fetch Live Ticket List
  const fetchTickets = useCallback(() => {
    setIsLoadingTickets(true);
    setTicketError(null);

    const params = {
      geo_unit_id: geoScope.effectiveGeoUnitId || undefined,
      category: categoryFilter || undefined,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
      page: currentPage,
      page_size: pageSize,
      sort_by: sortBy || undefined,
    };

    complaintsApi.listComplaints(params)
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          setTickets(data.items);
          setTotalTickets(data.total || 0);
        } else {
          setTickets([]);
          setTotalTickets(0);
        }
      })
      .catch((err) => {
        console.error('Complaints API failed:', err);
        setTicketError(err.message || 'Failed to fetch complaints from backend API');
        setTickets([]);
        setTotalTickets(0);
      })
      .finally(() => {
        setIsLoadingTickets(false);
      });
  }, [geoScope.effectiveGeoUnitId, categoryFilter, statusFilter, debouncedSearch, currentPage, pageSize, sortBy]);

  // 3. Fetch Live Aggregate Statistics
  const fetchStats = useCallback(() => {
    setIsLoadingStats(true);
    setStatsError(null);

    complaintsApi.getStats(geoScope.effectiveGeoUnitId || null)
      .then((res) => {
        if (res) {
          setStats(res);
        }
      })
      .catch((err) => {
        console.error('Stats API failed:', err);
        setStatsError(err.message || 'Failed to fetch statistics');
      })
      .finally(() => {
        setIsLoadingStats(false);
      });
  }, [geoScope.effectiveGeoUnitId]);

  // Trigger data fetches on parameter change
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchTickets(), fetchStats()]);
    setIsRefreshing(false);
  };

  const handleGeoChange = (newGeo) => {
    setGeoScope(newGeo);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setSortBy('created_at_desc');
    setCurrentPage(1);
  };

  const handleTicketUpdatedInModal = (updatedTicket) => {
    setTickets(prev => prev.map(t => t.complaint_id === updatedTicket.complaint_id ? updatedTicket : t));
    fetchStats();
  };


  const [keyPrompt, setKeyPrompt] = useState(null);
  const keyDialogRef = useDialog(!!keyPrompt, () => setKeyPrompt(null));

  const submitAdminKey = async (e) => {
    e.preventDefault();
    const key = new FormData(e.currentTarget).get('admin_key');
    if (!key || !keyPrompt) return;
    // sessionStorage: the key is forgotten when the tab closes, unlike localStorage.
    sessionStorage.setItem('civiclens_admin_key', key);
    try {
      await complaintsApi.deleteComplaint(keyPrompt.ticketId, key);
      setKeyPrompt(null);
      await Promise.all([fetchTickets(), fetchStats()]);
    } catch (retryErr) {
      sessionStorage.removeItem('civiclens_admin_key');
      setKeyPrompt({ ...keyPrompt, error: `That key did not work: ${retryErr.message}` });
    }
  };

  const handleDeleteTicket = async (ticket) => {
    const id = ticket.complaint_id || ticket.id;
    const confirmDelete = window.confirm(`Are you sure you want to delete Ticket #${id}? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      await complaintsApi.deleteComplaint(id);
      await Promise.all([fetchTickets(), fetchStats()]);
    } catch (err) {
      if (err.status === 401) {
        setKeyPrompt({ ticketId: id, error: null });
      } else {
        console.error(`Failed to delete ticket #${id}:`, err);
        alert(`Delete failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-[#0B0D12] light:bg-slate-50 text-slate-100 light:text-slate-900 font-sans overflow-hidden transition-colors">
      {keyPrompt && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4">
          <form ref={keyDialogRef} onSubmit={submitAdminKey} role="dialog" aria-modal="true" aria-labelledby="admin-key-heading" tabIndex={-1}
            className="w-full max-w-sm rounded-2xl bg-[#12151E] light:bg-white border border-slate-700 light:border-slate-200 p-5 space-y-3">
            <h2 id="admin-key-heading" className="text-base font-semibold">Admin key needed</h2>
            <p className="text-sm text-slate-400 light:text-slate-600">Deleting complaint #{keyPrompt.ticketId} needs the admin key. It is kept only until you close this tab.</p>
            <label htmlFor="admin-key" className="block text-sm font-medium">Admin key</label>
            <input id="admin-key" name="admin_key" type="password" autoComplete="off" data-autofocus required
              className="w-full min-h-[44px] rounded-lg border border-slate-700 light:border-slate-300 bg-transparent px-3 text-sm" />
            {keyPrompt.error && <p role="alert" className="text-sm text-rose-400 light:text-rose-700">{keyPrompt.error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setKeyPrompt(null)} className="min-h-[44px] px-4 rounded-lg text-sm">Cancel</button>
              <button type="submit" className="min-h-[44px] px-4 rounded-lg bg-crimson-700 hover:bg-crimson-800 text-white text-sm font-semibold">Delete complaint</button>
            </div>
          </form>
        </div>
      )}

      {/* 1. Centered Header Bar */}
      <AuthorityHeader
        onRefresh={handleRefreshAll}
        isRefreshing={isRefreshing}
        onBackToMap={onBackToMap}
      />

      {/* Main Dashboard Workspace (Flex container allowing table to fill full viewport height) */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        {/* 2. Geographic Scope Cascading Filters */}
        <GeographicScopeFilters
          selectedState={geoScope.state}
          selectedDistrict={geoScope.district}
          selectedCorp={geoScope.corp}
          selectedWard={geoScope.ward}
          onGeoChange={handleGeoChange}
        />

        {/* 3. Live Statistics Overview Bar */}
        <AuthorityStatsBar
          stats={stats}
          isLoading={isLoadingStats}
          error={statsError}
          onFilterByStatus={(st) => {
            setStatusFilter(st);
            setCurrentPage(1);
          }}
          activeStatus={statusFilter}
        />

        {/* 4. Collapsible Analytics Panel (Default Collapsed for maximum ticket table visibility) */}
        <AnalyticsPanel stats={stats} defaultOpen={false} />

        {/* 5. Expanded Height Ticket Data Table & Pagination Controls */}
        <TicketTable
          tickets={tickets}
          totalTickets={totalTickets}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          onStatusChange={(st) => {
            setStatusFilter(st);
            setCurrentPage(1);
          }}
          categoryFilter={categoryFilter}
          onCategoryChange={(cat) => {
            setCategoryFilter(cat);
            setCurrentPage(1);
          }}
          categoriesList={categoriesList}
          sortBy={sortBy}
          onSortChange={(sortVal) => {
            setSortBy(sortVal);
            setCurrentPage(1);
          }}
          onClearFilters={handleClearAllFilters}
          onSelectTicket={setInspectedTicket}
          isLoading={isLoadingTickets}
          error={ticketError}
          onRetry={fetchTickets}
          onDeleteTicket={handleDeleteTicket}
        />
      </div>

      {/* 6. Ticket Operational Inspection Modal */}
      {inspectedTicket && (
        <TicketDetailModal
          ticket={inspectedTicket}
          onClose={() => setInspectedTicket(null)}
          onTicketUpdated={handleTicketUpdatedInModal}
        />
      )}
    </div>
  );
}
