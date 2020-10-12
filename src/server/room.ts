import {Game, GameEvent, GameResult, GameResultType} from '../chess/game';
import {randomChoice} from '../common/utils';
import {Move, Turn, TurnType, toFEN} from '../chess/turn';
import {Color, getOpponent, ROULETTE_SECONDS, DISCONNECT_TIMEOUT_SECONDS, FIRST_MOVE_ABORT_SECONDS, RoomAction} from '../chess/const';
import {
  AppendMessage,
  replacer,
  ReplaceMessage,
  GameOverMessage,
  sendMessage,
  InitGameMessage,
  TimerMessage,
  ReconnectMessage,
  PlayerInfo,
  reviver,
  Message,
  PhaseEnum,
} from '../common/message';
import log from 'log';
import {RoomSchema} from '../db/schema';
import {VARIANTS} from '../chess/variants';
import {BoardState} from '../chess/state';
import {saveRoom, savePlayer, deleteRoom, updateScore, getRevRank} from '../db';
import { RoomPlayer, Player, toPlayerInfo } from './player';
import { PUBLIC_PLAY_SECONDS } from './const';
import { Phase, PlayingPhase, PHASE_MAP } from './phase';

export class Room {
  // public
  id: string;
  game: Game;

  p1: RoomPlayer;
  p2: RoomPlayer;
  ranked: boolean;
  phase: PhaseEnum;

  // protected
  phaseHandler: Phase;

  constructor(
    id: string,
    p1: Player,
    p2: Player,
    gc: typeof Game,
    ranked: boolean,
    p1Color = Color.WHITE,
    p1time = PUBLIC_PLAY_SECONDS * 1000,
    p2time = PUBLIC_PLAY_SECONDS * 1000,
    turnHistory?: Turn[],
    stateHistory?: BoardState[],
    phase = PhaseEnum.RULES,
  ) {
    this.id = id;

    this.p1 = {
      player: p1,
      color: p1Color,
      time: p1time,
      name: p1.username,
      allowedActions: new Set(),
    };
    this.p2 = {
      player: p2,
      color: getOpponent(p1Color),
      time: p2time,
      name: p2.username,
      allowedActions: new Set(),
    };
    this.ranked = ranked;

    // Disconnected players on hot reload should set timer
    if (!this.p1.player.connected) {
      this.disconnect(this.p1.player);
    }
    if (!this.p2.player.connected) {
      this.disconnect(this.p2.player);
    }
    this.game = new gc(true);
    if (turnHistory) this.game.turnHistory = turnHistory;
    if (stateHistory) {
      this.game.stateHistory = stateHistory;
      this.game.state = stateHistory[stateHistory.length - 1];
    }
    this.setPhase(phase);
    this.game.onEvent(this.handleGameEvent);
    saveRoom(this);
  }

  handleMessage = (uuid: string, m: Message) => {
    // Allow fall-through to phase handler
    switch (m.type) {
      case 'getAllowed':
        this.handleGetAllowed(uuid);
      default:
        this.phaseHandler.handleMessage(uuid, m);
    }
  }

  initGame() {
    // Send init game messages
    const {p1, p2} = this;
    sendMessage(p1.player.socket, {
      type: 'initGame',
      state: this.game.visibleState(this.game.state, this.p1.color),
      variantName: this.game.name,
      color: this.p1.color,
      player: toPlayerInfo(p1.player),
      opponent: toPlayerInfo(p2.player),
    });
    sendMessage(p2.player.socket, {
      type: 'initGame',
      state: this.game.visibleState(this.game.state, this.p2.color),
      variantName: this.game.name,
      color: this.p2.color,
      player: toPlayerInfo(p2.player),
      opponent: toPlayerInfo(p1.player),
    });
    setTimeout(() => {
      this.game.onConnect();
      this.sendTimers();
      this.resetAllowedActions(this.p1, false);
      this.resetAllowedActions(this.p2, false);
      this.sendRanks();
      this.sendPhase(p1.player.uuid);
      this.sendPhase(p2.player.uuid);  
    }, 100);

    log.get(this.p1.name).notice('playing variant', this.game.name);
    log.get(this.p2.name).notice('playing variant', this.game.name);
  }

  /** Room action handlers */
  handleGetAllowed(uuid: string) {
    const rp = this.uuidToRoomPlayer(uuid);
    if (!rp) {
      log.warn('no such player in room', uuid);
      return;
    }
    sendMessage(rp.player.socket, {
      type: 'allowedActions',
      actions: Array.from(rp.allowedActions),
    });
  }

