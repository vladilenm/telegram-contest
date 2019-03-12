import {computeRatio, getBoundary} from './utils'
import {drawGrid, drawLine, drawXAxis} from './draw'

export class Chart {
  constructor(options) {
    this.el = options.el
    this.c = this.el.getContext('2d')
    this.width = options.width
    this.height = options.height
    this.data = options.data || {}
    // this.columnsCount = options.columnsCount || options.data.columns[0].length - 1 // ??

    this.withGrid = typeof options.withGrid === 'boolean' ? options.withGrid : true
    this.withAxis = typeof options.withAxis === 'boolean' ? options.withAxis : true

    this.setDimensions()
    this.computeRatio()
    this.render()
  }

  computeRatio() {
    const [min, max] = getBoundary(this.data.datasets)
    const [xRatio, yRatio] = computeRatio(
      max,
      min,
      this.data.labels.length,
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


    this.data.datasets.forEach(dataset => {
      drawLine.bind(this)(dataset.data, dataset.color)
    })
  }

  setDimensions() {
    const xAxisHeight = 40

    this.width *= 2 // dpi
    this.height *= 2 // dpi
    this.el.style.width = (this.width / 2) + 'px'
    this.el.style.height = (this.height / 2) + 'px'

    this.el.width = this.width
    this.el.height = this.height

    this.viewWidth = this.width
    this.viewHeight = this.height - xAxisHeight
  }
}

