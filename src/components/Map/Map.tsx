import mapboxgl, {GeoJSONSource, LineLayer, Marker} from 'mapbox-gl'
import type {Map as MapboxMap} from 'mapbox-gl'
import CONFIG from '../../config'
import FLIGHTS, {Airport, AirportCode, Flight, LngLat} from '../../flights'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {bearing, point} from 'turf'
import 'mapbox-gl/dist/mapbox-gl.css'
import './Map.css'
import {Feature} from '../../utils/computeFeatures'

mapboxgl.accessToken = CONFIG.MAPBOX_API_KEY

const JAPAN: LngLat = [139.8, 35.6]

type Props = {
  currentFeature: Feature
  onFlightDone(): void
}

export default function Map({
  currentFeature,
  onFlightDone,
}: Props): React.ReactElement {
  const [divRef, map] = useMapboxMap()
  const [visitedAirports, setVisitedAirports] = useState<Set<Airport>>(
    new Set()
  )

  const addCityMarkerNx = useCallback(
    (airport: Airport) => {
      if (!map) {
        return
      }
      setVisitedAirports((visitedAirports) => {
        if (visitedAirports.has(airport)) {
          return visitedAirports
        }
        return new Set([...visitedAirports.add(airport)])
      })
    },
    [map]
  )

  useEffect(() => {
    addCityMarkerNx(currentFeature.flight.from)
  }, [addCityMarkerNx, currentFeature.flight, map, visitedAirports])

  const onDone = useCallback(() => {
    addCityMarkerNx(currentFeature.flight.to)
    onFlightDone()
  }, [addCityMarkerNx, currentFeature.flight.to, onFlightDone])

  const airplane = useAirplane(map, FLIGHTS[0].from.lnglat)
  useAirportMarkers(map, visitedAirports)
  useAnimateFlights(map, currentFeature, airplane, onDone)

  return <div className="Map" ref={divRef} />
}

function useMapboxMap() {
  const [map, setMap] = useState<MapboxMap | null>(null)
  const divRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (map || !divRef.current) return
    const m = initMap(divRef.current)
    m.on('load', () => setMap(m))
  }, [map])

  return useMemo(() => [divRef, map] as const, [map])
}

function initMap(container: HTMLElement): MapboxMap {
  return new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/light-v10',
    center: JAPAN,
    zoom: 1.5,
  })
}

export type Route = GeoJSON.FeatureCollection<GeoJSON.LineString>
type Airplane = GeoJSON.FeatureCollection<GeoJSON.Point>

function useAirplane(map: MapboxMap | null, origin: LngLat): Airplane {
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

type Labels = GeoJSON.FeatureCollection<GeoJSON.Geometry>

function useLabels(map: MapboxMap | null): [Labels, (l: Labels) => void] {
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
          'text-variable-anchor': ['bottom'],
          'text-radial-offset': 0.5,
          'text-ignore-placement': true,
          'text-allow-overlap': false,
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

function useAnimateFlights(
  map: MapboxMap | null,
  currentFeature: Feature,
  airplane: Airplane,
  onFlightDone: () => void
): void {
  useEffect(() => {
    if (!map) {
      return
    }
    animateFlight(map!, currentFeature, airplane, onFlightDone)
  }, [airplane, currentFeature, map, onFlightDone])
}

function animateFlight(
  map: MapboxMap,
  {flight, id, route, arc, steps}: Feature,
  airplane: Airplane,
  onDone: () => void
): void {
  map.addSource(`route${id}`, {
    type: 'geojson',
    data: route,
  })

  map.addLayer(
    {
      id: `route${id}`,
      source: `route${id}`,
      type: 'line',
      layout: {
        'line-cap': 'round',
      },
      paint: {
        'line-width': 2,
        'line-color': '#007cbf',
      },
    },
    'cityLabels'
  )

  // Start the animation
  animate(map, id, airplane, flight, arc, route, steps, 0, onDone)
}

function finishAnimation(
  map: MapboxMap,
  id: number,
  airplane: Airplane,
  arc: LngLat[],
  route: Route,
  onDone: () => void
) {
  // Animate route to completion
  route.features[0].geometry.coordinates = arc
  airplane.features[0].geometry.coordinates = arc[arc.length - 1]
  getGeoJSONSource(map, 'airplane').setData(airplane)
  getGeoJSONSource(map, `route${id}`).setData(route)

  onDone()
}

function useAirportMarkers(
  map: MapboxMap | null,
  visitedAirports: Set<Airport>
): void {
  const [labels, setLabels] = useLabels(map)
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
      setLabels({
        type: 'FeatureCollection',
        features: [...labels.features, label],
      })
    }
  }, [labels.features, map, setLabels, visitedAirports])
}

function getGeoJSONSource(map: MapboxMap, key: string): GeoJSONSource {
  return map.getSource(key) as GeoJSONSource
}

function getLineLayer(map: MapboxMap, key: string): LineLayer {
  return map.getLayer(key) as LineLayer
}

function animate(
  map: MapboxMap,
  id: number,
  airplane: Airplane,
  flight: Flight,
  arc: LngLat[],
  route: Route,
  steps: number,
  counter: number,
  onDone: () => void
) {
  if (counter > arc.length - 2) {
    finishAnimation(map, id, airplane, arc, route, onDone)
    return
  }

  airplane.features[0].geometry.coordinates = arc[counter]
  airplane.features[0].properties!.bearing = bearing(
    point(arc[counter]),
    point(arc[counter + 1])
  )
  route.features[0].geometry.coordinates = arc.slice(0, counter)

  // Update the source with this new data
  getGeoJSONSource(map, 'airplane').setData(airplane)
  getGeoJSONSource(map, `route${id}`).setData(route)

  let i = id
  while (i--) {
    const layerName = `route${i}`
    const layer = getLineLayer(map, layerName)
    const blur = (layer.paint as any).get('line-blur').value.value
    const opacity = (layer.paint as any).get('line-opacity').value.value
    const width = (layer.paint as any).get('line-width').value.value
    map.setPaintProperty(layerName, 'line-blur', Math.min(blur + 1, 20))
    map.setPaintProperty(
      layerName,
      'line-opacity',
      Math.max(opacity * 0.99, 0.2)
    )
    map.setPaintProperty(layerName, 'line-width', Math.min(width + 1, 10))
  }

  requestAnimationFrame(() =>
    animate(map, id, airplane, flight, arc, route, steps, counter + 1, onDone)
  )
}
