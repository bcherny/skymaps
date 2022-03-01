import mapboxgl from 'mapbox-gl'
import {Map as MapboxMap} from 'mapbox-gl'
import {useEffect, useMemo, useRef, useState} from 'react'
import CONFIG from '../../config'
import {LngLat} from '../../flights'

const JAPAN: LngLat = [139.8, 35.6]

mapboxgl.accessToken = CONFIG.MAPBOX_API_KEY

export default function useMapboxMap() {
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
