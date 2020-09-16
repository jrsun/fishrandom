import {Game, GameResult} from '../game';
import {Knight, Pawn, AmazonRoyal, King} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, backRank} from '../state';
import Square from '../square';
import {Turn} from '../turn';

export class Monster extends Game {
  name = 'Monster';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }
  modifyTurn(turn: Turn): Turn {
    if (turn.piece.color === Color.WHITE) {
      const lastTurn = this.turnHistory[this.turnHistory.length - 1];
      if (!lastTurn || lastTurn.piece.color === Color.BLACK) {
        return {
          ...turn,
          after: turn.after.setTurn(Color.WHITE),
        };
      }
    }
    return turn;
  }
  drawCondition(color: Color, state: BoardState): GameResult|undefined {
    // K vs. K is a win for white
    if (state.pieces.length === 2) return;

    return super.drawCondition(color, state);
  }
}

function generateStartState(): BoardState {
  const piecePositions = {
    0: backRank(Color.BLACK),
    1: {},
    6: {},
    7: {
      4: new King(Color.WHITE),
    },
  };

  for (let col = 0; col < 8; col++) {
    piecePositions[1][col] = new Pawn(Color.BLACK);
  }
  for (let col = 2; col < 6; col++) {
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
