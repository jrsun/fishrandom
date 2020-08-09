import {Game} from '../game';
import {BoardState, generateStartState} from '../state';
import {Move} from '../move';
import {Color} from '../const';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen} from '../piece';

export class Pocketknight extends Game {
  name = 'Pocketknight';
  constructor(isServer: boolean) {
    super(isServer, initial);
  }
  canDrop = true;
}

const initial = generateStartState();
initial.banks = {
  [Color.WHITE]: {[Knight.name]: 1},
  [Color.BLACK]: {[Knight.name]: 1},
};