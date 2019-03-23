import data from './data/chart_data'
import {TelegramChart} from './charts/telegram.chart'
import {transformData} from './utils'
import themes from './themes'
import './scss/index.scss'

const chart1 = new TelegramChart({
  el: document.getElementById('chart1'),
  width: 600,
  height: 200,
  data: transformData(data[0]),
  theme: themes.day,
  animationSpeed: 20
})

const chart2 = new TelegramChart({
  el: document.getElementById('chart2'),
  width: 600,
  height: 200,
  data: transformData(data[1])
})

const chart3 = new TelegramChart({
  el: document.getElementById('chart3'),
  width: 600,
  height: 200,
  data: transformData(data[2])
})

const chart4 = new TelegramChart({
  el: document.getElementById('chart4'),
  width: 600,
  height: 200,
  data: transformData(data[3])
})

const chart5 = new TelegramChart({
  el: document.getElementById('chart5'),
  width: 600,
  height: 200,
  data: transformData(data[4])
})

const charts = [chart1, chart2, chart3, chart4, chart5]

// Theme switcher
document.querySelector('#theme-switch').addEventListener('click', event => {
  event.preventDefault()
  const theme = event.target.dataset.theme
  document.body.classList.toggle('tg-night')
  event.target.textContent = theme === 'night'
    ? 'Switch to Day Mode'
    : 'Switch to Night Mode'
  event.target.setAttribute('data-theme', theme === 'night' ? 'day' : 'night')

  charts.forEach(c => c.setTheme(themes[theme]))
})