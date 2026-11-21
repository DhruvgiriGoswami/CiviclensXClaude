/**
 * CivicLens Map Geometry Cache & Normalizer Service
 * Caches normalized ward polygon path arrays by dataset key (cityId/stateId).
 */

class MapGeometryCacheService {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    return this.cache.get(key) || null;
  }

  set(key, normalizedWards) {
    this.cache.set(key, normalizedWards);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  normalizeFeatureCollection(featureCollection) {
    if (!featureCollection || !Array.isArray(featureCollection.features)) return [];

    const normalizedList = [];

    featureCollection.features.forEach((feature) => {
      if (!feature || !feature.geometry) return;
      const pathsList = this.normalizeGeometry(feature.geometry);
      const wardName = feature.properties?.name || 'Ward';
      const unitId = feature.properties?.unit_id || '';
      const corpName = feature.properties?.corporation || '';
      const stateCode = unitId.split('-')[1] || 'MH';

      pathsList.forEach((paths) => {
        if (!paths || paths.length < 3) return;
        normalizedList.push({
          unitId,
          wardName,
          corpName,
          stateCode,
          paths,
        });
      });
    });

    return normalizedList;
  }

  normalizeGeometry(geometry) {
    if (!geometry || !geometry.coordinates) return [];
    if (geometry.type === 'Polygon') {
      return [geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }))];
    } else if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.map((poly) => poly[0].map(([lng, lat]) => ({ lat, lng })));
    }
    return [];
  }
}

export const wardGeometryCache = new MapGeometryCacheService();
