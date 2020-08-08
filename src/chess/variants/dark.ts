import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import BoardState from '../state';
import Square from '../square';
import { equals, Pair } from '../pair';
import { Turn, Unknown, TurnType } from '../move';

export class Dark extends Game {
  name = 'Dark';
  constructor(isServer: boolean) {
    super(isServer);
  }
  visibleState(state: BoardState, color: Color): BoardState {
    // Speed this up
    if (!this.isServer) return state;

    const legalTargets: Set<Pair> = new Set();
    for (const square of state.squares.flat()) {
      if (!square.occupant || square.occupant.color !== color) {
        continue;
      }
      legalTargets.add(square);
      const moves = square.occupant.legalMoves(square.row, square.col, state, this.turnHistory);
      for (const move of moves) {
        legalTargets.add(move.end);
      }
    }
    return new BoardState(
      state.squares.map((row, i) =>
        row.map((square, j) => {
          if (Array.from(legalTargets).some(pair => equals(pair, {row: i, col: j}))) {
            return square;
          } else {
            const hidden =  new Square(i, j);
            hidden.place(new Obscurant(Color.OTHER));
            return hidden;
          }
        })
      ),
      state.whoseTurn
    );
  }

  postProcess(color: Color, turn: Turn): Turn {
    if (color === turn.piece.color) return turn;

    return {
      type: TurnType.UNKNOWN,
      before: turn.before,
      after: turn.after,
      end: {row: -1, col: -1},
      piece: new Obscurant(Color.OTHER),
    };
  }

  winCondition(color: Color): boolean {
    if (super.winCondition(color)) return true;

    if (
      !this.state.pieces
        .filter((piece) => piece.color === getOpponent(color))
        .some((piece) => piece instanceof King)
    ) {
      return true;
    }
    return false;
  }
}

export class Obscurant extends Piece {
  name = 'Obscurant';
  get img(): string {
    return 'fog.svg';
  }
  static freeze(p: Obscurant): object {
    return {
      _class: 'Obscurant',
      n: p.name,
      c: Color.OTHER,
    }
  }
  static thaw(o): Obscurant {
    return new Obscurant(o.c);
  }
}