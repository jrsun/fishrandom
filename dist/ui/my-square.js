var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, customElement, property, css } from 'lit-element';
import { SQUARE_SIZE, Color } from '../chess/const';
import './my-piece';
/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
let MySquare = class MySquare extends LitElement {
    constructor() {
        super(...arguments);
        this.selected = false;
        this.possible = false;
    }
    render() {
        // this.style.setProperty('transform', this.color === Color.BLACK ? 'rotate(180deg)' : '');
        return html `
      <div
        class="square"
        @click=${this._onClick}
        style="
        height:100%;width:100%;background-color:${this.selected
            ? 'rgba(0, 0, 255, 0.3)'
            : this.possible
                ? 'rgba(0, 255, 0, 0.3)'
                : ''};transform:${this.color === Color.BLACK ? 'rotate(180deg)' : ''};
      "
      >
        ${this.piece && html `<my-piece .piece=${this.piece}></my-piece>`}
      </div>
    `;
    }
    _onClick() {
        this.dispatchEvent(new CustomEvent('square-clicked', {
            bubbles: true,
            composed: true,
            detail: this.square,
        }));
    }
};
MySquare.styles = css `
    :host {
      height: ${SQUARE_SIZE}px;
      width: ${SQUARE_SIZE}px;
      display: inline-block;
    }

    .square {
      height: '100%';
      width: '100%';
      display: 'inline-block';
    }
  `;
__decorate([
    property({ type: Object })
], MySquare.prototype, "square", void 0);
__decorate([
    property({ type: Object })
], MySquare.prototype, "piece", void 0);
__decorate([
    property({ type: String })
], MySquare.prototype, "color", void 0);
__decorate([
    property({ type: Boolean })
], MySquare.prototype, "selected", void 0);
__decorate([
    property({ type: Boolean })
], MySquare.prototype, "possible", void 0);
MySquare = __decorate([
    customElement('my-square')
], MySquare);
export { MySquare };
//# sourceMappingURL=my-square.js.map