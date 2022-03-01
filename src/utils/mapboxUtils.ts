import type {GeoJSONSource, LineLayer, Map as MapboxMap} from 'mapbox-gl'

export function getGeoJSONSource(map: MapboxMap, key: string): GeoJSONSource {
  return map.getSource(key) as GeoJSONSource
}

export function getLineLayer(map: MapboxMap, key: string): LineLayer {
  return map.getLayer(key) as LineLayer
}
