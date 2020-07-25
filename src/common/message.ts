import {Piece} from '../chess/piece';
import BoardState from '../chess/state';
import Square from '../chess/square';
import {Move} from '../chess/move';

export interface Message {
  type: 'move'; // or others
  data: Move; // or others
}

// export interface MoveMessage {
//   srow: number;
//   scol: number;
//   drow: number;
//   dcol: number;
// }

export function replacer(k: string, o: Piece | BoardState | Square): object {
  if (o instanceof Piece) return Piece.freeze(o);
  if (o instanceof BoardState) return BoardState.freeze(o);
  if (o instanceof Square) return Square.freeze(o);
  return o;
}

export function reviver(k: string, v: any): Piece | BoardState | Square {
  if (v instanceof Object) {
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
