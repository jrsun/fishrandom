import {Game, GameEventName, GameEventType, GameResult, GameResultType} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn, Mann} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState, generate960} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Turn, Activate, TurnType, Castle} from '../turn';

export class Losers extends Game {
  name = 'Losers';
  constructor(isServer: boolean) {
    super(isServer, genInitial());
  }

  promotesTo(piece: Piece): Piece[] {
    return [Queen, Rook, Bishop, Knight, Mann].map((t) => new t(piece.color));
  }

  legalMovesFrom(state: BoardState, row, col, allowCastle): Turn[] {
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
          false,
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

  winCondition(color: Color, state: BoardState): GameResult|undefined {
    if (state.whoseTurn === color && super.drawCondition(color, state)) {
      return {
        type: GameResultType.WIN,
        reason: 'stalemate',
      };
    }
    if (state.pieces.filter((piece) => piece.color === color).length === 0) {
      return {
        type: GameResultType.WIN,
        reason: 'losing all pieces',
      }
    }
    return;
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
  const state = generate960();
  for (const square of state.squares.flat()) {
    if (square.occupant instanceof King) {
      state.place(new Mann(square.occupant.color), square.row, square.col);
    }
  }

  return state;
}
