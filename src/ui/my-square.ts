import {LitElement, html, customElement, property, css} from 'lit-element';
import {BoardState, STD_BOARD, Square, Piece} from '../chess/piece';
import {SQUARE_SIZE, Color} from '../chess/const';
import {styleMap} from 'lit-html/directives/style-map';
import './my-piece';

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('my-square')
export class MySquare extends LitElement {
  static styles = css`
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

  // public
  @property({type: Object}) square: Square;
  @property({type: Object}) piece?: Piece;
  @property({type: String}) color?: Color;
  @property({type: Boolean}) selected = false;
  @property({type: Boolean}) possible = false;

  render() {
    // this.style.setProperty('transform', this.color === Color.BLACK ? 'rotate(180deg)' : '');
    return html`
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
        ${this.piece && html`<my-piece .piece=${this.piece}></my-piece>`}
      </div>
    `;
  }

  private _onClick() {
    this.dispatchEvent(
      new CustomEvent('square-clicked', {
        bubbles: true,
        composed: true,
        detail: this.square,
      })
    );
    console.log('square clicked');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-square': MySquare;
  }
}
