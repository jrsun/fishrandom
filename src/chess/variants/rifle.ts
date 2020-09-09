import {generateStartState, BoardState} from '../state';
import {Game} from '../game';
import {Turn, TurnType} from '../turn';
import { Piece } from '../piece';

export class Shooting extends Game {
  name = 'Shooting';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }

  promotions(turn: Turn): Piece[] | undefined {
    if (turn.captured) return; // capture means pawn didn't really move
    
    return super.promotions(turn);
  }

  modifyTurn(turn: Turn): Turn {
    if (
      turn.captured &&
      (turn.type === TurnType.MOVE || turn.type === TurnType.PROMOTE)
    ) {
      return {
        ...turn,
        // end: turn.start, Don't change the end because this is used for display
        after: BoardState.copy(turn.after)
          .empty(turn.end.row, turn.end.col)
          .place(turn.piece, turn.start.row, turn.start.col),
        // set other turn
      };
    }
    return turn;
  }
}
