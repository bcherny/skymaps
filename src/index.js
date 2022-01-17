// @ts-check

import CONFIG from './config.js'
import FLIGHTS from './flights.js'

mapboxgl.accessToken = CONFIG.MAPBOX_API_KEY

const JAPAN = [139.8, 35.6]

function initMap() {
  return new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: JAPAN,
    zoom: 2,
  })
}

function main() {
  const map = initMap()
  map.on('load', () => {
    const airplane = initAirplane(map, FLIGHTS[0].from.latlng)
    animateFlights(map, airplane, 0)
  })
}

function animateFlights(map, airplane, i) {
  const flight = FLIGHTS[i]
  if (!flight) {
    return
  }
  updateLabel(flight)
  animateFlight(map, i, flight.from.latlng, flight.to.latlng, airplane, () => {
    animateFlights(map, airplane, i + 1)
  })
}

function updateLabel(flight) {
  document.querySelector('#label').innerHTML = `
  <section>
    <span class="label">Date</span>
    <span class="value">${flight.date.toLocaleDateString()}</span>
  </section>
  <section>
    <span class="label">Flight</span>
    <span class="value">${flight.flight}</span>
  </section>
  <section>
    <span class="label">Route</span>
    <span class="value">${flight.from.code} ➝ ${flight.to.code}</span>
  </section>
    `
}

function initAirplane(map, origin) {
  const airplane = {
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

function animateFlight(map, id, origin, destination, airplane, onDone) {
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
  const steps = Math.floor(lineDistance / 30)
  const arc = []
  for (let i = 1; i < lineDistance; i += lineDistance / steps) {
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
  animate(map, id, airplane, arc, route, steps, 0, onDone)
}

function finishAnimation(map, id, airplane, arc, route, onDone) {
  // Animate route to completion
  route.features[0].geometry.coordinates = arc
  airplane.features[0].geometry.coordinates = arc[arc.length - 1]
  map.getSource('airplane').setData(airplane)
  map.getSource(`route${id}`).setData(route)

  // Add city dot
  const city = {
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
      'symbol-sort-key': 1,
    },
  })

  onDone()
}

function animate(map, id, airplane, arc, route, steps, counter, onDone) {
  if (counter > arc.length - 2) {
    finishAnimation(map, id, airplane, arc, route, onDone)
    return
  }

  airplane.features[0].geometry.coordinates = arc[counter]
  airplane.features[0].properties.bearing = turf.bearing(
    turf.point(arc[counter]),
    turf.point(arc[counter + 1])
  )
  route.features[0].geometry.coordinates = arc.slice(0, counter)

  // Update the source with this new data
  map.getSource('airplane').setData(airplane)
  map.getSource(`route${id}`).setData(route)

  requestAnimationFrame(() =>
    animate(map, id, airplane, arc, route, steps, counter + 1, onDone)
  )
}

main()
