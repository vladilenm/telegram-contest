export class Label {
  constructor(options) {
    this.name = options.name
    this.color = options.color
  }

  toHtml() {
    // .begin and .after are not pseudo elements in order
    // to simplify js manipulate specific colors
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