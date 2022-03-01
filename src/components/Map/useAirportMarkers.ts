import {Map as MapboxMap, Marker} from 'mapbox-gl'
import {useEffect, useRef} from 'react'
import {Airport, AirportCode} from '../../flights'
import {getGeoJSONSource} from '../../utils/mapboxUtils'
import useAirportLabels from './useAirportLabels'

export default function useAirportMarkers(
  map: MapboxMap | null,
  visitedAirports: Set<Airport>
): void {
  const [labels, setLabels] = useAirportLabels(map)
  const renderedMarkers = useRef<Set<AirportCode>>(new Set())

  // Sync labels to map
  useEffect(() => {
    if (!map) {
      return
    }
    getGeoJSONSource(map, 'cityLabels').setData(labels)
  }, [labels, map])

  useEffect(() => {
    if (!map) {
      return
    }

    for (const {code, lnglat} of visitedAirports) {
      if (renderedMarkers.current.has(code)) {
        continue
      }

      const el = document.createElement('div')
      el.classList.add('Marker', 'Blue')
      new Marker(el).setLngLat(lnglat).addTo(map)
      renderedMarkers.current.add(code)

      const label: GeoJSON.Feature<GeoJSON.Geometry> = {
        type: 'Feature',
        properties: {
          description: code,
        },
        geometry: {
          type: 'Point',
          coordinates: lnglat,
        },
      }
      setLabels((labels) => ({
        type: 'FeatureCollection',
        features: [...labels.features, label],
      }))
    }
  }, [labels.features, map, setLabels, visitedAirports])
}
