import {Game} from '../game';
import {BoardState, generate960, generate9602} from '../state';
import {Move} from '../turn';
import {Color} from '../const';
import Square from '../square';
import {randomChoice} from '../../common/utils';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen} from '../piece';

export class Chess960 extends Game {
  name = 'Chess960';
  constructor(isServer: boolean) {
    super(isServer, generate960());
  }
}

export class Chess921600 extends Game {
  name = 'Chess921600';
  constructor(isServer: boolean) {
    super(isServer, generate9602());
  }
}
