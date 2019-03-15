import {getCoordinates} from '../utils'
import {BaseChart} from './base.chart'

export class DetailChart extends BaseChart {
  constructor(options) {
    super(options)
  }

  prepare() {
    super.prepare()
    this.margin = 40
    this.viewH = this.dpiH - this.margin * 2

    // Optimization
    this.proxy = new Proxy(this, {
      set: (...options) => {
        const result = Reflect.set(...options)
        this.raf = requestAnimationFrame(this.render)
        return result
      }
    })

    this.render = this.render.bind(this)
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this)
    this.mouseLeaveHandler = this.mouseLeaveHandler.bind(this)
  }

  init() {
    this.$el.addEventListener('mousemove', this.mouseMoveHandler, true)
    this.$el.addEventListener('mouseleave', this.mouseLeaveHandler)
  }

  update(data) {
    this.proxy.data = data
  }

  render() {
    console.log('[Detail Chart]: render')
    // this.raf = requestAnimationFrame(this.render)

    this.clear()
    this.setup()

    const {dpiW, dpiH, xRatio, mouse, viewH, yMax, yMin, yRatio, margin} = this

    this.draw.yAxis(this.data, dpiW, dpiH, xRatio, mouse, margin, 6)
    this.draw.xAxis(dpiW, viewH, yMax, yMin, margin, 5)

    this.data.datasets.forEach(({data, color}) => {
      const coords = getCoordinates(data, yMin, viewH, xRatio, yRatio, margin)
      this.draw.line(coords, color, mouse, dpiW, true)
    })
  }

  mouseLeaveHandler() {
    this.proxy.mouse = null
    this.tooltip.hide()
  }

  mouseMoveHandler({clientX, clientY}) {
    const {left, top} = this.$el.getBoundingClientRect()
    this.proxy.mouse = {
      x: (clientX - left) * 2,
      tooltip: {
        top: clientY - top,
        left:  clientX - left
      }
    }
  }

  destroy() {
    super.destroy()
    this.$el.removeEventListener('mousemove', this.mouseMoveHandler)
    this.$el.removeEventListener('mouseleave', this.mouseLeaveHandler)
  }
}

