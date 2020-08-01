import {Game} from '../chess/game';
import {randomChoice} from '../utils';
import {Move, Turn, TurnType} from '../chess/move';
import {Color, getOpponent} from '../chess/const';
import {
  AppendMessage,
  replacer,
  ReplaceMessage,
  GameResult,
  GameOverMessage,
  log,
  sendMessage,
} from '../common/message';

// States progress from top to bottom within a room.
enum RoomState {
  WAITING = 'waiting',
  RULES = 'rules',
  PLAYING = 'playing',
  COMPLETED = 'completed',
}

interface PlayerInfo {
  uuid: string;
  color: Color;
  socket: WebSocket;
}

export class Room {
  // public
  game?: Game;

  p1: PlayerInfo;
  p2?: PlayerInfo;

  // protected
  state: RoomState;

  constructor(uuid: string, socket: WebSocket, state = RoomState.WAITING) {
    this.p1 = {
      uuid,
      socket,
      color: randomChoice([Color.WHITE, Color.BLACK]),
    };
  }

  p2Connect(uuid: string, socket: WebSocket) {
    this.p2 = {
      uuid,
      socket,
      color: getOpponent(this.p1.color),
    };
    this.state = RoomState.PLAYING; // RULES
  }

  handleResign(uuid: string) {
    if (!this.game || !this.p2) return;

    return this.wins(uuid === this.p1.uuid ? this.p2.uuid : this.p1.uuid);
  }

  handleTurn(uuid: string, turnAttempt: Turn) {
    if (!this.game || !this.p2) return;

    const game = this.game;
    const player = this.p1.uuid === uuid ? this.p1 : this.p2;
    const opponent = player === this.p1 ? this.p2 : this.p1;
    let turn: Turn | undefined;

    switch (turnAttempt.type) {
      case TurnType.MOVE:
        const {
          start: {row: srow, col: scol},
          end: {row: drow, col: dcol},
        } = turnAttempt;

        const piece = game.state.getSquare(srow, scol)?.occupant;
        if (!piece) {
          console.log('no piece at ', srow, scol);
          return;
        }
        console.log(
          '%s: (%s, %s) -> (%s, %s)',
          piece.name,
          srow,
          scol,
          drow,
          dcol
        );

        turn = game.attemptMove(player.color, piece, srow, scol, drow, dcol);
        break;
      default:
        throw new Error('unimplemented');
    }

    if (!turn) {
      console.log('bad move!');
      return;
    }
    // we should send the mover a `replaceState` and the opponent an
    // `appendState`
    const rm = {
      type: 'replaceState',
      turn: {
        ...turn,
        before: game.visibleState(turn.before, player.color),
        after: game.visibleState(turn.after, player.color),
      },
    } as ReplaceMessage;
    const am = {
      type: 'appendState',
      turn: {
        ...turn,
        before: game.visibleState(turn.before, opponent.color),
        after: game.visibleState(turn.after, opponent.color),
      },
    } as AppendMessage;

    sendMessage(player.socket, rm);
    sendMessage(opponent.socket, am);

    if (game.winCondition(player.color)) {
      this.wins(player.uuid);
    }
  }

  wins(uuid: string) {
    if (!this.game || !this.p2) return;

    this.state = RoomState.COMPLETED;
    const player = this.p1.uuid === uuid ? this.p1 : this.p2;
    const opponent = player === this.p1 ? this.p2 : this.p1;

    const gom = {
      type: 'gameOver',
      stateHistory: this.game.stateHistory,
      turnHistory: this.game.turnHistory,
    };

    sendMessage(player.socket, {
      ...gom,
      result: GameResult.WIN,
    } as GameOverMessage);
    sendMessage(opponent.socket, {
      ...gom,
      result: GameResult.LOSS,
    } as GameOverMessage);
  }
}
