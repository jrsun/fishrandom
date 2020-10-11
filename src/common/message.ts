import {Piece} from '../chess/piece';
import {BoardState} from '../chess/state';
import Square from '../chess/square';
import zlib from 'zlib';
import {Turn} from '../chess/turn';
import {Color, RoomAction} from '../chess/const';
import WS from 'ws';
import {QueenPawn} from '../chess/variants/hiddenqueen';
import {Hopper} from '../chess/variants/grasshopper';
import {Obscurant} from '../chess/variants/dark';
import {Stealthbomber} from '../chess/variants';
import {BomberPawn} from '../chess/variants/stealthbomber';
import {KingPawn} from '../chess/variants/royalpawn';
import {Elephant} from '../chess/variants/pieceeater';
import {GameEvent, GameResult} from '../chess/game';
import {Golem, Halfgolem} from '../chess/variants/golem';
import { Wolf } from '../chess/variants/werewolf';
import { Nightrider } from '../chess/variants/knightrider';

export type Message =
  | TurnMessage
  | ReplaceMessage
  | AppendMessage
  | RoomActionMessage
  | GetAllowedMessage
  | CancelSeekMessage
  | NewGameMessage
  | InitGameMessage
  | GameOverMessage
  | TimerMessage
  | ReconnectMessage
  | GameEventMessage
  | KickMessage
  | UndoMessage
  | PingMessage
  | PlayerInfoMessage
  | AllowedActionsMessage
  | RankMessage;

/*
 * Client-initiated
 */
export interface TurnMessage {
  type: 'turn';
  turn: Turn;
}

export interface NewGameMessage {
  type: 'newGame';
  password?: string;
}

export interface RoomActionMessage {
  type: 'roomAction';
  action: RoomAction; // draw, resign, etc
}

export interface GetAllowedMessage {
  type: 'getAllowed';
}

export interface CancelSeekMessage {
  type: 'cancelSeek';
}

/*
 * Server-initiated
 */
export interface PingMessage {
  type: 'ping';
  scores: {
    name: string;
    score: number;
  }[];
  p: number;
}
export interface ReplaceMessage {
  type: 'replaceState';
  turn: Turn;
}

export interface AppendMessage {
  type: 'appendState';
  turn: Turn;
}

export interface PlayerInfo {
  name: string;
  streak: number; // not used
  elo: number;
  connected: boolean;
}

export interface InitGameMessage {
  type: 'initGame';
  state: BoardState;
  variantName: string;
  color: Color; // color for the receiving player
  player: PlayerInfo; // player name
  opponent: PlayerInfo; // opponent name
}

export interface ReconnectMessage {
  type: 'reconnect';
  state: BoardState;
  stateHistory: BoardState[];
  turnHistory: Turn[];
  variantName: string;
  color: Color;
  player: PlayerInfo;
  opponent: PlayerInfo;
}

export interface TimerMessage {
  type: 'timer';
  player: number;
  opponent: number;
}

export interface GameOverMessage {
  type: 'gameOver';
  stateHistory: BoardState[];
  turnHistory: Turn[];
  result: GameResult;

  player: PlayerInfo;
  opponent: PlayerInfo;
}

export interface GameEventMessage {
  type: 'gameEvent';
  content: GameEvent;
}

export interface KickMessage {
  type: 'kick';
}

export interface UndoMessage {
  type: 'undo';
}

export interface RankMessage {
  type: 'rank';
  rank: number;
}

export interface PlayerInfoMessage {
  type: 'playerInfo';
  player: PlayerInfo;
  opponent: PlayerInfo;
}

export interface AllowedActionsMessage {
  type: 'allowedActions';
  actions: RoomAction[];
}

// Could use evals here instead
export function replacer(k: string, o: Piece | BoardState | Square): object {
  if (o instanceof Obscurant) return Obscurant.freeze(o);
  if (o instanceof QueenPawn) return QueenPawn.freeze(o);
  if (o instanceof KingPawn) return KingPawn.freeze(o);
  if (o instanceof Elephant) return Elephant.freeze(o);
  if (o instanceof BomberPawn) return BomberPawn.freeze(o);
  if (o instanceof Golem) return Golem.freeze(o);
  if (o instanceof Halfgolem) return Halfgolem.freeze(o);
  if (o instanceof Nightrider) return Nightrider.freeze(o);
  if (o instanceof Wolf) return Wolf.freeze(o);
  if (o instanceof Hopper) return Hopper.freeze(o);
  if (o instanceof Piece) return Piece.freeze(o);
  if (o instanceof BoardState) return BoardState.freeze(o);
  if (o instanceof Square) return Square.freeze(o);
  return o;
}

export function reviver(k: string, v: any): Piece | BoardState | Square {
  if (v instanceof Object) {
    if (v._class === 'QueenPawn') {
      return QueenPawn.thaw(v);
    }
    if (v._class === 'KingPawn') {
      return KingPawn.thaw(v);
    }
    if (v._class === 'Elephant') {
      return Elephant.thaw(v);
    }
    if (v._class === 'Obscurant') {
      return Obscurant.thaw(v);
    }
    if (v._class === 'BomberPawn') {
      return BomberPawn.thaw(v);
    }
    if (v._class === 'Hopper') {
      return Hopper.thaw(v);
    }
    if (v._class === 'Golem') {
      return Golem.thaw(v);
    }
    if (v._class === 'Wolf') {
      return Wolf.thaw(v);
    }
    if (v._class === 'Halfgolem') {
      return Halfgolem.thaw(v);
    }
    if (v._class === 'Nightrider') {
      return Nightrider.thaw(v);
    }
    if (v._class === 'Piece') {
      return Piece.thaw(v);
    }
    if (v._class === 'BoardState') {
      return BoardState.thaw(v);
    }
    if (v._class === 'Square') {
      return Square.thaw(v);
    }
  }
  // default to returning the value unaltered
  return v;
}

export function broadcast(sockets: SocketIO.Namespace, m: Message) {
  sockets.emit('message', JSON.stringify(m, replacer));
}

export function sendMessage(
  socket: SocketIO.Socket | undefined,
  m: Message,
) {
  if (!socket) {
    console.error('tried to send message but no socket');
    return;
  }

  socket.emit('message', JSON.stringify(m, replacer));
}

export const addMessageHandler = (() => {
  const handlers: {[name: string]: ((data: any) => void)} = {};

  return (
    socket: SocketIO.Socket,
    name: string,
    handler: (message: Message) => void
  ) => {
    if (name in handlers) {
      socket.off('message', handlers[name]);
    }
    const fn = (data: any) => {
      let parsed;
      try {
        parsed = JSON.parse(data, reviver) as Message;
      } catch (err) {
        console.warn('error parsing message', err, data);
      }
      handler(parsed);
    };
    handlers[name] = fn;
    socket.on('message', fn);
  };
})();

