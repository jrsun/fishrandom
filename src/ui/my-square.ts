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
      height: 100%;
      width: 100%;
      display: 'inline-block';
      background-size: cover;
    }
    :host(.highlight) .square {
      background-image: url('/img/bg.svg');
    }
    :host([lastmove]) .square {
      background-color: rgba(255, 255, 0, 0.3);
    }
    :host([possible]) .square {
      background-color: rgba(0, 255, 0, 0.3);
    }
    :host([checked]) .square {
      background-color: rgba(255, 0, 0, 0.6);
    }
    :host(.explode) .square {
      background-color: #fa0;
    }

    :host([dragged]) my-piece {
      opacity: 0.5;
    }
    :host([color="black"]) .square {
      transform: rotate(180deg);
    }

    my-piece {
      z-index: 1;
    }
  `;

  // public
  @property({type: Object}) square: Square;
  @property({type: Object}) piece?: Piece | undefined;
  @property({type: String, reflect: true}) color?: Color;
  @property({type: Boolean, reflect: true}) dragged = false;
  @property({type: Boolean, reflect: true}) possible = false;
  @property({type: Boolean, reflect: true}) lastMove = false;
  @property({type: Boolean}) frozen = false;
  @property({type: Boolean, reflect: true}) checked = false;

  render() {
    // this.style.setProperty('transform', this.color === Color.BLACK ? 'rotate(180deg)' : '');
    // ${this.possible ? 'background-image:url(../img/_dt.png);' : ''}
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
      >
        ${this.piece &&
        html`<my-piece
          draggable=${true}
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
