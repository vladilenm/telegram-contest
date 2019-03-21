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

    this.$el.insertAdjacentHTML('afterbegin', template)

    this.prepare()
    this.init()
  }

  prepare() {
    this.labelClickHandler = this.labelClickHandler.bind(this)
    this.updateChart = this.updateChart.bind(this)

    this.activeLabels = this.data.datasets.map(set => set.name)
    this.prevState = {}

    this.$detail = this.$el.querySelector('[data-el=detail]')
    this.$tooltip = this.$el.querySelector('[data-el=tooltip]')
    this.$slider = this.$el.querySelector('[data-el=slider]')
    this.$labels = this.$el.querySelector('[data-el=labels]')
  }

  init() {
    document.body.classList.add('tg-chart-preload')
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
      data: this.data
    })

    this.updateChart()
    this.renderLabels()

    // Preventing initial css animations
    setTimeout(() => {
      document.body.classList.remove('tg-chart-preload')
    }, 500)
  }

  renderLabels() {
    const labels = this.data.datasets.map(set => new Label(set).toHtml()).join(' ')
    this.$labels.insertAdjacentHTML('afterbegin', labels)
  }

  updateChart() {
    if (this.shouldChartUpdate()) {
      const [left, right] = this.slider.position
      this.prevState = {left, right, labelsLength: this.activeLabels.length}
      this.chart.updatePosition({left, right})
    }
  }

  labelClickHandler({target}) {
    if (target.tagName.toLowerCase() !== 'input') {
      return
    }

    let type = ''
    if (target.checked) {
      type = 'added'
      this.activeLabels.push(target.value)
    } else if (this.activeLabels.length > 1) {
      type = 'removed'
      this.activeLabels = this.activeLabels.filter(l => l !== target.value)
    } else {
      target.checked = !target.checked
    }

    if (this.shouldChartUpdate()) {
      this.prevState.labelsLength = this.activeLabels.length

      this.slider.update(this.getData())
      this.chart.update({type, name: target.value, labels: this.activeLabels})
    }
  }

  shouldChartUpdate() {
    const [left, right] = this.slider.position
    return this.prevState.left !== left
      || this.prevState.right !== right
      || this.prevState.labelsLength !== this.activeLabels.length
  }

  getData() {
    return {
      datasets: this.data.datasets.filter(set => this.activeLabels.includes(set.name)),
      labels: this.data.labels.concat()
    }
  }

  destroy() {
    this.$labels.removeEventListener('click', this.labelClickHandler)
    this.chart.destroy()
    this.slider.destroy()
    document.body.classList.remove('tg-chart-preload')
    this.$el.innerHTML = ''
  }
}