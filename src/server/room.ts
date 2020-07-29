import {Game} from '../chess/game';
import {randomChoice} from '../utils';
import { Move } from '../chess/move';
import {Color} from '../chess/const';
import { AppendMessage, replacer, ReplaceMessage, GameResult, GameOverMessage } from '../common/message';

// States progress from top to bottom within a room.
enum RoomState {
  WAITING = 'waiting',
  RULES = 'rules',
  PLAYING = 'playing',
  COMPLETED = 'completed',
}

export class Room {
  // public
  p1: string;
  p2?: string;
  game?: Game;
  p1s: WebSocket;
  p2s?: WebSocket;

  // protected
  p1IsWhite: boolean;
  state: RoomState;
  victor: string; // p1 or p2

  constructor(p1: string, p1s: WebSocket, state = RoomState.WAITING) {
    this.p1 = p1;
    this.p1s = p1s;
    this.p1IsWhite = randomChoice([true, false]);
  }

  p2Connect(p2: string, p2s: WebSocket) {
    this.p2 = p2;
    this.p2s = p2s;
    this.state = RoomState.PLAYING; // RULES
  }

  handleMove(uuid: string, moveAttempt: Move) {
    if (!this.game || (uuid !== this.p1 && uuid !== this.p2)
    || !this.p2s || !this.p1s) return;

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
    if (game.winCondition(this.colorFromUuid(uuid))) {
      this.state = RoomState.COMPLETED;
      this.victor = uuid;
      this.socketFromUuid(uuid).send(JSON.stringify({
        type: 'gameOver',
        stateHistory: this.game.stateHistory,
        moveHistory: this.game.moveHistory,
        result: GameResult.WIN,
      } as GameOverMessage, replacer));
      this.otherSocketFromUuid(uuid).send(JSON.stringify({
        type: 'gameOver',
        stateHistory: this.game.stateHistory,
        moveHistory: this.game.moveHistory,
        result: GameResult.LOSS,
      } as GameOverMessage, replacer));
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
  private socketFromUuid(uuid: string): WebSocket {
    if (!this.p2s) {
      throw new Error('p2 socket not ready');
    }
    if (uuid === this.p1) return this.p1s;
    return this.p2s;
  }
  private otherSocketFromUuid(uuid: string): WebSocket {
    if (!this.p2s) {
      throw new Error('p2 socket not ready');
    }
    if (uuid === this.p1) return this.p2s;
    return this.p1s;
  }
}
