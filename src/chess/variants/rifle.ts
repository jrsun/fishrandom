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
        after: BoardState.copy(turn.before)
          .empty(turn.end.row, turn.end.col)
          .setTurn(turn.after.whoseTurn),
        // set other turn
      };
    }
    return turn;
  }
}
