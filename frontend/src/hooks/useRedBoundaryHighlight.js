import { useRef, useCallback, useEffect, useState } from 'react';
import { geographyApi } from '../services/api';
import { mapDebug } from '../utils/mapDebug';
import { boundsOf } from '../utils/cameraMath';
import { createDistrictLabels } from '../utils/mapLabels';
import { wardGeometryCache } from '../services/mapGeometryCache';
import { extractPathsFromGeoJson, getLoadedStateDistrictsData, STATE_CENTERS, fitIndia, buildMapStyles, addHoverHighlight } from '../utils/mapHelpers';

export function useRedBoundaryHighlight({
  googleMapRef,
  isMapReady,
  currentLevel,
  selectedState,
  selectedUnit,
  executeCameraCommand,
  onSelectStateRef,
  onSelectUnitRef,
  isDark,
  isPinningMode = false,
  onPinLocationSelect = null,
  hoveredDistrict = null,
}) {
  const [isBoundaryLoading, setIsBoundaryLoading] = useState(false);
  const highlightShapesRef = useRef([]);
  const districtPolygonsMapRef = useRef([]);
  const highlightRequestIdRef = useRef(0);
  const isPinningModeRef = useRef(isPinningMode);
  const onPinLocationSelectRef = useRef(onPinLocationSelect);

  useEffect(() => { isPinningModeRef.current = isPinningMode; }, [isPinningMode]);
  useEffect(() => { onPinLocationSelectRef.current = onPinLocationSelect; }, [onPinLocationSelect]);

  const clearHighlightShapes = useCallback(() => {
    highlightShapesRef.current.forEach((shape) => {
      if (shape && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(shape);
      }
      if (shape && typeof shape.setMap === 'function') {
        shape.setMap(null);
      }
    });
    highlightShapesRef.current = [];
    districtPolygonsMapRef.current = [];
  }, []);

  // Effect to update district polygon style when hovering over district in sidebar
  useEffect(() => {
    if (!googleMapRef.current || !districtPolygonsMapRef.current.length) return;
    const normString = (s) => (s || '').toUpperCase().replace(/[\s\-_]+/g, '');
    const targetNorm = normString(hoveredDistrict);

    districtPolygonsMapRef.current.forEach(({ name, distId, polygons, isSelected }) => {
      if (isSelected) return; // Keep selected district highlight unchanged
      const isMatched = targetNorm && (
        name === targetNorm ||
        name.includes(targetNorm) ||
        targetNorm.includes(name) ||
        (distId && (distId === targetNorm || distId.includes(targetNorm) || targetNorm.includes(distId)))
      );

      polygons.forEach(p => {
        if (isMatched) {
          p.setOptions({
            fillColor: '#EF4444',
            fillOpacity: 0.55,
            strokeColor: '#DC2626',
            strokeWeight: 3.0,
            strokeOpacity: 1.0,
            zIndex: 25
          });
        } else {
          p.setOptions({
            fillColor: isDark ? '#0284C7' : '#2563EB',
            fillOpacity: 0.15,
            strokeColor: isDark ? '#38BDF8' : '#1D4ED8',
            strokeWeight: 1.5,
            strokeOpacity: 0.80,
            zIndex: 3
          });
        }
      });
    });
  }, [hoveredDistrict, isDark]);

  const updateRedBoundaryHighlight = useCallback((stateId, unit) => {
    if (!googleMapRef.current || !window.google) return;
    const map = googleMapRef.current;

    const currentReqId = ++highlightRequestIdRef.current;
    clearHighlightShapes();

    const fitMapBoundsToPaths = (pathsList, options = {}) => {
      if (!pathsList || pathsList.length === 0 || !window.google) return false;
      const bounds = new window.google.maps.LatLngBounds();
      let count = 0;

      const addPoint = (pt) => {
        if (pt && typeof pt.lat === 'number' && typeof pt.lng === 'number') {
          bounds.extend(pt);
          count++;
        }
      };

      const processPath = (item) => {
        if (!item) return;
        if (typeof item.lat === 'number' && typeof item.lng === 'number') {
          addPoint(item);
        } else if (Array.isArray(item)) {
          item.forEach(sub => processPath(sub));
        }
      };

      pathsList.forEach(p => processPath(p));

      if (count > 0) {
        executeCameraCommand({
          type: 'FIT_BOUNDS',
          bounds,
          zoom: options.targetZoom,
          padding: options.padding,
          reason: 'FIT_BOUNDS_HIGHLIGHT',
        });
        return true;
      }
      return false;
    };

    const drawSinglePoly = (pathCoords) => {
      if (currentReqId !== highlightRequestIdRef.current) return;
      if (!pathCoords || pathCoords.length < 3) return;

      const polygon = new window.google.maps.Polygon({
        paths: pathCoords,
        strokeColor: '#DC2626',
        strokeOpacity: 0.95,
        strokeWeight: 2.5,
        fillColor: '#EF4444',
        fillOpacity: 0.35,
        clickable: true,
        zIndex: 10,
        map: map,
      });

      polygon.addListener('click', (e) => {
        if (!e || !e.latLng) return;
        if (isPinningModeRef.current) {
          if (onPinLocationSelectRef.current) {
            onPinLocationSelectRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
          return;
        }
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        geographyApi.resolveLocation(lat, lng).then((res) => {
          const wardMatch = res?.units?.find((u) => u.type === 'WARD') || res?.units?.[0];
          if (wardMatch && onSelectUnitRef.current) {
            onSelectUnitRef.current(wardMatch);
          }
        }).catch(() => {});
      });

      const lineSymbol = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 2.5,
        strokeColor: '#DC2626',
      };

      const polyline = new window.google.maps.Polyline({
        path: Array.isArray(pathCoords[0]) ? pathCoords[0] : pathCoords,
        strokeOpacity: 0,
        icons: [{
          icon: lineSymbol,
          offset: '0',
          repeat: '10px'
        }],
        map: map,
        zIndex: 11
      });

      highlightShapesRef.current.push(polygon);
      highlightShapesRef.current.push(polyline);
    };

    const rawStCode = stateId ? stateId.replace(/^IN-/, '').split('-')[0].toUpperCase() : (selectedState?.stateId ? selectedState.stateId.replace(/^IN-/, '').split('-')[0].toUpperCase() : (unit?.stateId ? unit.stateId.replace(/^IN-/, '').split('-')[0].toUpperCase() : null));
    const cleanStateId = rawStCode ? `IN-${rawStCode}` : null;

    // Guard: If unit belongs to a different state than target stateId, clear unit reference to avoid stale state highlights
    const unitStCode = unit?.stateId ? unit.stateId.replace(/^IN-/, '').split('-')[0].toUpperCase() : (unit?.unitId ? unit.unitId.split('-')[1]?.toUpperCase() : null);
    if (rawStCode && unitStCode && rawStCode !== unitStCode) {
      unit = null;
    }

    if (cleanStateId) {
      // 1. Immediately focus camera on state center or unit coordinates (0ms sync response for fast user feedback)
      const stateNameNorm = (selectedState?.stateName || '').toUpperCase().replace(/[\s\-_]+/g, '');
      const stCenter = STATE_CENTERS[rawStCode] || STATE_CENTERS[cleanStateId] || STATE_CENTERS[stateNameNorm];

      if (unit?.coordinates?.lat && typeof unit.coordinates.lat === 'number') {
        const zoomLevel = (unit.unitType === 'URBAN_WARD' || unit.unitType === 'WARD') ? 15 : (unit.unitType === 'DISTRICT' ? 10 : (unit.unitType === 'MUNICIPAL_CORPORATION' || unit.unitType === 'CITY' ? 12 : 13));
        executeCameraCommand({
          type: 'PAN_AND_ZOOM',
          center: unit.coordinates,
          zoom: zoomLevel,
          reason: 'UNIT_COORDINATES_IMMEDIATE_SYNC',
        });
      } else if (stCenter) {
        executeCameraCommand({
          type: 'PAN_AND_ZOOM',
          center: { lat: stCenter.lat, lng: stCenter.lng },
          zoom: stCenter.zoom || 6.5,
          reason: 'STATE_CENTER_IMMEDIATE_SYNC',
        });
      }

      let loadingTimer = setTimeout(() => {
        if (currentReqId === highlightRequestIdRef.current) {
          setIsBoundaryLoading(true);
        }
      }, 300);

      mapDebug({ event: 'DISTRICT_FETCH_START', stateId: cleanStateId });
      getLoadedStateDistrictsData(cleanStateId).then(stateDistricts => {
        clearTimeout(loadingTimer);
        if (currentReqId !== highlightRequestIdRef.current) return;
        setIsBoundaryLoading(false);
        mapDebug({ event: 'DISTRICT_FETCH_END', stateId: cleanStateId, count: stateDistricts?.length || 0 });
        const allDistrictPaths = [];
        const selectedDistPaths = [];

        if (stateDistricts && stateDistricts.length > 0) {
          const normString = (s) => (s || '').toUpperCase().replace(/[\s\-_]+/g, '');
          const uIdNorm = normString(unit?.unitId);
          const uNameNorm = normString(unit?.unitName);

          stateDistricts.forEach(dist => {
            if (!dist.polygons) return;

            const distCleanName = normString(dist.districtName || dist.name || dist.district);
            const distIdNorm = normString(dist.districtId || dist.id || distCleanName);
            const distUnitId = `IN-${cleanStateId.replace(/^IN-/, '')}-DIST-${dist.districtId || dist.id || distCleanName}`;
            
            const isSelectedDist = unit && unit.unitType === 'DISTRICT' && (
              unit.unitId === distUnitId || 
              (uIdNorm && distIdNorm && uIdNorm.includes(distIdNorm)) ||
              (uIdNorm && distCleanName && uIdNorm.includes(distCleanName)) ||
              (uNameNorm && distCleanName && (uNameNorm.includes(distCleanName) || distCleanName.includes(uNameNorm)))
            );

            const distPolys = [];

            dist.polygons.forEach(path => {
              const polygon = new window.google.maps.Polygon({
                paths: path,
                strokeColor: isSelectedDist ? '#EF4444' : (isDark ? '#38BDF8' : '#1D4ED8'),
                strokeOpacity: isSelectedDist ? 0.95 : 0.80,
                strokeWeight: isSelectedDist ? 2.5 : 1.5,
                fillColor: isSelectedDist ? '#EF4444' : (isDark ? '#0284C7' : '#2563EB'),
                fillOpacity: isSelectedDist ? 0.35 : 0.15,
                clickable: true,
                zIndex: isSelectedDist ? 5 : 3,
                map: map,
              });

              polygon.addListener('click', (e) => {
                if (!e || !e.latLng) return;
                if (isPinningModeRef.current) {
                  if (onPinLocationSelectRef.current) {
                    onPinLocationSelectRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                  }
                  return;
                }
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();

                // Clicking any state district polygon ALWAYS selects DISTRICT level
                const districtUnit = {
                  unitId: distUnitId,
                  unitName: dist.districtName || dist.name || 'District',
                  unitType: 'DISTRICT',
                  parentCityDistrict: `${dist.districtName || 'District'}, ${cleanStateId.replace(/^IN-/, '')}`,
                  stateId: cleanStateId.replace(/^IN-/, ''),
                  coordinates: { lat, lng }
                };
                if (onSelectUnitRef.current) {
                  onSelectUnitRef.current(districtUnit);
                }
              });

              distPolys.push(polygon);
              highlightShapesRef.current.push(polygon);
              allDistrictPaths.push(path);
              if (isSelectedDist) {
                selectedDistPaths.push(path);
              }
            });

            // The selected district is already red, so hover leaves it alone.
            if (!isSelectedDist) addHoverHighlight(distPolys);

            districtPolygonsMapRef.current.push({
              name: distCleanName,
              distId: distIdNorm,
              polygons: distPolys,
              isSelected: isSelectedDist
            });
          });

          highlightShapesRef.current.push(createDistrictLabels(map, stateDistricts
            .filter((d) => d.polygons)
            .map((d) => ({ name: d.districtName || d.name || d.district, paths: d.polygons })), isDark, (on) => buildMapStyles(isDark, on)));

          // 2. Camera positioning for DISTRICT vs STATE
          if (unit && unit.unitType === 'DISTRICT') {
            if (selectedDistPaths.length > 0) {
              fitMapBoundsToPaths(selectedDistPaths);
            } else if (unit.coordinates && typeof unit.coordinates.lat === 'number') {
              executeCameraCommand({
                type: 'PAN_AND_ZOOM',
                center: unit.coordinates,
                zoom: 10,
                reason: 'DISTRICT_UNIT_COORDINATES',
              });
            } else if (allDistrictPaths.length > 0) {
              fitMapBoundsToPaths(allDistrictPaths);
            }
          } else if (!unit || currentLevel === 'STATE') {
            // The STATE_CENTERS move above is a rough first aim; the real shape centres it.
            if (allDistrictPaths.length > 0) fitMapBoundsToPaths(allDistrictPaths);
          }
        }
      }).catch(() => {
        clearTimeout(loadingTimer);
        if (currentReqId === highlightRequestIdRef.current) {
          setIsBoundaryLoading(false);
        }
      });
    }

    if (unit && (unit.unitType === 'URBAN_WARD' || unit.unitType === 'WARD')) {
      if (unit.coordinates && typeof unit.coordinates.lat === 'number') {
        executeCameraCommand({
          type: 'PAN_AND_ZOOM',
          center: unit.coordinates,
          zoom: 15,
          reason: 'WARD_FOCUS_ZOOM',
        });
      }
      if (unit.unitId && unit.unitId.startsWith('IN-')) {
        geographyApi.getBoundaryGeoJson(unit.unitId)
          .then(feature => {
            if (currentReqId !== highlightRequestIdRef.current) return;
            const pathsList = extractPathsFromGeoJson(feature?.geometry);
            if (pathsList && pathsList.length > 0) {
              pathsList.forEach(p => drawSinglePoly(p));
              fitMapBoundsToPaths(pathsList);
            }
          })
          .catch(() => {});
      }
    } else if (unit && (unit.unitType === 'MUNICIPAL_CORPORATION' || unit.unitType === 'CITY')) {
      // Centre on the wards when they are cached; useWardPolygons fits them after a first fetch.
      const wardBounds = wardGeometryCache.has(unit.unitId) && boundsOf(wardGeometryCache.get(unit.unitId).map((w) => w.paths));
      if (wardBounds) {
        executeCameraCommand({ type: 'FIT_BOUNDS', bounds: wardBounds, reason: 'CORPORATION_WARDS_FIT' });
      } else if (unit.coordinates && typeof unit.coordinates.lat === 'number') {
        executeCameraCommand({
          type: 'PAN_AND_ZOOM',
          center: unit.coordinates,
          zoom: 12,
          reason: 'CORPORATION_FOCUS_ZOOM',
        });
      }
    } else if (unit && unit.unitType !== 'DISTRICT' && unit.coordinates && typeof unit.coordinates.lat === 'number') {
      executeCameraCommand({
        type: 'PAN_AND_ZOOM',
        center: unit.coordinates,
        zoom: 13,
        reason: 'GENERIC_UNIT_COORDINATES',
      });
    }
  }, [clearHighlightShapes, currentLevel, executeCameraCommand, googleMapRef, isDark, onSelectUnitRef]);

  // Load state boundary polygons for hover-highlighting and selection at National level (Level 1 Macro)
  const loadNationalStateBoundaries = useCallback(() => {
    if (!googleMapRef.current || !window.google) return;
    const map = googleMapRef.current;
    const currentReqId = ++highlightRequestIdRef.current;
    clearHighlightShapes();

    fitIndia(map, executeCameraCommand);

    const NATIONAL_STATE_CODES = [
      'MH', 'GJ', 'KA', 'DL', 'TN', 'UP', 'MP', 'RJ',
      'HR', 'PB', 'BR', 'WB', 'KL', 'TG', 'AP', 'OD',
      'JH', 'CT', 'AS', 'HP', 'UK', 'GA', 'AR', 'MN',
      'ML', 'MZ', 'NL', 'SK', 'TR',
      // Union territories; any without district boundaries in the DB are skipped below.
      'JK', 'LA', 'AN', 'CH', 'DN', 'DD', 'LD', 'PY'
    ];

    NATIONAL_STATE_CODES.forEach(stCode => {
      const fullStId = `IN-${stCode}`;
      getLoadedStateDistrictsData(fullStId).then(stateDistricts => {
        if (currentReqId !== highlightRequestIdRef.current) return;
        if (!stateDistricts || stateDistricts.length === 0) return;

        const statePolygons = [];

        stateDistricts.forEach(dist => {
          if (!dist.polygons) return;
          dist.polygons.forEach(path => {
            const polygon = new window.google.maps.Polygon({
              paths: path,
              strokeColor: '#EF4444',
              strokeOpacity: 0,
              strokeWeight: 0,
              fillColor: '#EF4444',
              fillOpacity: 0,
              clickable: true,
              zIndex: 2,
              map: map,
            });

            statePolygons.push(polygon);
            highlightShapesRef.current.push(polygon);
          });
        });

        statePolygons.forEach(polygon => {
          polygon.addListener('mouseover', () => {
            statePolygons.forEach(p => {
              p.setOptions({
                strokeOpacity: 0,
                strokeWeight: 0,
                fillColor: '#EF4444',
                fillOpacity: 0.40,
                zIndex: 15,
              });
            });
          });

          polygon.addListener('mouseout', () => {
            statePolygons.forEach(p => {
              p.setOptions({
                strokeOpacity: 0,
                strokeWeight: 0,
                fillColor: '#EF4444',
                fillOpacity: 0,
                zIndex: 2,
              });
            });
          });

          polygon.addListener('click', (e) => {
            if (isPinningModeRef.current) {
              if (onPinLocationSelectRef.current && e && e.latLng) {
                onPinLocationSelectRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
              }
              return;
            }
            if (onSelectStateRef?.current) {
              onSelectStateRef.current({ stateId: fullStId });
            }
          });
        });
      }).catch(() => {});
    });
  }, [clearHighlightShapes, executeCameraCommand, googleMapRef, onSelectStateRef]);

  // Sync red boundary highlight & Focus map view when selectedUnit or selectedState changes
  useEffect(() => {
    if (!googleMapRef.current || !isMapReady) return;
    if (currentLevel === 'NATIONAL') {
      loadNationalStateBoundaries();
      return;
    }
    if (selectedUnit) {
      updateRedBoundaryHighlight(selectedState?.stateId, selectedUnit);
    } else {
      clearHighlightShapes();
    }
  }, [clearHighlightShapes, currentLevel, executeCameraCommand, googleMapRef, isMapReady, loadNationalStateBoundaries, selectedState?.stateId, selectedUnit, updateRedBoundaryHighlight]);

  useEffect(() => {
    if (!googleMapRef.current || !isMapReady || currentLevel === 'NATIONAL') return;
    if (!selectedState || currentLevel !== 'STATE') return;
    if (selectedState) {
      updateRedBoundaryHighlight(selectedState.stateId, null);
    }
  }, [currentLevel, googleMapRef, isMapReady, selectedState, updateRedBoundaryHighlight]);

  return { updateRedBoundaryHighlight, clearHighlightShapes, isBoundaryLoading };
}
