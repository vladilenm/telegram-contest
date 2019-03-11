import {config} from './config'

function createPoint([cx, cy], style) {
  const point = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'circle'
  );
  point.setAttribute("cx", cx);
  point.setAttribute("cy", cy);
  point.setAttribute("r", style.pointRadius)
  point.setAttribute("fill", '#fff')
  point.setAttribute("stroke", style.color)
  point.setAttribute("stroke-width", style.strokeWidth)
  return point
}

function createRect(pointsCount, index) {
  if (index === 0 || index >= pointsCount - 1) {
    return
  }

  const rectWidth = config.width / (pointsCount - 2)
  const rect = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'rect'
  )
  rect.setAttribute("width", rectWidth.toString());
  rect.setAttribute("height", config.height.toString());
  rect.setAttribute("x", (rectWidth * (index - 1)).toString());
  rect.setAttribute("y", '0');
  rect.setAttribute("fill", "transparent");
  return rect
}

function createLine({points, style}) {
  const lineData = points.map(([x, y], i) => {
    const command = i === 0 ? 'M' : 'L'
    return `${command} ${x} ${y}`
  }).join(' ')

  const line = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path'
  )
  line.setAttribute("d", lineData)
  line.setAttribute("fill", "none")
  line.setAttribute("stroke", style.color)
  line.setAttribute("stroke-width", style.strokeWidth)
  return line
}

function createGroup(data, index) {
  const g = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'g'
  )

  g.setAttribute('class', 'hoverGroup')

  data.forEach(line => {
    g.appendChild(createPoint(line.points[index], line.style))
  })

  const rect = createRect(data[0].points.length, index)

  if (rect) {
    g.appendChild(rect)
  }

  return g
}

export function drawChart(data) {
  const $fragment = document.createDocumentFragment()

  data.forEach(line => {
    $fragment.appendChild(createLine(line))
  })

  const pointsCount = data[0].points.length
  for (let i = 0; i < pointsCount; i++) {
    $fragment.appendChild(createGroup(data, i))
  }

  return $fragment

}