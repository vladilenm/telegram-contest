import {computeRatio, css, getBoundary, getCoordinates, noop} from '../utils'
import {Draw} from '../draw'

export class BaseChart {
  constructor(options) {
    this.$el = options.el
    this.c = this.$el.getContext('2d')
    this.w = options.width
    this.h = options.height
    this.tooltip = options.tooltip
    this.data = options.data || {}
    this.trigger = options.onUpdate || noop

    css(this.$el, {
      width: `${this.w}px`,
      height: `${this.h}px`
    })

    this.dpiW = this.w * 2
    this.dpiH = this.h * 2
    this.viewW = this.dpiW
    this.viewH = this.dpiH
    this.$el.width = this.dpiW
    this.$el.height = this.dpiH
    this.draw = new Draw(this.c, this.tooltip)
    this.mouse = null

    this.prepare()
    this.init()
    this.raf = requestAnimationFrame(this.render)
  }

  prepare() {
    this.render = this.render.bind(this)
  }

  init() {}

  setup() {
    const [min, max] = getBoundary(this.data.datasets)
    const [xRatio, yRatio] = computeRatio(
      max - min,
      this.data.labels.length,
      this.viewW,
      this.viewH
    )

    this.yMin = min
    this.yMax = max

    this.xRatio = xRatio
    this.yRatio = yRatio
  }

  update(data) {}

  render() {
    this.clear()
    this.setup()

    const {yMin, viewH, xRatio, yRatio, mouse, dpiW} = this

    this.data.datasets.forEach(({data, color}) => {
      const coords = getCoordinates(data, yMin, viewH, xRatio, yRatio, 0)
      this.draw.line({coords, color, mouse, dpiW, opacity: 1})
    })
  }

  clear() {
    this.c.clearRect(0, 0, this.dpiW, this.dpiH)
  }

  destroy() {
    this.clear()
    cancelAnimationFrame(this.raf)
  }
}