import {
  css,
  boundaries,
  toCoords,
  line,
  computeXRatio,
  computeYRatio,
} from './utils'

function noop() {}

const HEIGHT = 40
const DPI_HEIGHT = HEIGHT * 2

export function sliderChart(root, data, DPI_WIDTH) {
  const WIDTH = DPI_WIDTH / 2
  const MIN_WIDTH = WIDTH * 0.05
  const canvas = root.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  let nextFn = noop
  canvas.width = DPI_WIDTH
  canvas.height = DPI_HEIGHT
  css(canvas, {
    width: WIDTH + 'px',
    height: HEIGHT + 'px',
  })

  const $left = root.querySelector('[data-el="left"]')
  const $window = root.querySelector('[data-el="window"]')
  const $right = root.querySelector('[data-el="right"]')

  function next() {
    nextFn(getPosition())
  }

  function mousedown(event) {
    const type = event.target.dataset.type
    const dimensions = {
      left: parseInt($window.style.left),
      right: parseInt($window.style.right),
      width: parseInt($window.style.width),
    }

    if (type === 'window') {
      const startX = event.pageX
      document.onmousemove = (e) => {
        const delta = startX - e.pageX
        if (delta === 0) {
          return
        }

        const left = dimensions.left - delta
        const right = WIDTH - left - dimensions.width

        setPosition(left, right)
        next()
      }
    } else if (type === 'left' || type === 'right') {
      const startX = event.pageX
      document.onmousemove = (e) => {
        const delta = startX - e.pageX
        if (delta === 0) {
          return
        }

        if (type === 'left') {
          const left = WIDTH - (dimensions.width + delta) - dimensions.right
          const right = WIDTH - (dimensions.width + delta) - left
          setPosition(left, right)
        } else {
          const right = WIDTH - (dimensions.width - delta) - dimensions.left
          setPosition(dimensions.left, right)
        }
        next()
      }
    }
  }

  function mouseup() {
    document.onmousemove = null
  }

  root.addEventListener('mousedown', mousedown)
  document.addEventListener('mouseup', mouseup)

  const defaultWidth = WIDTH * 0.3
  setPosition(0, WIDTH - defaultWidth)

  function setPosition(left, right) {
    const w = WIDTH - right - left

    if (w < MIN_WIDTH) {
      css($window, { width: MIN_WIDTH + 'px' })
      return
    }

    if (left < 0) {
      css($window, { left: '0px' })
      css($left, { width: '0px' })
      return
    }

    if (right < 0) {
      css($window, { right: '0px' })
      css($right, { width: '0px' })
      return
    }

    css($window, {
      width: w + 'px',
      left: left + 'px',
      right: right + 'px',
    })

    css($right, { width: right + 'px' })
    css($left, { width: left + 'px' })
  }

  function getPosition() {
    const left = parseInt($left.style.width)
    const right = WIDTH - parseInt($right.style.width)

    return [(left * 100) / WIDTH, (right * 100) / WIDTH]
  }

  const [yMin, yMax] = boundaries(data)
  const yRatio = computeYRatio(DPI_HEIGHT, yMax, yMin)
  const xRatio = computeXRatio(DPI_WIDTH, data.columns[0].length)

  const yData = data.columns.filter((col) => data.types[col[0]] === 'line')

  yData
    .map(toCoords(xRatio, yRatio, DPI_HEIGHT, 0, yMin))
    .forEach((coords, idx) => {
      const color = data.colors[yData[idx][0]]
      line(ctx, coords, { color })
    })

  return {
    subscribe(fn) {
      nextFn = fn
      fn(getPosition())
    },
  }
}
