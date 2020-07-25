import BoardState from './state';
import {Move} from './move';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen} from './piece';
import Square from './square';
import {Color, Pair, NotImplementedError, MoveType, equals} from './const';

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
    6: {},
    7: {
      0: new Rook(Color.WHITE),
      1: new Knight(Color.WHITE),
      2: new Bishop(Color.WHITE),
      3: new Queen(Color.WHITE),
      4: new King(Color.WHITE),
      5: new Bishop(Color.WHITE),
      6: new Knight(Color.WHITE),
      7: new Rook(Color.WHITE),
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
  return new BoardState(squares);
}

export class Game {
  state: BoardState;
  moveHistory: Move[];
  stateHistory: BoardState[];

  // PAWN_HOME_RANK = 1;

  constructor(initial?: BoardState) {
    this.state = initial ?? generateStartState();
    this.moveHistory = [];
    this.stateHistory = [];
  }

  get rules(): string {
    throw NotImplementedError;
  }

  place(piece: Piece, row: number, col: number) {
    this.state.place(piece, row, col);
  }

  winCondition(color: Color, state: BoardState): boolean {
    throw NotImplementedError;
  }

  move() {
    // state.attemptMove (x2 for double chess)
    // captureEffects
    // winCondition
  }

  // override in variants
  attemptMove(
    piece: Piece,
    srow: number,
    scol: number,
    drow: number,
    dcol: number
  ): Move {
    if (piece instanceof King && srow === drow && Math.abs(scol - dcol) === 2) {
      return this.castle(piece.color, srow, scol, drow, dcol);
    }
    const legalMoves = piece
      .legalMoves(srow, scol, this.state, this.moveHistory)
      .filter((move) => {
        return this.isMoveLegal(move);
      });
    const legalMove = legalMoves.find((move) =>
      equals(move.end, {row: drow, col: dcol})
    );
    if (!legalMove) {
      console.log('invalid move', piece.name, drow, dcol);
      console.log('legal moves are', legalMoves);
      return; // invalid move
    }
    if (legalMove.isCapture) {
      this.captureEffects();
    }

    this.moveHistory.push(legalMove);
    this.stateHistory.push(legalMove.after);
    this.state = legalMove.after;

    return legalMove;
  }

  castle(
    color: Color,
    row: number,
    col: number,
    drow: number,
    dcol: number
  ): Move {
    console.log('attempting castle');
    const kingside = dcol - col > 0;
    let target: Pair;
    let cols: number[];
    let rookSquare: Square;
    // check history for castling or rook/king moves
    if (this.moveHistory.some((move) => move.piece instanceof King)) {
      console.log('king moved');
      return;
    }

    const rookSquares = this.state.squares
      .flat()
      .filter(
        (square) =>
          square.occupant &&
          square.occupant instanceof Rook &&
          square.occupant.color === color
      );
    if (!rookSquares) {
      console.log('no rooks');
      return;
    }
    if (kingside) {
      target = {
        row: color === Color.BLACK ? 0 : this.state.ranks - 1,
        col: this.state.files - 2,
      };
      cols = [col];
      for (let i = col + 1; i <= target.col; i++) {
        cols.push(i);
      }
      rookSquare = rookSquares.sort((square) => square.col)[
        rookSquares.length - 1
      ];
    } else {
      target = {
        row: color === Color.BLACK ? 0 : this.state.ranks - 1,
        col: 2,
      };
      cols = [col];
      for (let i = col - 1; i >= target.col; i--) {
        cols.push(i);
      }
      rookSquare = rookSquares.sort((square) => square.col)[0];
    }
    if (this.moveHistory.some((move) => move.piece === rookSquare.occupant)) {
      console.log('rook moved');
      return;
    }

    const isAttacked = cols.some(
      (travelCol) =>
        this.isAttackedSquare(color, this.state, row, travelCol) ||
        (this.state.getSquare(row, travelCol).occupant &&
          this.state.getSquare(row, travelCol).occupant !==
            rookSquare.occupant &&
          !(this.state.getSquare(row, travelCol).occupant instanceof King))
    );
    if (isAttacked) {
      console.log('cannot castle, attacked on way');
      return;
    }
    const before = this.state;
    const after = new BoardState(this.state.squares)
      .empty(rookSquare.row, rookSquare.col)
      .empty(row, col)
      .place(new King(color), target.row, target.col)
      .place(new Rook(color), target.row, target.col + (kingside ? -1 : 1));
    const isCapture = false;
    const type = MoveType.CASTLE;
    const move = {
      start: {row, col},
      end: {row: drow, col: dcol},
      before,
      after,
      isCapture,
      type,
      color,
    };
    this.moveHistory.push(move);
    this.stateHistory.push(after);
    this.state = after;
    return move;
  }

  // Private

  isMoveLegal(move: Move): boolean {
    if (
      move.end.row < 0 ||
      move.end.row >= this.state.ranks ||
      move.end.col < 0 ||
      move.end.col >= this.state.files
    ) {
      return false;
    }
    if (this.isInCheck(move.color, move.after)) {
      return false;
    }
    return true;
  }

  isInCheck(color: Color, state: BoardState): boolean {
    const squaresWithEnemy = state.squares
      .flat()
      .filter((square) => !!square.occupant && square.occupant.color !== color);
    const enemyMoves = squaresWithEnemy.flatMap((square) =>
      square.occupant!.legalMoves(square.row, square.col, state, [])
    );

    return enemyMoves.some((move) => move.captured.isRoyal);
  }

  isAttackedSquare(
    color: Color,
    state: BoardState,
    row: number,
    col: number
  ): boolean {
    // put a dummy on the square (mostly for pawns)
    const dummy = new Piece(color);
    const stateWithDummy = new BoardState(state.squares).place(dummy, row, col);
    const squaresWithEnemy = state.squares
      .flat()
      .filter((square) => !!square.occupant && square.occupant.color !== color);
    const enemyMoves = squaresWithEnemy.flatMap((square) =>
      square.occupant!.legalMoves(square.row, square.col, stateWithDummy, [])
    );

    return enemyMoves.some((move) => move.captured === dummy);
  }

  captureEffects() {
    // in atomic chess, explode, etc.
  }
}
