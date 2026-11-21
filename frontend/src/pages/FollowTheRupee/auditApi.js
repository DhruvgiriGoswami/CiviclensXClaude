import { API_BASE_URL } from '../../services/api';

// VITE_AUDIT_MOCK=1 forces the mock. Otherwise we try the API and fall back to the mock
// when the server cannot be reached (network error). A real 404 stays a 404.
const FORCE_MOCK = import.meta.env.VITE_AUDIT_MOCK === '1';
let useMock = FORCE_MOCK;
const listeners = new Set();

export const isUsingMock = () => useMock;
export const onSourceChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

async function viaMock(path, body) {
  const { handleMock } = await import('./mockApi');
  return handleMock(path, body);
}

async function call(path, body) {
  if (useMock) return viaMock(path, body);
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/audit${path}`, body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : undefined);
  } catch {
    useMock = true;
    listeners.forEach((fn) => fn(true));
    return viaMock(path, body);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.detail || `The server answered ${res.status}.`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Ward codes contain "/" and go into the path raw, as the contract says.
export const auditApi = {
  overview: () => call('/overview'),
  wards: () => call('/wards'),
  geojson: () => call('/wards.geojson'),
  ward: (code) => call(`/wards/${code}`),
  nextRupee: (code) => call(`/next-rupee/${code}`),
  complaintPoints: () => call('/complaints'),
  complaintTickets: () => call('/complaint-tickets'),
  socialPosts: (limit = 10, offset = 0) => call(`/social-posts?limit=${limit}&offset=${offset}`),
  upvote: (id) => call(`/complaints/${encodeURIComponent(id)}/upvote`, {}),
  complaint: (id) => call(`/complaints/${encodeURIComponent(id)}`),
  search: (q) => call(`/search?q=${encodeURIComponent(q)}`),
  ask: (question, extra = {}) => call('/ask', { question, complaint_id: null, ward_code: null, ...extra }),
  summary: (code) => call(`/wards/${code}/summary`, {}),
  flagsCsvUrl: (ward) => `${API_BASE_URL}/audit/export/flags.csv${ward ? `?ward=${encodeURIComponent(ward)}` : ''}`,
};
