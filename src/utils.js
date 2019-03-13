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

export function transformData(initialData) {
  const datasets = []
  let labels = []

  initialData.columns.forEach(item => {
    if (item[0] === 'x') {
      item.shift()
      labels = [...item]
    } else {
      const type = item.shift()
      datasets.push({
        data: [...item],
        color: initialData.colors[type],
        name: initialData.names[type],
        type: initialData.types[type]
      })
    }
  })

  return {labels, datasets}
}

export function getYValues(datasets) {
  return datasets.reduce((all, dataset) => {
    return all.concat(dataset.data)
  }, [])
}

export function getBoundary(datasets) {
  const allValues = getYValues(datasets)
  const min = Math.floor(Math.min.apply(null, allValues)) // * 0.8
  const max = Math.ceil(Math.max.apply(null, allValues)) // * 1.2

  return [min, max]
}

export function computeRatio(max, min, columnsCount, width, height) {
  const yRatio = (max - min) / height
  const xRatio = width / (columnsCount - 2)

  return [xRatio, yRatio]
}

export function getCoordinates(data, min, height, xRatio, yRatio) {
  return data.map((value, index) => {
    const y = Math.floor(height - ((value - min) / yRatio))
    const x = Math.floor(index * xRatio)
    return [x, y]
  })
}

export function dateFilter(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
  }).format(date)
}