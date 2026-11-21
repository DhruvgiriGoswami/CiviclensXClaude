import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  findPinpointedLocation, pointInPolygon, isLocationInIndia,
  STATE_NAMES, STATE_CENTERS, findClosestStateForCoordinates,
} from '../utils/mapHelpers';
import { geographyApi } from '../services/api';
import {
  getStateInfoWindowContent,
  getWardInfoWindowContent,
  getOutsideBoundaryWarningContent
} from '../utils/mapInfoWindowTemplates';

import { useMapCamera } from '../hooks/useMapCamera';
import { useGoogleMapInit } from '../hooks/useGoogleMapInit';
import { useRedBoundaryHighlight } from '../hooks/useRedBoundaryHighlight';
import { useWardPolygons } from '../hooks/useWardPolygons';
import { useMapMarkers } from '../hooks/useMapMarkers';

import { MapControls } from './map/MapControls';
import { MapBanner } from './map/MapBanner';
import { MapLegend } from './map/MapLegend';
import { IndiaMapLoader } from './map/IndiaMapLoader';

export function MapContainer({
  units,
  selectedUnit,
  onSelectUnit,
  currentLevel,
  selectedState,
  onSelectState,
  onResetToNational,
  tickets = [],
  pinnedLocation = null,
  isPinningMode = false,
  isIntroActive = false,
  onPinLocationSelect = null,
  onStartPinning = null,
  isSidebarCollapsed = true,
  hoveredDistrict = null,
  hoveredTicketId = null,
  focusedTicketId = null,
  onInspectTicket = null,
}) {
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const isDark = theme !== 'light';

  // Geolocation state for My Location button
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isInternationalUser, setIsInternationalUser] = useState(false);

  // Check international location whenever userLocation updates
  useEffect(() => {
    if (userLocation && typeof userLocation.lat === 'number') {
      const isInIndia = isLocationInIndia(userLocation.lat, userLocation.lng);
      setIsInternationalUser(!isInIndia);
    }
  }, [userLocation]);



  // Callback Refs
  const onSelectStateRef = useRef(onSelectState);
  const onSelectUnitRef = useRef(onSelectUnit);
  const unitsRef = useRef(units);
  const selectedUnitRef = useRef(selectedUnit);
  const isPinningModeRef = useRef(isPinningMode);
  const onPinLocationSelectRef = useRef(onPinLocationSelect);

  useEffect(() => { onSelectStateRef.current = onSelectState; }, [onSelectState]);
  useEffect(() => { onSelectUnitRef.current = onSelectUnit; }, [onSelectUnit]);
  useEffect(() => { unitsRef.current = units; }, [units]);
  useEffect(() => { selectedUnitRef.current = selectedUnit; }, [selectedUnit]);
  useEffect(() => { isPinningModeRef.current = isPinningMode; }, [isPinningMode]);
  useEffect(() => { onPinLocationSelectRef.current = onPinLocationSelect; }, [onPinLocationSelect]);

  // Single Click Handler
  const handleMapClick = useCallback((latLng, map) => {
    const lat = latLng.lat();
    const lng = latLng.lng();

    // 1. Interactive Pin Placement Mode for issue reporting
    if (isPinningModeRef.current) {
      if (onPinLocationSelectRef.current) {
        onPinLocationSelectRef.current({ lat, lng });
      }
      return;
    }

    // 2. Spatial Point-in-Polygon Resolution via PostGIS Backend
    geographyApi.resolveLocation(lat, lng)
      .then((res) => {
        const unitsList = res?.units || [];
        let resolvedStateCode = null;
        let resolvedStateName = null;
        let matchedDistrict = null;
        let matchedWard = null;

        for (const u of unitsList) {
          if (u.type === 'WARD' || u.type === 'URBAN_WARD') {
            matchedWard = u;
          } else if (u.type === 'DISTRICT') {
            matchedDistrict = u;
          }
          if (u.unit_id && u.unit_id.startsWith('IN-')) {
            const parts = u.unit_id.split('-');
            if (parts.length >= 2 && parts[1].length <= 3 && !resolvedStateCode) {
              resolvedStateCode = parts[1].toUpperCase();
              if (u.type === 'STATE') {
                resolvedStateName = u.name;
              }
            }
          }
        }

        // Fallback: If no state boundary contained the point in PostGIS, resolve closest state from coordinates
        if (!resolvedStateCode) {
          const closest = findClosestStateForCoordinates(lat, lng);
          resolvedStateCode = closest.stateId;
          resolvedStateName = closest.stateName;
        } else if (!resolvedStateName) {
          resolvedStateName = STATE_NAMES[resolvedStateCode] || `State of ${resolvedStateCode}`;
        }

        // Switch to selected state
        if (onSelectStateRef.current) {
          onSelectStateRef.current({
            stateId: resolvedStateCode,
            stateName: resolvedStateName,
          });
        }

        const currentZoom = map?.getZoom() || 5;

        // If zoomed in, also select District or Ward
        if (currentZoom >= 8 && matchedDistrict && onSelectUnitRef.current) {
          onSelectUnitRef.current({
            unitId: matchedDistrict.unit_id,
            id: matchedDistrict.unit_id,
            unitName: matchedDistrict.name,
            districtName: matchedDistrict.name,
            unitType: 'DISTRICT',
            parentCityDistrict: matchedDistrict.name,
            stateId: resolvedStateCode,
            coordinates: { lat, lng },
          });
        } else if (currentZoom >= 13 && matchedWard && onSelectUnitRef.current) {
          onSelectUnitRef.current({
            unitId: matchedWard.unit_id,
            id: matchedWard.unit_id,
            unitName: matchedWard.name,
            unitType: 'WARD',
            parentCityDistrict: matchedDistrict?.name || resolvedStateName,
            stateId: resolvedStateCode,
            coordinates: { lat, lng },
          });
        }
      })
      .catch((err) => {
        console.warn('[CivicLens Map] Spatial click resolution warning:', err);
        const closest = findClosestStateForCoordinates(lat, lng);
        if (onSelectStateRef.current) {
          onSelectStateRef.current(closest);
        }
      });
  }, []);

  const googleMapRef = useRef(null);

  // 1. Google Maps Camera Hook
  const { executeCameraCommand } = useMapCamera(googleMapRef);

  // 1. Google Maps SDK Loader & Initialization Hook
  const { isMapReady, infoWindowRef, clickTimerRef } = useGoogleMapInit({
    mapRef,
    googleMapRef,
    isDark,
    onSingleClick: handleMapClick,
    executeCameraCommand,
  });

  // 4. Red Boundary Highlight Hook
  const { clearHighlightShapes, isBoundaryLoading } = useRedBoundaryHighlight({
    googleMapRef,
    isMapReady,
    currentLevel,
    selectedState,
    selectedUnit,
    executeCameraCommand,
    onSelectStateRef,
    onSelectUnitRef,
    isDark,
    isPinningMode,
    onPinLocationSelect,
    hoveredDistrict,
  });

  // 5. PostGIS DB Ward Polygon Layer Rendering Hook
  useWardPolygons({
    googleMapRef,
    isMapReady,
    selectedUnit,
    selectedState,
    isDark,
    unitsRef,
    onSelectUnitRef,
    clickTimerRef,
    isPinningMode,
    onPinLocationSelect,
  });

  // 6. Custom Ticket & Grievance Map Marker Hook
  useMapMarkers({
    googleMapRef,
    isMapReady,
    pinnedLocation,
    userLocation,
    selectedUnit,
    tickets,
    isPinningMode,
    onStartPinning,
    onPinLocationSelect,
    hoveredTicketId,
    focusedTicketId,
    onInspectTicket,
  });

  // 8. Sync State Chief Minister InfoWindow Content
  useEffect(() => {
    if (!googleMapRef.current || !selectedState || !infoWindowRef.current) return;
    if (selectedState && (selectedState.stateName || selectedState.state_name)) {
      infoWindowRef.current.setOptions({ pixelOffset: new window.google.maps.Size(0, -10) });
      infoWindowRef.current.setContent(getStateInfoWindowContent(selectedState));
    }
  }, [googleMapRef, selectedState]);

  // 9. Update Map Cursor during Pinning Mode
  useEffect(() => {
    if (!googleMapRef.current) return;
    const pinCursor = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDMyIDMyIj48ZmlsdGVyIGlkPSJzIiB4PSItMjAlIiB5PSItMjAlIiB3aWR0aD0iMTQwJSIgaGVpZ2h0PSIxNDAlIj48ZmVEcm9wU2hhZG93IGR4PSIwIiBkeT0iMiIgc3RkRGV2aWF0aW9uPSIxLjUiIGZsb29kLWNvbG9yPSIjMDAwMDAwIiBmbG9vZC1vcGFjaXR5PSIwLjYiLz48L2ZpbHRlcj48ZyBmaWx0ZXI9InVybCgjcykiPjxwYXRoIGZpbGw9IiNFNjM5NDYiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIxLjgiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xNiAzQzEwLjQ3NyAzIDYgNy40NzcgNiAxM2MwIDcuNSAxMCAxNyAxMCAxN3MxMC05LjUgMTAtMTdDMjYgNy40NzcgMjEuNTIzIDMgMTYgM3oiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjEzIiByPSIzLjUiIGZpbGw9IiNGRkZGRiIvPjwvZz48L3N2Zz4=") 20 38, crosshair`;

    googleMapRef.current.setOptions({
      draggableCursor: isPinningMode ? pinCursor : null,
      draggingCursor: isPinningMode ? pinCursor : null,
    });
  }, [isPinningMode, isMapReady]);


  // Control Event Handlers
  const handleZoomIn = () => executeCameraCommand({
    type: 'SET_ZOOM',
    zoom: Math.min(16, (googleMapRef.current?.getZoom() ?? 5) + 1),
    reason: 'ZOOM_IN_BUTTON',
  });

  const handleZoomOut = () => executeCameraCommand({
    type: 'SET_ZOOM',
    zoom: Math.max(4, (googleMapRef.current?.getZoom() ?? 5) - 1),
    reason: 'ZOOM_OUT_BUTTON',
  });

  const handleResetMap = () => {
    if (!googleMapRef.current) return;
    executeCameraCommand({
      type: 'PAN_AND_ZOOM',
      center: { lat: 22.5937, lng: 78.9629 },
      zoom: 5,
      reason: 'RESET_BUTTON',
    });
    clearHighlightShapes();
    onResetToNational();
    infoWindowRef.current?.close();
  };

  // High-Precision Watcher & Immediate Spatial Resolution for My Location Button
  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);

    let watchId = null;
    let timeoutId = null;
    let hasPaned = false;

    const cleanup = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      setIsLocating(false);
    };

    timeoutId = setTimeout(() => {
      cleanup();
    }, 5000);

    const onPositionReceived = (position) => {
      const { latitude: lat, longitude: lng, accuracy } = position.coords;
      const coords = { lat, lng };

      setUserLocation(coords);

      executeCameraCommand({
        type: 'PAN_AND_ZOOM',
        center: coords,
        zoom: 15,
        reason: 'MY_LOCATION_BUTTON_HIGH_ACCURACY',
      });
      hasPaned = true;

      geographyApi.resolveLocation(lat, lng)
        .then((res) => {
          const matchedUnit = res?.units?.find(u => u.type === 'WARD') || res?.units?.[0];
          if (matchedUnit && onSelectUnitRef.current) {
            onSelectUnitRef.current({
              ...matchedUnit,
              coordinates: coords, // Preserve exact user GPS coordinates so camera doesn't jump to DB centroid
            });
          }
        })
        .catch(() => {});

      if (accuracy <= 150 || hasPaned) {
        cleanup();
      }
    };

    const onError = (error) => {
      console.warn("Geolocation watch error, falling back to getCurrentPosition:", error.message);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          executeCameraCommand({
            type: 'PAN_AND_ZOOM',
            center: coords,
            zoom: 15,
            reason: 'MY_LOCATION_FALLBACK',
          });
          cleanup();
        },
        (err) => {
          cleanup();
          alert("Unable to retrieve your location. Please check browser location permissions.");
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    };

    watchId = navigator.geolocation.watchPosition(
      onPositionReceived,
      onError,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [executeCameraCommand]);

  return (
    <div className={`relative flex-1 w-full h-full overflow-hidden select-none ${isPinningMode ? 'pinning-mode' : ''}`}>
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* 9. Floating Map Controls Component */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetMap={handleResetMap}
        onLocateUser={handleLocateUser}
        isLocating={isLocating}
        userLocation={userLocation}
        isIntroActive={isIntroActive}
      />

      {/* 9. Instructional Top Navigation Banner Component */}
      {!isPinningMode && (
        <MapBanner
          currentLevel={currentLevel}
          selectedState={selectedState}
          selectedUnit={selectedUnit}
          onSelectUnit={onSelectUnit}
          isSidebarCollapsed={isSidebarCollapsed}
          googleMapRef={googleMapRef}
          isMapReady={isMapReady}
        />
      )}

      {/* 9. GBA Corporation Ward Legend Overlay Component */}
      <MapLegend
        selectedUnit={selectedUnit}
        selectedState={selectedState}
      />

      {/* 10. Sovereign Border Loader for Asynchronous Geographical Data Loading & Geolocation */}
      {(isBoundaryLoading || isLocating) && (
        <IndiaMapLoader
          message={isLocating ? "Acquiring Precise Location..." : "Loading Geographical Boundaries..."}
          isOverlay={true}
        />
      )}

      {/* 11. International Visitor Greeting Banner */}
      {isInternationalUser && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-red-500/40 flex items-center gap-3.5 max-w-lg text-center animate-fade-in">
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">CivicLens is Made for India</span>
            <span className="text-xs font-semibold text-slate-100 flex items-center gap-1 mt-0.5">
              Thanks for visiting from outside India.
            </span>
          </div>
          <button
            onClick={() => setIsInternationalUser(false)}
            className="ml-3 text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

