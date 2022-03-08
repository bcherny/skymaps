import {useDragLayer, XYCoord} from 'react-dnd'

export default function AirplaneDragLayer(): React.ReactElement | null {
  const {itemType, isDragging, item, initialOffset, currentOffset} =
    useDragLayer((monitor) => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      initialOffset: monitor.getInitialSourceClientOffset(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
    }))

  if (!isDragging) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 100,
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <div style={getItemStyles(initialOffset, currentOffset)}>
        <div className="Plane" />
      </div>
    </div>
  )
}
function getItemStyles(
  initialOffset: XYCoord | null,
  currentOffset: XYCoord | null
) {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    }
  }

  let {x, y} = currentOffset

  // if (isSnapToGrid) {
  //   x -= initialOffset.x
  //   y -= initialOffset.y
  //   ;[x, y] = snapToGrid(x, y)
  //   x += initialOffset.x
  //   y += initialOffset.y
  // }

  return {
    transform: `translate(${x}px, ${initialOffset.y}px)`,
  }
}
