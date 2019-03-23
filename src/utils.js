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

export function computeRatio({pos, viewH, viewW, length, delta}) {
  const percent = (pos.right - pos.left) / 100
  const xRatio = viewW / percent / (length - 2)
  const yRatio = delta / viewH

  return [xRatio, yRatio]
}

export function getCoordinates({data, yMin, viewH, xRatio, yRatio, margin}) {
  return data.map((value, index) => {
    const y = Math.floor(viewH - ((value - yMin) / yRatio))
    const x = Math.floor((index) * xRatio)
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

export function computeDy({max, min, oldMax, speed}) {
  const delta = max - oldMax
  return Math.abs(delta) > (max - min) / speed
    ? delta / speed
    : delta
}

export function isMouseOver(x, mouse, translateX, dpiW, length) {
  if (!mouse) {
    return false
  }
  return Math.abs(x - (mouse.x + Math.abs(translateX))) < dpiW / length / 2
}


export function getRgbValue(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b
  })

  return /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
}

export function hexToRgb(hex, opacity = 1) {
  const r = getRgbValue(hex)
  return `rgba(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}, ${opacity})`
}