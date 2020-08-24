import {Game, GameEvent} from '../chess/game';
import {randomChoice, uuidToName} from '../utils';
import {Move, Turn, TurnType} from '../chess/turn';
import {Color, getOpponent, ROULETTE_SECONDS} from '../chess/const';
import {
  AppendMessage,
  replacer,
  ReplaceMessage,
  GameResult,
  GameOverMessage,
  sendMessage,
  InitGameMessage,
  TimerMessage,
  ReconnectMessage,
} from '../common/message';
import WS from 'ws';
import log from 'log';

// States progress from top to bottom within a room.
export enum RoomState {
  WAITING = 'waiting',
  RULES = 'rules',
  PLAYING = 'playing',
  COMPLETED = 'completed',
}

// Player outside room
export interface Player {
  uuid: string;
  room?: Room;
  socket: WS.Websocket;
  lastVariant?: string;
  streak: number;
}

// Player inside room
interface RoomPlayer {
  player: Player;
  color: Color;
  time: number;
  name: string; // for logging namespace
}

const PLAYER_TIME_MS = 3 * 60 * 1000;
// const PLAYER_TIME_MS = 15 * 1000;
const INCREMENT_MS = 5 * 1000;

export class Room {
  // public
  game: Game;

  p1: RoomPlayer;
  p2: RoomPlayer;

  // protected
  state: RoomState;
  lastMoveTime: number;
  timerInterval: any; // timer
  timerPaused: boolean;

  constructor(
    p1: Player,
    p2: Player,
    gc: typeof Game
  ) {
    this.p1 = {
      player: p1,
      color: randomChoice([Color.WHITE, Color.BLACK]),
      time: PLAYER_TIME_MS,
      name: uuidToName(p1.uuid),
    };
    this.p2 = {
      player: p2,
      color: getOpponent(this.p1.color),
      time: PLAYER_TIME_MS,
      name: uuidToName(p2.uuid),
    };
    if (this.p1.color === Color.WHITE) {
      this.p1.time += ROULETTE_SECONDS * 1000;
    } else {
      this.p2.time += ROULETTE_SECONDS * 1000;
    }
    this.setState(RoomState.PLAYING);
    this.game = new gc(true);
    this.game.onEvent(this.handleGameEvent);

    const player1 = this.p1.player;
    const player2 = this.p2.player;

    // Send init game messages
    Promise.all([
      sendMessage(player1.socket, {
        type: 'initGame',
        state: this.game.visibleState(this.game.state, this.p1.color),
        variantName: this.game.name,
        color: this.p1.color,
        player: {
          name: getName(player1.uuid),
          streak: player1.streak,
        },
        opponent: {
          name: getName(player2.uuid),
          streak: player2.streak,
        },
      } as InitGameMessage),
      sendMessage(player2.socket, {
        type: 'initGame',
        state: this.game.visibleState(this.game.state, this.p2.color),
        variantName: this.game.name,
        color: this.p2.color,
        player: {
          name: getName(player2.uuid),
          streak: player2.streak,
        },
        opponent: {
          name: getName(player1.uuid),
          streak: player1.streak,
        },
      } as InitGameMessage),
    ]).then(() => {
      this.game.onConnect();
      this.timerInterval = setInterval(() => {
        if (this.timerPaused) return;
        const me =
          this.game.state.whoseTurn === this.p1.color ? this.p1 : this.p2;
        const opponent = me === this.p1 ? this.p2 : this.p1;
        me.time -= 1000;
        if (me.time <= 0) {
          log.get(me.name).notice('ran out of time');
          this.wins(opponent.player.uuid);
        }
      }, 1000);
      this.timerPaused = false;
      this.sendTimers();
    });
  }

  setState(state: RoomState) {
    this.state = state;
  }

  handleResign(uuid: string) {
    if (this.state !== RoomState.PLAYING) return;

    return this.wins(uuid === this.p1.player.uuid ? this.p2.player.uuid : this.p1.player.uuid);
  }

