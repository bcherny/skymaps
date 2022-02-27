import AIRPORTS from './const/AIRPORTS'
import KAZ_FLIGHTS from './const/KAZ_FLIGHTS'

const AIRPORTS_INVERTED = mapObject(
  AIRPORTS,
  ([lat, lng]): LngLat => [lng, lat]
)

function mapObject<A, B, O extends {[k: string]: A}>(
  o: O,
  f: (a: O[keyof O]) => B
): {[k in keyof O]: B} {
  const r = {} as {[k in keyof O]: B}
  Object.keys(o).forEach((k: keyof O) => (r[k] = f(o[k])))
  return r
}

function lookupAirportLngLat(airportCode: string): LngLat {
  const lngLat =
    AIRPORTS_INVERTED[airportCode as keyof typeof AIRPORTS_INVERTED]
  if (!lngLat) {
    throw Error(
      `Can't find lngLat for airport with code ${airportCode}. Please add it to AIRPORTS.js`
    )
  }
  return lngLat
}

export type AirportCode = keyof typeof AIRPORTS_INVERTED
export type LngLat = [number, number]

export type Flight = {
  date: Date
  flight: string
  from: {code: AirportCode; lnglat: LngLat}
  to: {code: AirportCode; lnglat: LngLat}
}

const FLIGHTS: Flight[] = KAZ_FLIGHTS.split('\n')
  .map((_) => _.split(/\s+/).map((_) => _.trim()))
  .filter((_) => _.length > 1)
  .map((_) => {
    const fromLngLat = lookupAirportLngLat(_[1])
    const toLngLat = lookupAirportLngLat(_[2])
    return {
      date: new Date(_[0]),
      from: {code: _[1] as AirportCode, lnglat: fromLngLat},
      to: {code: _[2] as AirportCode, lnglat: toLngLat},
      flight: _[3],
    }
  })
  .sort((a, b) => (a.date < b.date ? -1 : 1))

export default FLIGHTS
