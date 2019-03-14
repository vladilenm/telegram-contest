import {Chart} from './chart'
import {ZoomChart} from './zoom-chart'
import {Tooltip} from './tooltip'
import {transformData} from './utils'
import {LabelCheckbox} from './label-checkbox'

const template = `
  <div class="graph">
    <div class="tooltip" data-type="tooltip" style="display: none;z-index: 3;" tabindex="-1"></div>
    <canvas style="z-index: 2;" data-type="gdetail"></canvas>
    <div class="graph__zoom" style="z-index: 1;">
      <canvas data-type="gzoom"></canvas>
      <div data-type="leftm" class="graph__zoom-left">
        <div data-type="left" class="graph__zoom-arrow-left"></div>
      </div>
      
      <div data-type="zoom" class="graph__zoom-window"></div>
      
      <div data-type="rightm" class="graph__zoom-right">
        <div data-type="right" class="graph__zoom-arrow-right"></div>
      </div>
    </div>
    <div class="graph__labels" data-type="labels"></div>
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
    this.activeLabels = this.data.datasets.map(set => set.name)

    this.el.insertAdjacentHTML('afterbegin', template)
    this.detailGraph = this.el.querySelector('canvas[data-type=gdetail]')
    this.zoomGraph = this.el.querySelector('canvas[data-type=gzoom]')
    this.tooltipEl = this.el.querySelector('[data-type=tooltip]')
    this.labels = this.el.querySelector('[data-type=labels]')

    this.left = this.el.querySelector('[data-type=leftm]')
    this.zoom = this.el.querySelector('[data-type=zoom]')
    this.right = this.el.querySelector('[data-type=rightm]')


    this.mouseDownHandler = this.mouseDownHandler.bind(this)
    this.mouseUpHandler = this.mouseUpHandler.bind(this)
    this.labelsClickHandler = this.labelsClickHandler.bind(this)

    this.init()
  }

  init() {
    this.el.addEventListener('mousedown', this.mouseDownHandler)
    this.labels.addEventListener('click', this.labelsClickHandler)
    document.addEventListener('mouseup', this.mouseUpHandler)

    this.zoomChart = new ZoomChart({
      el: this.zoomGraph,
      width: this.width,
      data: this.data
    })

    const defaultZoomWidth = this.width * 3 / 10 // 30% by default
    this.setZoomPosition(this.width - defaultZoomWidth, 0)

    this.renderLabels()
  }

  renderLabels() {
    const labels = this.data.datasets.map(({name, color}) => {
      return new LabelCheckbox({name, color}).toHtml()
    }).join(' ')
    this.labels.insertAdjacentHTML('afterbegin', labels)
  }

  labelsClickHandler({target: {value, checked, tagName}}) {
    if (tagName.toLowerCase() === 'input') {
      if (checked) {
        this.activeLabels.push(value)
      } else {
        this.activeLabels = this.activeLabels.filter(l => l !== value)
      }
    }
    this.updateDetailChart()
    this.updateZoomChart()
  }

  getData() {
    const data = {datasets: []}

    const datasets = this.data.datasets.filter(set => {
      return this.activeLabels.includes(set.name)
    })
    const labels = this.data.labels.concat()

    const [left, right] = this.getZoomPosition()

    const leftIndex = Math.ceil(labels.length * left / 100)
    const rightIndex = Math.ceil(labels.length * right / 100)

    data.labels = labels.slice(leftIndex ? leftIndex - 1 : 0, rightIndex)
    data.datasets = datasets.map(set => ({
      ...set,
      data: set.data.slice(leftIndex ? leftIndex - 1 : 0, rightIndex)
    }))

    return data
  }

  getDataForZoom() {
    return {
      datasets: this.data.datasets.filter(set => {
        return this.activeLabels.includes(set.name)
      }),
      labels: this.data.labels.concat()
    }
  }

  updateDetailChart() {
    if (!this.chart) {
      this.chart = new Chart({
        el: this.detailGraph,
        width: this.width,
        height: this.height,
        tooltip: new Tooltip(this.tooltipEl),
        data: this.getData()
      })
    } else {
      this.chart.update(this.getData())
    }
  }

  updateZoomChart() {
    this.zoomChart.update(this.getDataForZoom())
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
    if (zoomWidth < 20) {
      this.zoom.style.width = `20px`
      return
    }

    if (left < 0) {
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
    document.removeEventListener('mouseup', this.mouseUpHandler)
    this.labels.removeEventListener('click', this.labelsClickHandler)
    this.chart.destroy()
    this.zoomChart.destroy()
    this.el.innerHTML = ''
  }
}