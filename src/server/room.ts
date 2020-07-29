import {Game} from '../chess/game';
import {randomChoice} from '../utils';
import { Move } from '../chess/move';
import WS from 'ws';
import {Color} from '../chess/const';
import { AppendMessage, replacer, ReplaceMessage } from '../common/message';

enum RoomState {
  WAITING = 'waiting',
  PLAYING = 'playing',
  COMPLETED = 'completed',
}

export class Room {
  // public
  p1: string;
  p2?: string;
  game?: Game;
  p1s: WS.WebSocket;
  p2s?: WS.WebSocket;

  // protected
  p1IsWhite: boolean;
  state: RoomState;

  constructor(p1: string, p1s: WS.WebSocket, state = RoomState.WAITING) {
    this.p1 = p1;
    this.p1s = p1s;
    this.p1IsWhite = randomChoice([true, false]);
  }

  handleMove(uuid: string, moveAttempt: Move) {
    if (!this.game || (uuid !== this.p1 && uuid !== this.p2)) return;

    const {
      start: {row: srow, col: scol},
      end: {row: drow, col: dcol},
    } = moveAttempt;
    const game = this.game;

    const piece = game.state.getSquare(srow, scol)?.occupant;
    if (!piece) {
      console.log('no piece at ', srow, scol);
      return;
    }
    console.log('%s: (%s, %s) -> (%s, %s)', piece.name, srow, scol, drow, dcol);

    const move = game.attemptMove(
      this.colorFromUuid(uuid),
      piece,
      srow,
      scol,
      drow,
      dcol
    );
    if (move) {
      // we should send the mover a `replaceState` and the opponent an
      // `appendState`
      const rm = JSON.stringify(
        {type: 'replaceState', move, state: game.state} as ReplaceMessage,
        replacer);
      const am = JSON.stringify(
        {type: 'appendState', move, state: game.state} as AppendMessage,
        replacer);
      
      this.p1s.send(uuid === this.p1 ? rm : am);
      this.p2s.send(uuid === this.p2 ? rm : am);
    } else {
      console.log('bad move!');
    }
  }

  get p1Color(): Color {
    return this.p1IsWhite ? Color.WHITE : Color.BLACK;
  }

  get p2Color(): Color {
    return this.p1IsWhite ? Color.BLACK : Color.WHITE;
  }

  private colorFromUuid(uuid: string): Color {
    if (
      (uuid === this.p1 && this.p1IsWhite)
      || (uuid === this.p2 && !this.p1IsWhite)) {return Color.WHITE};
    return Color.BLACK;
  }
}