  reconnect(uuid: string, socket: SocketIO.Socket) {
    const me = this.uuidToRoomPlayer(uuid);
    const opponent = me === this.p1 ? this.p2 : this.p1;
    if (!me || !opponent) {
      log.warn('in reconnect, someone used wrong uuid', uuid, this.p1.player.uuid);
      return;
    }
    
    me.player.socket = socket;
    me.player.connected = true;
    savePlayer(me.player);

    if (me.disconnectTimeout) {
      clearTimeout(me.disconnectTimeout);
    }

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
    sendMessage(socket, rec);
    
    // HACK: Client is sometimes not ready to receive these
    setTimeout( () => {
      this.sendPhase(me.player.uuid);
      this.sendTimers();
      this.resetAllowedActions(me, true);
      this.sendRanks();
      this.game.onConnect();
  
      // Opponent needs to know player has reconnected
      sendMessage(opponent.player.socket, {
        type: 'playerInfo',
        player: toPlayerInfo(opponent.player),
        opponent: toPlayerInfo(me.player),
      });
    }, 500);
  }

  disconnect(player: Player) {
    const me = this.uuidToRoomPlayer(player.uuid);
    const opponent = me === this.p1 ? this.p2 : this.p1;
    if (!me || !opponent) {
      log.warn('in disconnect, someone used wrong uuid', player.uuid, this.p1, this.p2);
      return;
    }
    me.player.connected = false;
    savePlayer(me.player);
    sendMessage(opponent.player.socket, {
      type: 'playerInfo',
      player: toPlayerInfo(opponent.player),
      opponent: toPlayerInfo(me.player),
    });
    if (this.ranked) {
      // Give the other player the win after X seconds
      me.disconnectTimeout = setTimeout(() => {
        // Handle as if resigned
        this.setPhase(PhaseEnum.PLAYING);
        this.phaseHandler.handleMessage(player.uuid, {
          type: 'roomAction',
          action: RoomAction.RESIGN,
        });
      }, DISCONNECT_TIMEOUT_SECONDS * 1000);
    }
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

  /** Allowed actions */

  resetAllowedActions(rp: RoomPlayer, force: boolean) {
    const listActions = Array.from(rp.allowedActions);
    if (
      listActions.length !== DEFAULT_ALLOWED_ACTIONS.length ||
      !listActions.every(action => DEFAULT_ALLOWED_ACTIONS.includes(action)) ||
      force
    ) {
      rp.allowedActions = new Set(DEFAULT_ALLOWED_ACTIONS);
      sendMessage(rp.player.socket, {
        type: 'allowedActions',
        actions: Array.from(rp.allowedActions),
      })
    }
  }

  /** Send ranks */
  sendRanks() {
    getRevRank(this.p1.player.uuid).then(rank => {
      if (rank === undefined) return;
      sendMessage(this.p1.player.socket, {type: 'rank', rank});
    });
    getRevRank(this.p2.player.uuid).then(rank => {
      if (rank === undefined) return;
      sendMessage(this.p2.player.socket, {type: 'rank', rank});
    });
  }

  sendPhase(uuid: string) {
    const {phase} = this;
    const player = this.uuidToRoomPlayer(uuid);
    sendMessage(player?.player.socket, {type: 'phaseChange', phase});
  }

  handleGameEvent = (event: GameEvent) => {
    const gem = {
      type: 'gameEvent' as const,
      content: event,
    };
    sendMessage(this.p1.player.socket, gem);
    sendMessage(this.p2.player.socket, gem);
  };

  uuidToRoomPlayer = (uuid: string): RoomPlayer|undefined => {
    if (this.p1.player.uuid === uuid) {
      return this.p1;
    } else if (this.p2.player.uuid === uuid) {
      return this.p2;
    }
    return;
  }

  // Phase transitions
  setPhase = (phase: PhaseEnum) => {
    const Handler = PHASE_MAP.get(phase);
    if (!Handler) {
      log.warn('unknown phase', phase);
      return;
    }
    this.phase = phase;
    this.phaseHandler = new Handler(this);

    const m = {
      type: 'phaseChange' as const,
      phase,
    }
    sendMessage(this.p1.player.socket, m);
    sendMessage(this.p2.player.socket, m);
    saveRoom(this);
  }

  static freeze(r: Room): RoomSchema {
    const {id, p1, p2, ranked, game, phase} = r;
    return {
      id,
      ranked,
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
      turnHistory: game?.turnHistory,
      stateHistory: game?.stateHistory,
      variant: game?.name,
      phase,
    };
  }

  static thaw(p1: Player, p2: Player, rs: RoomSchema): Room {
    const {id, variant, turnHistory, stateHistory, phase} = rs;
    const p1info = rs.players[p1.uuid];
    const p2info = rs.players[p2.uuid];
    if (!p1info || !p2info) {
      log.error('uuid didnt resolve', p1, p2, p1info, p2info);
    }

    return new Room(
      id,
      p1,
      p2,
      VARIANTS[variant],
      rs.ranked,
      p1info.color,
      p1info.time,
      p2info.time,
      turnHistory,
      stateHistory,
      phase,
    );
  }
}

const DEFAULT_ALLOWED_ACTIONS = [RoomAction.OFFER_DRAW, RoomAction.RESIGN];

