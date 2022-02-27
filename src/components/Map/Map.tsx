import mapboxgl, {GeoJSONSource, LineLayer} from 'mapbox-gl'
import type {Map as MapboxMap} from 'mapbox-gl'
import CONFIG from '../../config'
import FLIGHTS, {Flight, LngLat} from '../../flights'
import {useEffect, useRef} from 'react'
import {along, bearing, lineDistance, point} from 'turf'
import 'mapbox-gl/dist/mapbox-gl.css'
import './Map.css'

mapboxgl.accessToken = CONFIG.MAPBOX_API_KEY

const JAPAN: LngLat = [139.8, 35.6]

type Props = {
  currentFlight: Flight | null
  setCurrentFlight(f: Flight): void
}

export default function Map({setCurrentFlight}: Props): React.ReactElement {
  const mapRef = useRef<MapboxMap | null>(null)
  const divRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (mapRef.current || !divRef.current) return
    const map = initMap(divRef.current)
    map.on('load', () => {
      const airplane = initAirplane(map, FLIGHTS[0].from.lnglat)
      const features = computeFeatures(FLIGHTS)
      animateFlights(map, airplane, features, 0, setCurrentFlight)
    })

    mapRef.current = map
  }, [setCurrentFlight])

  return <div className="Map" ref={divRef} />
}

type Route = GeoJSON.FeatureCollection<GeoJSON.LineString>
type Line = GeoJSON.Feature<GeoJSON.LineString>

type Feature = {
  flight: Flight
  route: Route
  line: Line
  steps: number
  arc: LngLat[]
  id: number
}

function computeFeatures(flights: Flight[]): Feature[] {
  return flights.map((flight, index) => {
    const {from, to} = flight
    const route: Route = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [from.lnglat, from.lnglat],
          },
          properties: {},
        },
      ],
    }
    const line: Line = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [from.lnglat, to.lnglat],
      },
      properties: {},
    }
    const distance = lineDistance(line)
    const steps = Math.floor(distance / 30)
    const arc: LngLat[] = []
    for (let i = 1; i < distance; i += distance / steps) {
      const segment = along(line, i)
      arc.push(segment.geometry.coordinates as LngLat)
    }
    return {flight, route, line, steps, arc, id: index}
  })
}

function initMap(container: HTMLElement): MapboxMap {
  return new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/light-v10',
    center: JAPAN,
    zoom: 2,
  })
}

type Airplane = GeoJSON.FeatureCollection<GeoJSON.Point>

function initAirplane(map: MapboxMap, origin: LngLat): Airplane {
  const airplane: Airplane = {
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
  })

  return airplane
}

function animateFlights(
  map: MapboxMap,
  airplane: Airplane,
  features: Feature[],
  i: number,
  setCurrentFlight: (f: Flight) => void
): void {
  const feature = features[i]
  if (!feature) {
    return
  }
  setCurrentFlight(feature.flight)
  animateFlight(map, feature, airplane, () => {
    animateFlights(map, airplane, features, i + 1, setCurrentFlight)
  })
}

function animateFlight(
  map: MapboxMap,
  {id, route, arc, steps}: Feature,
  airplane: Airplane,
  onDone: () => void
): void {
  map.addSource(`route${id}`, {
    type: 'geojson',
    data: route,
  })

  map.addLayer({
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
  })

  // Start the animation
  animate(map, id, airplane, arc, route, steps, 0, onDone)
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

  // Add city dot
  const city: GeoJSON.FeatureCollection<GeoJSON.Point> = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: arc[arc.length - 1],
        },
      },
    ],
  }
  map.addSource(`city${id}`, {
    type: 'geojson',
    data: airplane,
  })

  map.addLayer({
    id: `city${id}`,
    source: `city${id}`,
    type: 'symbol',
    layout: {
      'icon-image': 'attraction-15',
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': false,
      'icon-ignore-placement': true,
      'symbol-z-order': 'source',
      'symbol-sort-key': 1000,
    },
  })

  onDone()
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
      Math.max(opacity * 0.99, 0.05)
    )
    map.setPaintProperty(layerName, 'line-width', Math.min(width + 1, 10))
  }

  requestAnimationFrame(() =>
    animate(map, id, airplane, arc, route, steps, counter + 1, onDone)
  )
}
