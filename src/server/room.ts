import {Game} from '../chess/game';
import {randomChoice} from '../utils';
import {Move, Turn, TurnType} from '../chess/move';
import {Color, getOpponent, ROULETTE_SECONDS} from '../chess/const';
import {
  AppendMessage,
  replacer,
  ReplaceMessage,
  GameResult,
  GameOverMessage,
  log,
  sendMessage,
  InitGameMessage,
  TimerMessage,
  ReconnectMessage,
} from '../common/message';

// States progress from top to bottom within a room.
export enum RoomState {
  WAITING = 'waiting',
  RULES = 'rules',
  PLAYING = 'playing',
  COMPLETED = 'completed',
}

interface PlayerInfo {
  uuid: string;
  color: Color;
  socket: WebSocket;
  time: number;
}

const PLAYER_TIME_MS = 3 * 60 * 1000;
const INCREMENT_MS = 5 * 1000;

export class Room {
  // public
  game: Game;

  p1: PlayerInfo;
  p2: PlayerInfo;

  // protected
  state: RoomState;
  lastMoveTime: number;
  timerInterval: any; // timer

  constructor(
    p1: string,
    p1s: WebSocket,
    p2: string,
    p2s: WebSocket,
    game: Game
  ) {
    this.p1 = {
      uuid: p1,
      socket: p1s,
      color: randomChoice([Color.WHITE, Color.BLACK]),
      time: PLAYER_TIME_MS,
    };
    this.p2 = {
      uuid: p2,
      socket: p2s,
      color: getOpponent(this.p1.color),
      time: PLAYER_TIME_MS,
    };
    if (this.p1.color === Color.WHITE) {
      this.p1.time += ROULETTE_SECONDS * 1000;
    } else {
      this.p2.time += ROULETTE_SECONDS * 1000;
    }
    this.setState(RoomState.PLAYING);
    this.game = game;

    // Send init game messages
    sendMessage(this.p1.socket, {
      type: 'initGame',
      state: this.game.visibleState(this.game.state, this.p1.color),
      variantName: this.game.name,
      color: this.p1.color,
      player: getName(this.p1.uuid),
      opponent: getName(this.p2.uuid),
    } as InitGameMessage);
    sendMessage(this.p2.socket, {
      type: 'initGame',
      state: this.game.visibleState(this.game.state, this.p2.color),
      variantName: this.game.name,
      color: this.p2.color,
      player: getName(this.p2.uuid),
      opponent: getName(this.p1.uuid),
    } as InitGameMessage);
    this.timerInterval = setInterval(() => {
      const player =
        this.game.state.whoseTurn === this.p1.color ? this.p1 : this.p2;
      const opponent = player === this.p1 ? this.p2 : this.p1;
      player.time -= 1000;
      if (player.time <= 0) {
        this.wins(opponent.uuid);
      }
    }, 1000);
    this.sendTimers();
  }

  setState(state: RoomState) {
    this.state = state;
  }

  handleResign(uuid: string) {
    if (this.state !== RoomState.PLAYING) return;

    return this.wins(uuid === this.p1.uuid ? this.p2.uuid : this.p1.uuid);
  }

