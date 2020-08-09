import {Game} from '../game';
import {King, Knight, Rook, Bishop, Queen, Pawn} from '../piece';
import {Color} from '../const';
import {BoardState} from '../state';
import Square from '../square';

export class Horde extends Game {
  // TODO: pawns on 1st rank can move 2 squares
  name = 'Horde';

  constructor(isServer) {
    super(isServer, generateStartState());
  }
}

function generateStartState(): BoardState {
  const piecePositions = {
    0: {
      0: new Rook(Color.BLACK),
      1: new Knight(Color.BLACK),
      2: new Bishop(Color.BLACK),
      3: new Queen(Color.BLACK),
      4: new King(Color.BLACK),
      5: new Bishop(Color.BLACK),
      6: new Knight(Color.BLACK),
      7: new Rook(Color.BLACK),
    },
    1: {},
    3: {
      1: new Pawn(Color.WHITE),
      2: new Pawn(Color.WHITE),
      5: new Pawn(Color.WHITE),
      6: new Pawn(Color.WHITE),
    },
    4: {},
    5: {},
    6: {},
    7: {},
  };

  for (let col = 0; col < 8; col++) {
    piecePositions[1][col] = new Pawn(Color.BLACK);
    for (let row = 4; row < 8; row++) {
      piecePositions[row][col] = new Pawn(Color.WHITE);
    }
  }

  const squares: Square[][] = [];
  for (let i = 0; i < 8; i++) {
    const row: Square[] = [];
    for (let j = 0; j < 8; j++) {
      const square = new Square(i, j);
      row.push(square);
      if (piecePositions[i]?.[j]) {
        square.place(piecePositions[i][j]);
      }
    }
    squares.push(row);
  }
  return new BoardState(squares, Color.WHITE, {});
}
