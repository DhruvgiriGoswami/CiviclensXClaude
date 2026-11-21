import { useCallback } from 'react';
import { mapDebug } from '../utils/mapDebug';

export function useMapCamera(googleMapRef) {
  const executeCameraCommand = useCallback((command) => {
    if (!googleMapRef.current || !window.google) return;
    const map = googleMapRef.current;
    if (typeof map.panTo !== 'function') return;

    const { type, center, zoom, bounds, padding, reason } = command;

    mapDebug({
      event: 'CAMERA_COMMAND',
      reason: reason || 'GENERAL',
      type,
      center,
      zoom,
      timestamp: Date.now(),
    });

    if (type === 'PAN_AND_ZOOM' && center && typeof zoom === 'number') {
      map.panTo(center);
      map.setZoom(zoom);
    } else if (type === 'FIT_BOUNDS' && bounds) {
      if (typeof zoom === 'number') {
        const bCenter = bounds.getCenter();
        map.panTo(bCenter);
        map.setZoom(zoom);
      } else {
        map.fitBounds(bounds, padding || { top: 40, right: 260, bottom: 40, left: 40 });
      }
    } else if (type === 'SET_ZOOM' && typeof zoom === 'number') {
      map.setZoom(zoom);
    } else if (type === 'PAN_TO' && center) {
      map.panTo(center);
    }
  }, [googleMapRef]);

  return { executeCameraCommand };
}
