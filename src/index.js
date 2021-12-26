// @ts-check

import CONFIG from './config.js'
import FLIGHTS from './flights.js'

mapboxgl.accessToken = CONFIG.MAPBOX_API_KEY

const STEPS = 100
const JAPAN = [139.8, 35.6]

function initMap() {
  return new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: JAPAN,
    zoom: 2,
  })
}

function main() {
  const map = initMap()
  map.on('load', () => {
    const point = initPoint(map, FLIGHTS[0].from.latlng)
    animateFlights(map, point, 0)
  })
}

function animateFlights(map, point, i) {
  if (!FLIGHTS[i]) {
    return
  }
  animateFlight(
    map,
    i,
    FLIGHTS[i].from.latlng,
    FLIGHTS[i].to.latlng,
    point,
    () => {
      animateFlights(map, point, i + 1)
    }
  )
}

function initPoint(map, origin) {
  const point = {
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

  map.addSource('point', {
    type: 'geojson',
    data: point,
  })

  map.addLayer({
    id: 'point',
    source: 'point',
    type: 'symbol',
    layout: {
      'icon-image': 'airport-15',
      'icon-rotate': ['get', 'bearing'],
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  })

  return point
}

function animateFlight(map, id, origin, destination, point, onDone) {
  const route = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [origin, origin],
        },
      },
    ],
  }

  const line = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [origin, destination],
    },
  }

  const lineDistance = turf.length(line)
  const arc = []
  for (let i = 0; i < lineDistance; i += lineDistance / STEPS) {
    const segment = turf.along(line, i)
    arc.push(segment.geometry.coordinates)
  }

  map.addSource(`route${id}`, {
    type: 'geojson',
    data: route,
  })

  map.addLayer({
    id: `route${id}`,
    source: `route${id}`,
    type: 'line',
    paint: {
      'line-width': 2,
      'line-color': '#007cbf',
    },
  })

  // Start the animation
  animate(map, id, point, arc, route, 0, onDone)
}

function animate(map, id, point, arc, route, counter, onDone) {
  const start = arc[counter >= STEPS ? counter - 1 : counter]
  const end = arc[counter >= STEPS ? counter : counter + 1]
  if (!start || !end) {
    return
  }

  point.features[0].geometry.coordinates = arc[counter]
  point.features[0].properties.bearing = turf.bearing(
    turf.point(start),
    turf.point(end)
  )
  route.features[0].geometry.coordinates.push(arc[counter])

  // Update the source with this new data
  map.getSource('point').setData(point)
  map.getSource(`route${id}`).setData(route)

  // Request the next frame of animation as long as the end has not been reached
  if (counter < STEPS) {
    requestAnimationFrame(() =>
      animate(map, id, point, arc, route, counter + 1, onDone)
    )
  } else {
    onDone()
  }
}

main()
