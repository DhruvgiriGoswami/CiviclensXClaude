import { geographyApi } from '../services/api';
import { wardGeometryCache } from '../services/mapGeometryCache';

const cachedStateDistrictsMap = {};

function geoJsonToStateDistricts(featureCollection) {
  if (!featureCollection || !Array.isArray(featureCollection.features)) return [];
  return featureCollection.features.map(feat => {
    const props = feat.properties || {};
    const rawId = props.unit_id || '';
    const districtId = rawId.includes('-DIST-') ? rawId.split('-DIST-')[1] : (props.name || '');
    const districtName = props.name || districtId;
    const polygons = extractPathsFromGeoJson(feat.geometry);
    return {
      districtId,
      districtName,
      name: districtName,
      id: districtId,
      rawUnitId: rawId,
      polygons,
    };
  });
}

export const getLoadedStateDistrictsData = async (rawStateId) => {
  if (!rawStateId) return null;
  let cleanId = rawStateId.replace(/^IN-/, '');
  if (cleanId.includes('-')) {
    cleanId = cleanId.split('-')[0];
  }
  if (!cleanId || cleanId.length > 3) return null;
  if (cachedStateDistrictsMap[cleanId]) return cachedStateDistrictsMap[cleanId];

  // Fetch directly from PostGIS DB backend endpoint
  try {
    const fullStateId = `IN-${cleanId}`;
    const fc = await geographyApi.getWardsForCity(fullStateId, { silent: true });
    if (fc && Array.isArray(fc.features) && fc.features.length > 0) {
      const formattedData = geoJsonToStateDistricts(fc);
      cachedStateDistrictsMap[cleanId] = formattedData;
      return formattedData;
    }
  } catch (err) {
    console.warn(`[CivicLens Map] Could not fetch district boundaries from DB for ${cleanId}:`, err);
  }

  return null;
};

export function extractPathsFromGeoJson(geometry) {
  return wardGeometryCache.normalizeGeometry(geometry);
}

const INDIA_FIT = { north: 35.7, south: 6.5, west: 68.0, east: 97.5 };
const INDIA_PAD = { top: 16, bottom: 16, left: 16, right: 16 };

// Fit all of India instantly. The desktop side panel sits beside the map div, not over it, so the padding is even.
// With executeCameraCommand it flies there instead.
export const fitIndia = (map, executeCameraCommand) => {
  if (executeCameraCommand) {
    executeCameraCommand({ type: 'FIT_BOUNDS', bounds: INDIA_FIT, padding: INDIA_PAD, reason: 'FIT_INDIA' });
  } else {
    map.fitBounds(INDIA_FIT, INDIA_PAD);
  }
};

