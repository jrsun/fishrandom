import {Game} from '../game';
import {BoardState, generateStartState} from '../state';
import {Move} from '../turn';
import {Color} from '../const';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen} from '../piece';

export class Pocketknight extends Game {
  name = 'Pocketknight';
  constructor(isServer: boolean) {
    super(
      isServer,
      new BoardState(generateStartState().squares, Color.WHITE, {
        [Color.WHITE]: [new Knight(Color.WHITE)],
        [Color.BLACK]: [new Knight(Color.BLACK)],
      })
    );
  }
  canDrop = true;
}
