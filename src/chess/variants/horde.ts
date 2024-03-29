import {Game, GameResult, GameResultType} from '../game';
import {King, Knight, Rook, Bishop, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, squaresFromPos, backRank} from '../state';

export class Horde extends Game {
  // TODO: pawns on 1st rank can move 2 squares
  name = 'Horde';
  pawnHomeRanks = [0, 1];

  constructor(isServer) {
    super(isServer, generateStartState());
  }
  winCondition(color: Color, state: BoardState): GameResult|undefined {
    const opponent = getOpponent(color);
    if (color === Color.WHITE) {
      return super.winCondition(color, state);
    }
    // Black wins by capturing all the pawns
    if (
      state.squares
        .flat()
        .filter((square) => square.occupant?.color === opponent).length === 0
    ) {
      return {
        type: GameResultType.WIN,
        reason: 'capturing all pawns',
      }
    }
    return;
  }
}

function generateStartState(): BoardState {
  const piecePositions = {
    0: backRank(Color.BLACK),
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

  const squares = squaresFromPos(piecePositions);
  return new BoardState(squares, Color.WHITE, {});
}
