import {LitElement, html, customElement, property, css} from 'lit-element';
import {Piece} from '../chess/piece';
import Square from '../chess/square';
import {BoardState} from '../chess/state';
import {Color} from '../chess/const';
import {styleMap} from 'lit-html/directives/style-map';
import './my-piece';

const SQUARE_SIZE = Math.min(window.innerWidth / 8, 50); // 50

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
  @property({type: Boolean}) dragged = false;
  @property({type: Boolean}) possible = false;
  @property({type: Boolean}) lastMove = false;
  @property({type: Boolean}) frozen = false;
  @property({type: Boolean}) checked = false;

  render() {
    // this.style.setProperty('transform', this.color === Color.BLACK ? 'rotate(180deg)' : '');
    // ${this.possible ? 'background-image:url(../img/_dt.png);' : ''}
    const styles = {};
    if (this.color === Color.BLACK) {
      styles['transform'] = 'rotate(180deg)';
    }
    if (this.dragged) {
      styles['opacity'] = '0.5';
    } else if (this.checked) {
      styles['background-color'] = 'rgba(255, 0, 0, 0.6)';
    } else {
      if (this.lastMove) {
        styles['background-color'] = 'rgba(255, 255, 0, 0.3)';
      }
      if (this.possible) {
        styles['background-color'] = 'rgba(0, 255, 0, 0.3)';
      }
    }
    return html`
      <div
        class="square"
        @click=${this._onClick}
        @mousedown=${this._onMouseDown}
        @mouseup=${this._onMouseUp}
        @dblclick=${this._onDblClick}
        @dragover=${(e) => {
          e.preventDefault();
        }}
        @dragenter=${(e) => {
          e.preventDefault();
        }}
        @drop=${this._onDrop}
        style="
        height:100%;width:100%;
        position:relative;
        background-size:cover;${styleMap(styles)}"
      >
        ${this.piece &&
        html`<my-piece
          draggable=${!this.frozen}
          @dragstart=${this._onDragStart}
          .piece=${this.piece}
        ></my-piece>`}
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

  private _onDragStart(e: DragEvent) {
    this.dispatchEvent(
      new CustomEvent('square-dragstart', {
        bubbles: true,
        composed: true,
        detail: this.square,
      })
    );
  }

  private _onDrop(e: DragEvent) {
    this.dispatchEvent(
      new CustomEvent('square-drop', {
        bubbles: true,
        composed: true,
        detail: this.square,
      })
    );
    e.preventDefault();
  }

  private _onDblClick(e: MouseEvent) {
    this.dispatchEvent(
      new CustomEvent('square-double', {
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
