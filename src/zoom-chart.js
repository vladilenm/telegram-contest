import {Chart} from './chart'

export class ZoomChart extends Chart {
  constructor(options) {
    super({
      ...options,
      height: 40,
      isMini: true
    })
  }

  update(data) {
    this.data = data
    this.render()
  }
}