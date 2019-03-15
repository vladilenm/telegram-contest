import {DetailChart} from './detail.chart'
import {SliderChart} from './slider.chart'
import {Tooltip} from '../components/tooltip'
import {Label} from '../components/label'

const template = `
  <div class="tg-chart">
    <div class="tg-chart-tooltip" data-el="tooltip"></div>
    <canvas data-el="detail"></canvas>
    <div class="tg-chart-slider" data-el="slider">
      <canvas></canvas>
      <div data-el="left" class="tg-chart-slider__left">
        <div class="tg-chart-slider__arrow--left" data-type="left"></div>
      </div>
      
      <div data-el="window" data-type="window" class="tg-chart-slider__window"></div>
      
      <div data-el="right" class="tg-chart-slider__right">
        <div class="tg-chart-slider__arrow--right" data-type="right"></div>
      </div>
    </div>
    <div class="tg-chart-labels" data-el="labels"></div>
  </div>
`

export class TelegramChart {
  constructor(options) {
    if (!options.el) {
      throw new Error('[Telegram Chart]: "el" option must be provided')
    }

    if (!options.data) {
      throw new Error('[Telegram Chart]: "data" option must be provided')
    }

    this.$el = options.el
    this.data = options.data
    this.w = options.width || 500
    this.h = options.height || 300
    this.activeLabels = this.data.datasets.map(set => set.name)

    this.$el.insertAdjacentHTML('afterbegin', template)

    this.prepare()
    this.init()
  }

  prepare() {
    this.labelClickHandler = this.labelClickHandler.bind(this)
    this.updateChart = this.updateChart.bind(this)

    this.$detail = this.$el.querySelector('[data-el=detail]')
    this.$tooltip = this.$el.querySelector('[data-el=tooltip]')
    this.$slider = this.$el.querySelector('[data-el=slider]')
    this.$labels = this.$el.querySelector('[data-el=labels]')
  }

  init() {
    this.$labels.addEventListener('click', this.labelClickHandler)

    this.slider = new SliderChart({
      el: this.$slider,
      width: this.w,
      data: this.data,
      onUpdate: this.updateChart,
      height: 40
    })

    this.chart = new DetailChart({
      el: this.$detail,
      width: this.w,
      height: this.h,
      tooltip: new Tooltip(this.$tooltip),
      data: this.getData()
    })

    this.renderLabels()
  }

  renderLabels() {
    const labels = this.data.datasets.map(({name, color}) => {
      return new Label({name, color}).toHtml()
    }).join(' ')
    this.$labels.insertAdjacentHTML('afterbegin', labels)
  }

  updateChart() {
    this.chart.update(this.getData())
  }

  updateSlider() {
    this.slider.update(this.getSliderData())
  }

  labelClickHandler({target: {value, checked, tagName}}) {
    if (tagName.toLowerCase() === 'input') {
      if (checked) {
        this.activeLabels.push(value)
      } else {
        this.activeLabels = this.activeLabels.filter(l => l !== value)
      }
    }
    this.updateChart()
    this.updateSlider()
  }

  getData() {
    const data = {datasets: []}
    const [left, right] = this.slider.position

    const datasets = this.data.datasets.filter(set => {
      return this.activeLabels.includes(set.name)
    })
    const labels = this.data.labels.concat()

    const leftIndex = Math.ceil(labels.length * left / 100)
    const rightIndex = Math.ceil(labels.length * right / 100)

    data.labels = labels.slice(leftIndex ? leftIndex - 1 : 0, rightIndex)
    data.datasets = datasets.map(set => ({
      ...set,
      data: set.data.slice(leftIndex ? leftIndex - 1 : 0, rightIndex)
    }))

    return data
  }

  getSliderData() {
    return {
      datasets: this.data.datasets.filter(set => {
        return this.activeLabels.includes(set.name)
      }),
      labels: this.data.labels.concat()
    }
  }

  destroy() {
    this.$labels.removeEventListener('click', this.labelClickHandler)
    this.chart.destroy()
    this.slider.destroy()
    this.$el.innerHTML = ''
  }
}