import type {Map as MapboxMap} from 'mapbox-gl'
import {Dispatch, SetStateAction, useEffect, useState} from 'react'

type Labels = GeoJSON.FeatureCollection<GeoJSON.Geometry>

export default function useAirportLabels(
  map: MapboxMap | null
): [Labels, Dispatch<SetStateAction<Labels>>] {
  useEffect(() => {
    if (!map) {
      return
    }

    map.addSource(`cityLabels`, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })

    map.addLayer(
      {
        id: `cityLabels`,
        type: 'symbol',
        source: `cityLabels`,
        layout: {
          'text-size': 16,
          'text-field': ['get', 'description'],
          'text-variable-anchor': ['bottom', 'top', 'left', 'right'],
          'text-radial-offset': 0.5,
        },
        paint: {
          'text-halo-color': '#fff',
          'text-halo-width': 2,
        },
      },
      'airplane'
    )
  }, [map])

  return useState<Labels>({
    type: 'FeatureCollection',
    features: [],
  })
}
