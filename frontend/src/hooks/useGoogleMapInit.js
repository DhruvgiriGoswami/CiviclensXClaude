import { useState, useEffect, useRef } from 'react';
import { buildMapStyles, isInsideIndia, fitIndia } from '../utils/mapHelpers';
import { mapDebug } from '../utils/mapDebug';

export function useGoogleMapInit({
  mapRef,
  googleMapRef: externalGoogleMapRef,
  isDark,
  onSingleClick,
  executeCameraCommand,
}) {
  const [isMapReady, setIsMapReady] = useState(false);
  const internalGoogleMapRef = useRef(null);
  const googleMapRef = externalGoogleMapRef || internalGoogleMapRef;
  const infoWindowRef = useRef(null);
  const clickTimerRef = useRef(null);

  useEffect(() => {
    if (googleMapRef.current) return;


    let pollInterval = null;

    const tryInitMap = () => {
      if (googleMapRef.current) return true;
      if (!mapRef.current || !window.google || !window.google.maps) return false;

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          // No mapId: a cloud map style would override the muted `styles` below, and no AdvancedMarker needs one.
          center: { lat: 22.5937, lng: 78.9629 },
          zoom: 5,
          minZoom: 3,
          maxZoom: 16,
          isFractionalZoomEnabled: true, // lets the camera animate through in-between zooms on this raster map
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: buildMapStyles(isDark),
          restriction: {
            latLngBounds: {
              north: 38.5,
              south: 5.5,
              west: 67.0,
              east: 98.5,
            },
            strictBounds: false,
          },
        });

        // The map div has its real size only after the first idle, so fit India then.
        window.google.maps.event.addListenerOnce(map, 'idle', () => fitIndia(map));

        googleMapRef.current = map;
        infoWindowRef.current = new window.google.maps.InfoWindow();

        mapDebug({ event: 'MAP_INIT', timestamp: Date.now() });

        // Single click event (delayed to allow double-click cancellation)
        map.addListener('click', (event) => {
          if (typeof event.stop === 'function') {
            event.stop();
          }
          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
          }
          clickTimerRef.current = setTimeout(() => {
            clickTimerRef.current = null;
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            if (!isInsideIndia(lat, lng)) return;
            if (onSingleClick) onSingleClick(event.latLng, map);
          }, 250);
        });

        // Double click event (zoom in map naturally, cancels single click)
        map.addListener('dblclick', (event) => {
          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
          }
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          if (!isInsideIndia(lat, lng)) return;
          const currentZoom = map.getZoom() || 5;
          if (executeCameraCommand) {
            executeCameraCommand({
              type: 'PAN_AND_ZOOM',
              center: event.latLng,
              zoom: Math.min(16, currentZoom + 1),
              reason: 'MAP_DOUBLE_CLICK',
            });
          }
        });

        setIsMapReady(true);

        setTimeout(() => {
          if (googleMapRef.current && window.google?.maps?.event) {
            window.google.maps.event.trigger(googleMapRef.current, 'resize');
          }
        }, 300);

        return true;
      } catch (err) {
        console.warn("[CivicLens Map] Map init error:", err);
        return false;
      }
    };

    if (!tryInitMap()) {
      pollInterval = setInterval(() => {
        if (tryInitMap()) {
          clearInterval(pollInterval);
        }
      }, 100);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, [executeCameraCommand, isDark, mapRef, onSingleClick]);

  // Theme changes restyle the existing map instead of waiting for a reload.
  useEffect(() => {
    googleMapRef.current?.setOptions({ styles: buildMapStyles(isDark) });
  }, [googleMapRef, isDark]);

  return {
    isMapReady,
    googleMapRef,
    infoWindowRef,
    clickTimerRef,
  };
}
