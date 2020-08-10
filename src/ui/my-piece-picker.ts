import {LitElement, html, customElement, property, css} from 'lit-element';
import {Piece} from '../chess/piece';

const SQUARE_SIZE = Math.min(window.innerWidth / 12, 50); // 50

@customElement('my-piece-picker')
export class MyPiecePicker extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: ${SQUARE_SIZE}px;
    }
    .picker-piece {
      height: ${SQUARE_SIZE}px;
      width: ${SQUARE_SIZE}px;
      cursor: pointer;
      background-size: cover;
      display: block;
    }
  `;

  @property({type: Array}) pieces: Piece[];
  @property({type: Boolean}) needsTarget = false;
  @property({type: String}) eventName?;

  @property({type: Object}) selected?: Piece;

  attached() {
  }

  pickedPiece(piece: Piece, e: CustomEvent) {
    let newSelected: Piece | undefined;
    if (this.needsTarget) {
      if (this.selected === piece) {
        newSelected = undefined;
      } else {
        newSelected = piece;
      }
    } else {
      newSelected = piece;
    }

    if (this.eventName) {
      this.dispatchEvent(
        new CustomEvent(this.eventName, {
          bubbles: true,
          composed: true,
          detail: newSelected,
        })
      );
    }
  }

  render() {
    return html`
        ${this.pieces.map(
          (piece) => html`<div
            class="picker-piece ${piece.name}"
            draggable=${this.needsTarget}
            
            style="
              background-image:url(/img/${piece.img});
              ${this.selected === piece ? 'background-color: rgb(0, 255, 0, 0.3);' : ''}
            "
            @click=${(e) => {
              this.pickedPiece(piece, e);
            }}
          ></div>`
        )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-piece-picker': MyPiecePicker;
  }
}
