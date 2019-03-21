import data from './data/chart_data'
import {TelegramChart} from './charts/telegram.chart'
import {transformData} from './utils'
import themes from './themes'
import './scss/index.scss'

const chart = new TelegramChart({
  el: document.getElementById('chart'),
  width: 500,
  height: 200,
  data: transformData(data[1]),
  theme: themes.day
})

// Theme switcher
document.querySelector('#theme-switch').addEventListener('click', event => {
  event.preventDefault()
  const theme = event.target.dataset.theme
  document.body.classList.toggle('tg-night')
  event.target.textContent = theme === 'night'
    ? 'Switch to Day Mode'
    : 'Switch to Night Mode'
  event.target.setAttribute('data-theme', theme === 'night' ? 'day' : 'night')

  chart.setTheme(themes[theme])
})