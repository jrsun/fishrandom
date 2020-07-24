import Square from './square';
import {Piece} from './piece';
import {hash} from './const';

export default class BoardState {
  ranks: number = 8;
  files: number = 8;
  squares: Square[][];

  constructor(squares: Square[][]) {
    this.ranks = squares.length;
    this.files = squares[0].length;
    const newSquares = [];
    for (const row of squares) {
      const newRow = [];
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

  toString(): string {
    let result = '';
    for (const row of this.squares) {
      for (const square of row) {
        result += square.toString();
      }
      result += '<br>';
    }
    return result;
  }
}