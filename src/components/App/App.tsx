import React, {useCallback, useMemo, useState} from 'react'
import {BLUE_FLIGHTS} from '../../flights'
import computeFeatures, {Feature} from '../../utils/computeFeatures'
import Legend from '../Legend/Legend'
import Map from '../Map/Map'
import {Timeline} from '../Timeline/Timeline'
import './App.css'

function App(): React.ReactElement {
  const features = useMemo(() => computeFeatures(BLUE_FLIGHTS), [])
  const [currentFeature, setCurrentFeature] = useState<Feature>(features[0])

  const onFlightDone = useCallback(() => {
    const i = features.indexOf(currentFeature)
    const nextFeature = features[i + 1]
    if (nextFeature) {
      setCurrentFeature(nextFeature)
    }
  }, [currentFeature, features])

  return (
    <div className="App">
      <Map currentFeature={currentFeature} onFlightDone={onFlightDone} />
      <Legend flight={currentFeature.flight} />
      <Timeline
        currentFeature={currentFeature}
        features={features}
        color="Blue"
      />
    </div>
  )
}

export default App
