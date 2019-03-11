export function getRandom(min, max) {
  return Math.ceil(Math.random() * (max - min) + min)
}

export function getCoords(elem) {
  const box = elem.getBoundingClientRect()
  return {
    top: box.top + pageYOffset,
    left: box.left + pageXOffset
  }
}

export function getYValues(columns) {
  return columns.reduce((all, column) => {
    if (column[0] === 'x') {
      return all
    }
    const col = column.concat()
    col.shift()
    return all.concat(col)
  }, [])
}

export function getBoundary(columns) {
  const allValues = getYValues(columns)
  const min = Math.floor(Math.min.apply(null, allValues) * 0.8)
  const max = Math.ceil(Math.max.apply(null, allValues) * 1.2)

  return [min, max]
}

export function computeRatio(max, min, columnsCount, width, height) {
  const yRatio = (max - min) / height
  const xRatio = width / (columnsCount - 2)

  return [xRatio, yRatio]
}

export function getCoordinates(columns, min, height, xRatio, yRatio) {
  return columns
    .map((value, i) => {
      if (typeof value === 'string') {
        return
      }
      const y = height - ((value - min) / yRatio)
      const x = i * xRatio - (xRatio / 2)
      return [x, y]
    })
    .filter(c => !!c)
}

export function dateFilter(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
  }).format(date)
}