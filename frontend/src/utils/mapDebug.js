/**
 * CivicLens Map Diagnostics & Build Version Utility
 * Provides structured map event logging for SIT / Localhost troubleshooting.
 */

export const isMapDebugEnabled = () => {
  if (typeof window === 'undefined') return false;
  return (
    import.meta.env.VITE_MAP_DEBUG === 'true' ||
    new URLSearchParams(window.location.search).get('mapDebug') === 'true'
  );
};

export const frontendVersion = {
  environment: import.meta.env.MODE || 'development',
  commit: import.meta.env.VITE_COMMIT_SHA || 'dev-local',
  buildTime: import.meta.env.VITE_BUILD_TIME || '2026-09-20-local',
};

let requestIdCounter = 0;
export const generateRequestId = (prefix = 'req') => {
  return `${prefix}-${Date.now().toString(36)}-${(++requestIdCounter).toString(36)}`;
};

export const mapDebug = (payload) => {
  if (!isMapDebugEnabled()) return;
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[CivicLens MapDebug ${time}] [${payload.event || 'EVENT'}]`, {
    ...payload,
    version: frontendVersion,
  });
};
