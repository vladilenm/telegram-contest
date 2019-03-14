import {computeRatio, css, getBoundary, getCoordinates} from './utils'
import {Draw} from './draw'

export class Chart {
  constructor(options) {
    this.el = options.el
    this.c = this.el.getContext('2d')
    this.width = options.width
    this.height = options.height
    this.tooltip = options.tooltip
    this.data = options.data || {}
    this.isFullChart = typeof options.isMini === 'boolean' ? !options.isMini : true

    css(this.el, {
      width: `${this.width}px`,
      height: `${this.height}px`
    })

    const margin = 40
    this.dpiWidth = this.width * 2
    this.dpiHeight = this.height * 2
    this.viewWidth = this.dpiWidth
    this.viewHeight = this.dpiHeight - (this.isFullChart ? margin * 2 : 0)
    this.el.width = this.dpiWidth
    this.el.height = this.dpiHeight

    this.draw = new Draw(this.c, this.tooltip)
    this.mouse = null

    this.render = this.render.bind(this)
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this)
    this.mouseLeaveHandler = this.mouseLeaveHandler.bind(this)

    // Optimization

    // this.proxy = new Proxy(this.data, {
    //   set(target, prop, value) {
    //     console.log(target, prop, value)
    //     target[prop] = value
    //   },
    //   get(target, prop) {
    //     console.log('get')
    //     return target[prop]
    //   }
    // })

    // Object.defineProperty(this, '_data', {
    //   // value: options.data || {},
    //   configurable: true,
    //   enumerable: true,
    //   // writable: true,
    //   set(value) {
    //     this.render()
    //     console.log('SET', value)
    //   }
    // })

    this.init()
    this.raf = requestAnimationFrame(this.render)
  }

  init() {
    if (this.isFullChart) {
      this.el.addEventListener('mousemove', this.mouseMoveHandler, true)
      this.el.addEventListener('mouseleave', this.mouseLeaveHandler)
    }
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

  update(data) {
    this.data = data
  }

  render() {
    // console.log('[Chart]: render')
    if (this.isFullChart) {
      this.raf = requestAnimationFrame(this.render)
    }

    this.clear()
    this.computeRatio()

    if (this.isFullChart) {
      this.draw.yAxis(this.data, this.dpiWidth, this.dpiHeight, this.xRatio, this.mouse)
      this.draw.xAxis(this.dpiWidth, this.viewHeight, this.yMax, this.yMin)
    }

    this.data.datasets.forEach(dataset => {
      const coords = getCoordinates(
        dataset.data,
        this.yMin,
        this.viewHeight,
        this.xRatio,
        this.yRatio,
        this.isFullChart ? 40 : 0
      )
      this.draw.line(coords, dataset.color, this.mouse, this.dpiWidth, this.isFullChart)
    })
  }

  mouseLeaveHandler() {
    // console.log('mouseLeaveHandler')
    this.mouse = null
    this.tooltip.hide()
  }

  mouseMoveHandler({clientX, clientY}) {
    const {left, top} = this.el.getBoundingClientRect()
    this.mouse = {
      x: (clientX - left) * 2,
      tooltip: {
        top: clientY - top,
        left:  clientX - left
      }
    }
  }

  clear() {
    this.c.clearRect(0, 0, this.dpiWidth, this.dpiHeight)
  }

  destroy() {
    this.clear()
    this.el.removeEventListener('mousemove', this.mouseMoveHandler)
    this.el.removeEventListener('mouseleave', this.mouseLeaveHandler)
    cancelAnimationFrame(this.raf)
  }
}

