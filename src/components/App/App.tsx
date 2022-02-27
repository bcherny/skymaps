import React, {useState} from 'react'
import {Flight} from '../../flights'
import Legend from '../Legend/Legend'
import Map from '../Map/Map'
import './App.css'

function App(): React.ReactElement {
  const [currentFlight, setCurrentFlight] = useState<Flight | null>(null)
  return (
    <div className="App">
      <Map currentFlight={currentFlight} setCurrentFlight={setCurrentFlight} />
      {currentFlight && <Legend flight={currentFlight} />}
    </div>
  )
}

export default App
