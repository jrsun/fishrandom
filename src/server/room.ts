import {Game, GameEvent} from '../chess/game';
import {randomChoice} from '../utils';
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
  PlayerInfo,
  reviver,
} from '../common/message';
import WS from 'ws';
import log from 'log';
import {RoomSchema} from '../db/schema';
import {VARIANTS} from '../chess/variants';
import {BoardState} from '../chess/state';
import { saveRoom, savePlayer, deleteRoom } from '../db';

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
  username: string;
  roomId?: string;
  socket?: WebSocket;
  lastVariants: string[];
  streak: number;
  elo: number;
}

// Player inside room
interface RoomPlayer {
  player: Player;
  color: Color;
  time: number;
  name: string; // for logging namespace
}

const INCREMENT_MS = 5 * 1000;

const ELO_K = 100;

export class Room {
  // public
  id: string;
  game: Game;

  p1: RoomPlayer;
  p2: RoomPlayer;

  // protected
  state: RoomState;
  lastMoveTime: number;
  timerInterval: any; // timer
  timerPaused: boolean;
  drawRequestedBy: string | undefined; // uuid

  constructor(
    id: string,
    p1: Player,
    p2: Player,
    gc: typeof Game,
    p1Color = Color.WHITE,
    p1time = 3 * 60 * 1000,
    p2time = 3 * 60 * 1000,
    turnHistory?: Turn[],
    stateHistory?: BoardState[]
  ) {
    this.id = id;

    this.p1 = {
      player: p1,
      color: p1Color,
      time: p1time,
      name: p1.username,
    };
    this.p2 = {
      player: p2,
      color: getOpponent(p1Color),
      time: p2time,
      name: p2.username,
    };
    if (this.p1.color === Color.WHITE) {
      this.p1.time += ROULETTE_SECONDS * 1000;
    } else {
      this.p2.time += ROULETTE_SECONDS * 1000;
    }
    this.setState(RoomState.PLAYING);
    this.game = new gc(true);
    if (turnHistory) this.game.turnHistory = turnHistory;
    if (stateHistory) {
      this.game.stateHistory = stateHistory;
      this.game.state = stateHistory[
        stateHistory.length - 1
      ];
    }
    this.game.onEvent(this.handleGameEvent);
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
    saveRoom(this);
  }

  initGame() {
    // Send init game messages
    const {p1, p2} = this;
    Promise.all([
      sendMessage(p1.player.socket, {
        type: 'initGame',
        state: this.game.visibleState(this.game.state, this.p1.color),
        variantName: this.game.name,
        color: this.p1.color,
        player: toPlayerInfo(p1.player),
        opponent: toPlayerInfo(p2.player),
      }),
      sendMessage(p2.player.socket, {
        type: 'initGame',
        state: this.game.visibleState(this.game.state, this.p2.color),
        variantName: this.game.name,
        color: this.p2.color,
        player: toPlayerInfo(p2.player),
        opponent: toPlayerInfo(p1.player),
      }),
    ]).then(() => {
      this.game.onConnect();
      this.sendTimers();
    });
    log.get(this.p1.name).notice('playing variant', this.game.name);
    log.get(this.p2.name).notice('playing variant', this.game.name);
  }

  setState(state: RoomState) {
    this.state = state;
  }

  handleResign(uuid: string) {
    if (this.state !== RoomState.PLAYING) return;
    const {turnHistory} = this.game;
    if (
      !turnHistory.some(turn => turn.piece.color === Color.WHITE) ||
      !turnHistory.some(turn => turn.piece.color === Color.BLACK)
    ) {
      return this.aborts();
    }
    // TODO: fix this so it checks actual uuid equality
    return this.wins(
      uuid === this.p1.player.uuid ? this.p2.player.uuid : this.p1.player.uuid
    );
  }

  handleDraw(uuid: string) {
    if (this.state !== RoomState.PLAYING) return;
    const opponent = (uuid === this.p1.player.uuid ? this.p2.player : this.p1.player);
    
    if (this.drawRequestedBy === opponent.uuid) {
      return this.draws();
    }
    this.drawRequestedBy = uuid;
    sendMessage(opponent.socket, {type: 'draw'});
  }

