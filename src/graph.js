import {Chart} from './chart'
import {ZoomChart} from './zoom-chart'
import {transformData} from './utils'

const template = `
  <div class="graph">
    <canvas data-type="gdetail"></canvas>
    <div class="graph__zoom">
      <canvas data-type="gzoom"></canvas>
      <div data-type="leftm" class="graph__zoom-left">
        <div data-type="left" class="graph__zoom-arrow-left"></div>
      </div>
      
      <div data-type="zoom" class="graph__zoom-window"></div>
      
      <div data-type="rightm" class="graph__zoom-right">
        <div data-type="right" class="graph__zoom-arrow-right"></div>
      </div>
    </div>
  </div>
`

export class Graph {
  constructor(options) {
    if (!options.el) {
      throw new Error('[Telegram Chart]: El option must be provided')
    }

    if (!options.data) {
      throw new Error('[Telegram Chart]: Data option must be provided')
    }

    this.el = options.el
    this.data = transformData(options.data)
    this.width = options.width || 500
    this.height = options.height || 300

    this.el.insertAdjacentHTML('afterbegin', template)
    this.detailGraph = this.el.querySelector('canvas[data-type=gdetail]')
    this.zoomGraph = this.el.querySelector('canvas[data-type=gzoom]')

    this.left = this.el.querySelector('[data-type=leftm]')
    this.zoom = this.el.querySelector('[data-type=zoom]')
    this.right = this.el.querySelector('[data-type=rightm]')

    this.mouseDownHandler = this.mouseDownHandler.bind(this)
    this.mouseUpHandler = this.mouseUpHandler.bind(this)

    this.el.addEventListener('mousedown', this.mouseDownHandler)
    this.el.addEventListener('mouseup', this.mouseUpHandler)

    this.zoomChart = new ZoomChart({
      el: this.zoomGraph,
      width: this.width,
      data: this.data
    })

    const defaultZoomWidth = this.width * 3 / 10 // 30%
    this.setZoomPosition(this.width - defaultZoomWidth, 0)
  }

  getData() {
    const data = {datasets: []}

    const datasets = this.data.datasets.concat()
    const labels = this.data.labels.concat()

    const [left, right] = this.getZoomPosition()

    const leftIndex = Math.ceil(labels.length * left / 100)
    const rightIndex = Math.ceil(labels.length * right / 100)

    data.labels = labels.slice(leftIndex - 1, rightIndex)

    for (let i = 0; i < datasets.length; i++) {
      data.datasets.push({
        ...datasets[i],
        data: datasets[i].data.slice(leftIndex - 1, rightIndex)
      })
    }

    return data
  }

  updateDetailChart() {
    if (!this.chart) {
      this.chart = new Chart({
        el: this.detailGraph,
        width: this.width,
        height: this.height,
        data: this.getData()
      })
    } else {
      this.chart.setData(this.getData())
    }
  }

  getZoomPosition() {
    const leftPx = parseInt(this.left.style.width)
    const rightPx = this.width - parseInt(this.right.style.width)

    return [
      leftPx * 100 / this.width,
      rightPx * 100 / this.width
    ]
  }

  setZoomPosition(left, right) {
    const zoomWidth = this.width - right - left
    if (zoomWidth <= 10) {
      return
    }

    if (left <= 0) {
      this.zoom.style.left = `0px`
      this.left.style.width = `0px`
      return
    }

    if (right < 0) {
      this.zoom.style.right = `0px`
      this.right.style.width = `0px`
      return
    }

    this.zoom.style.width = `${zoomWidth}px`
    this.zoom.style.left = `${left}px`
    this.zoom.style.right = `${right}px`

    this.left.style.width = `${left}px`
    this.right.style.width = `${right}px`

    this.updateDetailChart()
  }

  mouseDownHandler(event) {
    const type = event.target.dataset.type
    const zoom = {
      left: parseInt(this.zoom.style.left),
      right: parseInt(this.zoom.style.right),
      width: parseInt(this.zoom.style.width)
    }
    if (type === 'zoom') {
      const startX = event.pageX
      window.onmousemove = e => {
        const delta = startX - e.pageX
        if (delta === 0) {
          return
        }
        const left = zoom.left - delta
        const right = this.width - left - zoom.width
        this.setZoomPosition(left, right)
      }
    } else if (type === 'left' || type === 'right') {
      const zoomWidth = zoom.width
      const startX = event.pageX
      window.onmousemove = e => {
        const delta = startX - e.pageX
        if (delta === 0) {
          return
        }
        if (type === 'left') {
          const left = this.width - (zoomWidth + delta) - zoom.right
          const right = this.width - (zoomWidth + delta) - left
          this.setZoomPosition(left, right)
        } else if (type === 'right') {
          const right = this.width - (zoomWidth - delta) - zoom.left
          this.setZoomPosition(zoom.left, right)
        }
      }
    }
  }

  mouseUpHandler() {
    window.onmousemove = null
  }

  destroy() {
    this.el.removeEventListener('mousedown', this.mouseDownHandler)
    this.el.removeEventListener('mouseup', this.mouseUpHandler)
    this.chart.destroy()
    this.zoomChart.destroy()
    this.el.innerHTML = ''
  }
}