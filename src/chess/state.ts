import Square from './square';
import {Piece, ALL_PIECES} from './piece';
import {hash, Color} from './const';

type BoardJson = (string | null)[][];

export default class BoardState {
  ranks: number = 8;
  files: number = 8;
  squares: Square[][];

  constructor(squares: Square[][]) {
    this.ranks = squares.length;
    this.files = squares[0].length;
    const newSquares: Square[][] = [];
    for (const row of squares) {
      const newRow: Square[] = [];
      for (const square of row) {
        const newSquare = new Square(square.row, square.col);
        newRow.push(newSquare);
        if (square.occupant) {
          newSquare.place(square.occupant);
        }
      }
      newSquares.push(newRow);
    }
    this.squares = newSquares;
  }

  place(piece: Piece, row: number, col: number): BoardState {
    const square = this.getSquare(row, col);
    if (!square) {
      throw new Error('square out of bounds' + row + ',' + col);
    }
    square.place(piece);
    return this;
  }

  empty(row: number, col: number): BoardState {
    const square = this.getSquare(row, col);
    if (!square) {
      throw new Error('square out of bounds' + row + ',' + col);
    }
    square.empty();
    return this;
  }

  getSquare(row: number, col: number): Square | undefined {
    return this.squares[row]?.[col];
  }

  pieces(): Piece[] {
    return this.squares
    .map(row => row.map(square => square.occupant)).flat()
    .filter((occupant: Piece|undefined) => !!occupant) as Piece[];
  }

  static freeze(state: BoardState): object {
    return {
      _class: 'BoardState',
      squares: state.squares,
    };
  }

  static thaw(o): BoardState {
    return new BoardState(o.squares);
  }
}
