import {ReactElement} from 'react'
import {Feature} from '../../utils/computeFeatures'
import './Timeline.css'
import {DndProvider, useDrag} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'

type Props = {
  color: string
  currentFeature: Feature
  features: Feature[][]
}

// Assumes features are in order of date
// Assumes features has length >= 1
function Timeline({color, currentFeature, features}: Props): ReactElement {
  const minDate = features.reduce(
    (p, [_]) => Math.min(p, _.flight.date.getTime()),
    Infinity
  )
  const maxDate = features.reduce(
    (p, _) => Math.max(p, _[_.length - 1].flight.date.getTime()),
    -Infinity
  )

  const [{opacity}, dragRef] = useDrag(
    () => ({
      type: 'CARD',
      collect(monitor) {
        return {
          opacity: monitor.isDragging() ? 0.5 : 1,
        }
      },
    }),
    []
  )

  return (
    <div className="Timeline">
      {features.flatMap((f, i) =>
        f.map((_) => (
          <div
            className={`Flight ${i === 0 ? 'Blue' : 'Red'}`}
            key={`${i}${_.id}`}
            style={{
              left: getLeft(_.flight.date),
              opacity,
            }}
          />
        ))
      )}
      <div
        className="Plane"
        ref={dragRef}
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

export default function Wrapper(props: Props): React.ReactElement {
  return (
    <DndProvider backend={HTML5Backend}>
      <Timeline {...props} />
    </DndProvider>
  )
}
