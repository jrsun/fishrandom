import {Piece} from '../chess/piece';
import BoardState from '../chess/state';
import Square from '../chess/square';
import {Move} from '../chess/move';
import {Color} from '../chess/const';
import {QueenPawn} from '../chess/variants/hiddenqueen';

// TODO: Set game type and start game.
export type Message =
  | MoveMessage
  | ReplaceMessage
  | AppendMessage
  | ReplaceAllMessage
  | InitGameMessage
  | GameOverMessage;

/*
 * Client-initiated
 */
export interface MoveMessage {
  type: 'move';
  move: Move;
}

export interface ResignMessage {
  type: 'resign';
}

/*
 * Server-initiated
 */
export interface ReplaceMessage {
  type: 'replaceState';
  state: BoardState;
  move: Move;
}

export interface AppendMessage {
  type: 'appendState';
  state: BoardState;
  move: Move;
}

export interface ReplaceAllMessage {
  type: 'replaceAll';
  stateHistory: BoardState[];
  moveHistory: Move[];
}

export interface InitGameMessage {
  type: 'initGame';
  state: BoardState;
  variantName: string;
  color: Color; // color for the receiving player
}

export enum GameResult {
  WIN = 'win',
  DRAW = 'draw',
  LOSS = 'loss',
}

export interface GameOverMessage {
  type: 'gameOver';
  stateHistory: BoardState[];
  moveHistory: Move[];
  result: GameResult;
}

export function replacer(k: string, o: Piece | BoardState | Square): object {
  if (o instanceof QueenPawn) return QueenPawn.freeze(o);
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
