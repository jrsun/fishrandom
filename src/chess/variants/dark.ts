import {Game, GameResult, GameResultType} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generate9602} from '../state';
import Square from '../square';
import {equals, Pair} from '../pair';
import {Turn, Unknown, TurnType} from '../turn';

export class Dark extends Game {
  name = 'Dark';
  constructor(isServer: boolean, initial?: BoardState) {
    super(isServer, initial);
  }
  visibleState(state: BoardState, color: Color): BoardState {
    const legalTargets: Set<Pair> = new Set();
    for (const square of state.squares.flat()) {
      if (!square.occupant || square.occupant.color !== color) {
        continue;
      }
      legalTargets.add(square);
      const moves = this.legalMovesFrom(state, square.row, square.col, false);
      for (const move of moves) {
        legalTargets.add(move.end);
      }
      // En passant
      const ep = moves.find(
        (move) => move.type === TurnType.MOVE && move.enpassant
      );
      if (ep) {
        const yDir = color === Color.WHITE ? -1 : 1;
        legalTargets.add({row: ep.end.row - yDir, col: ep.end.col});
      }
    }
    const vis = BoardState.copy(state);
    vis.squares = state.squares.map((row, i) =>
      row.map((square, j) => {
        if (
          Array.from(legalTargets).some((pair) =>
            equals(pair, {row: i, col: j})
          )
        ) {
          return square;
        } else {
          const hidden = new Square(i, j);
          hidden.place(new Obscurant(Color.OTHER));
          return hidden;
        }
      })
    );
    return vis;
  }

  validateTurn(color: Color, turn: Turn): boolean {
    if (
      turn.end.row < 0 ||
      turn.end.row >= this.state.ranks ||
      turn.end.col < 0 ||
      turn.end.col >= this.state.files ||
      !('start' in turn)
    ) {
      return false;
    }
    if (this.winCondition(color, turn.after)) {
      return true;
    }
    const newKnownState = BoardState
      .copy(this.visibleState(turn.before, color))
      .empty(turn.start.row, turn.start.col)
      .place(turn.piece, turn.end.row, turn.end.col);
    if (
      turn.after.whoseTurn === getOpponent(color) &&
      this.knowsInCheck(color, newKnownState)
    ) {
      return false;
    }
    return true;
  }

  winCondition(color: Color, state: BoardState): GameResult|undefined {
    if (!this.isServer) {
      // The client can know if they can capture the king.
      // This is actually necessary to validate the turn clientside.
      const opponent = getOpponent(color);
      const royalty = state.pieces.filter(piece => piece.isRoyal);
      if (
        royalty.some(piece => piece.color === color) &&
        !royalty.some(piece => piece.color === opponent)
      ) {
        return {
          type: GameResultType.WIN,
          reason: 'king capture',
        };
      } else {
        return;
      }
    }
    return super.winCondition(color, state);
  }

  visibleTurn(turn: Turn, color: Color): Turn {
    if (color === turn.piece.color) return turn;
    // Hack: Pawn double steps as is, if visible, for en-passant
    if (
      turn.piece instanceof Pawn &&
      turn.type === TurnType.MOVE &&
      Math.abs(turn.end.row - turn.start.row) === 2 &&
      !(
        this.visibleState(this.state, color).getSquare(
          turn.end.row,
          turn.end.col
        )?.occupant instanceof Obscurant
      )
    ) {
      return turn;
    }

    return {
      type: TurnType.UNKNOWN,
      before: turn.before,
      after: turn.after,
      end: {row: -1, col: -1},
      captured: turn.captured,
      piece: new Obscurant(Color.OTHER),
    };
  }
}

export class Dark2r extends Dark {
  name = 'Dark2r';
  constructor(isServer: boolean) {
    super(isServer, generate9602());
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
    };
  }
  static thaw(o): Obscurant {
    return new Obscurant(o.c);
  }
}
