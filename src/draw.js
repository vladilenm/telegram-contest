import {dateFilter} from './utils';

export class Draw {
  constructor(context, tooltip) {
    this.c = context
    this.tooltip = tooltip

    this.font = 'normal 20px Helvetica,sans-serif'
    this.axisStrokeStyle = '#dfe6eb'
    this.axisFillStyle = '#96a2aa'
    this.axisLineWidth = 2

    this.radius = 12
  }

  line(coords, color, mouse, dpiWidth, withCircles = true) {
    this.c.beginPath()
    this.c.moveTo(coords[0][0], coords[0][1])

    this.c.lineWidth = 4
    this.c.strokeStyle = color

    coords.forEach(([x, y]) => this.c.lineTo(x, y))

    this.c.stroke()
    this.c.closePath()

    if (withCircles) {
      for (let i = 0; i < coords.length; i++) {
        if (mouse && Math.abs(mouse.x - coords[i][0]) < dpiWidth / coords.length / 2) {
          this.circle(coords[i], color)
          break
        }
      }
    }
  }

  circle([x, y], color) {
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

  yAxis(data, dpiWidth, dpiHeight, xRatio, mouse) {
    this.c.fillStyle = this.axisFillStyle
    this.c.font = this.font
    this.c.strokeStyle = this.axisStrokeStyle
    this.c.lineWidth = this.axisLineWidth

    this.c.beginPath()
    this.c.moveTo(0, 0)

    for (let i = 0; i < data.labels.length; i++) {
      const x = Math.floor(i * xRatio)

      // TODO: 5 is magic number now, should be computed from labels
      if (i % 5 === 0) {
        this.c.fillText(dateFilter(data.labels[i]), x, dpiHeight - 10)
      }

      if (!mouse || Math.abs(x - mouse.x) > ((dpiWidth / data.labels.length) / 2)) {
        continue
      }
      this.c.moveTo(x, 0)
      this.c.lineTo(x, dpiHeight - 40) // 40 xAxis height

      this.tooltip.show(mouse.tooltip, {
        title: dateFilter(data.labels[i], true),
        items: data.datasets.map(set => ({
          name: set.name,
          color: set.color,
          value: set.data[i]
        }))
      })
    }

    this.c.stroke()
  }
}