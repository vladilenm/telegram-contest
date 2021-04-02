import { chart } from './chart'
import data from './data.json'
import './styles.scss'

const tgChart = chart(document.getElementById('chart'), data[4])
tgChart.init()

/*
  1. Checkbox 
  2. Animations
  3. Few Charts on page
  4. Dynamic theme change
  5. Random
*/
