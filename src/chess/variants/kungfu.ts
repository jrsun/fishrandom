import {Game, GameEventType, GameEventName} from '../game';
import {generateStartState, Phase, BoardState} from '../state';
import {Color} from '../const';
import {Piece} from '../piece';
import {Turn} from '../turn';

export class Kungfu extends Game {
  name = 'Kungfu';
  constructor(isServer: boolean) {
    super(isServer, generateStartState().setPhase(Phase.PRE));
  }
  onConnect() {
    if (this.eventHandler) {
      if (this.state.extra.phase === Phase.PRE) {
        this.eventHandler({
          type: GameEventType.On,
          name: GameEventName.Highlight,
          pairs: [0, 1, 2, 3, 4, 5, 6, 7]
            .map((col) => [
              {row: 0, col},
              {row: 1, col},
              {row: 6, col},
              {row: 7, col},
            ])
            .flat(),
        });
      }
    }
  }
  sideEffects(turn: Turn) {
    if (!this.isServer) return;

    if (this.turnHistory.length === 2) {
      if (this.eventHandler) {
        this.eventHandler({
          type: GameEventType.Off,
          name: GameEventName.Highlight,
          pairs: [0, 1, 2, 3, 4, 5, 6, 7]
            .map((col) => [
              {row: 0, col},
              {row: 1, col},
              {row: 6, col},
              {row: 7, col},
            ])
            .flat(),
        });
      }
    }
  }
  modifyTurn(turn: Turn): Turn {
    if (this.turnHistory.length + 1 === 2) {
      return {
        ...turn,
        after: BoardState.copy(turn.after).setPhase(Phase.NORMAL),
      };
    }
    return turn;
  }
  isWhoseTurn(color: Color, piece?: Piece): boolean {
    if (process.env.NODE_ENV === 'development') return true;

    if (this.state.extra.phase === Phase.PRE) {
      return super.isWhoseTurn(color, piece);
    }
    return color === piece?.color;
  }
}
