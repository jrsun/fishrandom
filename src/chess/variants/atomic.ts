import {Game, GameEventName, GameEventType} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent, Pair} from '../const';
import {BoardState, generateStartState} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Turn, Activate, TurnType, Castle} from '../turn';

export class Atomic extends Game {
  name = 'Atomic';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }

  sideEffects(turn: Turn) {
    if (!turn.captured) return;

    if (this.eventHandler) {
      const pairs: Pair[] = [];
      const {row, col} = turn.end;
      for (let i = row - 1; i < row + 2; i++) {
        for (let j = col - 1; j < col + 2; j++) {
          pairs.push({row: i, col: j});
        }
      }
      this.eventHandler({
        pairs,
        name: GameEventName.Explode,
        type: GameEventType.Temporary,
      });
    }
  }

  legalMovesFrom(state: BoardState, row, col, allowCastle): Turn[] {
    const square = state.getSquare(row, col);
    const piece = square?.occupant;
    if (!piece) return [];

    let moves = super.legalMovesFrom(state, row, col, allowCastle);
    // No moves that result in own King being gone after turn.
    return moves.filter((move) => (
      move.after.pieces.some(p => {
        return p instanceof King &&
          p.color === piece.color
      })
    ));
  }

  modifyTurn(turn: Turn): Turn {
    if (!turn.captured) return turn;

    const {row, col} = turn.end;
    const after = BoardState.copy(turn.after);
    after.empty(row, col);

    const pairs: Pair[] = [];
    for (let i = row - 1; i < row + 2; i++) {
      for (let j = col - 1; j < col + 2; j++) {
        pairs.push({row: i, col: j});
        const occupant = after.getSquare(i, j)?.occupant;
        if (occupant && !(occupant instanceof Pawn)) {
          after.empty(i, j);
        }
      }
    }
    return {
      ...turn,
      after,
    };
  }
}
