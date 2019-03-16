import data from './data/chart_data'
import {TelegramChart} from './charts/telegram.chart'
import {transformData} from './utils'
import './scss/index.scss'


const chart = new TelegramChart({
  el: document.getElementById('chart'),
  width: 500,
  height: 200,
  data: transformData(data[3])
})

// new Graph({
//   el: document.getElementById('graph2'),
//   width: 500,
//   height: 200,
//   data: data[1],
// })
//
//
// new Graph({
//   el: document.getElementById('graph3'),
//   width: 500,
//   height: 200,
//   data: data[2],
// })
//
//
// new Graph({
//   el: document.getElementById('graph4'),
//   width: 500,
//   height: 200,
//   data: data[3],
// })