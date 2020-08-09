import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, TurnType} from '../move';
import {dedup, Pair} from '../pair';

export class Grasshopper extends Game {
  name = 'Grasshopper';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }
}

export class Hopper extends Piece {
  name = 'Hopper';
  moves = [
    {row: 1, col: 1},
    {row: 1, col: 0},
  ];
  get img(): string {
    if (this.color === Color.BLACK) {
      return 'gdt.svg';
    } else if (this.color === Color.WHITE) {
      return 'glt.svg';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
  legalMoves(row: number, col: number, state: BoardState): Move[] {
    const moves = dedup(
      this.moves.flatMap((move) =>
        [-1, 1]
          .map((sign) => move.row * sign)
          .flatMap((first) =>
            [-1, 1].flatMap((sign) => [
              {
                row: first,
                col: move.col * sign,
              },
              {
                row: move.col * sign,
                col: first,
              },
            ])
          )
      )
    )
      .map((dir) => this.ride(row, col, dir.row, dir.col, state))
      .filter((move) => !!move) as Move[];
    return moves;
  }
  private ride(
    row: number,
    col: number,
    rowDir: number,
    colDir: number,
    state: BoardState
  ): Move | undefined {
    // ride in one direction until we hit the edge of board or another piece
    let square = state.getSquare(row, col);

    while (square) {
      square = state.getSquare(square.row + rowDir, square.col + colDir);
      if (square?.occupant) {
        square = state.getSquare(square.row + rowDir, square.col + colDir);
        break;
      }
    }
    if (!square || square.occupant?.color === this.color) return;
    const isCapture = !!(
      square.occupant && square.occupant.color !== this.color
    );
    return {
      before: state,
      after: new BoardState(state.squares, getOpponent(this.color))
        .place(this, square.row, square.col)
        .empty(row, col),
      piece: this,
      start: {row, col},
      end: square,
      isCapture,
      captured: square.occupant,
      type: TurnType.MOVE,
    };
  }

  static freeze(p: Hopper): object {
    return {
      _class: 'Hopper',
      n: p.name,
      c: p.color,
    };
  }
  static thaw(o): Hopper {
    return new Hopper(o.c);
  }
}

function generateStartState(): BoardState {
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
    2: {},
    5: {},
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
    piecePositions[1][col] = new Hopper(Color.BLACK);
    piecePositions[2][col] = new Pawn(Color.BLACK);
    piecePositions[5][col] = new Pawn(Color.WHITE);
    piecePositions[6][col] = new Hopper(Color.WHITE);
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
  return new BoardState(squares, Color.WHITE);
}
