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
      this.lines[set.name] = {opacity: 1, step: 0}
    })

    this.pos = {}
    this.max = null
    this.dy = null

    // For optimization
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
    const leftIndex = Math.round(length * this.pos.left / 100)
    const rightIndex = Math.round(length * this.pos.right / 100)

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

  get translateX() {
    return -1 * Math.round(this.data.labels.length * this.xRatio * this.pos.left / 100)
  }

  get delta() {
    return Math.round(this.max - this.yMax)
  }

  setup() {
    const [min, max] = getBoundary(this.visibleData.datasets)
    this.updateMaxAndDelta(max, min)

    // let [xRatio, yRatio] = computeRatio(
    //   this.max - min,
    //   this.pos,
    //   this.data.labels.length,
    //   this.viewW,
    //   this.viewH
    // )
    const percent = (this.pos.right - this.pos.left) / 100
    const xRatio = this.viewW / percent / (this.data.labels.length - 2)
    const yRatio = (this.max - min) / this.viewH

    this.yMin = min
    this.yMax = max

    this.xRatio = xRatio
    this.yRatio = yRatio
  }

  updateMaxAndDelta(max, min) {
    if (!this.max) {
      this.max = max
    }

    if (!this.dy && this.max !== max) {
      this.dy = computeDy({max, min, oldMax: this.max, speed: this.animationSpeed})
    }

    if (this.dy > 0) {
      this.max += this.dy
      if (this.max > max) {
        this.max = max
        this.dy = null
      }
    } else if (this.dy < 0) {
      this.max += this.dy
      if (this.max < max) {
        this.max = max
        this.dy = null
      }
    }
  }

  shouldAnimate() {
    const isTransitionFinished = Object
      .keys(this.lines)
      .map(k => this.lines[k].step)
      .every(l => l === 0)

    return this.dy || !isTransitionFinished || this.delta
  }

  updateTheme(theme) {
    this.draw.updateTheme(theme)
    this.raf = requestAnimationFrame(this.render)
  }

  render() {
    this.clear()
    this.setup()

    if (this.shouldAnimate()) {
      this.raf = requestAnimationFrame(this.render)
    }

    this.draw.yAxis({
      dy: this.dy,
      dpiW: this.dpiW,
      viewH: this.viewH,
      delta: this.delta,
      yMax: this.yMax,
      yMin: this.yMin,
      margin: this.margin,
      rowsCount: 5
    })

    this.draw.xAxis({
      data: this.data,
      visibleItemsLength: this.visibleData.labels.length,
      dpiW: this.dpiW,
      viewW: this.viewW,
      pos: this.pos,
      dpiH: this.dpiH,
      xRatio: this.xRatio,
      mouse: this.mouse,
      margin: this.margin,
      activeLabels: this.activeLabels,
      translateX: this.translateX
    })

    this.data.datasets.forEach(({data, color, name}) => {
      if (this.shouldSkipLine(name)) {
        return
      }

      const coords = getCoordinates(data, this.yMin, this.viewH, this.xRatio, this.yRatio, this.margin)
      this.updateOpacityFor(name)

      this.draw.line({
        coords, color,
        translateX: this.translateX,
        mouse: this.mouse,
        dpiW: this.dpiW,
        opacity: this.lines[name].opacity,
        visibleItemsCount: this.visibleData.labels.length,
        withCircles: true
      })
    })
  }

  shouldSkipLine(name) {
    return this.lines[name].opacity <= 0 && this.lines[name].step === 0
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

