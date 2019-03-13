import {dateFilter} from './utils'

export class Draw {
  constructor(context) {
    this.c = context

    this.font = 'normal 20px Helvetica,sans-serif'
    this.axisStrokeStyle = '#dfe6eb'
    this.axisFillStyle = '#96a2aa'
    this.axisLineWidth = 2

    this.radius = 12
  }

  line(coords, color, mouse, withCircles = true) {
    this.c.beginPath()
    this.c.moveTo(coords[0][0], coords[0][1])

    this.c.lineWidth = 4
    this.c.strokeStyle = color

    coords.forEach(([x, y]) => this.c.lineTo(x, y))

    this.c.stroke()
    this.c.closePath()

    if (withCircles) {
      coords.forEach(([x, y]) => this.circle(x, y, color, mouse))
    }
  }

  circle(x, y, color, mouse) {
    // TODO: calculate depending on xScale
    if (!mouse.x || Math.abs(mouse.x - x) > this.radius / 2) {
      return
    }
    this.c.beginPath()
    this.c.strokeStyle = color
    this.c.fillStyle = '#fff'
    this.c.arc(x, y, this.radius, 0, Math.PI * 2)
    this.c.fill()
    this.c.stroke()
  }

  xAxis(viewHeight, yRatio, dpiWidth) {
    const rowsCount = 5
    const stepY = viewHeight / rowsCount
    let y = stepY

    this.c.fillStyle = this.axisFillStyle
    this.c.font = this.font
    this.c.strokeStyle = this.axisStrokeStyle
    this.c.lineWidth = this.axisLineWidth

    this.c.beginPath()

    while (y <= viewHeight) {
      const text = Math.round((viewHeight - y) * yRatio)
      this.c.fillText(text.toString(), 0, y - 10)
      this.c.moveTo(0, y)
      this.c.lineTo(dpiWidth, y)
      y += stepY
    }

    this.c.stroke()
  }

  yAxis(labels, dpiWidth, dpiHeight, xRatio, mouse) {
    this.c.fillStyle = this.axisFillStyle
    this.c.font = this.font
    this.c.strokeStyle = this.axisStrokeStyle
    this.c.lineWidth = this.axisLineWidth

    this.c.beginPath()
    this.c.moveTo(0, 0)

    for (let i = 0; i < labels.length; i++) {
      const x = i * xRatio

      // TODO: 10 is magic number now, should be computed from labels
      if (i % 5 === 0) {
        const text = dateFilter(labels[i])
        this.c.fillText(text, x, dpiHeight - 10)
      }

      // TODO: radius / 2 should calc depend on visible items count
      if (!mouse.x || Math.abs(x - mouse.x) > this.radius / 2) {
        continue
      }
      this.c.moveTo(x, 0)
      // 40 xAxis height
      this.c.lineTo(x, dpiHeight - 40)
    }

    this.c.stroke()
  }
}