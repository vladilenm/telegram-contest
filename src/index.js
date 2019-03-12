import data from './chart_data'
import {Graph} from './graph'
import './scss/index.scss'
//
// new Chart({
//   el: document.querySelector('canvas'),
//   width: 800,
//   height: 300,
//   data: data[0],
//   columnsCount: 5,
//   fullChart: true
// })

new Graph({
  el: document.getElementById('graph'),
  width: 800,
  height: 300,
  data: data[2],
})


