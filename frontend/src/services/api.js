/**
 * CivicLens API Client Service
 * Connects frontend React components to FastAPI backend v1 endpoints (http://localhost:8000/api/v1)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const headers = { ...options.headers };
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.requestId && !headers['X-Request-ID']) {
    headers['X-Request-ID'] = options.requestId;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && !isFormData && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || `HTTP Error ${response.status}: ${response.statusText}`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (!options.silent) {
      console.warn(`[CivicLens API] Call failed for ${endpoint}:`, err.message);
    }
    throw err;
  }
}

// ----------------------------------------------------
// 1. Geography API
// ----------------------------------------------------
export const geographyApi = {
  /** Get all Municipal Corporations provisioned in PostgreSQL DB */
  getCorporations: (options = {}) => request('/geo-units/corporations', options),

  /** List geo units with optional filters (e.g. unit_type_id=WARD, state_code=MH) */
  getGeoUnits: (params = {}, options = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/geo-units${query ? `?${query}` : ''}`, options);
  },

  /** Get GeoJSON boundary feature for a unit */
  getBoundaryGeoJson: (unitId, options = {}) => request(`/geo-units/${encodeURIComponent(unitId)}/boundary`, { silent: true, ...options }).catch(() => null),

  /** Get political representatives (ward holders) assigned to a unit */
  getRepresentatives: (unitId, options = {}) => request(`/geo-units/${encodeURIComponent(unitId)}/representatives`, options),

  /** Resolve GPS point to containing units */
  resolveLocation: (latitude, longitude, options = {}) => request('/geography/resolve', {
    method: 'POST',
    body: { latitude, longitude },
    ...options,
  }),

  /** Get GeoJSON FeatureCollection of all wards for a city */
  getWardsForCity: (cityId, options = {}) => request(`/map/wards?city_id=${encodeURIComponent(cityId)}`, options),
};

// ----------------------------------------------------
// 2. Complaints API
// ----------------------------------------------------
export const complaintsApi = {
  /** List complaints with optional filters (geo_unit_id, category, status, search, sort_by, page, page_size) */
  listComplaints: (params = {}) => {
    // Filter out undefined / null / empty string parameters
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return request(`/complaints${query ? `?${query}` : ''}`);
  },

  /** Get aggregate complaint stats, optionally filtered by geo_unit_id */
  getStats: (geoUnitId = null, options = {}) => {
    const query = geoUnitId ? `?geo_unit_id=${encodeURIComponent(geoUnitId)}` : '';
    return request(`/complaints/stats${query}`, options);
  },

  /** Get distinct categories list */
  getCategories: (options = {}) => request('/complaints/categories', options),

  /** Submit a new complaint */
  createComplaint: (payload) => request('/complaints', {
    method: 'POST',
    body: payload,
  }),

  /** Upvote a complaint (increment counter persistently in DB) */
  upvoteComplaint: (complaintId) => request(`/complaints/${complaintId}/upvote`, {
    method: 'POST',
  }),

  /** Upload photo/video attachment for complaint */
  uploadMedia: async (complaintId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/complaints/${complaintId}/media`, {
      method: 'POST',
      headers: {}, // Let browser set multipart boundary
      body: formData,
    });
  },

  /** Delete a single complaint (Protected by Admin API Key) */
  deleteComplaint: (complaintId, adminKey) => {
    // Never bundle a key: whatever is in the JS ships to every visitor.
    const key = adminKey || sessionStorage.getItem('civiclens_admin_key') || '';
    return request(`/complaints/${complaintId}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Key': key,
      },
    });
  },

};

// ----------------------------------------------------
// 3. Authority & Leadership API
// ----------------------------------------------------
export const authorityApi = {
  /** Get political representatives for a unit */
  getPoliticalRepresentatives: (geoUnitId) => {
    if (!geoUnitId) return Promise.resolve([]);
    return request(`/geo-units/${encodeURIComponent(geoUnitId)}/political-representatives`);
  },

  /** Alias getOfficers */
  getOfficers: (geoUnitId) => {
    if (!geoUnitId) return Promise.resolve([]);
    return request(`/geo-units/${encodeURIComponent(geoUnitId)}/officers`);
  },

  /** Submit rating for a political or administrative leader */
  rateRepresentative: (payload) => request('/representatives/rate', {
    method: 'POST',
    body: payload,
  }),

  /** Get all verified citizen feedbacks and reviews for a leader */
  getLeaderFeedbacks: (leaderName, leaderId) => {
    const params = new URLSearchParams();
    if (leaderName) params.append('leader_name', leaderName);
    if (leaderId) params.append('leader_id', leaderId);
    return request(`/representatives/feedbacks?${params.toString()}`);
  },

  /** Get global ratings summary for all leaders */
  getRatingsSummary: () => request('/representatives/ratings-summary'),
};

// ----------------------------------------------------
// 7. Governance API
// ----------------------------------------------------
export const governanceApi = {
  /** Get CM leadership for all States & UTs */
  getStatesLeadership: () => request('/governance/states'),

  /** Get CM leadership for a specific state (e.g. GJ, MH) */
  getStateLeadership: (stateId) => request(`/governance/states/${encodeURIComponent(stateId)}`),

  /** Get all District Collectors, optionally filtered by state */
  getCollectors: (stateId) => request(`/governance/collectors${stateId ? `/${encodeURIComponent(stateId)}` : ''}`),

  /** Get National & Apex Institutional Leaders (PM, President, RBI Governor, CAG) */
  getNationalLeaders: () => request('/governance/national'),
};

// ----------------------------------------------------
// 8. Search API
// ----------------------------------------------------
export const searchApi = {
  /** PostgreSQL GIN-indexed trigram fuzzy search across all entities */
  searchFuzzy: (query, limit = 20) => request(`/search/fuzzy?q=${encodeURIComponent(query)}&limit=${limit}`),
};

// ----------------------------------------------------
// 9. System / Healthcheck API
// ----------------------------------------------------
export const systemApi = {
  /** Check if FastAPI backend service is online & responsive via /health endpoint */
  checkHealth: async () => {
    const healthUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/health';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return data.status === 'ok' || data.status === 'degraded';
      }
      return false;
    } catch {
      return false;
    }
  },
};
