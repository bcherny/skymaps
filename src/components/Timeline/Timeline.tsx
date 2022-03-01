import {ReactElement} from 'react'
import {Feature} from '../../utils/computeFeatures'
import './Timeline.css'

type Props = {
  color: string
  currentFeature: Feature
  features: Feature[]
}

// Assumes features are in order of date
// Assumes features has length >= 1
export function Timeline({
  color,
  currentFeature,
  features,
}: Props): ReactElement {
  const minDate = features[0].flight.date.getTime()
  const maxDate = features[features.length - 1].flight.date.getTime()
  return (
    <div className="Timeline">
      {features.map((_) => (
        <div
          className={`Flight ${color}`}
          key={_.id}
          style={{left: getLeft(_.flight.date)}}
        />
      ))}
      <div
        className="Plane"
        style={{left: getLeft(currentFeature.flight.date)}}
      />
    </div>
  )

  function getLeft(date: Date): string {
    // 5% buffer on each side
    const left = 5 + (90 * (date.getTime() - minDate)) / (maxDate - minDate)
    return `${left}%`
  }
}
