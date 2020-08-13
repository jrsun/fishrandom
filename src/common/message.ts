import {Piece} from '../chess/piece';
import {BoardState} from '../chess/state';
import Square from '../chess/square';
import zlib from 'zlib';
import {Turn} from '../chess/move';
import {Color} from '../chess/const';
import WS from 'ws';
import {QueenPawn} from '../chess/variants/hiddenqueen';
import {Hopper} from '../chess/variants/grasshopper';
import {Obscurant} from '../chess/variants/dark';
import {Secretbomber} from '../chess/variants';
import {BomberPawn} from '../chess/variants/secretbomber';

// TODO: Set game type and start game.
export type Message =
  | TurnMessage
  | ReplaceMessage
  | AppendMessage
  | ResignMessage
  | NewGameMessage
  | InitGameMessage
  | GameOverMessage
  | TimerMessage
  | ReconnectMessage;

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

export interface InitGameMessage {
  type: 'initGame';
  state: BoardState;
  variantName: string;
  color: Color; // color for the receiving player
  player: string; // player name
  opponent: string; // opponent name
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
}

export interface ReconnectMessage {
  type: 'reconnect',
  state: BoardState;
  stateHistory: BoardState[];
  turnHistory: Turn[];
  variantName: string;
  color: Color;
  player: string;
  opponent: string;
}

// Could use evals here instead
export function replacer(k: string, o: Piece | BoardState | Square): object {
  if (o instanceof Obscurant) return Obscurant.freeze(o);
  if (o instanceof QueenPawn) return QueenPawn.freeze(o);
  if (o instanceof BomberPawn) return BomberPawn.freeze(o);
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
    if (v._class === 'Obscurant') {
      return Obscurant.thaw(v);
    }
    if (v._class === 'BomberPawn') {
      return BomberPawn.thaw(v);
    }
    if (v._class === 'Hopper') {
      return Hopper.thaw(v);
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

export function log(m: string, type: string, sent: boolean) {
  console.log(
    '%s message of type %s with size %s',
    sent ? 'Sent' : 'Received',
    type,
    m.length
  );
}

export function sendMessage(ws: WS.WebSocket, m: Message) {
  const input = JSON.stringify(m, replacer);
  // if (process.env.NODE_ENV === 'development') {
  //   ws.send(input);
  //   return;
  // }
  zlib.gzip(input, (err, buffer) => {
    if (err) {
      console.log('Failed to compress and send message %s', input);
      return;
    }
    console.log(
      'Sending message of type %s with size %s',
      m.type,
      buffer.length
    );
    ws.send(buffer.toString('base64'));
  });
}

export function addMessageHandler(
  ws: WebSocket,
  handler: (message: Message) => void
) {
  ws.addEventListener('message', async (e: MessageEvent) => {
    let msg: Message;
    // if (process.env.NODE_ENV === 'development') {
    //   msg = JSON.parse(e.data, reviver) as Message;
    // } else {
    const s = zlib.gunzipSync(Buffer.from(e.data, 'base64')).toString();
    msg = JSON.parse(s, reviver) as Message;
    // }
    console.log('Received message of type %s', msg.type);
    handler(msg as Message);
  });
}
