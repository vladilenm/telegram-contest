export function transformData(data) {
  const datasets = []
  let labels = []

  data.columns.forEach(column => {
    if (column[0] === 'x') {
      column.shift()
      labels = column.concat()
    } else {
      const type = column.shift()
      datasets.push({
        data: [...column],
        color: data.colors[type],
        name: data.names[type],
        type: data.types[type]
      })
    }
  })

  return {labels, datasets}
}

export function getValues(datasets) {
  return datasets.reduce((all, dataset) => {
    return all.concat(dataset.data)
  }, [])
}

export function getBoundary(datasets) {
  const values = getValues(datasets)
  const min = Math.floor(Math.min.apply(null, values))
  const max = Math.ceil(Math.max.apply(null, values))

  return [min, max]
}

export function computeRatio(max, min, length, width, height) {
  const yRatio = (max - min) / height
  const xRatio = width / (length - 2)

  return [xRatio, yRatio]
}

export function getCoordinates(data, min, height, xRatio, yRatio, margin = 0) {
  return data.map((value, index) => {
    const y = Math.floor(height - ((value - min) / yRatio))
    const x = Math.floor(index * xRatio)
    return [x, y + margin]
  })
}

const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function toDate(timestamp, withDay) {
  const date = new Date(timestamp)
  if (withDay) {
    return `${shortDays[date.getDay()]}, ${shortMonths[date.getMonth()]} ${date.getDate()}`
  }
  return `${shortMonths[date.getMonth()]} ${date.getDate()}`
}

export function css(el, styles = {}) {
  Object.keys(styles).forEach(style => {
    el.style[style] = styles[style]
  })
}

export function noop() {}