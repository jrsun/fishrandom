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
// initial.banks = new Map([
//   [Color.WHITE, new Map([[new Knight(Color.WHITE), 1]])],
//   [Color.BLACK, new Map([[new Knight(Color.BLACK), 1]])],
// ]);
initial.banks = {
  [Color.WHITE]: [new Knight(Color.WHITE)],
  [Color.BLACK]: [new Knight(Color.BLACK)],
};