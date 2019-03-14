import data from './data/chart_data'
import {Graph} from './graph'
import './scss/index.scss'

new Graph({
  el: document.getElementById('graph'),
  width: 800,
  height: 200,
  data: data[0],
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