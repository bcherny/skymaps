import {ReactElement, useMemo, useRef, useState} from 'react'
import {Feature} from '../../utils/computeFeatures'
import './Timeline.css'
import {DndProvider, useDrag, useDrop} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import Airplane from './Airplane'
import AirplaneDragLayer from './AirplaneDragLayer'

type Props = {
  color: string
  currentFeature: Feature
  features: Feature[][]
}

// Assumes features are in order of date
// Assumes features has length >= 1
function Timeline({color, currentFeature, features}: Props): ReactElement {
  const minDate = features.reduce(
    (p, [_]) => (_.flight.date < p ? _.flight.date : p),
    features[0][0].flight.date
  )
  const maxDate = features.reduce(
    (p, _) =>
      _[_.length - 1].flight.date < p ? p : _[_.length - 1].flight.date,
    features[0][0].flight.date
  )

  const [airplaneLeftManual, setAirplaneLeftManual] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const airplaneLeft = getLeft(currentFeature.flight.date, minDate, maxDate)

  const [, dropRef] = useDrop(
    () => ({
      accept: 'AIRPLANE',
      drop(item: {left: number}, monitor) {
        const delta = monitor.getDifferenceFromInitialOffset()!

        let left = Math.round(item.left + delta.x)
        // if (snapToGrid) {
        //   ;[left, top] = doSnapToGrid(left, top)
        // }

        console.log(
          'drop',
          item,
          delta.x,
          wrapperRef.current?.getBoundingClientRect()
        )

        setAirplaneLeftManual(left)
        return undefined
      },
    }),
    []
  )

  return (
    <div ref={wrapperRef}>
      <div className="Timeline" ref={dropRef}>
        {features.flatMap((f, i) =>
          f.map((_) => (
            <div
              className={`Flight ${i === 0 ? 'Blue' : 'Red'}`}
              key={`${i}${_.id}`}
              style={{
                left: `${100 * getLeft(_.flight.date, minDate, maxDate)}%`,
              }}
            />
          ))
        )}
        <Airplane left={airplaneLeft} />
        <AirplaneDragLayer />
      </div>
    </div>
  )
}

function getLeft(date: Date, minDate: Date, maxDate: Date): number {
  // 5% buffer on each side
  return (
    0.05 +
    (0.9 * (date.getTime() - minDate.getTime())) /
      (maxDate.getTime() - minDate.getTime())
  )
}

export default function Wrapper(props: Props): React.ReactElement {
  return (
    <DndProvider backend={HTML5Backend}>
      <Timeline {...props} />
    </DndProvider>
  )
}
