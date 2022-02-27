import React from 'react'
import ReactDOM from 'react-dom'
import mapboxgl, {LngLatLike} from 'mapbox-gl'
import type {Map} from 'mapbox-gl'
import './index.css'

import App from './components/App/App'

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)
