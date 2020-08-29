import {Piece} from '../chess/piece';
import {BoardState} from '../chess/state';
import Square from '../chess/square';
import zlib from 'zlib';
import {Turn} from '../chess/turn';
import {Color, Pair} from '../chess/const';
import WS from 'ws';
import {QueenPawn} from '../chess/variants/hiddenqueen';
import {Hopper} from '../chess/variants/grasshopper';
import {Obscurant} from '../chess/variants/dark';
import {Stealthbomber} from '../chess/variants';
import {BomberPawn} from '../chess/variants/stealthbomber';
import {KingPawn} from '../chess/variants/royalpawn';
import {Elephant} from '../chess/variants/pieceeater';
import {GameEvent} from '../chess/game';
import { Golem, Halfgolem } from '../chess/variants/golem';

export type Message =
  | TurnMessage
  | ReplaceMessage
  | AppendMessage
  | ResignMessage
  | ExitMessage
  | NewGameMessage
  | InitGameMessage
  | GameOverMessage
  | TimerMessage
  | ReconnectMessage
  | GameEventMessage
  | KickMessage
  | UndoMessage;

/*
 * Client-initiated
 */
export interface TurnMessage {
  type: 'turn';
  turn: Turn;
}

export interface ResignMessage {
  type: 'resign';
}

export interface NewGameMessage {
  type: 'newGame';
  password?: string;
}

export interface ExitMessage {
  type: 'exit';
}

/*
 * Server-initiated
 */
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

export enum GameResult {
  WIN = 'win',
  DRAW = 'draw',
  LOSS = 'loss',
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

// Could use evals here instead
export function replacer(k: string, o: Piece | BoardState | Square): object {
  if (o instanceof Obscurant) return Obscurant.freeze(o);
  if (o instanceof QueenPawn) return QueenPawn.freeze(o);
  if (o instanceof KingPawn) return KingPawn.freeze(o);
  if (o instanceof Elephant) return Elephant.freeze(o);
  if (o instanceof BomberPawn) return BomberPawn.freeze(o);
  if (o instanceof Golem) return Golem.freeze(o);
  if (o instanceof Halfgolem) return Halfgolem.freeze(o);
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
    if (v._class === 'Halfgolem') {
      return Halfgolem.thaw(v);
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

export function sendMessage(ws: WebSocket, m: Message, sync=false): Promise<void> {
  const input = JSON.stringify(m, replacer);
  if (sync) {
    const buffer = zlib.gzipSync(input);
    ws.send(buffer.toString('base64'));
    return Promise.resolve();
  } 
  return new Promise((resolve) => {
    zlib.gzip(input, (err, buffer) => {
      if (err) {
        console.error('Failed to compress and send message %s', input);
        return;
      }
      if (typeof window === 'undefined') {
        console.error(
          '%s: Sending message of type %s with size %s',
          new Date().toUTCString(),
          m.type,
          buffer.length
        );
      }
      ws.send(buffer.toString('base64'));

      resolve();
    });
  });
}

export function addMessageHandler(
  ws: WebSocket,
  handler: (message: Message) => void
) {
  ws.addEventListener('message', (e: MessageEvent) => {
    let msg: Message;
    try {
      const s = zlib.gunzipSync(Buffer.from(e.data, 'base64')).toString();
 
      msg = JSON.parse(s, reviver) as Message;
      console.log(msg);
      if (typeof window === 'undefined') {
        console.error(
          '%s: Received message of type %s',
          new Date().toUTCString(),
          msg.type
        );
      }
      handler(msg as Message);
    } catch (err) {
      console.warn("error parsing message", err, e.data);
    }
  });
}
