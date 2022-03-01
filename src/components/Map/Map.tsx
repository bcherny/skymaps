import type {Map as MapboxMap} from 'mapbox-gl'
import FLIGHTS, {Airport, Flight, LngLat} from '../../flights'
import {useCallback, useEffect, useState} from 'react'
import {bearing, point} from 'turf'
import 'mapbox-gl/dist/mapbox-gl.css'
import './Map.css'
import {Feature} from '../../utils/computeFeatures'
import {getGeoJSONSource, getLineLayer} from '../../utils/mapboxUtils'
import useAirplane, {Airplane} from './useAirplane'
import useCountryShader from './useCountryShader'
import useAirportMarkers from './useAirportMarkers'
import useMapboxMap from './useMapboxMap'

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
  useCountryShader(map, visitedAirports)

  return <div className="Map" ref={divRef} />
}

export type Route = GeoJSON.FeatureCollection<GeoJSON.LineString>

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

  getGeoJSONSource(map, 'airplane').setData(airplane)
  getGeoJSONSource(map, `route${id}`).setData(route)

  let i = id
  while (i--) {
    graduallyBlurLine(map, i)
  }

  requestAnimationFrame(() =>
    animate(map, id, airplane, flight, arc, route, steps, counter + 1, onDone)
  )
}

function graduallyBlurLine(map: MapboxMap, lineIndex: number) {
  const layerName = `route${lineIndex}`
  const layer = getLineLayer(map, layerName)
  const blur = (layer.paint as any).get('line-blur').value.value
  const opacity = (layer.paint as any).get('line-opacity').value.value
  const width = (layer.paint as any).get('line-width').value.value
  map.setPaintProperty(layerName, 'line-blur', Math.min(blur + 1, 20))
  map.setPaintProperty(layerName, 'line-opacity', Math.max(opacity * 0.99, 0.2))
  map.setPaintProperty(layerName, 'line-width', Math.min(width + 1, 10))
}
