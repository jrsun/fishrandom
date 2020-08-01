import BoardState from './state';
import {Move, TurnType, Castle, Turn, Drop, Promote} from './move';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen} from './piece';
import Square from './square';
import {Color, Pair, NotImplementedError, getOpponent, equals} from './const';

export class Game {
  // public
  name: string; // variant name

  // protected
  state: BoardState;
  turnHistory: Turn[];
  stateHistory: BoardState[];

  // PAWN_HOME_RANK = 1;

  constructor(public isServer: boolean, initial?: BoardState) {
    this.state = initial ?? generateStartState();
    this.turnHistory = [];
    this.stateHistory = [this.state];
  }

  place(piece: Piece, row: number, col: number) {
    this.state.place(piece, row, col);
  }

  /***********************
   *  Override in variants
   *************************/
  afterMove() {} // In Piece Eater, do something
  captureEffects(move: Move) {
    // in atomic chess, explode, etc.
  }
  visibleState(state: BoardState, color: Color) {
    return state;
  } // dark chess
  winCondition(color: Color): boolean {
    const opponent = getOpponent(color);
    if (!this.knowsInCheck(opponent, this.state)) return false;

    const opponentLegalMoves = this.state.squares
      .flat()
      .filter((square) => square.occupant?.color === opponent)
      .flatMap((square) =>
        square.occupant?.legalMoves(
          square.row,
          square.col,
          this.state,
          this.turnHistory
        )
      )
      .filter((move) => move && !this.knowsInCheck(opponent, move.after));
    // Opponent is in check and cannot escape it.
    return opponentLegalMoves.length === 0;
  }

  /***********************
   *  Private
   *************************/

  //  attemptTurn(
  //    color: Color,
  //    piece: Piece,
  //    srow: number,
  //    scol: number,
  //    drow: number,
  //    dcol: number): Move|undefined {
  //     if (color !== piece.color || color !== this.whoseTurn) return;
  //     const move = this.attemptMove(piece, srow, scol, drow, dcol);
  //     if (!move) return;
  //     this.winCondition(color);
  //     this.afterMove();
  //     this.whoseTurn = getOpponent(color);
  //     return {
  //       [Color.WHITE]: this.visibleState(Color.WHITE),
  //       [Color.BLACK]: this.visibleState(Color.BLACK),
  //     };
  //   }

  attemptMove(
    color: Color,
    piece: Piece,
    srow: number,
    scol: number,
    drow: number,
    dcol: number
  ): Move | undefined {
    // if (color !== piece.color || color !== this.state.whoseTurn) return;
    const legalMoves = piece
      .legalMoves(srow, scol, this.state, this.turnHistory)
      .filter((move) => {
        return this.isTurnLegal(move);
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
      this.captureEffects(legalMove);
    }

    this.turnHistory.push(legalMove);
    this.stateHistory.push(legalMove.after);
    this.state = legalMove.after;

    return legalMove;
  }

  drop(piece: Piece, row: number, col: number): Drop | undefined {
    console.log('dropping');
    const {state} = this;
    const square = state.getSquare(row, col);
    if (!square || square.occupant) {
      return;
    }
    const after = state.place(piece, row, col);
    const drop = {
      before: state,
      after,
      color: piece.color,
      end: {row, col},
      piece,
      type: TurnType.DROP,
    } as Drop;
    if (!this.isTurnLegal(drop)) {
      console.log('illegal drop');
      return;
    }
    console.log('dropped!');
    this.state = after;
    this.turnHistory.push(drop);
    this.stateHistory.push(after);
    return drop;
  }

  castle(color: Color, kingside: boolean): Castle | undefined {
    console.log('attempting castle');
    let target: Pair;
    const cols: number[] = [];
    let rookSquare: Square;
    // check history for castling or rook/king moves
    if (this.turnHistory.some((move) => move.piece.isRoyal)) {
      console.log('king moved');
      return;
    }
    const kingSquares = this.state.squares
      .flat()
      .filter(
        (square) => square?.occupant?.isRoyal && square.occupant.color === color
      );
    if (kingSquares.length !== 1) {
      console.log('error, expected 1 royal, got %s', kingSquares.length);
      return;
    }
    const kingSquare = kingSquares[0];
    const {row, col} = kingSquare;

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
      rookSquare = rookSquares.sort((square) => square.col)[
        rookSquares.length - 1
      ];
      target = {
        row: color === Color.BLACK ? 0 : this.state.ranks - 1,
        col: this.state.files - 2,
      };
    } else {
      rookSquare = rookSquares.sort((square) => square.col)[0];
      target = {
        row: color === Color.BLACK ? 0 : this.state.ranks - 1,
        col: 2,
      };
    }
    if (this.turnHistory.some((move) => move.piece === rookSquare.occupant)) {
      console.log('rook moved');
      return;
    }

    for (
      let i = Math.min(kingSquare.col, rookSquare.col, target.col);
      i <= Math.max(kingSquare.col, rookSquare.col, target.col);
      i++
    ) {
      cols.push(i);
    }

    const isBlocked = cols.some((travelCol) => {
      const square = this.state.getSquare(row, travelCol);
      if (!square) {
        throw new Error(`attempted to castle through nonexistent square
          , ${row}, ${travelCol}`);
      }
      return (
        this.knowsAttackedSquare(color, this.state, row, travelCol) ||
        (square.occupant &&
          square.occupant !== rookSquare.occupant &&
          square.occupant !== kingSquare.occupant)
      );
    });
    if (isBlocked) {
      console.log('cannot castle, blocked or attacked');
      return;
    }
    const before = this.state;
    const king = kingSquare.occupant!;
    const after = new BoardState(this.state.squares, getOpponent(color))
      .empty(rookSquare.row, rookSquare.col)
      .empty(row, col)
      .place(king, target.row, target.col)
      .place(new Rook(color), target.row, target.col + (kingside ? -1 : 1));
    const type = TurnType.CASTLE;
    const move = {
      before,
      after,
      color,
      end: target,
      piece: king,
      type,
      start: {row, col},
      kingside,
    } as Castle;
    this.turnHistory.push(move);
    this.stateHistory.push(after);
    this.state = after;
    return move;
  }

