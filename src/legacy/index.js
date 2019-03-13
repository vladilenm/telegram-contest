import {calculateSVGData} from './logic'
import {config} from './config'
import {drawChart} from './draw'
import chartData from '../data/single.json'
import '../scss/index.scss'

const $chart = document.querySelector('#chart')

document.querySelector('button').addEventListener('click', () => {
  $chart.innerHTML = ''

  // const data = [
  //   {
  //     points: createDataset(pointsCount, 40, 270),
  //     style: {
  //       strokeWidth: config.strokeWidth,
  //       pointRadius: config.pointRadius,
  //       color: config.colors[0]
  //     }
  //   },
  //   {
  //     points: createDataset(pointsCount, 25, 70),
  //     style: {
  //       strokeWidth: config.strokeWidth,
  //       pointRadius: config.pointRadius,
  //       color: config.colors[1]
  //     }
  //   }
  // ]

  const svgData = calculateSVGData(chartData[0])
  $chart.appendChild(drawChart(svgData))
})



function getRandom(min, max) {
  return Math.ceil(Math.random() * (max - min) + min)
}

function createDataset(count = 10, min, max) {
  return new Array(count).fill('').map(() => {
    return {
      value: getRandom(min, max)
    }
  })
}