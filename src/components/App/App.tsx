import React, {useCallback, useMemo, useState} from 'react'
import {BLUE_FLIGHTS, RED_FLIGHTS} from '../../flights'
import computeFeatures, {Feature} from '../../utils/computeFeatures'
import Legend from '../Legend/Legend'
import Map from '../Map/Map'
import Timeline from '../Timeline/Timeline'
import './App.css'

function App(): React.ReactElement {
  const blueFeatures = useMemo(() => computeFeatures(BLUE_FLIGHTS), [])
  const redFeatures = useMemo(() => computeFeatures(RED_FLIGHTS), [])
  const [currentFeature, setCurrentFeature] = useState<Feature>(blueFeatures[0])

  const onFlightDone = useCallback(() => {
    const i = blueFeatures.indexOf(currentFeature)
    const nextFeature = blueFeatures[i + 1]
    if (nextFeature) {
      setCurrentFeature(nextFeature)
    }
  }, [currentFeature, blueFeatures])

  return (
    <div className="App">
      <Map currentFeature={currentFeature} onFlightDone={onFlightDone} />
      <Legend flight={currentFeature.flight} />
      <Timeline
        currentFeature={currentFeature}
        features={[blueFeatures, redFeatures]}
        color="Blue"
      />
    </div>
  )
}

export default App
