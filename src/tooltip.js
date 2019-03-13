export class Tooltip {
  constructor(el) {
    this.el = el
    this.el.textContent = 'HELLO'
  }

  show({top, left}, text) {
    const {height, width} = this.el.getBoundingClientRect()
    this.el.style.display = 'block'
    this.el.style.top = `${top - height}px`
    this.el.style.left = `${left + (width / 2)}px`

    this.el.textContent = text
  }

  hide() {
    this.el.style.display = 'none'
  }
}