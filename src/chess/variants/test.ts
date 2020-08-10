import {Game} from '../game';
import {BoardState, generateStartState} from '../state';
import {Move} from '../move';
import {Color} from '../const';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen} from '../piece';

export class Test extends Game {
  name = 'Test';
  constructor(isServer: boolean) {
    super(
      isServer,
      new BoardState(generateStartState().squares, Color.WHITE, {
        [Color.WHITE]: [
          new Pawn(Color.WHITE),
          new Knight(Color.WHITE),
          new Rook(Color.WHITE),
          new Bishop(Color.WHITE),
          new Queen(Color.WHITE),
          new King(Color.WHITE),
        ],
        [Color.BLACK]: [
          new Pawn(Color.BLACK),
          new Knight(Color.BLACK),
          new Rook(Color.BLACK),
          new Bishop(Color.BLACK),
          new Queen(Color.BLACK),
          new King(Color.BLACK),
        ],
      })
    );
  }
  canDrop = true;
}
