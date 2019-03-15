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

  line(coords, color, mouse, dpiWidth, withCircles = false) {
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

  xAxis(dpiWidth, viewHeight, yMax, yMin) {
    const rowsCount = 5
    const stepY = viewHeight / rowsCount
    const stepYText = (yMax - yMin) / rowsCount

    this.c.fillStyle = this.axisFillStyle
    this.c.font = this.font
    this.c.strokeStyle = this.axisStrokeStyle
    this.c.lineWidth = this.axisLineWidth

    this.c.beginPath()

    for (let i = 1; i <= rowsCount; i++) {
      const y = stepY * i
      const text = Math.round(yMax - stepYText * i)
      this.c.fillText(text.toString(), 0, y - 10 + 40)
      this.c.moveTo(0, y + 40)
      this.c.lineTo(dpiWidth, y + 40)
    }

    this.c.stroke()
  }

  yAxis(data, dpiWidth, dpiHeight, xRatio, mouse) {
    this.c.fillStyle = this.axisFillStyle
    this.c.font = this.font
    this.c.strokeStyle = this.axisStrokeStyle
    this.c.lineWidth = this.axisLineWidth

    this.c.beginPath()
    this.c.moveTo(0, 40)

    for (let i = 0; i < data.labels.length; i++) {
      const x = Math.floor(i * xRatio)

      // TODO: 5 is magic number now, should be computed from labels
      if (i % 5 === 0) {
        this.c.fillText(dateFilter(data.labels[i]), x + 20, dpiHeight - 10)
      }

      if (!mouse || Math.abs(x - mouse.x) > ((dpiWidth / data.labels.length) / 2)) {
        continue
      }
      this.c.moveTo(x, 40)
      this.c.lineTo(x, dpiHeight - 40)

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