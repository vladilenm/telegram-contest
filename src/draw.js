import {dateFilter, getCoordinates} from './utils'

export function drawLine(chartData, color) {
  const data = getCoordinates(chartData, this.yMin, this.viewHeight, this.xRatio, this.yRatio)

  this.c.beginPath()
  this.c.moveTo(data[0][0], data[0][1])

  data.forEach(([x, y]) => this.c.lineTo(x, y))

  this.c.lineWidth = 4
  this.c.strokeStyle = color

  this.c.stroke()
}

export function drawGrid() {
  const rowsCount = 5
  const stepY = this.viewHeight / rowsCount
  let y = stepY

  this.c.beginPath()
  this.c.fillStyle = '#96a2aa'
  this.c.font = 'normal 20px Helvetica,sans-serif'

  while (y <= this.viewHeight) {
    const text = Math.round((this.viewHeight - y) * this.yRatio)
    this.c.fillText(text.toString(), 0, y - 10)
    this.c.moveTo(0, y)
    this.c.lineTo(this.width, y)
    y += stepY
  }

  this.c.strokeStyle = '#dfe6eb'
  this.c.lineWidth = 2
  this.c.stroke()
}

export function drawXAxis() {
  const labels = this.data.labels
  const columnSize = this.width / 5

  const dates = labels.map(label => new Date(label))

  this.c.beginPath()
  this.c.moveTo(0, 0)

  // TODO: 10 is magic number now, should be computed
  for (let i = 0; i < dates.length; i += 10) {
    const x = i * this.xRatio
    const text = dateFilter(dates[i])
    this.c.fillText(text, x, this.height - 10)
    this.c.moveTo(x, columnSize)
  }
}