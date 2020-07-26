import {LitElement, html, customElement, property, css} from 'lit-element';
import {Piece} from '../chess/piece';
import Square from '../chess/square';
import BoardState from '../chess/state';
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
  @property({type: Object}) piece?: Piece | undefined;
  @property({type: String}) color?: Color;
  @property({type: Boolean}) selected = false;
  @property({type: Boolean}) possible = false;

  render() {
    // this.style.setProperty('transform', this.color === Color.BLACK ? 'rotate(180deg)' : '');
    return html`
      <div
        class="square"
        @click=${this._onClick}
        @mousedown=${this._onMouseDown}
        @mouseup=${this._onMouseUp}
        style="
        height:100%;width:100%;
        position:relative;background-color:${this.selected
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

  private _onClick(e: MouseEvent) {
    const isRightMB = (e.which === 3);
    if (isRightMB) return;
    this.dispatchEvent(
      new CustomEvent('square-clicked', {
        bubbles: true,
        composed: true,
        detail: this.square,
      })
    );
  }

  private _onMouseDown(e: MouseEvent) {
    const isRightMB = (e.which === 3);
    if (!isRightMB) return;
    this.dispatchEvent(
      new CustomEvent('square-mousedown', {
        bubbles: true,
        composed: true,
        detail: this.square,
      })
    );
  }

  private _onMouseUp(e: MouseEvent) {
    const isRightMB = (e.which === 3);
    if (!isRightMB) return;
    this.dispatchEvent(
      new CustomEvent('square-mouseup', {
        bubbles: true,
        composed: true,
        detail: this.square,
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-square': MySquare;
  }
}
