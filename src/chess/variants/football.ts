import {Game, GameEventName, GameEventType, GameResult, GameResultType} from '../game';
import {Knight, Rook, Bishop, Queen, Pawn, Piece, Mann} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, squaresFromPos} from '../state';
import Square from '../square';

export class Football extends Game {
  name = 'Football';
  castler = Mann;
  constructor(isServer) {
    super(isServer, generateStartState());
  }

  onConnect() {
    if (this.eventHandler) {
      this.eventHandler({
        name: GameEventName.Finish,
        type: GameEventType.On,
        pairs: [
          {row: 0, col: 3},
          {row: 0, col: 4},
          {row: 7, col: 3},
          {row: 7, col: 4},
        ],
      });
    }
  }

  winCondition(color: Color, state: BoardState): GameResult|undefined {
    const goals: Square[] = (color === Color.WHITE
      ? [state.getSquare(0, 3), state.getSquare(0, 4)]
      : [state.getSquare(7, 3), state.getSquare(7, 4)]) as Square[];
    if (goals.some((goal) => goal.occupant?.color === color)) {
      return {
        type: GameResultType.WIN,
        reason: 'touchdown',
      };
    }
    if (
      state.pieces.filter((piece) => piece.color === getOpponent(color))
        .length === 0
    ) {
      return {
        type: GameResultType.WIN,
        reason: 'capturing all opponent pieces',
      };
    };
  }

  promotesTo(piece: Piece): Piece[] {
    return [Queen, Rook, Bishop, Knight, Mann].map((t) => new t(piece.color));
  }
}

function generateStartState(): BoardState {
  const piecePositions = {
    0: {
      0: new Rook(Color.BLACK),
      1: new Knight(Color.BLACK),
      2: new Bishop(Color.BLACK),
      3: new Queen(Color.BLACK),
      4: new Mann(Color.BLACK),
      5: new Bishop(Color.BLACK),
      6: new Knight(Color.BLACK),
      7: new Rook(Color.BLACK),
    },
    1: {},
    6: {},
    7: {
      0: new Rook(Color.WHITE),
      1: new Knight(Color.WHITE),
      2: new Bishop(Color.WHITE),
      3: new Queen(Color.WHITE),
      4: new Mann(Color.WHITE),
      5: new Bishop(Color.WHITE),
      6: new Knight(Color.WHITE),
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
