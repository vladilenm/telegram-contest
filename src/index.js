import data from './data/chart_data'
import {TelegramChart} from './charts/telegram.chart'
import {transformData} from './utils'
import './scss/index.scss'


const chart = new TelegramChart({
  el: document.getElementById('chart'),
  width: 500,
  height: 200,
  data: transformData(data[1])
})