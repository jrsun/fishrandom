import {Game} from '../game';
import {BoardState, generate960, generate9602, squaresFromPos, generateStartState} from '../state';
import {Move, Turn, TurnType} from '../turn';
import {Color, getOpponent} from '../const';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen} from '../piece';

export class Pawnside extends Game {
  name = 'Pawnside';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }

  legalMovesFrom(
    state: BoardState,
    row: number,
    col: number,
    allowCastle: boolean
  ): Turn[] {
    const square = state.getSquare(row, col);
    const piece = square?.occupant;
    const moves = super.legalMovesFrom(state, row, col, allowCastle);

    if (piece instanceof Pawn) {
      let targets = [{row, col: col-1}, {row, col: col+1}];
      targets = targets.filter(target => {
        const square = state.getSquare(target.row, target.col);
        return square && !square.occupant;
      });

      for (const target of targets) {
        moves.push({
          before: state,
          after: BoardState.copy(state)
            .setTurn(getOpponent(piece.color))
            .place(piece, target.row, target.col)
            .empty(row, col),
          piece,
          start: {row, col},
          end: target,
          type: TurnType.MOVE,
        });
      }
    }
    return moves;
  }
}