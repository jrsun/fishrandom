import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn, Zero} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, squaresFromPos} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, TurnType, Castle, Turn, Promote} from '../turn';
import {dedup, Pair} from '../pair';

const OPTIONS = [Bishop, Bishop, Knight, Knight, Rook, Rook, Queen];

export class Bario extends Game {
  name = 'Bario';
  constructor(isServer: boolean) {
    super(isServer, generateInitial());
  }

  modifyTurn(turn: Turn): Turn {
    const {after, piece, captured} = turn;
    if (!(piece instanceof Zero) && !captured) {
      return turn;
    }
    let newState: BoardState = BoardState.copy(after);
    for (const color of [Color.WHITE, Color.BLACK]) {
      // If no zeroes of the player's color are left, replace all their pieces with zeroes.
      if (
        newState.pieces.filter(
          (piece) => piece instanceof Zero && piece.color === color
        ).length === 0
      ) {
        for (let i = 0; i < newState.squares.length; i++) {
          for (let j = 0; j < newState.squares[i].length; j++) {
            const occupant = newState.getSquare(i, j)?.occupant;
            if (!occupant) continue;
            if (
              occupant.color === color &&
              [Bishop, Knight, Rook, Queen].some((t) => occupant instanceof t)
            ) {
              newState.place(new Zero(color), i, j);
            }
          }
        }
        newState.extra.bario = this.resetOptions(newState, piece.color);
      }
    }
    return {...turn, after: newState};
  }

  promotions(turn: Turn): Piece[] | undefined {
    if (turn.piece instanceof Pawn) return super.promotions(turn);
    if (turn.piece instanceof Zero) {
      const {after, piece, end} = turn;
      const afterPiece = after.getSquare(end.row, end.col)?.occupant;
      if (!afterPiece) return [];

      const extra = after.extra.bario;
      if (!extra) return [];

      const options =
        piece.color === Color.WHITE ? extra.whiteOptions : extra.blackOptions;
      const index = options.findIndex((opt) => opt.name === afterPiece.name);
      if (afterPiece instanceof Bishop || afterPiece instanceof Rook) {
        const qindex = options.findIndex((opt) => opt instanceof Queen);
        if (qindex !== -1) {
          return [afterPiece, options[qindex]];
        }
      }
      return [afterPiece];
    }
  }

  promote(color, promoter, to, srow, scol, drow, dcol): Promote | undefined {
    const turn = super.promote(color, promoter, to, srow, scol, drow, dcol);
    if (!turn) return;
    const {after} = turn;
    const extra = this.state.extra.bario;
    if (!extra) return;

    const options =
      promoter.color === Color.WHITE ? extra.whiteOptions : extra.blackOptions;
    const index = options.findIndex((opt) => opt.name === to.name);
    if (index !== -1) {
      options.splice(index, 1);
    }
    return turn;
  }

  legalMovesFrom(
    state: BoardState,
    row,
    col,
    allowCastle,
  ): Turn[] {
    const square = state.getSquare(row, col);
    const piece = square?.occupant;
    if (!piece) return [];
    if (!(piece instanceof Zero))
      return super.legalMovesFrom(state, row, col, allowCastle);

    const moves: Move[] = [];
    const extra = state.extra.bario;
    if (!extra) return [];
    const options =
      piece.color === Color.WHITE ? extra.whiteOptions : extra.blackOptions;

    const dedupOptions = options.reduce(
      (acc: {[name: string]: Piece}, p: Piece) => {
        if (!acc[p.name]) {
          acc[p.name] = p;
        }
        return acc;
      },
      {}
    );
    for (const opt of Object.values(dedupOptions)) {
      moves.push(
        ...opt.legalMoves(row, col, state, this.turnHistory).map((move) => ({
          ...move,
          piece,
        }))
      );
    }
    return moves;
  }

  private resetOptions(state: BoardState, color: Color) {
    const extra = state.extra.bario;
    if (!extra) return;
    if (color === Color.WHITE) {
      return {
        ...extra,
        whiteOptions: OPTIONS.map((c) => new c(Color.WHITE)),
      };
    } else {
      return {
        ...extra,
        blackOptions: OPTIONS.map((c) => new c(Color.BLACK)),
      }
    }
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

  return new BoardState(
    squaresFromPos(piecePositions),
    Color.WHITE,
    {},
    {
      bario: {
        whiteOptions: OPTIONS.map((c) => new c(Color.WHITE)),
        blackOptions: OPTIONS.map((c) => new c(Color.BLACK)),
      },
    }
  );
}
