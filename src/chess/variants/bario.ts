import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn, Zero} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, squaresFromPos} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, TurnType, Castle, Turn} from '../move';
import {dedup, Pair} from '../pair';

const OPTIONS = [Bishop, Bishop, Knight, Knight, Rook, Rook, Queen];

export class Bario extends Game {
  name = 'Bario';
  whiteOptions = OPTIONS.map(c => new c(Color.WHITE));
  blackOptions = OPTIONS.map(c => new c(Color.BLACK));
  constructor(isServer: boolean) {
    super(isServer, generateInitial());
  }

  legalMovesFrom(state: BoardState, row, col, allowCastles = false): (Castle|Move)[] {
    const square = state.getSquare(row, col);
    const piece = square?.occupant;
    if (!piece) return [];
    if (!(piece instanceof Zero)) return super.legalMovesFrom(state, row, col, allowCastles);
    
    const moves: Move[] = [];
    const options = piece.color === Color.WHITE ? this.whiteOptions : this.blackOptions;
    
    const dedupOptions = options.reduce((acc: {[name: string]: Piece}, p: Piece) => {
      if (!acc[p.name]) {
        acc[p.name] = p;
      }
      return acc;
    }, {});
    for (const piece of Object.values(dedupOptions)) {
      moves.push(...piece.legalMoves(row, col, state, this.turnHistory));
    }
    return moves;
  }

  move(color, piece, srow, scol, drow, dcol): Move | undefined {
    const turn = super.move(color, piece, srow, scol, drow, dcol);
    if (!turn) return;

    const options = turn.piece.color === Color.WHITE ? this.whiteOptions : this.blackOptions;
    const index = options.findIndex(piece => piece.name === turn.piece.name);
    if (index !== -1) {
      options.splice(index, 1);
    }
    return turn;   
  }

  modifyTurn(turn: Turn): Turn {
    // If no zeroes are left, replace all pieces with zeroes.
    if (turn.after.squares.flat().filter(square => square?.occupant instanceof Zero).length === 0) {
      const newState = BoardState.copy(turn.after);
      for (let i=0; i < turn.after.squares.length; i++) {
        for (let j=0; j < turn.after.squares[i].length; j++) {
          const occupant = turn.after.getSquare(i, j)?.occupant;
          if (!occupant) continue;
          if ([Bishop, Knight, Rook, Queen].some(t => occupant instanceof t)) {
            newState.place(new Zero(occupant.color), i, j);
          }
        }
      }
      return {
        ...turn,
        after: newState,
      };
    }
    return turn;
  }

  winCondition(color: Color): boolean {
    if (super.winCondition(color)) return true;

    if (
      !this.state.pieces
        .filter((piece) => piece.color === getOpponent(color))
        .some((piece) => piece instanceof King)
    ) {
      return true;
    }
    return false;
  }
}


export function generateInitial(): BoardState {
  const piecePositions = {
    0: {},
    1: {},
    6: {},
    7: {},
  };

  for (let col = 0; col < 8; col++) {
    piecePositions[0][col] = new Zero(Color.BLACK);
    piecePositions[1][col] = new Pawn(Color.BLACK);
    piecePositions[6][col] = new Pawn(Color.WHITE);
    piecePositions[7][col] = new Zero(Color.WHITE);
  }
  piecePositions[0][4] = new King(Color.BLACK);
  piecePositions[7][4] = new King(Color.WHITE);

  return new BoardState(squaresFromPos(piecePositions), Color.WHITE, {});
}
