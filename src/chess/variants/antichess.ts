import {Game, GameEventName, GameEventType} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn, Mann} from '../piece';
import {Color, getOpponent, Pair} from '../const';
import {BoardState, generateStartState} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Turn, Activate, TurnType, Castle} from '../turn';

export class Antichess extends Game {
  name = 'Antichess';
  constructor(isServer: boolean) {
    super(isServer, genInitial());
  }

  promotesTo(): typeof Piece[] {
    return [Queen, Rook, Bishop, Knight, Mann];
  }

  legalMovesFrom(state: BoardState, row, col, allowCastles): (Move | Castle)[] {
    // only captures
    let atLeastOneCapture = false;
    const occupant = state.getSquare(row, col)?.occupant;
    if (!occupant) return [];
    for (const square of state.squares.flat()) {
      if (square.occupant?.color === occupant.color) {
        const allMoves = super.legalMovesFrom(
          state,
          square.row,
          square.col,
          false
        );
        if (allMoves.some((move) => move.captured)) {
          atLeastOneCapture = true;
          break;
        }
      }
    }
    const moves = super.legalMovesFrom(state, row, col, false);
    if (atLeastOneCapture) {
      return moves.filter((move) => move.captured);
    }
    return moves;
  }

  winCondition(color: Color, state: BoardState): boolean {
    return (
      state.pieces.filter((piece) => piece.color === color).length === 0 ||
      super.drawCondition(color, state)
    );
  }

  validateTurn(color: Color, turn: Turn): boolean {
    if (
      turn.end.row < 0 ||
      turn.end.row >= this.state.ranks ||
      turn.end.col < 0 ||
      turn.end.col >= this.state.files
    ) {
      return false;
    }
    return true;
  }
}

function genInitial(): BoardState {
  const state = generateStartState();
  state.place(new Mann(Color.WHITE), 7, 4);
  state.place(new Mann(Color.BLACK), 0, 4);

  return state;
}
