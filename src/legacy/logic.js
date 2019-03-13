import {config} from './config'

function getValueArray(data) {
  return data.map(item => item.value)
}

function getCoordinates(values, max, min) {
  const yRatio = (max - min) / config.height
  const xRatio = config.width / (values.length - 2)

  return values.map((value, i) => {
    const y = config.height - ((value - min) / yRatio)
    const x = (xRatio * i) - (xRatio / 2)
    return [x, y]
  })
}

function getYValues(columns) {
  return columns.reduce((all, column) => {
    if (column[0] === 'x') {
      return all
    }
    const col = column.concat()
    col.shift()
    return all.concat(col)
  }, [])
}

function getMinAndMaxY(allValues) {
  const minY = Math.floor(Math.min.apply(null, allValues) * 0.8)
  const maxY = Math.ceil(Math.max.apply(null, allValues) * 1.2)

  return {minY, maxY}
}

export function calculateSVGData(chartData) {
  const allValues = getYValues(chartData.columns)
  const {maxY, minY} = getMinAndMaxY(allValues)

  // return chartData.map(line => {
    // const values = getValueArray(line.points)
    // return {
    //   ...line,
    //   points: getCoordinates(values, maxY, minY)
    // }
  // })

  // return
}