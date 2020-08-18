import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Turn, Activate, TurnType, Castle} from '../move';

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

    for (let i = row - 1; i < row + 2; i++) {
      for (let j = col - 1; j < col + 2; j++) {
        const occupant = after.getSquare(i,j)?.occupant;
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