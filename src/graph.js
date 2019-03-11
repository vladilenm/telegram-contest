import {Chart} from './chart'
import {ZoomChart} from './zoom-chart';

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
    this.el = options.el
    this.data = options.data
    this.width = options.width || 500
    this.height = options.height || 300
    this.zoomWidth = Math.round(this.width * 3 / 10)

    this.el.insertAdjacentHTML('afterbegin', template)
    this.detailGraph = this.el.querySelector('canvas[data-type=gdetail]')
    this.zoomGraph = this.el.querySelector('canvas[data-type=gzoom]')

    this.left = this.el.querySelector('[data-type=leftm]')
    this.leftArrow = this.el.querySelector('[data-type=left]')
    this.zoom = this.el.querySelector('[data-type=zoom]')
    this.right = this.el.querySelector('[data-type=rightm]')
    this.rightArrow = this.el.querySelector('[data-type=right]')

    this.el.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.el.addEventListener('mouseup', () => document.onmousemove = null)

    new ZoomChart({
      el: this.zoomGraph,
      width: this.width,
      data: this.data,
    })

    this.setZoomPosition(this.width - this.zoomWidth, 5)
  }

  getData() {
    const data = this.data

    const length = data.columns[0].length - 1

    const [leftPercent, visiblePercent] = this.getZoomArea()

    const left = Math.ceil(length * leftPercent / 100)
    const visible = Math.ceil(length * visiblePercent / 100)

    for (let i = 0; i < data.columns.length; i++) {
      let col = data.columns[i].concat()
      const first = col.shift()
      col = col.slice(left, left + visible)
      col.unshift(first)
      data.columns[i] = col
    }

    return data
  }

  renderDetailChart() {
    console.log('render')
    const data = this.getData()
    // this.detailGraph.innerHTML = ''

    new Chart({
      el: this.detailGraph,
      width: this.width,
      height: this.height,
      data: data
    })
  }


  getZoomArea() {
    const left = parseInt(this.zoom.style.left)

    // const ar = new Array(150).fill('')
    // for (let i = 0; i < ar.length; i++) {
    //   ar[i] = i + 1
    // }

    // floor?
    const leftPercent = Math.floor((left * 100) / this.width)
    const visiblePercent = Math.ceil((this.zoomWidth * 100) / this.width)

    return [leftPercent, visiblePercent]

    // const leftSplice = Math.ceil(ar.length * leftPercent / 100)
    // const visible = Math.ceil(ar.length * visiblePercent / 100)

    // todo: lost last element
    // console.log(ar.slice(leftSplice, leftSplice + visible))

  }

  setZoomPosition(left, right) {
    const arrowWidth = 4
    if (
      left <= arrowWidth ||
      right <= arrowWidth ||
      (left + this.zoomWidth) > this.width ||
      this.zoomWidth <= 10
    ) {
      return
    }

    console.log('leftparse', parseInt(this.zoom.style.left))
    console.log('left', left)
    console.log('leftparse', parseInt(this.zoom.style.right))
    console.log('left', right)
    if (parseInt(this.zoom.style.left) === left && parseInt(this.zoom.style.right) === right) {
      return
    }

    this.zoom.style.width = `${this.zoomWidth}px`
    this.zoom.style.left = `${left}px`
    this.zoom.style.right = `${right}px`

    this.left.style.width = `${left}px`
    this.right.style.width = `${right}px`

    this.renderDetailChart()
  }

  handleMouseDown(event) {
    const type = event.target.dataset.type
    const zoom = {
      left: parseInt(this.zoom.style.left),
      right: parseInt(this.zoom.style.right) || 0,
    }
    if (type === 'zoom') {
      const startX = event.pageX
      document.onmousemove = e => {
        const delta = startX - e.pageX
        const left = zoom.left - delta
        const right = this.width - left - this.zoomWidth
        this.setZoomPosition(left, right)
      }
    } else if (type === 'left' || type === 'right') {
      const zoomWidth = this.zoomWidth
      const startX = event.pageX
      document.onmousemove = e => {
        const delta = startX - e.pageX
        if (type === 'left') {
          this.zoomWidth = zoomWidth + delta
          const left = this.width - this.zoomWidth - zoom.right
          const right = this.width - this.zoomWidth - left
          this.setZoomPosition(left, right)
        } else if (type === 'right') {
          this.zoomWidth = zoomWidth - delta
          const right = this.width - this.zoomWidth - zoom.left
          this.setZoomPosition(zoom.left, right)
        }
      }
    }
  }
}