
import { Piece } from './piece';

export default class Square {
  piece?: Piece;

  constructor(public row: number, public col: number) {}

  get occupant(): Piece | undefined {
    return this.piece;
  }

  toString(): string {
    if (this.occupant) {
      return `[${this.occupant.toString()}]`;
    }
    return '[ ]';
  }

  render(): HTMLElement {
    const result = document.createElement('div');
    result.setAttribute('class', 'square');
    // result.style.height = `${SQUARE_SIZE}px`;
    // result.style.width = `${SQUARE_SIZE}px`;
    if (this.occupant) {
      result.appendChild(this.occupant.render());
    }
    result.onclick = (e) => {
      result.dispatchEvent(
        new CustomEvent('square-clicked', {
          detail: this,
        })
      );
    };
    return result;
  }

  empty() {
    this.piece = undefined;
  }

  place(piece: Piece) {
    this.piece = piece;
  }
}