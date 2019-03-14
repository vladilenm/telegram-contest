export class LabelCheckbox {
  constructor(options) {
    this.name = options.name
    this.color = options.color
    this.checked = options.checked || true
  }

  toHtml() {
    return `
      <div class="chart-check">
        <input type="checkbox" checked value="${this.name}" />
        <label>
          <span 
            class="before" 
            style="background-color: ${this.color}; border-color: ${this.color}"
          ></span>
          ${this.name}
          <span class="after"></span>
        </label>
      </div>
    `
  }
}