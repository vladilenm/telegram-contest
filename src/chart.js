import {computeRatio, getBoundary, getCoordinates} from './utils'
import {Draw} from './draw'

export class Chart {
  constructor(options) {
    this.el = options.el
    this.c = this.el.getContext('2d')
    this.width = options.width
    this.height = options.height
    this.data = options.data || {}
    this.isFullChart = typeof options.isMini === 'boolean' ? !options.isMini : true

    this.el.style.width = this.width + 'px'
    this.el.style.height = this.height + 'px'

    const xAxisHeight = 40
    this.dpiWidth = this.width * 2
    this.dpiHeight = this.height * 2
    this.viewWidth = this.dpiWidth
    this.viewHeight = this.dpiHeight - xAxisHeight
    this.el.width = this.dpiWidth
    this.el.height = this.dpiHeight

    this.draw = new Draw(this.c)
    this.mouseX = null

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
    this.el.addEventListener('mousemove', this.mouseMoveHandler)
    this.el.addEventListener('mouseleave', this.mouseLeaveHandler)
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

  setData(data) {
    this.data = data
    // this.render()
  }

  render() {
    // console.log('[Chart]: render')
    if (this.isFullChart) {
      this.raf = requestAnimationFrame(this.render)
    }

    this.clear()
    this.computeRatio()

    if (this.isFullChart) {
      const labels = this.data.labels.map(label => new Date(label))
      this.draw.yAxis(labels, this.dpiWidth, this.dpiHeight, this.xRatio, this.mouseX)
      this.draw.xAxis(this.viewHeight, this.yRatio, this.dpiWidth)
    }

    this.data.datasets.forEach(dataset => {
      const coords = getCoordinates(dataset.data, this.yMin, this.viewHeight, this.xRatio, this.yRatio)
      this.draw.line(coords, dataset.color, this.mouseX, this.dpiWidth, this.isFullChart)
    })
  }

  mouseLeaveHandler() {
    this.mouseX = null
  }

  mouseMoveHandler({clientX}) {
    const canvas = this.el.getBoundingClientRect()
    this.mouseX = (clientX - canvas.left) * 2
    // y: this.dpiHeight - (clientY - canvas.top) * 2
  }

  clear() {
    this.c.clearRect(0, 0, this.dpiWidth, this.dpiHeight)
  }

  destroy() {
    this.clear()
    this.el.removeEventListener('mousemove', this.mouseMoveHandler)
    this.el.removeEventListener('mouseleave', this.mouseLeaveHandler)
    if (this.raf) {
      cancelAnimationFrame(this.raf)
    }
  }
}

