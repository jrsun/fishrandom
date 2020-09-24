import {LitElement, html, customElement, property, css} from 'lit-element';
import {Piece} from '../chess/piece';
import Square from '../chess/square';
import {BoardState} from '../chess/state';
import {Color, SQUARE_SIZE} from '../chess/const';
import {styleMap} from 'lit-html/directives/style-map';
import './my-piece';
import {reviver, replacer} from '../common/message';

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
    :host(.finish) .square {
      background-image: url('/img/bg.svg');
    }
    :host([lastmove]) .square {
      background-color: rgba(255, 255, 0, 0.3);
    }
    :host([checked]) .square {
      background-color: rgba(255, 0, 0, 0.6);
    }
    :host([possible]) .square {
      background-color: rgba(0, 255, 0, 0.3);
    }
    :host([selected]) .square {
      background-color: rgba(0, 0, 255, 0.3);
    }
    :host(.explode) .square {
      background-color: #fa0;
    }
    :host(.highlight) .square {
      background-color: rgba(0, 255, 0, 0.3);
    }
    :host(.veto) .square {
      background-color: rgba(255, 100, 100);
    }

    :host([dragged]) my-piece {
      opacity: 0.5;
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
  @property({type: Boolean, reflect: true}) selected = false;

  render() {
    // this.style.setProperty('transform', this.color === Color.BLACK ? 'rotate(180deg)' : '');
    // ${this.possible ? 'background-image:url(../img/_dt.png);' : ''}
    return html`
      <div
        class="square"
        @click=${this._onClick}
        @mousedown=${this._onMouseDown}
        @mouseup=${this._onMouseUp}
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

  _onClick = (() => {
    let lastClicked: Date|undefined = undefined;
    return (e: MouseEvent) => {
      const isRightMB = e.which === 3;
      if (isRightMB) return;
      this.dispatchEvent(
        new CustomEvent('square-clicked', {
          bubbles: true,
          composed: true,
          detail: {square: this.square},
        })
      );
      if (
        lastClicked &&
        Math.abs(new Date().getTime() - lastClicked.getTime()) < 500
      ) {
        this.dispatchEvent(
          new CustomEvent('square-double', {
            bubbles: true,
            composed: true,
            detail: this.square,
          })
        );
      }
      lastClicked = new Date();
    }
  })();

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
    if (e.dataTransfer && this.square.occupant) {
      e.dataTransfer.setData(
        'text/plain',
        JSON.stringify(
          {piece: this.square.occupant, square: this.square, type: 'move'},
          replacer
        )
      );
    }
  }

  private _onDrop(e: DragEvent) {
    if (!e.dataTransfer) return;
    const {piece, square, type} = JSON.parse(
      e.dataTransfer.getData('text/plain'),
      reviver
    );
    this.dispatchEvent(
      new CustomEvent('square-drop', {
        bubbles: true,
        composed: true,
        detail: {
          square: this.square,
          piece,
          type,
          start: square,
        },
      })
    );
    e.preventDefault();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-square': MySquare;
  }
}
