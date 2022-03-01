import type {Map as MapboxMap} from 'mapbox-gl'
import {useEffect} from 'react'
import AIRPORTS_TO_COUNTRIES from '../../const/AIRPORTS_TO_COUNTRIES'
import {Airport} from '../../flights'

export default function useCountryShader(
  map: MapboxMap | null,
  visitedAirports: Set<Airport>
): void {
  useEffect(() => {
    if (!map) {
      return
    }
    map.addLayer(
      {
        id: 'country-boundaries',
        source: {
          type: 'vector',
          url: 'mapbox://mapbox.country-boundaries-v1',
        },
        'source-layer': 'country_boundaries',
        type: 'fill',
        paint: {
          'fill-color': '#007cbf',
          'fill-opacity': 0.4,
        },
      },
      'country-label'
    )
    // bcherny.d64kq0ad ISO_A3
    map.setFilter('country-boundaries', ['in', 'iso_3166_1_alpha_3'])
  }, [map])

  useEffect(() => {
    if (!map) {
      return
    }
    const countries = new Set(
      [...visitedAirports].map((_) => AIRPORTS_TO_COUNTRIES[_.code])
    )
    map.setFilter('country-boundaries', [
      'in',
      'iso_3166_1_alpha_3',
      ...countries,
    ])
  })
}
