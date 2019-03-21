import {group, hexToRgb, isMouseOver, toDate} from './utils'

export class Draw {
  constructor(context, tooltip) {
    this.c = context
    this.tooltip = tooltip

    this.font = 'normal 20px Helvetica,sans-serif'
    this.strokeStyle = 'rgba(223, 230, 235)'
    this.fillStyle = '#96a2aa'
    this.lineWidth = 2

    this.radius = 12
  }

  line({coords, color, opacity, mouse, dpiW, translateX, withCircles, visibleItemsCount}) {
    this.c.beginPath()
    this.c.moveTo(coords[0][0], coords[0][1])

    this.c.lineWidth = 4
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

  yAxis({dpiW, viewH, yMax, yMin, margin, rowsCount = 5}) {
    this.c.save()
    this.c.fillStyle = this.fillStyle
    this.c.font = this.font
    this.c.strokeStyle = this.strokeStyle
    this.c.lineWidth = this.lineWidth

    const step = Math.round(viewH / rowsCount)
    const stepText = (yMax - yMin) / rowsCount

    this.c.beginPath()

    for (let i = 1; i <= rowsCount; i++) {
      const y = step * i
      const text = Math.round(yMax - stepText * i)
      this.c.fillText(text.toString(), 0, y - 10 + margin)
      this.c.moveTo(0, y + margin)
      this.c.lineTo(dpiW, y + margin)
    }

    this.c.stroke()
    this.c.restore()
    this.c.closePath()
  }

  xAxis({data, visibleData, dpiW, dpiH, xRatio, mouse, margin, pos, translateX}) {
    this.c.fillStyle = this.fillStyle
    this.c.font = this.font
    this.c.strokeStyle = this.strokeStyle
    this.c.lineWidth = this.lineWidth


    const visibleItems = visibleData.labels.length

    this.c.beginPath()
    this.c.save()
    this.c.translate(translateX, 0)
    this.c.moveTo(0, margin)

    const every = visibleItems <= 12
      ? visibleItems < 6 ? 1 : 2
      : Math.floor(visibleItems / 12) * 3

    for (let i = 0; i < data.labels.length; i++) {
      let x = Math.floor(i * xRatio)
      const text = toDate(data.labels[i])

      this.c.save()

      if (i % every !== 0) {
        this.c.fillStyle = `rgba(223, 230, 235, ${0})`
      }

      this.c.fillText(text, x, dpiH - 10)
      this.c.restore()


      if (!mouse || !isMouseOver(x, mouse.x + Math.abs(translateX), dpiW, visibleData.labels.length)) {
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

    this.c.restore()
    this.c.stroke()
    this.c.closePath()
  }
}