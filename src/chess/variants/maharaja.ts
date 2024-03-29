import {Game} from '../game';
import {Knight, Pawn, AmazonRoyal} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, backRank} from '../state';
import Square from '../square';

export class Maharaja extends Game {
  name = 'Maharaja';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }
}

function generateStartState(): BoardState {
  const piecePositions = {
    0: backRank(Color.BLACK),
    1: {},
    6: {},
    7: {
      4: new AmazonRoyal(Color.WHITE),
    },
  };

  for (let col = 0; col < 8; col++) {
    piecePositions[1][col] = new Pawn(Color.BLACK);
    piecePositions[6][col] = new Pawn(Color.WHITE);
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
