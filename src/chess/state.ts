import Square from './square';
import {Piece, ALL_PIECES, Rook, Knight, Bishop, Queen, King, Pawn} from './piece';
import {hash, Color} from './const';

type BoardJson = (string | null)[][];

export class BoardState {
  ranks: number = 8;
  files: number = 8;
  squares: Square[][];
  whoseTurn: Color;
  banks: {[color: string]: Piece[]} = {};

  constructor(squares: Square[][], whoseTurn, banks) {
    if (!banks) banks = {};

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
    this.banks = banks;
  }

  static copy(other: BoardState): BoardState {
    return new BoardState(other.squares, other.whoseTurn, other.banks);
  }

  setTurn(color: Color): BoardState {
    this.whoseTurn = color;
    return this;
  }

  place(piece: Piece, row: number, col: number): BoardState {
    const square = this.getSquare(row, col);
    if (!square) {
      throw new Error('square out of bounds' + row + ',' + col);
    }
    square.place(piece);
    return this;
  }

  removeFromBank(color: Color, piece: Piece): BoardState|undefined {
    const playerBank = this.banks[color];
    if (!playerBank) return this;

    const index = playerBank.findIndex(p => p.name === piece.name);
    playerBank.splice(index, 1);
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
      banks: state.banks,
    };
  }

  static thaw(o): BoardState {
    return new BoardState(o.squares, o.whoseTurn, o.banks);
  }
}

export function generateStartState(): BoardState {
  const piecePositions = {
    0: {
      0: new Rook(Color.BLACK),
      1: new Knight(Color.BLACK),
      2: new Bishop(Color.BLACK),
      3: new Queen(Color.BLACK),
      4: new King(Color.BLACK),
      5: new Bishop(Color.BLACK),
      6: new Knight(Color.BLACK),
      7: new Rook(Color.BLACK),
    },
    1: {},
    6: {},
    7: {
      0: new Rook(Color.WHITE),
      1: new Knight(Color.WHITE),
      2: new Bishop(Color.WHITE),
      3: new Queen(Color.WHITE),
      4: new King(Color.WHITE),
      5: new Bishop(Color.WHITE),
      6: new Knight(Color.WHITE),
      7: new Rook(Color.WHITE),
    },
  };

  for (let col = 0; col < 8; col++) {
    piecePositions[1][col] = new Pawn(Color.BLACK);
    piecePositions[6][col] = new Pawn(Color.WHITE);
  }

  const squares: Square[][] = [];
  for (let i = 0; i < 8; i++) {
    const row: Square[] = [];
    for (let j = 0; j < 8; j++) {
      const square = new Square(i, j);
      row.push(square);
      if (piecePositions[i]?.[j]) {
        square.place(piecePositions[i][j]);
      }
    }
    squares.push(row);
  }
  return new BoardState(squares, Color.WHITE, {});
}
