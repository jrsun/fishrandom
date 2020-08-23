import {Game} from '../game';
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

  legalMovesFrom(state: BoardState, row, col, allowCastles): (Move|Castle)[] {
    const square = state.getSquare(row, col);
    const piece = square?.occupant;
    let moves = super.legalMovesFrom(state, row, col, allowCastles);

    if (piece instanceof King) {
      moves = moves.filter(move => !move.captured);
    }
    return moves;
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
        const occupant = after.getSquare(i,j)?.occupant;
        if (occupant && !(occupant instanceof Pawn)) {
          after.empty(i, j);
        }
      }
    }
    if (this.eventHandler) {
      this.eventHandler({
        pairs,
        type: 'explode' as const,
        temporary: true,
      });
    }
    return {
      ...turn,
      after,
    };
  }
}