  promote(
    promoter: Piece,
    to: Piece,
    srow: number,
    scol: number,
    drow: number,
    dcol: number
  ): Promote | undefined {
    const legalMoves = promoter
      .legalMoves(srow, scol, this.state, this.turnHistory)
      .filter((move) => {
        return (
          this.isTurnLegal(move) &&
          move.end.col === dcol &&
          move.end.row === drow
        );
      });
    if (!legalMoves.length) {
      console.log('cannot promote here');
      return;
    }
    if (legalMoves.length > 1) {
      console.log('multiple legal moves??');
    }
    const legalMove = legalMoves[0];
    const after = new BoardState(
      this.state.squares,
      getOpponent(promoter.color)
    )
      .empty(srow, scol)
      .place(to, drow, dcol);
    if (legalMove.isCapture) {
      this.captureEffects(legalMove);
    }
    const promote = {
      ...legalMove,
      after,
      type: TurnType.PROMOTE,
      to,
    } as Promote;
    this.turnHistory.push(promote);
    this.stateHistory.push(after);
    this.state = after;
    return promote;
  }

  // Private

  isTurnLegal(turn: Turn): boolean {
    if (
      turn.end.row < 0 ||
      turn.end.row >= this.state.ranks ||
      turn.end.col < 0 ||
      turn.end.col >= this.state.files
    ) {
      return false;
    }
    if (this.knowsInCheck(turn.color, turn.after)) {
      return false;
    }
    return true;
  }

  knowsInCheck(color: Color, state: BoardState): boolean {
    const visibleState = this.visibleState(state, color);
    const squaresWithEnemy = visibleState.squares
      .flat()
      .filter((square) => !!square.occupant && square.occupant.color !== color);
    const enemyMoves = squaresWithEnemy.flatMap((square) =>
      square.occupant!.legalMoves(square.row, square.col, visibleState, [])
    );

    return enemyMoves.some((move) => move.captured?.isRoyal);
  }

  knowsAttackedSquare(
    color: Color,
    state: BoardState,
    row: number,
    col: number
  ): boolean {
    const visibleState = this.visibleState(state, color);
    // put a dummy on the square (mostly for pawns)
    const dummy = new Piece(color);
    const stateWithDummy = new BoardState(
      visibleState.squares,
      getOpponent(color)
    ).place(dummy, row, col);
    const squaresWithEnemy = state.squares
      .flat()
      .filter(
        (square) =>
          !!square.occupant && square.occupant.color === getOpponent(color)
      );
    const enemyMoves = squaresWithEnemy.flatMap((square) =>
      square.occupant!.legalMoves(square.row, square.col, stateWithDummy, [])
    );

    return enemyMoves.some((move) => move.captured === dummy);
  }
}

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
  return new BoardState(squares, Color.WHITE);
}
