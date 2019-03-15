import {BaseChart} from './base.chart'

export class SliderChart extends BaseChart {
  constructor(options) {
    super({
      ...options,
      height: 40
    })

    this.trigger = options.onUpdate
  }

  update(data) {
    this.data = data
    this.render()
  }
}