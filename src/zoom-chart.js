import {Chart} from './chart'

export class ZoomChart extends Chart {
  constructor(options) {
    super({
      ...options,
      height: 40,
      withGrid: false,
      withAxis: false
    })
  }
}