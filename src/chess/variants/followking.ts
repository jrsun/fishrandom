import {Game, GameEventName, GameEventType} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn, ALL_PIECES} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState} from '../state';
import Square from '../square';
import {randomChoice} from '../../common/utils';
import {Move, Turn, Activate, TurnType, Castle} from '../turn';
import { Pair } from '../pair';

export class Followking extends Game {
  name = 'Followking';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }

  legalMovesFrom(
    state: BoardState,
    row: number,
    col: number,
  ): Turn[] {
    // Disallow castling
    return super
      .legalMovesFrom(state, row, col, false)
      .filter(move => move.type !== TurnType.CASTLE);
  }

  modifyTurn(turn: Turn): Turn {
    const {piece, end, before, after} = turn;
    if (
      !(piece instanceof King) ||
      (turn.type !== TurnType.MOVE)
    ) return turn;
   
    const dRow = end.row - turn.start.row;
    const dCol = end.col - turn.start.col;

    const state = BoardState.copy(before).setTurn(after.whoseTurn);
    const pos: Map<string, Pair[]> = new Map<string, Pair[]>();

    for (const row of state.squares) {
      for (const square of row) {
        if (square.occupant?.color === piece.color) {
          pos.set(
            square.occupant.name,
            [...(pos.get(square.occupant.name) || []), square],
          );
          state.empty(square.row, square.col);
        }
      }
    }
    pos.forEach((pairs, pieceName) => {
      for (const pair of pairs) {
        state.place(
          new ALL_PIECES[pieceName](piece.color),
          pair.row + dRow,
          pair.col + dCol,
        )
      }
    });
    return {...turn, after: state};
  }
}
