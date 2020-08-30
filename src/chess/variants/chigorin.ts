import {Game} from '../game';
import {
  RoyalKnight,
  Mann,
  Rook,
  Bishop,
  Queen,
  Pawn,
  Piece,
  Knight,
  Chancellor,
} from '../piece';
import {Color} from '../const';
import {BoardState, squaresFromPos, generateStartState} from '../state';
import Square from '../square';

export class Chigorin extends Game {
  name = 'Chigorin';
  constructor(isServer) {
    super(isServer, genInitial());
  }

  promotesTo(piece: Piece): Piece[] {
    if (piece.color === Color.WHITE) {
      return [Rook, Knight, Chancellor].map(t => new t(piece.color));
    } else {
      return [Rook, Bishop, Queen].map(t => new t(piece.color));
    }
  }
}

function genInitial(): BoardState {
  const state = generateStartState();
  state.place(new Bishop(Color.BLACK), 0, 1);
  state.place(new Bishop(Color.BLACK), 0, 6);
  state.place(new Knight(Color.WHITE), 7, 2);
  state.place(new Knight(Color.WHITE), 7, 5);
  state.place(new Chancellor(Color.WHITE), 7, 3);

  return state;
}
