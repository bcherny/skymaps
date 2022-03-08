import {useEffect} from 'react'
import {useDrag} from 'react-dnd'
import {getEmptyImage} from 'react-dnd-html5-backend'

type Props = {
  // Percent (eg. .13)
  left: number
}

export default function Airplane({left}: Props): React.ReactElement {
  const [{isDragging}, dragRef, preview] = useDrag(
    () => ({
      type: 'AIRPLANE',
      item: {left}, // TODO
      collect(monitor) {
        return {
          isDragging: monitor.isDragging(),
        }
      },
    }),
    []
  )

  useEffect(() => {
    preview(getEmptyImage(), {captureDraggingState: true})
  }, [preview])

  return (
    <div
      className="Plane"
      ref={dragRef}
      style={{left: `${100 * left}%`, opacity: isDragging ? 0 : 1}}
    />
  )
}
