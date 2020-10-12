import {Game} from '../game';
import {generateStartState, BoardState} from '../state';
import {Move} from '../turn';
import {Color} from '../const';
import Square from '../square';
import {randomChoice} from '../../common/utils';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen} from '../piece';

export class Gaychess extends Game {
  name = 'Gaychess';
  constructor(isServer: boolean) {
    super(isServer, generateInitial());
  }
}

export function generateInitial(): BoardState {
  return generateStartState()
    .place(new King(Color.BLACK), 0, 3)
    .place(new King(Color.WHITE), 7, 3);
}
