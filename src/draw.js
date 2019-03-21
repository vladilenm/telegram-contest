import {group, hexToRgb, isMouseOver, toDate} from './utils'

export class Draw {
  constructor(context, tooltip, theme) {
    this.c = context
    this.tooltip = tooltip
    this.theme = theme
  }

  updateTheme(theme) {
    this.theme = theme
  }

  line({coords, color, opacity, mouse, dpiW, translateX, withCircles, visibleItemsCount}) {
    this.c.beginPath()
    this.c.save()
    this.c.translate(translateX, 0)
    this.c.moveTo(coords[0][0], coords[0][1])

    this.c.lineWidth = this.theme.lineWidth
    this.c.strokeStyle = hexToRgb(color, opacity)

    coords.forEach(([x, y]) => this.c.lineTo(x, y))

    this.c.stroke()
    this.c.closePath()

    if (withCircles) {
      for (let i = 0; i < coords.length; i++) {
        if (mouse && isMouseOver(coords[i][0], mouse.x + Math.abs(translateX), dpiW, visibleItemsCount)) {
          this.circle(coords[i], color)
          break
        }
      }
    }
    this.c.restore()
  }

  circle([x, y], color) {
    this.c.beginPath()
    this.c.strokeStyle = color
    this.c.fillStyle = this.theme.gridBackground
    this.c.arc(x, y, this.theme.circleRadius, 0, Math.PI * 2)
    this.c.fill()
    this.c.stroke()
    this.c.closePath()
  }

  setContextStyles() {
    this.c.fillStyle = this.theme.gridTextColor
    this.c.font = this.theme.font
    this.c.strokeStyle = this.theme.gridLineColor
    this.c.lineWidth = this.theme.gridLineWidth
  }

  yAxis({dpiW, viewH, yMax, yMin, margin, delta, dy, rowsCount = 5}) {
    this.setContextStyles()

    const step = Math.round(viewH / rowsCount)
    const stepText = (yMax - yMin) / rowsCount

    this.c.save()
    this.c.beginPath()

    for (let i = 1; i <= rowsCount; i++) {
      const y = step * i
      const text = Math.round(yMax - stepText * i)
      this.c.fillText(text.toString(), 0, y - 10 + margin + delta)
      this.c.moveTo(0, y + margin)
      this.c.lineTo(dpiW, y + margin)
    }

    this.c.stroke()
    this.c.restore()
    this.c.closePath()
  }

  xAxis({data, visibleItemsLength, activeLabels, dpiW, dpiH, xRatio, mouse, margin, pos, translateX}) {
    this.setContextStyles()
    this.c.strokeStyle = this.theme.gridActiveLineColor

    const visibleDatasets = data.datasets.filter(s => activeLabels.includes(s.name))

    this.c.beginPath()
    this.c.save()
    this.c.translate(translateX, 0)
    this.c.moveTo(0, margin)

    const every = visibleItemsLength <= 12
      ? visibleItemsLength < 6 ? 1 : 2
      : Math.floor(visibleItemsLength / 12) * 3

    for (let i = 0; i < data.labels.length; i++) {
      let x = Math.floor(i * xRatio)
      const text = toDate(data.labels[i])

      this.c.save()

      if (i % every !== 0) {
        this.c.fillStyle = `rgba(223, 230, 235, ${0})`
      }

      this.c.fillText(text, x, dpiH - 10)
      this.c.restore()

      if (!mouse || !isMouseOver(x, mouse.x + Math.abs(translateX), dpiW, visibleItemsLength)) {
        continue
      }

      this.c.save()
      this.c.moveTo(x, margin)
      this.c.lineTo(x, dpiH - margin)
      this.c.restore()

      this.tooltip.show(mouse.tooltip, {
        title: toDate(data.labels[i], true),
        items: visibleDatasets
          .map(set => ({
            name: set.name,
            color: set.color,
            value: set.data[i]
          }))
      })
    }

    this.c.restore()
    this.c.stroke()
    this.c.closePath()
  }
}