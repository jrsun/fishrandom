import {LitElement, html, customElement, property, css} from 'lit-element';
import {Piece} from '../chess/piece';

const SQUARE_SIZE = Math.min(window.innerWidth / 12, 50); // 50

@customElement('my-piece-picker')
export class MyPiecePicker extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .picker {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
    }
    .picker-piece {
      height: ${SQUARE_SIZE}px;
      width: ${SQUARE_SIZE}px;
      display: inline-block;
      background-size: cover;
    }
  `;

  @property({type: Array}) pieces: Piece[];
  @property({type: String}) eventName;

  pickedPiece(piece: Piece) {
    this.dispatchEvent(
      new CustomEvent(this.eventName, {
        bubbles: true,
        composed: true,
        detail: piece,
      })
    );
  }

  render() {
    return html`
      <div class="picker">
        ${this.pieces.map(
          (piece) => html`<div
            class="picker-piece ${piece.name}"
            style="background-image:url(/img/${piece.img});"
            @click=${() => {
              this.pickedPiece(piece);
            }}
          ></div>`
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-piece-picker': MyPiecePicker;
  }
}
