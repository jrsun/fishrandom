import {Game} from '../game';
import {RoyalKnight, Mann, Rook, Bishop, Queen, Pawn, Piece} from '../piece';
import {Color} from '../const';
import {BoardState, squaresFromPos} from '../state';
import Square from '../square';

export class Knightmate extends Game {
  // TODO: Implement castling
  name = 'Knightmate';
  castler = RoyalKnight;
  constructor(isServer) {
    super(isServer, generateStartState());
  }

  get promotesTo(): typeof Piece[] {
    return [Queen, Rook, Bishop, Mann];
  }
}

function generateStartState(): BoardState {
  const piecePositions = {
    0: {
      0: new Rook(Color.BLACK),
      1: new Mann(Color.BLACK),
      2: new Bishop(Color.BLACK),
      3: new Queen(Color.BLACK),
      4: new RoyalKnight(Color.BLACK),
      5: new Bishop(Color.BLACK),
      6: new Mann(Color.BLACK),
      7: new Rook(Color.BLACK),
    },
    1: {},
    6: {},
    7: {
      0: new Rook(Color.WHITE),
      1: new Mann(Color.WHITE),
      2: new Bishop(Color.WHITE),
      3: new Queen(Color.WHITE),
      4: new RoyalKnight(Color.WHITE),
      5: new Bishop(Color.WHITE),
      6: new Mann(Color.WHITE),
      7: new Rook(Color.WHITE),
    },
  };

  for (let col = 0; col < 8; col++) {
    piecePositions[1][col] = new Pawn(Color.BLACK);
    piecePositions[6][col] = new Pawn(Color.WHITE);
  }

  const squares = squaresFromPos(piecePositions);
  return new BoardState(squares, Color.WHITE, {});
}