  handleTurn(uuid: string, turnAttempt: Turn) {
    if (this.state !== RoomState.PLAYING) return;

    const game = this.game;
    const player = this.p1.uuid === uuid ? this.p1 : this.p2;
    const opponent = player === this.p1 ? this.p2 : this.p1;
    let turn: Turn | undefined;
    const {
      end: {row: drow, col: dcol},
    } = turnAttempt;

    switch (turnAttempt.type) {
      case TurnType.MOVE:
        const {
          start: {row: srow, col: scol},
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

        turn = game.move(player.color, piece, srow, scol, drow, dcol);
        break;
      case TurnType.CASTLE:
        turn = game.castle(player.color, turnAttempt.kingside);
        break;
      case TurnType.DROP:
        const {
          piece: droppedPiece,
          end: {row, col},
        } = turnAttempt;
        turn = game.drop(player.color, droppedPiece, row, col);
        break;
      case TurnType.PROMOTE:
        const {
          to,
          piece: promoter,
          start: {row: prow, col: pcol},
        } = turnAttempt;
        turn = game.promote(player.color, promoter, to, prow, pcol, drow, dcol);
        break;
      case TurnType.ACTIVATE:
        const apiece = game.state.getSquare(
          turnAttempt.end.row,
          turnAttempt.end.col
        )?.occupant;
        if (!apiece) return;
        turn = game.activate(
          player.color,
          apiece,
          turnAttempt.end.row,
          turnAttempt.end.col
        );
        break;
      default:
        throw new Error(`unimplemented turn type ${turnAttempt.type}`);
    }

    if (!turn) {
      console.log('bad move!');
      return;
    }

    game.state = turn.after;
    game.turnHistory.push(turn);
    game.stateHistory.push(turn.after);

    player.time += INCREMENT_MS;
    // we should send the mover a `replaceState` and the opponent an
    // `appendState`
    const rm = {
      type: 'replaceState' as const,
      turn: {
        // mostly a no-op on turn, but useful in variants
        ...this.game.visibleTurn(turn, player.color),
        // state should be universal
        before: game.visibleState(turn.before, player.color),
        after: game.visibleState(turn.after, player.color),
      },
    };
    const am = {
      type: 'appendState' as const,
      turn: {
        ...this.game.visibleTurn(turn, opponent.color),
        before: game.visibleState(turn.before, opponent.color),
        after: game.visibleState(turn.after, opponent.color),
      },
    };

    sendMessage(player.socket, rm);
    sendMessage(opponent.socket, am);
    this.sendTimers();

    if (game.winCondition(player.color)) {
      this.wins(player.uuid);
    }
    if (game.drawCondition(player.color)) {
      this.draws();
    }
  }

  reconnect(uuid: string, socket: WebSocket) {
    const player = this.p1.uuid === uuid ? this.p1 : this.p2;
    const opponent = this.p1.uuid === uuid ? this.p2 : this.p1;
    player.socket = socket;

    const rec = {
      type: 'reconnect' as const,
      state: this.game.visibleState(this.game.state, player.color),
      variantName: this.game.name,
      color: player.color,
      player: getName(player.uuid),
      opponent: getName(opponent.uuid),
      turnHistory: this.game.turnHistory.map(turn => ({
        ...this.game.visibleTurn(turn, player.color),
        before: this.game.visibleState(turn.before, player.color),
        after: this.game.visibleState(turn.after, player.color),
      })),
      stateHistory: this.game.stateHistory.map(state => 
        this.game.visibleState(state, player.color)),
    };
    sendMessage(socket, rec);
    this.sendTimers();
  }

  getColor(uuid: string) {
    return this.p1.uuid === uuid ? this.p1.color : this.p2.color;
  }

  wins(uuid: string) {
    this.setState(RoomState.COMPLETED);
    clearInterval(this.timerInterval);

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
    this.sendTimers();
  }

  sendTimers() {
    const timerMessage = {
      type: 'timer',
    };
    sendMessage(this.p1.socket, {
      ...timerMessage,
      player: this.p1.time,
      opponent: this.p2.time,
    } as TimerMessage);
    sendMessage(this.p2.socket, {
      ...timerMessage,
      player: this.p2.time,
      opponent: this.p1.time,
    } as TimerMessage);
  }

  draws() {
    this.setState(RoomState.COMPLETED);
    clearInterval(this.timerInterval);

    const gom = {
      type: 'gameOver',
      stateHistory: this.game.stateHistory,
      turnHistory: this.game.turnHistory,
    };

    sendMessage(this.p1.socket, {
      ...gom,
      result: GameResult.DRAW,
    } as GameOverMessage);
    sendMessage(this.p2.socket, {
      ...gom,
      result: GameResult.DRAW,
    } as GameOverMessage);
    this.sendTimers();
  }
}

function getName(uuid?: string): string {
  return uuid?.split('|')?.[1] ?? 'Fish';
}
