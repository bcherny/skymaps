import type {Map as MapboxMap} from 'mapbox-gl'
import {useEffect, useMemo} from 'react'
import {LngLat} from '../../flights'

export type Airplane = GeoJSON.FeatureCollection<GeoJSON.Point>

export default function useAirplane(
  map: MapboxMap | null,
  origin: LngLat
): Airplane {
  const airplane: Airplane = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: origin,
          },
        },
      ],
    }),
    [origin]
  )

  useEffect(() => {
    if (!map) {
      return
    }

    map.addSource('airplane', {
      type: 'geojson',
      data: airplane,
    })

    map.addLayer({
      id: 'airplane',
      source: 'airplane',
      type: 'symbol',
      layout: {
        'icon-image': 'airport-15',
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
      paint: {
        'icon-color': '#007cbf',
      },
    })
  }, [airplane, map, origin])

  return airplane
}
