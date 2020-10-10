import Square from './square';
import {
  Piece,
  ALL_PIECES,
  Rook,
  Knight,
  Bishop,
  Queen,
  King,
  Pawn,
} from './piece';
import {Color} from './const';
import {randomChoice} from '../utils';
import {Move, Turn} from './turn';

type BoardJson = (string | null)[][];

export enum Phase {
  PRE = 'pre',
  NORMAL = 'normal',
  VETO = 'veto',
}

interface Extra {
  bario?: {
    whiteOptions: Piece[];
    blackOptions: Piece[];
  };
  phase?: Phase;
  vetoed?: Turn | false;
}

export class BoardState {
  ranks: number = 8;
  files: number = 8;
  squares: Square[][];
  whoseTurn: Color;
  banks: {[color: string]: Piece[]} = {};
  extra: Extra;

  constructor(
    squares: Square[][],
    whoseTurn: Color,
    banks: {[color: string]: Piece[]},
    extra?: {[variant: string]: any}
  ) {
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
    this.banks = Object.keys(banks).reduce(
      (acc: {[color: string]: Piece[]}, color: Color) => {
        acc[color] = [...banks[color]];
        return acc;
      },
      {}
    );
    this.extra = {...extra};
  }

  static copy(other: BoardState): BoardState {
    return new BoardState(
      other.squares,
      other.whoseTurn,
      other.banks,
      other.extra
    );
  }

  setTurn(color: Color): BoardState {
    this.whoseTurn = color;
    return this;
  }

  setPhase(phase: Phase): BoardState {
    this.extra.phase = phase;
    return this;
  }

  place(piece: Piece, row: number, col: number): BoardState {
    const square = this.getSquare(row, col);
    if (!square) {
      return this;
    }
    square.place(piece);
    return this;
  }

  removeFromBank(color: Color, piece: Piece): BoardState | undefined {
    const playerBank = this.banks[color];
    if (!playerBank) return;

    const index = playerBank.findIndex((p) => p.name === piece.name);
    if (index === -1) return;

    playerBank.splice(index, 1);
    return this;
  }

  empty(row: number, col: number): BoardState {
    const square = this.getSquare(row, col);
    if (!square) {
      return this;
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
      extra: state.extra,
    };
  }

  static thaw(o): BoardState {
    return new BoardState(o.squares, o.whoseTurn, o.banks, o.extra);
  }
}

export function backRank(color: Color): {[i: number]: Piece} {
  return {
    0: new Rook(color),
    1: new Knight(color),
    2: new Bishop(color),
    3: new Queen(color),
    4: new King(color),
    5: new Bishop(color),
    6: new Knight(color),
    7: new Rook(color),
  };
}

function randomBackRank(): {[i: number]: typeof Piece} {
  const allFiles = [0, 1, 2, 3, 4, 5, 6, 7];
  const usedFiles: number[] = [];
  const bishop1File = randomChoice([0, 2, 4, 6]);
  const bishop2File = randomChoice([1, 3, 5, 7]);
  usedFiles.push(bishop1File);
  usedFiles.push(bishop2File);
  const queenFile = randomChoice(
    allFiles.filter((file) => !usedFiles.includes(file))
  );
  usedFiles.push(queenFile);

  const n1file = randomChoice(
    allFiles.filter((file) => !usedFiles.includes(file))
  );
  usedFiles.push(n1file);
  const n2file = randomChoice(
    allFiles.filter((file) => !usedFiles.includes(file))
  );
  usedFiles.push(n2file);
  const [r1file, kfile, r2file] = allFiles.filter(
    (file) => !usedFiles.includes(file)
  );
  return {
    [bishop1File]: Bishop,
    [bishop2File]: Bishop,
    [queenFile]: Queen,
    [n1file]: Knight,
    [n2file]: Knight,
    [r1file]: Rook,
    [kfile]: King,
    [r2file]: Rook,
  };
}

export function squaresFromPos(pos): Square[][] {
  const squares: Square[][] = [];
  for (let i = 0; i < 8; i++) {
    const row: Square[] = [];
    for (let j = 0; j < 8; j++) {
      const square = new Square(i, j);
      row.push(square);
      if (pos[i]?.[j]) {
        square.place(pos[i][j]);
      }
    }
    squares.push(row);
  }
  return squares;
}

export function generate9602(): BoardState {
  const blackRank = {};
  const whiteRank = {};
  for (const [file, piece] of Object.entries(randomBackRank())) {
    blackRank[file] = new piece(Color.BLACK);
  }
  for (const [file, piece] of Object.entries(randomBackRank())) {
    whiteRank[file] = new piece(Color.WHITE);
  }

  const piecePositions = {
    0: blackRank,
    1: {},
    6: {},
    7: whiteRank,
  };
  for (let col = 0; col < 8; col++) {
    piecePositions[1][col] = new Pawn(Color.BLACK);
    piecePositions[6][col] = new Pawn(Color.WHITE);
  }
  return new BoardState(squaresFromPos(piecePositions), Color.WHITE, {});
}

export function generate960(): BoardState {
  const backRank = randomBackRank();
  const blackRank = {};
  const whiteRank = {};
  for (const [file, piece] of Object.entries(backRank)) {
    blackRank[file] = new piece(Color.BLACK);
    whiteRank[file] = new piece(Color.WHITE);
  }

  const piecePositions = {
    0: blackRank,
    1: {},
    6: {},
    7: whiteRank,
  };
  for (let col = 0; col < 8; col++) {
    piecePositions[1][col] = new Pawn(Color.BLACK);
    piecePositions[6][col] = new Pawn(Color.WHITE);
  }
  return new BoardState(squaresFromPos(piecePositions), Color.WHITE, {});
}

export function generateStartState(): BoardState {
  const piecePositions = {
    0: backRank(Color.BLACK),
    1: {},
    6: {},
    7: backRank(Color.WHITE),
  };

  for (let col = 0; col < 8; col++) {
    piecePositions[1][col] = new Pawn(Color.BLACK);
    piecePositions[6][col] = new Pawn(Color.WHITE);
  }

  return new BoardState(squaresFromPos(piecePositions), Color.WHITE, {});
}
