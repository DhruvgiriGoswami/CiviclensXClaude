import { useCallback, useRef } from 'react';
import { mapDebug } from '../utils/mapDebug';
import { fitCamera, cameraAt, flightMs } from '../utils/cameraMath';

const EVEN_PAD = { top: 48, right: 48, bottom: 48, left: 48 };
const toLiteral = (p) => (typeof p?.lat === 'function' ? { lat: p.lat(), lng: p.lng() } : p);
const toBounds = (b) => (typeof b?.toJSON === 'function' ? b.toJSON() : b);
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useMapCamera(googleMapRef) {
  const stopFlightRef = useRef(null);

  // One animated camera move. A new move, a drag or a wheel stops the one in flight,
  // and the next one starts from wherever the camera is.
  const flyTo = useCallback((map, target) => {
    stopFlightRef.current?.();
    const move = (cam) => (typeof map.moveCamera === 'function'
      ? map.moveCamera(cam)
      : (map.setCenter(cam.center), map.setZoom(cam.zoom)));
    const c = map.getCenter();
    if (!c || reducedMotion()) { move(target); return; }
    const from = { center: toLiteral(c), zoom: map.getZoom() ?? target.zoom };
    const ms = flightMs(from, target);
    const t0 = performance.now();
    let raf = 0;
    const g = window.google.maps;
    const drag = g.event.addListener(map, 'dragstart', () => stop());
    const div = map.getDiv();
    const stop = () => {
      cancelAnimationFrame(raf);
      g.event.removeListener(drag);
      div.removeEventListener('wheel', stop);
      if (stopFlightRef.current === stop) stopFlightRef.current = null;
    };
    div.addEventListener('wheel', stop, { passive: true });
    stopFlightRef.current = stop;
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      move(cameraAt(from, target, t));
      if (t < 1) raf = requestAnimationFrame(frame); else stop();
    };
    raf = requestAnimationFrame(frame);
  }, []);

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
      flyTo(map, { center: toLiteral(center), zoom });
    } else if (type === 'FIT_BOUNDS' && bounds) {
      const b = toBounds(bounds);
      if (typeof zoom === 'number') {
        flyTo(map, { center: { lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 }, zoom });
      } else {
        const div = map.getDiv();
        flyTo(map, fitCamera(b, { width: div.clientWidth, height: div.clientHeight }, padding || EVEN_PAD));
      }
    } else if (type === 'SET_ZOOM' && typeof zoom === 'number') {
      stopFlightRef.current?.();
      map.setZoom(zoom);
    } else if (type === 'PAN_TO' && center) {
      stopFlightRef.current?.();
      map.panTo(center);
    }
  }, [googleMapRef, flyTo]);

  return { executeCameraCommand };
}