  handleTurn(uuid: string, turnAttempt: Turn) {
    if (this.state !== RoomState.PLAYING) return;

    const game = this.game;
    const me = this.p1.player.uuid === uuid ? this.p1 : this.p2;
    const opponent = me === this.p1 ? this.p2 : this.p1;
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
          log.get(me.name).warn('no piece at ', srow, scol);
          return;
        }
        log.get(me.name).notice(
          '%s: (%s, %s) -> (%s, %s)',
          piece.name,
          srow,
          scol,
          drow,
          dcol
        );

        turn = game.move(me.color, piece, srow, scol, drow, dcol);
        break;
      case TurnType.CASTLE:
        turn = game.castle(me.color, turnAttempt.kingside);
        break;
      case TurnType.DROP:
        const {
          piece: droppedPiece,
        } = turnAttempt;
        turn = game.drop(me.color, droppedPiece, drow, dcol);
        break;
      case TurnType.PROMOTE:
        const {
          to,
          piece: promoter,
          start: {row: prow, col: pcol},
        } = turnAttempt;
        turn = game.promote(me.color, promoter, to, prow, pcol, drow, dcol);
        break;
      case TurnType.ACTIVATE:
        const apiece = game.state.getSquare(
          turnAttempt.end.row,
          turnAttempt.end.col
        )?.occupant;
        if (!apiece) return;
        turn = game.activate(
          me.color,
          apiece,
          turnAttempt.end.row,
          turnAttempt.end.col
        );
        break;
      default:
        throw new Error(`unimplemented turn type ${turnAttempt.type}`);
    }

    if (!turn) {
      log.get(me.name).warn('submitted an invalid move!');
      return;
    }
    turn = game.modifyTurn(turn);
    if (!turn) {
      log.get(me.name).error('submitted an invalid move!');
      return;
    }

    game.state = turn.after;
    game.turnHistory.push(turn);
    game.stateHistory.push(turn.after);

    me.time += INCREMENT_MS;
    // we should send the mover a `replaceState` and the opponent an
    // `appendState`
    const rm = {
      type: 'replaceState' as const,
      turn: {
        // mostly a no-op on turn, but useful in variants
        ...this.game.visibleTurn(turn, me.color),
        // state should be universal
        before: game.visibleState(turn.before, me.color),
        after: game.visibleState(turn.after, me.color),
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

    sendMessage(me.player.socket, rm);
    sendMessage(opponent.player.socket, am);
    this.sendTimers();
    // Pause timer because we're now handling cpuTurn
    this.timerPaused = true;

    if (this.checkIfOver()) return;

    // BUG: Don't let people move before cpuTurn
    this.modifyCpuTurn(game.cpuTurn());
    this.checkIfOver();
    this.timerPaused = false;
  }

  modifyCpuTurn(turn?: Turn) {
    if (!turn) return;

    const {game, p1, p2} = this;
    turn = game.modifyTurn(turn);
    if (!turn) return;

    game.state = turn.after;
    game.turnHistory.push(turn);
    game.stateHistory.push(turn.after);

    const am1 = {
      type: 'appendState' as const,
      turn: {
        ...game.visibleTurn(turn, p1.color),
        before: game.visibleState(turn.before, p1.color),
        after: game.visibleState(turn.after, p1.color),
      },
    };
    const am2 = {
      type: 'appendState' as const,
      turn: {
        ...game.visibleTurn(turn, p2.color),
        before: game.visibleState(turn.before, p2.color),
        after: game.visibleState(turn.after, p2.color),
      },
    };

    sendMessage(p1.player.socket, am1);
    sendMessage(p2.player.socket, am2);
  }

  reconnect(uuid: string, socket: WebSocket) {
    const me = this.p1.player.uuid === uuid ? this.p1 : this.p2;
    const opponent = this.p1.player.uuid === uuid ? this.p2 : this.p1;
    me.player.socket = socket;

    const rec = {
      type: 'reconnect' as const,
      state: this.game.visibleState(this.game.state, me.color),
      variantName: this.game.name,
      color: me.color,
      player: {
        name: getName(me.player.uuid),
        streak: me.player.streak,
      },
      opponent: {
        name: getName(opponent.player.uuid),
        streak: opponent.player.streak,
      },  
      turnHistory: this.game.turnHistory.map((turn) => ({
        ...this.game.visibleTurn(turn, me.color),
        before: this.game.visibleState(turn.before, me.color),
        after: this.game.visibleState(turn.after, me.color),
      })),
      stateHistory: this.game.stateHistory.map((state) =>
        this.game.visibleState(state, me.color)
      ),
    };
    sendMessage(socket, rec).then(() => {
      this.sendTimers();
      this.game.onConnect();
    });
  }

  checkIfOver(): boolean {
    const {game, p1: me, p2: opponent} = this;
    const playerWins = game.winCondition(me.color, game.state);
    const opponentWins = game.winCondition(opponent.color, game.state);
    if (playerWins) {
      if (opponentWins) {
        this.draws();
        return true;
      } else {
        this.wins(me.player.uuid);
        return true;
      }
    } else if (opponentWins) {
      this.wins(opponent.player.uuid);
      return true;
    }
    if (game.drawCondition(me.color, game.state)) {
      this.draws();
      return true;
    }
    return false;
  }

  getColor(uuid: string) {
    return this.p1.player.uuid === uuid ? this.p1.color : this.p2.color;
  }

  wins(uuid: string) {
    const me = this.p1.player.uuid === uuid ? this.p1 : this.p2;
    const opponent = me === this.p1 ? this.p2 : this.p1;

    const gom = {
      type: 'gameOver' as const,
      stateHistory: this.game.stateHistory,
      turnHistory: this.game.turnHistory,
    };

    // Set streak
    me.player.streak += 1;
    opponent.player.streak = 0;

    sendMessage(me.player.socket, {
      ...gom,
      result: GameResult.WIN,
      player: {
        name: getName(me.player.uuid),
        streak: me.player.streak,
      },
      opponent: {
        name: getName(opponent.player.uuid),
        streak: opponent.player.streak,
      },  
    });
    sendMessage(opponent.player.socket, {
      ...gom,
      result: GameResult.LOSS,
      player: {
        name: getName(opponent.player.uuid),
        streak: opponent.player.streak,
      },
      opponent: {
        name: getName(me.player.uuid),
        streak: me.player.streak,
      },
    });
    this.end();

    log.get(me.name).notice('won');
    log.get(opponent.name).notice('lost');
  }

  draws() {
    const gom = {
      type: 'gameOver' as const,
      stateHistory: this.game.stateHistory,
      turnHistory: this.game.turnHistory,
    };

    sendMessage(this.p1.player.socket, {
      ...gom,
      result: GameResult.DRAW,
      player: {
        name: getName(this.p1.player.uuid),
        streak: this.p1.player.streak,
      },
      opponent: {
        name: getName(this.p2.player.uuid),
        streak: this.p2.player.streak,
      },  
    });
    sendMessage(this.p2.player.socket, {
      ...gom,
      result: GameResult.DRAW,
      player: {
        name: getName(this.p2.player.uuid),
        streak: this.p2.player.streak,
      },
      opponent: {
        name: getName(this.p1.player.uuid),
        streak: this.p1.player.streak,
      },  
    });
    this.end();

    log.get(this.p1.name).notice('draw');
    log.get(this.p2.name).notice('draw');
  }

  sendTimers() {
    const timerMessage = {
      type: 'timer',
    };
    sendMessage(this.p1.player.socket, {
      ...timerMessage,
      player: this.p1.time,
      opponent: this.p2.time,
    } as TimerMessage);
    sendMessage(this.p2.player.socket, {
      ...timerMessage,
      player: this.p2.time,
      opponent: this.p1.time,
    } as TimerMessage);
  }

  end() {
    this.setState(RoomState.COMPLETED);
    clearInterval(this.timerInterval);

    this.sendTimers();
    delete this.p1.player.room;
    delete this.p2.player.room;
  }

  handleGameEvent = (event: GameEvent) => {
    const gem = {
      type: 'gameEvent' as const,
      content: event,
    };
    sendMessage(this.p1.player.socket, gem);
    sendMessage(this.p2.player.socket, gem);
  }
}

function getName(uuid?: string): string {
  return uuidToName(uuid ?? '');
}
