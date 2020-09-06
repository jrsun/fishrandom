import {generateStartState, BoardState} from '../state';
import {Game} from '../game';
import {Turn, TurnType} from '../turn';

export class Shooting extends Game {
  name = 'Shooting';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }

  modifyTurn(turn: Turn): Turn {
    if (
      turn.captured &&
      (turn.type === TurnType.MOVE || turn.type === TurnType.PROMOTE)
    ) {
      return {
        ...turn,
        end: turn.start,
        after: BoardState.copy(turn.after)
          .empty(turn.end.row, turn.end.col)
          .place(turn.piece, turn.start.row, turn.start.col),
        // set other turn
      };
    }
    return turn;
  }
}
