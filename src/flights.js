import AIRPORTS from './const/AIRPORTS.js'
import BORIS_FLIGHTS from './const/BORIS_FLIGHTS.js'

const AIRPORTS_INVERTED = mapObject(AIRPORTS, ([lat, lng]) => [lng, lat])

function mapObject(o, f) {
  const r = {}
  Object.keys(o).forEach((k) => (r[k] = f(o[k])))
  return r
}

function lookupAirportLatLng(airportCode) {
  const latlng = AIRPORTS_INVERTED[airportCode]
  if (!latlng) {
    throw Error(
      `Can't find latlng for airport with code ${airportCode}. Please add it to AIRPORTS.js`
    )
  }
  return latlng
}

const FLIGHTS = BORIS_FLIGHTS.split('\n')
  .map((_) => _.split(/\s+/).map((_) => _.trim()))
  .filter((_) => _.length > 1)
  .map((_) => {
    const fromLatLng = lookupAirportLatLng(_[1])
    const toLatLng = lookupAirportLatLng(_[2])
    return {
      date: new Date(_[0]),
      from: {code: _[1], latlng: fromLatLng},
      to: {code: _[2], latlng: toLatLng},
      flight: _[3],
    }
  })
  .sort((a, b) => a.date < b.date)

export default FLIGHTS
