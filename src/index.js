import CONFIG from './config.js'
import FLIGHTS from './flights.js'

mapboxgl.accessToken = CONFIG.MAPBOX_API_KEY

// Number of steps to use in the arc and animation, more steps means
// a smoother arc and animation, but too many steps will result in a
// low frame rate
const STEPS = 500

function main() {
  const map = createMap()
  const {routes, points} = computeFeatures()

  map.on('load', () => {
    plotFlights(map, routes, points)

    routes.features.forEach((feature, index) => {
      const singleRoute = {...routes, features: [feature]}
      const singlePoint = {...points, features: [points[index]]}
      animateFlights(map, singleRoute, singlePoint)
    })
  })
}

function createMap() {
  return new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 2,
  })
}

function computeFeatures() {
  const routes = {
    type: 'FeatureCollection',
    features: FLIGHTS.map((_) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [_.from.latlng, _.to.latlng],
      },
    })),
  }

  // Calculate the distance in kilometers between route start/end point.
  const lineDistance = turf.length(routes.features[0])
  const arc = []

  // Draw an arc between the `origin` & `destination` of the two points
  for (let i = 0; i < lineDistance; i += lineDistance / STEPS) {
    const segment = turf.along(routes.features[0], i)
    arc.push(segment.geometry.coordinates)
  }

  // Update the routes with calculated arc coordinates
  routes.features[0].geometry.coordinates = arc

  const points = {
    type: 'FeatureCollection',
    features: FLIGHTS.map((_) => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: _.from.latlng,
      },
    })),
  }
  return {routes, points}
}

function plotFlights(map, routes, points) {
  map.addSource('route', {
    type: 'geojson',
    data: routes,
  })

  map.addSource('point', {
    type: 'geojson',
    data: points,
  })

  map.addLayer({
    id: 'route',
    source: 'route',
    type: 'line',
    paint: {
      'line-width': 2,
      'line-color': '#007cbf',
    },
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
}

function animateFlights(map, routes, points) {
  // Used to increment the value of the point measurement against the route.
  let counter = 0

  function animate(counter) {
    const start =
      routes.features[0].geometry.coordinates[
        counter >= STEPS ? counter - 1 : counter
      ]
    const end =
      routes.features[0].geometry.coordinates[
        counter >= STEPS ? counter : counter + 1
      ]
    if (!start || !end) return

    // Update point geometry to a new position based on counter denoting
    // the index to access the arc
    points.features[0].geometry.coordinates =
      routes.features[0].geometry.coordinates[counter]

    // Calculate the bearing to ensure the icon is rotated to match the route arc
    // The bearing is calculated between the current point and the next point, except
    // at the end of the arc, which uses the previous point and the current point
    points.features[0].properties.bearing = turf.bearing(
      turf.point(start),
      turf.point(end)
    )

    // Update the source with this new data
    map.getSource('point').setData(points)

    // Request the next frame of animation as long as the end has not been reached
    if (counter < STEPS) {
      requestAnimationFrame(animate)
    }

    counter = counter + 1
  }

  animate(counter)
}

main()
