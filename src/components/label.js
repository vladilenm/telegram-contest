export class Label {
  constructor(options) {
    this.name = options.name
    this.color = options.color
  }

  toHtml() {
    // .begin and .after are not pseudo elements in order
    // to simplify js manipulate specific colors
    const id = `tg-check-${this.color}-${this.name}`
    return `
      <div class="tg-chart-checkbox">
        <input 
          id="${id}" 
          type="checkbox" 
          value="${this.name}" 
          checked
        />
        <label for="${id}">
          <span
            style="border-color: ${this.color}"
          ></span>
          ${this.name}
        </label>
      </div>
    `
  }
}