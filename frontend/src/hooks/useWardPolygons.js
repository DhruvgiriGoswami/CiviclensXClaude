import { useEffect, useRef, useMemo, useCallback } from 'react';
import { geographyApi } from '../services/api';
import { wardGeometryCache } from '../services/mapGeometryCache';
import { mapDebug, generateRequestId } from '../utils/mapDebug';

export function useWardPolygons({
  googleMapRef,
  isMapReady,
  selectedUnit,
  selectedState,
  isDark,
  unitsRef,
  onSelectUnitRef,
  clickTimerRef,
  isPinningMode = false,
  onPinLocationSelect = null,
}) {
  const wardRequestGenRef = useRef(0);
  const wardAbortControllerRef = useRef(null);
  const wardPolygonsMapRef = useRef(new Map());

  const isPinningModeRef = useRef(isPinningMode);
  const onPinLocationSelectRef = useRef(onPinLocationSelect);

  useEffect(() => { isPinningModeRef.current = isPinningMode; }, [isPinningMode]);
  useEffect(() => { onPinLocationSelectRef.current = onPinLocationSelect; }, [onPinLocationSelect]);

  // Determine active target cityId for ward geometry loading (validated against selectedState)
  const activeCityId = useMemo(() => {
    const selStateCode = selectedState?.stateId ? selectedState.stateId.replace(/^IN-/, '') : null;

    if (selectedUnit?.unitId) {
      const unitStCode = selectedUnit.stateId ? selectedUnit.stateId.replace(/^IN-/, '') : selectedUnit.unitId.split('-')[1];
      if (!selStateCode || unitStCode === selStateCode) {
        const uId = selectedUnit.unitId;
        if (uId.includes('-WARD-')) {
          return uId.split('-WARD-')[0];
        }
        if (selectedUnit.unitType === 'MUNICIPAL_CORPORATION' || uId.includes('-BMC-BHAVNAGAR') || !uId.includes('-DIST-')) {
          return uId;
        }
        const parts = uId.split('-');
        if (parts.length >= 3) {
          return parts.slice(0, 3).join('-');
        }
      }
    }
    if (selStateCode) {
      return `IN-${selStateCode}`;
    }
    return null;
  }, [selectedUnit?.unitId, selectedUnit?.unitType, selectedUnit?.stateId, selectedState?.stateId]);

  // Helper to clear existing ward polygons safely
  const clearWardPolygons = useCallback(() => {
    wardPolygonsMapRef.current.forEach(({ polygon }) => {
      if (polygon && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(polygon);
      }
      if (polygon && typeof polygon.setMap === 'function') {
        polygon.setMap(null);
      }
    });
    wardPolygonsMapRef.current.clear();
  }, []);

  // 1. Ward Geometry Lifecycle Effect
  useEffect(() => {
    clearWardPolygons();
    if (!googleMapRef.current || !window.google || !isMapReady || !activeCityId) return;
    const map = googleMapRef.current;

    const generation = ++wardRequestGenRef.current;
    const requestId = generateRequestId('ward-fetch');

    if (wardAbortControllerRef.current) {
      wardAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    wardAbortControllerRef.current = abortController;

    const renderNormalizedWards = (normalizedList) => {
      if (generation !== wardRequestGenRef.current) {
        mapDebug({ event: 'WARD_REQUEST_STALE', generation, currentGeneration: wardRequestGenRef.current, requestId });
        return;
      }

      mapDebug({ event: 'WARD_RENDER_START', count: normalizedList.length, activeCityId, requestId });
      const renderStart = performance.now();

      normalizedList.forEach((wardData) => {
        const { unitId, wardName, corpName, stateCode, paths } = wardData;

        let polyFillColor = isDark ? '#0284C7' : '#2563EB';
        let polyStrokeColor = isDark ? '#38BDF8' : '#1D4ED8';
        let polyFillOpacity = 0.20;
        let polyStrokeOpacity = 0.85;
        let polyStrokeWeight = 1.8;

        if (unitId.startsWith('IN-KA-BBMP') || corpName) {
          const corpColors = {
            'North': { fill: '#2563EB', stroke: '#1D4ED8' },
            'South': { fill: '#059669', stroke: '#047857' },
            'East': { fill: '#DC2626', stroke: '#B91C1C' },
            'West': { fill: '#D97706', stroke: '#B45309' },
            'Central': { fill: '#7C3AED', stroke: '#6D28D9' }
          };
          const cObj = corpColors[corpName] || (unitId.includes('-North-') ? corpColors['North'] : unitId.includes('-South-') ? corpColors['South'] : unitId.includes('-East-') ? corpColors['East'] : unitId.includes('-West-') ? corpColors['West'] : unitId.includes('-Central-') ? corpColors['Central'] : null);
          if (cObj) {
            polyFillColor = cObj.fill;
            polyStrokeColor = cObj.stroke;
            polyFillOpacity = 0.38;
            polyStrokeOpacity = 0.90;
            polyStrokeWeight = 1.8;
          }
        }

        if (unitId.startsWith('IN-GJ-BMC-BHAVNAGAR')) {
          const bhvPalette = [
            { fill: '#6366F1', stroke: '#4338CA' },
            { fill: '#2563EB', stroke: '#1D4ED8' },
            { fill: '#10B981', stroke: '#047857' },
            { fill: '#F59E0B', stroke: '#B45309' },
            { fill: '#8B5CF6', stroke: '#6D28D9' },
            { fill: '#EC4899', stroke: '#BE185D' },
            { fill: '#14B8A6', stroke: '#0F766E' },
            { fill: '#EF4444', stroke: '#B91C1C' },
            { fill: '#F97316', stroke: '#C2410C' },
            { fill: '#84CC16', stroke: '#4D7C0F' },
            { fill: '#06B6D4', stroke: '#0891B2' },
            { fill: '#A855F7', stroke: '#7E22CE' },
            { fill: '#EAB308', stroke: '#A16207' }
          ];
          const wNum = parseInt(unitId.split('-').pop() || '1') - 1;
          const col = bhvPalette[wNum % bhvPalette.length];
          polyFillColor = col.fill;
          polyStrokeColor = col.stroke;
          polyFillOpacity = 0.40;
          polyStrokeOpacity = 0.90;
          polyStrokeWeight = 1.8;
        }

        const polygon = new window.google.maps.Polygon({
          paths,
          strokeColor: polyStrokeColor,
          strokeOpacity: polyStrokeOpacity,
          strokeWeight: polyStrokeWeight,
          fillColor: polyFillColor,
          fillOpacity: polyFillOpacity,
          clickable: true,
          zIndex: 6,
          map: map,
        });

        polygon.addListener('mouseover', () => {
          polygon.setOptions({
            fillOpacity: Math.min(0.65, polyFillOpacity + 0.25),
            strokeWeight: polyStrokeWeight + 1,
            strokeOpacity: 1.0
          });
        });

        polygon.addListener('mouseout', () => {
          polygon.setOptions({
            fillOpacity: polyFillOpacity,
            strokeWeight: polyStrokeWeight,
            strokeOpacity: polyStrokeOpacity
          });
        });

        polygon.addListener('click', (e) => {
          if (isPinningModeRef.current) {
            if (onPinLocationSelectRef.current && e && e.latLng) {
              onPinLocationSelectRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            }
            return;
          }
          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
          }
          const latLng = e.latLng;
          clickTimerRef.current = setTimeout(() => {
            clickTimerRef.current = null;
            const lat = latLng ? latLng.lat() : paths[0].lat;
            const lng = latLng ? latLng.lng() : paths[0].lng;

            geographyApi
              .resolveLocation(lat, lng, { requestId })
              .then((res) => {
                const wardMatch = res?.units?.find((u) => u.type === 'WARD') || res?.units?.[0];
                const targetUnitId = wardMatch?.unit_id || unitId;
                
                const matchedRegisteredUnit = (unitsRef.current || []).find((u) => u.unitId === targetUnitId || u.unitId === unitId);
                if (matchedRegisteredUnit) {
                  if (onSelectUnitRef.current) {
                    onSelectUnitRef.current({ ...matchedRegisteredUnit, coordinates: { lat, lng } });
                  }
                  if (latLng) map.panTo(latLng);
                  return;
                }

                const isDist = targetUnitId.includes('-DIST-') || wardMatch?.type === 'DISTRICT' || unitId.includes('-DIST-');
                const clickedUnit = {
                  unitId: targetUnitId,
                  unitName: wardMatch?.name || wardName,
                  unitType: isDist ? 'DISTRICT' : (wardMatch?.type || 'URBAN_WARD'),
                  parentCityDistrict: wardMatch?.parent_unit_id || `${unitId.split('-')[2] || 'Municipal'} Corporation Region`,
                  stateId: stateCode,
                  coordinates: { lat, lng }
                };

                if (onSelectUnitRef.current) {
                  onSelectUnitRef.current(clickedUnit);
                }
              })
              .catch(() => {
                const matchedRegisteredUnit = (unitsRef.current || []).find((u) => u.unitId === unitId);
                if (matchedRegisteredUnit) {
                  if (onSelectUnitRef.current) {
                    onSelectUnitRef.current({ ...matchedRegisteredUnit, coordinates: { lat, lng } });
                  }
                  if (latLng) map.panTo(latLng);
                  return;
                }
                const isBLR = unitId.startsWith('IN-KA-BBMP') || stateCode === 'KA';
                const isDistFallback = unitId.includes('-DIST-');
                const fallbackUnit = {
                  unitId,
                  unitName: wardName,
                  unitType: isDistFallback ? 'DISTRICT' : 'URBAN_WARD',
                  parentCityDistrict: `${unitId} Region`,
                  stateId: stateCode,
                  isElectionUpcoming: isBLR,
                  coordinates: { lat, lng },
                };
                if (onSelectUnitRef.current) {
                  onSelectUnitRef.current(fallbackUnit);
                }
              });

            if (latLng) {
              map.panTo(latLng);
            }
          }, 250);
        });

        wardPolygonsMapRef.current.set(unitId, {
          polygon,
          baseOptions: {
            fillColor: polyFillColor,
            strokeColor: polyStrokeColor,
            fillOpacity: polyFillOpacity,
            strokeOpacity: polyStrokeOpacity,
            strokeWeight: polyStrokeWeight,
          },
        });
      });

      const renderDuration = performance.now() - renderStart;
      mapDebug({ event: 'WARD_RENDER_END', activeCityId, durationMs: renderDuration.toFixed(2), requestId });
    };

    // Check Geometry Cache first (0ms network delay!)
    if (wardGeometryCache.has(activeCityId)) {
      mapDebug({ event: 'WARD_CACHE_HIT', activeCityId, requestId });
      renderNormalizedWards(wardGeometryCache.get(activeCityId));
      return;
    }

    mapDebug({ event: 'WARD_FETCH_START', activeCityId, requestId });
    const fetchStart = performance.now();

    geographyApi
      .getWardsForCity(activeCityId, { signal: abortController.signal, requestId })
      .then((fc) => {
        if (generation !== wardRequestGenRef.current) {
          mapDebug({ event: 'WARD_REQUEST_STALE', generation, currentGeneration: wardRequestGenRef.current, requestId });
          return;
        }

        const fetchDuration = performance.now() - fetchStart;
        mapDebug({ event: 'WARD_FETCH_END', activeCityId, durationMs: fetchDuration.toFixed(2), requestId });

        const normalized = wardGeometryCache.normalizeFeatureCollection(fc);
        wardGeometryCache.set(activeCityId, normalized);
        renderNormalizedWards(normalized);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          mapDebug({ event: 'WARD_REQUEST_ABORTED', activeCityId, requestId });
        } else {
          console.warn(`[CivicLens DB] Error loading ward polygons for ${activeCityId}:`, err.message);
        }
      });

    return () => {
      if (wardAbortControllerRef.current) {
        wardAbortControllerRef.current.abort();
      }
    };
  }, [activeCityId, clickTimerRef, googleMapRef, isDark, isMapReady, onSelectUnitRef, unitsRef]);

  // 2. Ward Selection Styling Effect (Lightweight styling change, NO re-fetching!)
  useEffect(() => {
    const selUnitId = selectedUnit?.unitId;
    const selUnitName = selectedUnit?.unitName?.toLowerCase();

    wardPolygonsMapRef.current.forEach(({ polygon, baseOptions }, unitId) => {
      const isSelectedWard = selUnitId && (
        selUnitId === unitId ||
        (selUnitName && unitId.toLowerCase().includes(selUnitName))
      );

      if (isSelectedWard) {
        polygon.setOptions({
          fillColor: '#EF4444',
          strokeColor: '#DC2626',
          fillOpacity: 0.45,
          strokeOpacity: 1.0,
          strokeWeight: 3.0,
          zIndex: 12,
        });
      } else {
        polygon.setOptions({
          fillColor: baseOptions.fillColor,
          strokeColor: baseOptions.strokeColor,
          fillOpacity: baseOptions.fillOpacity,
          strokeOpacity: baseOptions.strokeOpacity,
          strokeWeight: baseOptions.strokeWeight,
          zIndex: 6,
        });
      }
    });
  }, [selectedUnit?.unitId, selectedUnit?.unitName]);
}