  async handleTurn(uuid: string, turnAttempt: Turn) {
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
        log
          .get(me.name)
          .notice(
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
        const {
          start: {row: crow, col: ccol},
        } = turnAttempt;
        turn = game.castle(me.color, crow, ccol, turnAttempt.kingside);
        break;
      case TurnType.DROP:
        const {piece: droppedPiece} = turnAttempt;
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

    turn = game.execute(me.color, turn);
    if (!turn) {
      sendMessage(me.player.socket, {type: 'undo'});
      log.get(me.name).warn('submitted an invalid move, undoing!');
      return;
    }
    saveRoom(this);

    me.time += INCREMENT_MS;

    this.drawRequestedBy = undefined;
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

    await sendMessage(me.player.socket, rm);
    await sendMessage(opponent.player.socket, am);
    this.sendTimers();
    // Pause timer because we're now handling cpuTurn
    this.timerPaused = true;

    if (this.checkIfOver(me)) return;

    // BUG: Don't let people move before cpuTurn
    this.takeCpuTurn(me);
    this.timerPaused = false;
  }

  takeCpuTurn(justMovedPlayer: RoomPlayer) {
    const {game, p1, p2} = this;

    let turn = game.cpuTurn();
    if (!turn) return;
    turn = game.modifyTurn(turn);
    if (!turn) return;

    game.state = turn.after;
    game.turnHistory.push(turn);
    game.stateHistory.push(turn.after);
    saveRoom(this);

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
    this.checkIfOver(justMovedPlayer);
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
      player: toPlayerInfo(me.player),
      opponent: toPlayerInfo(opponent.player),
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

  checkIfOver(me: RoomPlayer): boolean {
    // player is who just moved
    const {game} = this;
    const opponent = me === this.p1 ? this.p2 : this.p1;
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
    // This move put the opponent into stalemate
    if (game.drawCondition(opponent.color, game.state)) {
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
    // Set ELO
    const ra = me.player.elo;
    const rb = opponent.player.elo;
    const ea = 1 / (1 + 10 ** ((rb - ra) / 400));
    const eb = 1 / (1 + 10 ** ((ra - rb) / 400));

    const ran = Math.ceil(ra + ELO_K * (1 - ea));
    const rbn = Math.ceil(rb + ELO_K * (0 - eb));
    me.player.elo = ran;
    opponent.player.elo = rbn;

    sendMessage(me.player.socket, {
      ...gom,
      result: GameResult.WIN,
      player: toPlayerInfo(me.player),
      opponent: toPlayerInfo(opponent.player),
    });
    sendMessage(opponent.player.socket, {
      ...gom,
      result: GameResult.LOSS,
      player: toPlayerInfo(opponent.player),
      opponent: toPlayerInfo(me.player),
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
      result: GameResult.DRAW,
    };

    const me = this.p1;
    const opponent = this.p2;

    const ra = me.player.elo;
    const rb = opponent.player.elo;
    const ea = 1 / ((1 + 10) ^ ((rb - ra) / 400));
    const eb = 1 / ((1 + 10) ^ ((ra - rb) / 400));

    const ran = Math.ceil(ra + ELO_K * (0.5 - ea));
    const rbn = Math.ceil(rb + ELO_K * (0.5 - eb));
    me.player.elo = ran;
    opponent.player.elo = rbn;

    sendMessage(this.p1.player.socket, {
      ...gom,
      player: toPlayerInfo(this.p1.player),
      opponent: toPlayerInfo(this.p2.player),
    });
    sendMessage(this.p2.player.socket, {
      ...gom,
      player: toPlayerInfo(this.p2.player),
      opponent: toPlayerInfo(this.p1.player),
    });
    this.end();

    log.get(this.p1.name).notice('draw');
    log.get(this.p2.name).notice('draw');
  }

  aborts() {
    const gom = {
      type: 'gameOver' as const,
      stateHistory: this.game.stateHistory,
      turnHistory: this.game.turnHistory,
      result: GameResult.ABORTED,
    };
    sendMessage(this.p1.player.socket, {
      ...gom,
      player: toPlayerInfo(this.p1.player),
      opponent: toPlayerInfo(this.p2.player),
    });
    sendMessage(this.p2.player.socket, {
      ...gom,
      player: toPlayerInfo(this.p2.player),
      opponent: toPlayerInfo(this.p1.player),
    });
    this.end();

    log.get(this.p1.name).notice('aborted');
    log.get(this.p2.name).notice('aborted');
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
    delete this.p1.player.roomId;
    delete this.p2.player.roomId;
    savePlayer(this.p1.player);
    savePlayer(this.p2.player);
    deleteRoom(this.id);
  }

  handleGameEvent = (event: GameEvent) => {
    const gem = {
      type: 'gameEvent' as const,
      content: event,
    };
    sendMessage(this.p1.player.socket, gem);
    sendMessage(this.p2.player.socket, gem);
  };

  static freeze(r: Room): RoomSchema {
    const {id, p1, p2, game} = r;
    return {
      id,
      players: {
        [p1.player.uuid]: {
          time: p1.time,
          name: p1.name,
          color: p1.color,
        },
        [p2.player.uuid]: {
          time: p2.time,
          name: p2.name,
          color: p2.color,
        },
      },
      turnHistory: game.turnHistory,
      stateHistory: game.stateHistory,
      variant: game.name,
    };
  }

  static thaw(p1: Player, p2: Player, rs: RoomSchema): Room {
    const {id, variant, turnHistory, stateHistory} = rs;
    const p1info = rs.players[p1.uuid];
    const p2info = rs.players[p2.uuid];
    if (!p1info || !p2info) {
      console.error('uuid didnt resolve', p1, p2, p1info, p2info);
    }

    return new Room(
      id,
      p1,
      p2,
      VARIANTS[variant],
      p1info.color,
      p1info.time,
      p2info.time,
      turnHistory,
      stateHistory
    );
  }
}

const toPlayerInfo = (p: Player): PlayerInfo => {
  const {username, streak, elo} = p;
  return {
    name: username,
    streak,
    elo,
  };
};