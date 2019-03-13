import data from './chart_data'
import {Graph} from './graph'
import './scss/index.scss'

new Graph({
  el: document.getElementById('graph'),
  width: 800,
  height: 300,
  data: data[1],
})


