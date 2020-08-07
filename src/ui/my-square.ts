import {LitElement, html, customElement, property, css} from 'lit-element';
import {Piece} from '../chess/piece';
import Square from '../chess/square';
import BoardState from '../chess/state';
import {Color} from '../chess/const';
import {styleMap} from 'lit-html/directives/style-map';
import './my-piece';

const SQUARE_SIZE = Math.min(window.innerWidth / 12, 50); // 50

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
    .square[data-selected] {
      background-color: rgba(0, 0, 255, 0.3);
    }
    .square[data-possible] {
      background-color: rgba(0, 255, 0, 0.3);
    }
    .square[data-black] {
      transform: rotate(180deg);
    }
  `;

  // public
  @property({type: Object}) square: Square;
  @property({type: Object}) piece?: Piece | undefined;
  @property({type: String}) color?: Color;
  @property({type: Boolean}) selected = false;
  @property({type: Boolean}) possible = false;
  @property({type: Boolean}) lastMove = false;

  render() {
    // this.style.setProperty('transform', this.color === Color.BLACK ? 'rotate(180deg)' : '');
    // ${this.possible ? 'background-image:url(../img/_dt.png);' : ''}
    const styles = {};
    if (this.lastMove) {
      styles['background-color'] = 'rgba(255, 255, 0, 0.3)';
    }
    if (this.selected) {
      styles['background-color'] = 'rgba(0, 0, 255, 0.3)';
    }
    if (this.possible) {
      styles['background-color'] = 'rgba(0, 255, 0, 0.3)';
    }
    if (this.color === Color.BLACK) {
      styles['transform'] = 'rotate(180deg)';
    }
    return html`
      <div
        class="square"
        @click=${this._onClick}
        @mousedown=${this._onMouseDown}
        @mouseup=${this._onMouseUp}
        style="
        height:100%;width:100%;
        position:relative;
        background-size:cover;${styleMap(styles)}"
      >
        ${this.piece && html`<my-piece .piece=${this.piece}></my-piece>`}
      </div>
    `;
  }

  private _onClick(e: MouseEvent) {
    const isRightMB = e.which === 3;
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
    const isRightMB = e.which === 3;
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
    const isRightMB = e.which === 3;
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
