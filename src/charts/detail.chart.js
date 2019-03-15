import {getCoordinates} from '../utils'
import {BaseChart} from './base.chart'

export class DetailChart extends BaseChart {
  constructor(options) {
    super(options)

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
  }

  prepare() {
    this.margin = 40
    this.viewH = this.dpiH - this.margin * 2

    this.render = this.render.bind(this)
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this)
    this.mouseLeaveHandler = this.mouseLeaveHandler.bind(this)
  }

  init() {
    this.el.addEventListener('mousemove', this.mouseMoveHandler, true)
    this.el.addEventListener('mouseleave', this.mouseLeaveHandler)
  }

  update(data) {
    this.data = data
  }

  render() {
    // console.log('[Chart]: render')
    this.raf = requestAnimationFrame(this.render)

    this.clear()
    this.setup()

    const {dpiW, dpiH, xRatio, mouse, viewH, yMax, yMin, yRatio, margin} = this

    this.draw.yAxis(this.data, dpiW, dpiH, xRatio, mouse)
    this.draw.xAxis(dpiW, viewH, yMax, yMin)

    this.data.datasets.forEach(({data, color}) => {
      const coords = getCoordinates(data, yMin, viewH, xRatio, yRatio, margin)
      this.draw.line(coords, color, mouse, dpiW, true)
    })
  }

  mouseLeaveHandler() {
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

  destroy() {
    super.destroy()
    this.el.removeEventListener('mousemove', this.mouseMoveHandler)
    this.el.removeEventListener('mouseleave', this.mouseLeaveHandler)
  }
}

