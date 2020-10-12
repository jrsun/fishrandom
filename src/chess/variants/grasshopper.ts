import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState} from '../state';
import Square from '../square';
import {randomChoice} from '../../common/utils';
import {Move, TurnType} from '../turn';
import {dedup, Pair} from '../pair';

export class Grasshopper extends Game {
  name = 'Grasshopper';
  constructor(isServer: boolean) {
    super(isServer, generateInitial());
  }
  promotesTo(piece: Piece): Piece[] {
    return [...super.promotesTo(piece), new Hopper(piece.color)];
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
      return 'bgrasshopper.svg';
    } else if (this.color === Color.WHITE) {
      return 'wgrasshopper.svg';
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
      after: BoardState.copy(state)
        .setTurn(getOpponent(this.color))
        .place(this, square.row, square.col)
        .empty(row, col),
      piece: this,
      start: {row, col},
      end: square,
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

function generateInitial(): BoardState {
  const state = generateStartState();
  const squares = state.squares;
  for (let col = 0; col < 8; col++) {
    squares[1][col].place(new Hopper(Color.BLACK));
    squares[2][col].place(new Pawn(Color.BLACK));
    squares[5][col].place(new Pawn(Color.WHITE));
    squares[6][col].place(new Hopper(Color.WHITE));
  }
  return state;
}