export const buildMapStyles = (isDark, provinceLabels = true) => {
  const bg = isDark ? '#2A2A2A' : '#EEF2F7';
  const water = isDark ? '#101417' : '#B8D4E8';
  const road = isDark ? '#383838' : '#D1DBE8';
  const localLabel = isDark ? '#9A9A9A' : '#475569';
  const labelStroke = isDark ? '#2A2A2A' : '#EEF2F7';
  return [
    { elementType: 'geometry', stylers: [{ color: bg }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: water }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: road }] },
    { elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: localLabel }, { visibility: 'simplified' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.stroke', stylers: [{ color: labelStroke }, { visibility: 'simplified' }] },
    { featureType: 'administrative.province', elementType: 'labels.text.fill', stylers: [{ visibility: provinceLabels ? 'on' : 'off' }, { color: isDark ? '#D4D4D4' : '#3C4043' }] },
    { featureType: 'administrative.province', elementType: 'labels.text.stroke', stylers: [{ visibility: provinceLabels ? 'on' : 'off' }, { color: labelStroke }, { weight: 3 }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { stylers: [{ saturation: -60 }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ];
};

export function findPinpointedLocation(lat, lng, units, stateId) {
  let closestRegistered = null;
  let minRegDist = Infinity;

  (units || []).forEach(u => {
    if (u.coordinates && typeof u.coordinates.lat === 'number') {
      const dLat = u.coordinates.lat - lat;
      const dLng = u.coordinates.lng - lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minRegDist) {
        minRegDist = dist;
        closestRegistered = u;
      }
    }
  });

  if (closestRegistered && minRegDist < 0.20) {
    return closestRegistered;
  }

  const latStr = lat.toFixed(2);
  const lngStr = lng.toFixed(2);

  return {
    unitId: `IN-${stateId || 'MH'}-GPS-${latStr}-${lngStr}`,
    unitName: `Regional Ward (${latStr}°N, ${lngStr}°E)`,
    unitType: "URBAN_WARD",
    parentCityDistrict: `Regional District, India`,
    stateId: stateId || 'MH',
    coordinates: { lat, lng }
  };
}

export const INDIA_BOUNDS = { north: 38.5, south: 5.5, east: 98.5, west: 67.0 };

export const isInsideIndia = (lat, lng) =>
  lat >= INDIA_BOUNDS.south && lat <= INDIA_BOUNDS.north &&
  lng >= INDIA_BOUNDS.west && lng <= INDIA_BOUNDS.east;

export function pointInPolygon(lat, lng, polygonCoords) {
  if (!polygonCoords || !Array.isArray(polygonCoords)) return false;
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const xi = polygonCoords[i].lat ?? polygonCoords[i][1];
    const yi = polygonCoords[i].lng ?? polygonCoords[i][0];
    const xj = polygonCoords[j].lat ?? polygonCoords[j][1];
    const yj = polygonCoords[j].lng ?? polygonCoords[j][0];

    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / ((yj - yi) || 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const STATE_CENTERS = {
  AP: { lat: 15.9129, lng: 79.7400, zoom: 6.5 },
  AR: { lat: 28.2180, lng: 94.7278, zoom: 6.8 },
  AS: { lat: 26.2006, lng: 92.9376, zoom: 6.5 },
  BR: { lat: 25.0961, lng: 85.3131, zoom: 7.2 },
  CG: { lat: 21.2787, lng: 81.8661, zoom: 6.5 },
  CT: { lat: 21.2787, lng: 81.8661, zoom: 6.5 },
  GA: { lat: 15.2993, lng: 74.1240, zoom: 10.5 },
  GJ: { lat: 22.3000, lng: 71.8000, zoom: 6.4 },
  HR: { lat: 29.0588, lng: 76.0856, zoom: 7.5 },
  HP: { lat: 31.7317, lng: 77.1650, zoom: 7.4 },
  JH: { lat: 23.6102, lng: 85.2799, zoom: 7.0 },
  KA: { lat: 14.8000, lng: 75.8000, zoom: 6.5 },
  KL: { lat: 10.8505, lng: 76.2711, zoom: 7.0 },
  MP: { lat: 22.9734, lng: 78.6569, zoom: 6.0 },
  MH: { lat: 19.5000, lng: 76.0000, zoom: 6.2 },
  MN: { lat: 24.6637, lng: 93.9063, zoom: 8.2 },
  ML: { lat: 25.4670, lng: 91.3662, zoom: 8.0 },
  MZ: { lat: 23.1645, lng: 92.9376, zoom: 8.0 },
  NL: { lat: 26.1584, lng: 94.5624, zoom: 8.2 },
  OD: { lat: 20.9517, lng: 85.0985, zoom: 6.5 },
  OR: { lat: 20.9517, lng: 85.0985, zoom: 6.5 },
  PB: { lat: 31.1471, lng: 75.3412, zoom: 7.5 },
  RJ: { lat: 26.6000, lng: 73.8000, zoom: 6.0 },
  SK: { lat: 27.5330, lng: 88.5122, zoom: 9.5 },
  TN: { lat: 11.1271, lng: 78.6569, zoom: 6.4 },
  TG: { lat: 18.1124, lng: 79.0193, zoom: 6.8 },
  TS: { lat: 18.1124, lng: 79.0193, zoom: 6.8 },
  TR: { lat: 23.9408, lng: 91.9882, zoom: 8.5 },
  UP: { lat: 26.8467, lng: 80.9462, zoom: 6.0 },
  UK: { lat: 30.0668, lng: 79.0193, zoom: 7.4 },
  UT: { lat: 30.0668, lng: 79.0193, zoom: 7.4 },
  WB: { lat: 22.9868, lng: 87.8550, zoom: 6.5 },
  DL: { lat: 28.7041, lng: 77.1025, zoom: 10.0 },
  AN: { lat: 11.7401, lng: 92.6586, zoom: 7.5 },
  CH: { lat: 30.7333, lng: 76.7794, zoom: 11.0 },
  DN: { lat: 20.4283, lng: 72.8397, zoom: 10.0 },
  JK: { lat: 33.7782, lng: 76.5762, zoom: 6.8 },
  LA: { lat: 34.1526, lng: 77.5771, zoom: 6.5 },
  LD: { lat: 10.5667, lng: 72.6417, zoom: 8.5 },
  PY: { lat: 11.9416, lng: 79.8083, zoom: 11.0 },

  ANDHRAPRADESH: { lat: 15.9129, lng: 79.7400, zoom: 6.5 },
  ARUNACHALPRADESH: { lat: 28.2180, lng: 94.7278, zoom: 6.8 },
  ASSAM: { lat: 26.2006, lng: 92.9376, zoom: 6.5 },
  BIHAR: { lat: 25.0961, lng: 85.3131, zoom: 7.2 },
  CHHATTISGARH: { lat: 21.2787, lng: 81.8661, zoom: 6.5 },
  GOA: { lat: 15.2993, lng: 74.1240, zoom: 10.5 },
  GUJARAT: { lat: 22.3000, lng: 71.8000, zoom: 6.4 },
  HARYANA: { lat: 29.0588, lng: 76.0856, zoom: 7.5 },
  HIMACHALPRADESH: { lat: 31.7317, lng: 77.1650, zoom: 7.4 },
  JHARKHAND: { lat: 23.6102, lng: 85.2799, zoom: 7.0 },
  KARNATAKA: { lat: 14.8000, lng: 75.8000, zoom: 6.5 },
  KERALA: { lat: 10.8505, lng: 76.2711, zoom: 7.0 },
  MADHYAPRADESH: { lat: 22.9734, lng: 78.6569, zoom: 6.0 },
  MAHARASHTRA: { lat: 19.5000, lng: 76.0000, zoom: 6.2 },
  MANIPUR: { lat: 24.6637, lng: 93.9063, zoom: 8.2 },
  MEGHALAYA: { lat: 25.4670, lng: 91.3662, zoom: 8.0 },
  MIZORAM: { lat: 23.1645, lng: 92.9376, zoom: 8.0 },
  NAGALAND: { lat: 26.1584, lng: 94.5624, zoom: 8.2 },
  ODISHA: { lat: 20.9517, lng: 85.0985, zoom: 6.5 },
  PUNJAB: { lat: 31.1471, lng: 75.3412, zoom: 7.5 },
  RAJASTHAN: { lat: 26.6000, lng: 73.8000, zoom: 6.0 },
  SIKKIM: { lat: 27.5330, lng: 88.5122, zoom: 9.5 },
  TAMILNADU: { lat: 11.1271, lng: 78.6569, zoom: 6.4 },
  TELANGANA: { lat: 18.1124, lng: 79.0193, zoom: 6.8 },
  TRIPURA: { lat: 23.9408, lng: 91.9882, zoom: 8.5 },
  UTTARPRADESH: { lat: 26.8467, lng: 80.9462, zoom: 6.0 },
  UTTARAKHAND: { lat: 30.0668, lng: 79.0193, zoom: 7.4 },
  WESTBENGAL: { lat: 22.9868, lng: 87.8550, zoom: 6.5 },
  DELHI: { lat: 28.7041, lng: 77.1025, zoom: 10.0 },
  ANDAMANANDNICOBARISLANDS: { lat: 11.7401, lng: 92.6586, zoom: 7.5 },
  CHANDIGARH: { lat: 30.7333, lng: 76.7794, zoom: 11.0 },
  DADRAANDNAGARHAVELI: { lat: 20.4283, lng: 72.8397, zoom: 10.0 },
  JAMMUANDKASHMIR: { lat: 33.7782, lng: 76.5762, zoom: 6.8 },
  LADAKH: { lat: 34.1526, lng: 77.5771, zoom: 6.5 },
  LAKSHADWEEP: { lat: 10.5667, lng: 72.6417, zoom: 8.5 },
  PUDUCHERRY: { lat: 11.9416, lng: 79.8083, zoom: 11.0 }
};

export const STATE_NAMES = {
  AP: 'Andhra Pradesh',
  AR: 'Arunachal Pradesh',
  AS: 'Assam',
  BR: 'Bihar',
  CG: 'Chhattisgarh',
  CT: 'Chhattisgarh',
  GA: 'Goa',
  GJ: 'Gujarat',
  HR: 'Haryana',
  HP: 'Himachal Pradesh',
  JH: 'Jharkhand',
  KA: 'Karnataka',
  KL: 'Kerala',
  MP: 'Madhya Pradesh',
  MH: 'Maharashtra',
  MN: 'Manipur',
  ML: 'Meghalaya',
  MZ: 'Mizoram',
  NL: 'Nagaland',
  OD: 'Odisha',
  OR: 'Odisha',
  PB: 'Punjab',
  RJ: 'Rajasthan',
  SK: 'Sikkim',
  TN: 'Tamil Nadu',
  TG: 'Telangana',
  TS: 'Telangana',
  TR: 'Tripura',
  UP: 'Uttar Pradesh',
  UK: 'Uttarakhand',
  UT: 'Uttarakhand',
  WB: 'West Bengal',
  DL: 'Delhi',
  AN: 'Andaman & Nicobar Islands',
  CH: 'Chandigarh',
  DN: 'Dadra & Nagar Haveli and Daman & Diu',
  JK: 'Jammu & Kashmir',
  LA: 'Ladakh',
  LD: 'Lakshadweep',
  PY: 'Puducherry',
};

export function findClosestStateForCoordinates(lat, lng) {
  let closestCode = 'MH';
  let minDistance = Infinity;
  for (const [stKey, stData] of Object.entries(STATE_CENTERS)) {
    if (stKey.length === 2 && typeof stData.lat === 'number') {
      const dLat = stData.lat - lat;
      const dLng = stData.lng - lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDistance) {
        minDistance = dist;
        closestCode = stKey;
      }
    }
  }
  return {
    stateId: closestCode,
    stateName: STATE_NAMES[closestCode] || closestCode,
  };
}

export function isLocationInIndia(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return true;
  // Bounding Box for India region (including Andaman & Nicobar and Lakshadweep)
  // Lat: 6.0° N to 37.6° N, Lng: 68.0° E to 97.5° E
  return lat >= 6.0 && lat <= 37.6 && lng >= 68.0 && lng <= 97.5;
}


