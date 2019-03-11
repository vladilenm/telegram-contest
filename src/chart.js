import {computeRatio, dateFilter, getBoundary, getCoordinates} from './utils'

const xAxisHeight = 40

export class Chart {
  constructor(options) {
    this.el = options.el
    this.c = this.el.getContext('2d')
    this.width = options.width || 500
    this.height = options.height || 300
    this.data = options.data || {}
    this.columnsCount = options.columnsCount || options.data.columns[0].length - 1
    this.withGrid = typeof options.withGrid === 'boolean' ? options.withGrid : true
    this.withAxis = typeof options.withAxis === 'boolean' ? options.withAxis : true

    // if (options.fullChart) {
    //   new Chart({
    //     el: document.querySelector('#full-chart'),
    //     width: this.width,
    //     height: 50,
    //     data: this.data,
    //     withGrid: false,
    //     withAxis: false
    //   })
    // }

    setDimensions.call(this)
    this._computeRatio()
    this.render()
  }

  _computeRatio() {
    const [min, max] = getBoundary(this.data.columns)
    const [xRatio, yRatio] = computeRatio(
      max,
      min,
      this.data.columns[1].length - 1,
      this.viewWidth,
      this.viewHeight
    )

    this.yMin = min
    this.yMax = max
    this.xRatio = xRatio
    this.yRatio = yRatio
  }

  render() {
    if (this.withGrid) {
      drawGrid.call(this)
    }
    if (this.withAxis) {
      drawXAxis.call(this)
    }

    for (let i = 0; i < this.data.columns.length - 1; i++) {
      const data = this.data.columns[i + 1]
      const color = this.data.colors[this.data.columns[i + 1][0]]
      drawLine.bind(this)(data, color)
    }
  }
}

function drawLine(dataset, color) {
  const data = getCoordinates(dataset, this.yMin, this.viewHeight, this.xRatio, this.yRatio)

  this.c.beginPath()
  this.c.moveTo(data[0][0], data[0][1])

  data.forEach(([x, y]) => this.c.lineTo(x, y))

  this.c.lineWidth = 2
  this.c.strokeStyle = color

  this.c.stroke()
}

function drawGrid() {
  const stepY = this.viewHeight / 5 // number of rows
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

function setDimensions() {
  this.width *= 2
  this.height *= 2
  this.el.style.width = (this.width / 2) + 'px'
  this.el.style.height = (this.height / 2) + 'px'

  this.el.width = this.width
  this.el.height = this.height

  this.viewWidth = this.width
  this.viewHeight = this.height - xAxisHeight
}

function drawXAxis() {
  const data = this.data.columns[0]
  const columnSize = this.width / this.columnsCount

  const dates = data
    .map((item, index) => {
      if (typeof item === 'string') {
        return
      }

      return new Date(item)
    })
    .filter(i => !!i)

  this.c.beginPath()
  this.c.moveTo(0, 0)

  for (let i = 0; i < dates.length; i += 10) {
    const x = i * this.xRatio
    const text = dateFilter(dates[i])
    this.c.fillText(text, x, this.height - 10)
    this.c.moveTo(x, columnSize)
  }
}