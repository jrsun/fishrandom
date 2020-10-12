import {Game} from '../game';
import {generateStartState, BoardState} from '../state';
import {Move} from '../turn';
import {Color} from '../const';
import Square from '../square';
import {randomChoice} from '../../common/utils';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen, RoyalKnight} from '../piece';

export class Knighthood extends Game {
  name = 'Knighthood';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }

  legalMovesFrom(state: BoardState, row: number, col: number, allowCastle: boolean) {
    let moves = super.legalMovesFrom(state, row, col, allowCastle);

    const piece = state.getSquare(row, col)?.occupant;
    if (
      !piece || piece instanceof Pawn || piece instanceof Knight
    ) {
      return moves;
    }
    if (piece instanceof King) {
      return [...moves, ...new RoyalKnight(piece.color).legalMoves(row, col, state)];
    }
    return [
      ...moves,
      ...new Knight(piece.color).legalMoves(row, col, state),
    ];
  }
}
