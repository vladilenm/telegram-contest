import {computeDy, computeRatio, getBoundary, getCoordinates} from '../utils'
import {BaseChart} from './base.chart'

export class DetailChart extends BaseChart {
  constructor(options) {
    super(options)
  }

  prepare() {
    super.prepare()
    this.lines = {}
    this.margin = 40
    this.animationSpeed = 10
    this.viewH = this.dpiH - this.margin * 2
    this.activeLabels = this.data.datasets.map(s => s.name)
    this.data.datasets.forEach(set => {
      this.lines[set.name] = {
        opacity: 1,
        step: 0
      }
    })

    this.pos = {}
    this.oldMax = null
    this.dy = null

    // For optimization
    this.proxy = new Proxy(this, {
      set: (...options) => {
        this.raf = requestAnimationFrame(this.render)
        return Reflect.set(...options)
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

  updatePosition(pos) {
    this.proxy.pos = pos
  }

  update({type, name, labels}) {
    if (type === 'removed') {
      this.lines[name] = {
        opacity: 1,
        step: -1 / this.animationSpeed
      }
    } else if (type === 'added') {
      this.lines[name] = {
        opacity: 0,
        step: 1 / this.animationSpeed
      }
    }

    this.proxy.activeLabels = labels
  }

  get visibleData() {
    const {length} = this.data.labels
    const leftIndex = Math.floor(length * this.pos.left / 100)
    const rightIndex = Math.floor(length * this.pos.right / 100)

    return {
      datasets: this.data.datasets
        .filter(set => this.activeLabels.includes(set.name))
        .map(set => ({
          ...set,
          data: set.data.slice(leftIndex, rightIndex)
        })),
      labels: this.data.labels.concat().slice(leftIndex, rightIndex)
    }
  }

  setup() {
    const [min, max] = getBoundary(this.visibleData.datasets)
    this.updateMaxAndDelta(max, min)

    const [xRatio, yRatio] = computeRatio(
      this.oldMax - min,
      this.visibleData.labels.length,
      this.viewW,
      this.viewH
    )

    this.yMin = min
    this.yMax = max

    this.xRatio = xRatio
    this.yRatio = yRatio
  }

  updateMaxAndDelta(max, min) {
    if (!this.oldMax) {
      this.oldMax = max
    }

    if (!this.dy && this.oldMax !== max) {
      this.dy = computeDy({max, min, oldMax: this.oldMax, speed: this.animationSpeed})
    }

    if (this.dy > 0) {
      this.oldMax += this.dy
      if (this.oldMax > max) {
        this.oldMax = max
        this.dy = null
      }
    } else if (this.dy < 0) {
      this.oldMax += this.dy
      if (this.oldMax < max) {
        this.oldMax = max
        this.dy = null
      }
    }
  }

  get translateX() {
    return -1 * Math.round(this.data.labels.length * this.xRatio * this.pos.left / 100)
  }

  shouldAnimate() {
    const opacityFinished = Object.keys(this.lines).map(k => this.lines[k].step).every(l => l === 0)
    return this.dy || !opacityFinished
  }

  render() {
    console.log('[Detail Chart]: render')
    if (this.shouldAnimate()) {
      this.raf = requestAnimationFrame(this.render)
    }

    this.clear()
    this.setup()

    const {dpiW, dpiH, xRatio, mouse, viewH, yMax, yMin, yRatio, margin} = this

    this.draw.yAxis({
      dpiW, viewH, yMax, yMin, margin,
      rowsCount: 5
    })

    this.draw.xAxis({
      data: this.data,
      visibleData: this.visibleData,
      pos: this.pos,
      dpiW, dpiH, xRatio, mouse, margin,
      translateX: this.translateX
    })

    this.data.datasets.forEach(({data, color, name}) => {
      this.c.save()
      this.c.translate(this.translateX, 0)

      const coords = getCoordinates(data, yMin, viewH, xRatio, yRatio, margin)
      this.updateOpacityFor(name)

      this.draw.line({
        coords, color, mouse, dpiW,
        translateX: this.translateX,
        opacity: this.lines[name].opacity,
        withCircles: true,
        visibleItemsCount: this.visibleData.labels.length
      })

      this.c.restore()
    })
  }

  updateOpacityFor(name) {
    if (this.lines[name].step !== 0) {
      this.lines[name].opacity += this.lines[name].step

      if (this.lines[name].opacity >= 1 || this.lines[name].opacity <= 0) {
        this.lines[name].step = 0
      }
    }
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

