import {Game} from '../game';
import {
  RoyalKnight,
  Mann,
  Rook,
  Bishop,
  Queen,
  Pawn,
  Piece,
  Rook4,
  Amazon,
  Knight,
} from '../piece';
import {Color} from '../const';
import {BoardState, squaresFromPos, generateStartState} from '../state';
import Square from '../square';
import {Royalpawn} from './royalpawn';

export class Amazonarmy extends Game {
  name = 'Amazonarmy';
  constructor(isServer) {
    super(isServer, genInitial());
  }
}

function genInitial(): BoardState {
  const state = generateStartState();
  state.place(new Rook4(Color.WHITE), 7, 0);
  state.place(new Rook4(Color.WHITE), 7, 7);
  state.place(new Amazon(Color.WHITE), 7, 3);

  return state;
}
