import {Game, GameEventName, GameEventType} from '../game';
import {Knight, Pawn, AmazonRoyal, King, Piece} from '../piece';
import {Color, getOpponent, Pair} from '../const';
import {BoardState, generateStartState, Phase} from '../state';
import Square from '../square';
import {Turn, TurnType} from '../turn';
import {equals} from '../pair';
import {cartesian} from '../../utils';

export class Veto extends Game {
  name = 'Veto';
  lastOn: Pair | undefined;
  lastOff: Pair | undefined;

  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }
  onConnect() {
    const last = this.turnHistory[this.turnHistory.length - 1];
    if (!last) return;
    this.sideEffects(last);
  }
  sideEffects(turn: Turn) {
    if (!this.eventHandler) return;
    if (this.lastOn) {
      this.eventHandler({
        pairs: [this.lastOn],
        name: GameEventName.Highlight,
        type: GameEventType.Off,
      });
    }
    if (this.lastOff) {
      this.eventHandler({
        pairs: [this.lastOff],
        name: GameEventName.Veto,
        type: GameEventType.Off,
      });
    }
    if (turn.after.extra.phase !== Phase.VETO) return;
    this.eventHandler({
      pairs: [turn.end],
      name: GameEventName.Highlight,
      type: GameEventType.On,
    });
    this.lastOn = turn.end;
    if ('start' in turn) {
      this.eventHandler({
        pairs: [turn.start],
        name: GameEventName.Veto,
        type: GameEventType.On,
      });
      this.lastOff = turn.start;
    }
  }
  modifyTurn(turn: Turn): Turn {
    const newState = BoardState.copy(turn.after);
    if (turn.type !== TurnType.ACTIVATE) {
      if (turn.after.extra.vetoed === undefined) {
        // was a move, and there is no veto, so set veto phase
        return {
          ...turn,
          after: newState.setPhase(Phase.VETO),
        };
      } else {
        // was a move, and there was a veto already, so unset vetoed
        newState.extra = {
          vetoed: undefined,
        };
        return {
          ...turn,
          after: newState,
        };
      }
    }
    return turn;
  }

  activate(color, row, col, piece?: Piece): Turn | undefined {
    if (color !== this.state.whoseTurn) return;

    const last = this.turnHistory[this.turnHistory.length - 1];
    if (!last || !('start' in last)) return;

    if (equals({row, col}, last.end)) {
      // accept
      const newState = BoardState.copy(last.after)
        .setPhase(Phase.NORMAL)
        .setTurn(color);
      newState.extra = {
        vetoed: undefined,
      };
      return {
        before: last.after,
        after: newState,
        end: last.end,
        piece: last.piece,
        type: TurnType.ACTIVATE,
      };
    } else if (equals({row, col}, last.start)) {
      // veto
      const newState = BoardState.copy(last.before).setPhase(Phase.NORMAL);
      newState.extra = {
        vetoed: last,
      };
      return {
        before: last.after,
        after: newState,
        end: last.start,
        piece: last.piece,
        type: TurnType.ACTIVATE,
      };
    }
  }

  legalMovesFrom(state: BoardState, row, col, allowCastle): Turn[] {
    if (state.extra.phase === Phase.VETO) return [];

    return super.legalMovesFrom(state, row, col, allowCastle).filter((move) => {
      const vetoed = state.extra.vetoed;
      if (!vetoed) return true;
      if (!('start' in move) || !('start' in vetoed)) return false;

      return (
        !equals(move.end, vetoed.end) ||
        move.piece?.name !== vetoed.piece?.name ||
        !equals(move.start, vetoed.start)
      );
    });
  }

  validateTurn(color: Color, turn: Turn): boolean {
    if (!super.validateTurn(color, turn)) return false;

    if (turn.type === TurnType.ACTIVATE) {
      return (
        turn.before.extra.phase === Phase.VETO && !turn.before.extra.vetoed
      );
    } else {
      const last = this.turnHistory[this.turnHistory.length - 1];
      if (!last) return true;

      return (
        last.type === TurnType.ACTIVATE ||
        last.piece.color === getOpponent(color)
      );
    }
  }
}
