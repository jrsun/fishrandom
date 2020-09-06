import {Game} from '../game';
import {BoardState, generate960, generate9602, squaresFromPos} from '../state';
import {Move} from '../turn';
import {Color} from '../const';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen} from '../piece';

export class Instagram extends Game {
  name = 'Instagram';
  constructor(isServer: boolean) {
    super(isServer, generateInitial());
  }
}

export function generateInitial(): BoardState {
  const piecePositions = {
    0: {},
    1: {},
    2: {},
    5: {},
    6: {},
    7: {},
  };

  piecePositions[0] = [
    Queen,
    Queen,
    King,
    Knight,
    Rook,
    Bishop,
    Bishop,
    Pawn,
  ].map((p) => new p(Color.BLACK));
  for (let col = 0; col < 8; col++) {
    piecePositions[1][col] = new Pawn(Color.BLACK);
    piecePositions[6][col] = new Pawn(Color.WHITE);
  }
  piecePositions[1][3] = new Rook(Color.BLACK);
  piecePositions[2][0] = new Pawn(Color.BLACK);

  piecePositions[5][5] = new Queen(Color.WHITE);
  piecePositions[7] = [
    King,
    Queen,
    Bishop,
    Bishop,
    Rook,
    Rook,
    Knight,
    Knight,
  ].map((p) => new p(Color.WHITE));

  return new BoardState(squaresFromPos(piecePositions), Color.WHITE, {});
}
