import Square from './square';
import {Piece, ALL_PIECES} from './piece';
import {hash, Color} from './const';

type BoardJson = (string | null)[][];

export default class BoardState {
  ranks: number = 8;
  files: number = 8;
  squares: Square[][];
  whoseTurn: Color;
  banks: Map<Color, Map<typeof Piece, number>>= new Map();

  constructor(squares: Square[][], whoseTurn) {
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
    this.whoseTurn = whoseTurn;
  }

  place(piece: Piece, row: number, col: number): BoardState {
    const square = this.getSquare(row, col);
    if (!square) {
      throw new Error('square out of bounds' + row + ',' + col);
    }
    square.place(piece);
    return this;
  }

  removeFromBank(color: Color, p: Piece): BoardState|undefined {
    const playerBank = this.banks.get(color);
    if (!playerBank) return this;

    for (const pieceType of playerBank.keys()) {
      if (p instanceof pieceType && playerBank.get(pieceType)! > 0) {
        playerBank.set(pieceType, playerBank.get(pieceType)! - 1);
      }
    }
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

  get pieces(): Piece[] {
    return this.squares
      .map((row) => row.map((square) => square.occupant))
      .flat()
      .filter((occupant: Piece | undefined) => !!occupant) as Piece[];
  }

  static freeze(state: BoardState): object {
    return {
      _class: 'BoardState',
      squares: state.squares,
      whoseTurn: state.whoseTurn,
    };
  }

  static thaw(o): BoardState {
    return new BoardState(o.squares, o.whoseTurn);
  }
}
