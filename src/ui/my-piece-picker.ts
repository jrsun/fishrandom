import {LitElement, html, customElement, property, css} from 'lit-element';
import {Piece} from '../chess/piece';
import {replacer} from '../common/message';
import { selectPieceEvent } from './utils';

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
    .picker-piece.selected {
      background-color: rgba(0, 0, 255, 0.3);
    }
  `;

  @property({type: Array}) pieces: Piece[] = [];
  @property({type: Boolean}) needsTarget = false;
  @property({type: String}) eventName: string;
  @property({type: Object}) selectedPiece;

  pickedPiece(piece: Piece) {
    this.dispatchEvent(
      new CustomEvent(this.eventName, {
        bubbles: true,
        composed: true,
        detail: selectPieceEvent(piece === this.selectedPiece ? undefined : piece),
      })
    );
  }

  render() {
    return html`
      ${this.pieces.map(
        (piece) => html`<div
          class="picker-piece ${piece.name} ${piece === this.selectedPiece ? 'selected' : ''}"
          draggable=${this.needsTarget}
          style="background-image:url(/img/${piece.img});"
          @click=${(e) => {
            this.pickedPiece(piece);
          }}
          @dragstart=${(e: DragEvent) => {
            if (e.dataTransfer) {
              e.dataTransfer.setData(
                'text/plain',
                JSON.stringify({piece, type: 'drop'}, replacer)
              );
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
