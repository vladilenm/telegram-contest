import {BaseChart} from './base.chart'
import {css} from '../utils'

export class SliderChart extends BaseChart {
  constructor(options) {
    super({
      ...options,
      el: options.el.querySelector('canvas')
    })
  }

  prepare() {
    super.prepare()
    this.$wrap = this.$el.parentElement
    this.mouseDownHandler = this.mouseDownHandler.bind(this)
    this.mouseUpHandler = this.mouseUpHandler.bind(this)
  }

  init() {
    this.$left = this.$wrap.querySelector('[data-el=left]')
    this.$window = this.$wrap.querySelector('[data-el=window]')
    this.$right = this.$wrap.querySelector('[data-el=right]')

    this.$wrap.addEventListener('mousedown', this.mouseDownHandler)
    document.addEventListener('mouseup', this.mouseUpHandler)

    const defaultWidth = this.w * 0.3 // 30% by default
    this.setPosition(0, this.w - defaultWidth)
  }


  updateTheme(theme) {
    css(this.$left, {background: theme.sliderBackground})
    css(this.$right, {background: theme.sliderBackground})
    css(this.$right.querySelector('[data-el=arrow]'), {background: theme.sliderArrow})
    css(this.$left.querySelector('[data-el=arrow]'), {background: theme.sliderArrow})
  }

  update(data) {
    this.data = data
    this.render()
  }

  mouseDownHandler(event) {
    const {type} = event.target.dataset
    const dimension = {
      left: parseInt(this.$window.style.left),
      right: parseInt(this.$window.style.right),
      width: parseInt(this.$window.style.width)
    }
    if (type === 'window') {
      const startX = event.pageX
      document.onmousemove = e => {
        const delta = startX - e.pageX
        if (delta === 0) {
          return
        }
        const left = dimension.left - delta
        const right = this.w - left - dimension.width
        this.setPosition(left, right)
        this.trigger()
      }
    } else if (type === 'left' || type === 'right') {
      const zoomWidth = dimension.width
      const startX = event.pageX
      document.onmousemove = e => {
        const delta = startX - e.pageX
        if (delta === 0) {
          return
        }
        if (type === 'left') {
          const left = this.w - (zoomWidth + delta) - dimension.right
          const right = this.w - (zoomWidth + delta) - left
          this.setPosition(left, right)
        } else {
          const right = this.w - (zoomWidth - delta) - dimension.left
          this.setPosition(dimension.left, right)
        }
        this.trigger()
      }
    }
  }

  setPosition(left, right) {
    const width = this.w - right - left
    const minWidth = this.w * 0.05 // 5% of full width
    if (width < minWidth) {
      this.$window.style.width = `${minWidth}px`
      return
    }

    if (left < 0) {
      this.$window.style.left = `0px`
      this.$left.style.width = `0px`
      return
    }

    if (right < 0) {
      this.$window.style.right = `0px`
      this.$right.style.width = `0px`
      return
    }

    this.$window.style.width = `${width}px`
    this.$window.style.left = `${left}px`
    this.$window.style.right = `${right}px`

    this.$left.style.width = `${left}px`
    this.$right.style.width = `${right}px`
  }

  get position() {
    const leftPx = parseInt(this.$left.style.width)
    const rightPx = this.w - parseInt(this.$right.style.width)

    return [
      leftPx * 100 / this.w,
      rightPx * 100 / this.w
    ]
  }

  mouseUpHandler() {
    document.onmousemove = null
  }

  destroy() {
    super.destroy()
    this.$wrap.removeEventListener('mousedown', this.mouseDownHandler)
    document.removeEventListener('mouseup', this.mouseUpHandler)
    this.$wrap.innerHTML = ''
  }
}