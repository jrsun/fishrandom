import {LitElement, html, customElement, property, css} from 'lit-element';
import {Piece} from '../chess/piece';
import { replacer } from '../common/message';

const SQUARE_SIZE = Math.min(window.innerWidth / 8, 50); // 50

@customElement('my-piece-picker')
export class MyPiecePicker extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: ${SQUARE_SIZE}px;
      min-width: ${SQUARE_SIZE}px;
    }
    .picker-piece {
      height: ${SQUARE_SIZE}px;
      width: ${SQUARE_SIZE}px;
      cursor: pointer;
      background-size: cover;
      display: block;
      z-index: 1;
      position: relative;
    }
  `;

  @property({type: Array}) pieces: Piece[] = [];
  @property({type: Boolean}) needsTarget = false;
  @property({type: String}) eventName?: string;

  pickedPiece(piece: Piece) {
    if (this.eventName) {
      this.dispatchEvent(
        new CustomEvent(this.eventName, {
          bubbles: true,
          composed: true,
          detail: piece,
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
          style="background-image:url(/img/${piece.img});"
          @click=${(e) => {
            if (!this.needsTarget) this.pickedPiece(piece);
          }}
          @dragstart=${(e: DragEvent) => {
            if (this.needsTarget) this.pickedPiece(piece);
            if (e.dataTransfer) {
              e.dataTransfer.setData('text/plain', JSON.stringify(
                {piece, type: 'drop'},
                replacer,
              ))
            }
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
