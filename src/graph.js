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
    this.el.addEventListener('mouseup', () => {
      document.onmousemove = null
      // this.renderDetailChart()
    })

    new ZoomChart({
      el: this.zoomGraph,
      width: this.width,
      data: this.data,
    })

    this.setZoomPosition(this.width - this.zoomWidth, 5)
    // this.renderDetailChart()
  }

  getColumns() {
    const columns = this.data.columns.concat()

    const length = columns[0].length - 1

    const [leftPercent, visiblePercent] = this.getZoomArea()

    // console.log('leftPercent', leftPercent)
    // console.log('visiblePercent', visiblePercent)


    const left = Math.floor(length * leftPercent / 100)
    const visible = Math.floor(length * visiblePercent / 100)
    for (let i = 0; i < columns.length; i++) {
      const first = columns[i][0]
      const from = left > 1 ? left - 2 : 1
      columns[i] = columns[i].slice(from, left + visible + 2)
      columns[i].unshift(first)
    }

    return columns
  }

  renderDetailChart() {
    const columns = this.getColumns()
    // console.log('render', columns)
    // this.detailGraph.innerHTML = ''

    new Chart({
      el: this.detailGraph,
      width: this.width,
      height: this.height,
      data: {...this.data, columns}
    })
  }


  getZoomArea() {
    const left = parseInt(this.zoom.style.left)

    const leftPercent = left * 100 / this.width
    const visiblePercent = (this.zoomWidth * 100) / this.width

    return [leftPercent, visiblePercent]
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

    // console.log('leftparse', parseInt(this.zoom.style.left))
    // console.log('left', left)
    // console.log('leftparse', parseInt(this.zoom.style.right))
    // console.log('left', right)
    // if (parseInt(this.zoom.style.left) === left && parseInt(this.zoom.style.right) === right) {
    //   return
    // }

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
        if (delta === 0) {
          return
        }
        const left = zoom.left - delta
        const right = this.width - left - this.zoomWidth
        this.setZoomPosition(left, right)
      }
    } else if (type === 'left' || type === 'right') {
      const zoomWidth = this.zoomWidth
      const startX = event.pageX
      document.onmousemove = e => {
        const delta = startX - e.pageX
        if (delta === 0) {
          return
        }
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