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
  constructor(isServer: boolean) {
    super(isServer, generateInitial());
  }

  legalMovesFrom(state: BoardState, row, col, allowCastles = false): (Castle|Move)[] {
    const square = state.getSquare(row, col);
    const piece = square?.occupant;
    if (!piece) return [];
    if (!(piece instanceof Zero)) return super.legalMovesFrom(state, row, col, allowCastles);
    
    const moves: Move[] = [];
    const extra = state.extra?.bario;
    if (!extra) return [];
    const options = piece.color === Color.WHITE ? extra.whiteOptions : extra.blackOptions;
    
    const dedupOptions = options.reduce((acc: {[name: string]: Piece}, p: Piece) => {
      if (!acc[p.name]) {
        acc[p.name] = p;
      }
      return acc;
    }, {});
    for (const opt of Object.values(dedupOptions)) {
      moves.push(...opt.legalMoves(row, col, state, this.turnHistory).map(move => ({
        ...move,
        piece,
      })));
    }
    return moves;
  }

  modifyTurn(turn: Turn): Turn {
    const {piece, after, end} = turn;
    // Note: piece is Zero, afterPiece is the piece the Zero moved as.
    if (piece instanceof Zero) {
      const afterPiece = after.getSquare(end.row, end.col)?.occupant;
      if (!afterPiece) return turn;

      const extra = this.state.extra?.bario;
      if (!extra) return turn;

      const options = piece.color === Color.WHITE ? extra.whiteOptions : extra.blackOptions;
      const index = options.findIndex(opt => opt.name === afterPiece.name);
      if (index !== -1) {
        options.splice(index, 1);
      }
    }

    // If no zeroes of the player's color are left, replace all their pieces with zeroes.
    if (after.squares.flat().filter(square =>
      square?.occupant instanceof Zero &&
      square.occupant.color === piece.color
    ).length === 0) {
      const newState = BoardState.copy(after);
      for (let i=0; i < after.squares.length; i++) {
        for (let j=0; j < after.squares[i].length; j++) {
          const occupant = after.getSquare(i, j)?.occupant;
          if (!occupant) continue;
          if (occupant.color === piece.color && [Bishop, Knight, Rook, Queen].some(t => occupant instanceof t)) {
            newState.place(new Zero(occupant.color), i, j);
          }
        }
      }
      this.resetOptions();
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

  private resetOptions() {
    const extra = this.state.extra?.bario;
    if (!extra) return;
    extra.whiteOptions = OPTIONS.map(c => new c(Color.WHITE));
    extra.blackOptions = OPTIONS.map(c => new c(Color.BLACK));
  }
}


export function generateInitial(): BoardState {
  const piecePositions = {
    0: {},
    1: {},
    6: {},
    7: {},
  };

  for (let col = 0; col < 3; col++) {
    piecePositions[0][col] = new Zero(Color.BLACK);
    piecePositions[1][col] = new Pawn(Color.BLACK);
    piecePositions[6][col] = new Pawn(Color.WHITE);
    piecePositions[7][col] = new Zero(Color.WHITE);
  }
  piecePositions[0][4] = new King(Color.BLACK);
  piecePositions[7][4] = new King(Color.WHITE);

  return new BoardState(
    squaresFromPos(piecePositions),
    Color.WHITE,
    {},
    {
      bario: {
        whiteOptions: OPTIONS.map(c => new c(Color.WHITE)),
        blackOptions: OPTIONS.map(c => new c(Color.BLACK)),
      },
    }
  );
}
