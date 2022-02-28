import {along, lineDistance} from 'turf'
import {Route} from '../components/Map/Map'
import {Flight, LngLat} from '../flights'

type Line = GeoJSON.Feature<GeoJSON.LineString>

export type Feature = {
  flight: Flight
  route: Route
  line: Line
  steps: number
  arc: LngLat[]
  id: number
}

export default function computeFeatures(flights: Flight[]): Feature[] {
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
