import {toDate} from './utils'

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

  line(coords, color, mouse, dpiW, withCircles = false) {
    this.c.beginPath()
    this.c.moveTo(coords[0][0], coords[0][1])

    this.c.lineWidth = 4
    this.c.strokeStyle = color

    coords.forEach(([x, y]) => this.c.lineTo(x, y))

    this.c.stroke()
    this.c.closePath()

    if (withCircles) {
      for (let i = 0; i < coords.length; i++) {
        // if (mouse && Math.abs(mouse.x - coords[i][0]) < dpiW / coords.length / 2) {
        if (mouse && isMouseOver(coords[i][0], mouse.x, dpiW, coords.length)) {
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
    this.c.closePath()
  }

  xAxis(dpiW, viewH, yMax, yMin, margin, rowsCount = 5) {
    const step = Math.round(viewH / rowsCount)
    const stepText = (yMax - yMin) / rowsCount

    this.c.fillStyle = this.axisFillStyle
    this.c.font = this.font
    this.c.strokeStyle = this.axisStrokeStyle
    this.c.lineWidth = this.axisLineWidth

    this.c.beginPath()

    for (let i = 1; i <= rowsCount; i++) {
      const y = step * i
      const text = Math.round(yMax - stepText * i)
      this.c.fillText(text.toString(), 0, y - 10 + margin)
      this.c.moveTo(0, y + 40)
      this.c.lineTo(dpiW, y + margin)
    }

    this.c.stroke()
    this.c.closePath()
  }

  yAxis(data, dpiW, dpiH, xRatio, mouse, margin, columnsCount = 6) {
    const step = Math.round(data.labels.length / columnsCount)

    this.c.fillStyle = this.axisFillStyle
    this.c.font = this.font
    this.c.strokeStyle = this.axisStrokeStyle
    this.c.lineWidth = this.axisLineWidth

    this.c.beginPath()
    this.c.moveTo(0, margin)

    for (let i = 0; i < data.labels.length; i++) {
      const x = Math.floor(i * xRatio)

      if (i % step === 0) {
        this.c.fillText(toDate(data.labels[i]), x + 20, dpiH - 10)
      }

      // if (!mouse || Math.abs(x - mouse.x) > ((dpiW / data.labels.length) / 2)) {
      if (!mouse || !isMouseOver(x, mouse.x, dpiW, data.labels.length)) {
        continue
      }

      this.c.moveTo(x, margin)
      this.c.lineTo(x, dpiH - margin)

      this.tooltip.show(mouse.tooltip, {
        title: toDate(data.labels[i], true),
        items: data.datasets.map(set => ({
          name: set.name,
          color: set.color,
          value: set.data[i]
        }))
      })
    }

    this.c.stroke()
    this.c.closePath()
  }
}

function isMouseOver(x, mouse, dpiW, length) {
  return Math.abs(x - mouse) < dpiW / length / 2
}