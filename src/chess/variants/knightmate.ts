import {Game} from '../game';
import {RoyalKnight, Mann, Rook, Bishop, Queen, Pawn, Piece} from '../piece';
import {Color} from '../const';
import {BoardState, squaresFromPos, generateStartState} from '../state';
import Square from '../square';
import {Royalpawn} from './royalpawn';

export class Knightmate extends Game {
  // TODO: Implement castling
  name = 'Knightmate';
  castler = RoyalKnight;
  constructor(isServer) {
    super(isServer, genInitial());
  }

  promotesTo(): typeof Piece[] {
    return [Queen, Rook, Bishop, Mann];
  }
}

function genInitial(): BoardState {
  const state = generateStartState();
  state.place(new Mann(Color.BLACK), 0, 1);
  state.place(new Mann(Color.BLACK), 0, 6);
  state.place(new Mann(Color.WHITE), 7, 1);
  state.place(new Mann(Color.WHITE), 7, 6);
  state.place(new RoyalKnight(Color.BLACK), 0, 4);
  state.place(new RoyalKnight(Color.WHITE), 7, 4);

  return state;
}
