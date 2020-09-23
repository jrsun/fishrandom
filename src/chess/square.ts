import {Piece} from './piece';

export default class Square {
  piece?: Piece;

  constructor(public row: number, public col: number) {}

  get occupant(): Piece | undefined {
    return this.piece;
  }

  render(): HTMLElement {
    const result = document.createElement('div');
    result.setAttribute('class', 'square');
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

  place(piece: Piece): Square {
    this.piece = piece;
    return this;
  }

  static freeze(square: Square): object {
    return {
      _class: 'Square',
      r: square.row,
      c: square.col,
      p: square.occupant,
    };
  }

  static thaw(o): Square {
    const sq = new Square(o.r, o.c);
    if (o.p) {
      sq.place(o.p);
    }
    return sq;
  }
}
