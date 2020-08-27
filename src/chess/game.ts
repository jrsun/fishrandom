import {BoardState, generateStartState} from './state';
import {Move, TurnType, Castle, Turn, Drop, Promote} from './turn';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen, Mann} from './piece';
import Square from './square';
import {Color, Pair, NotImplementedError, getOpponent, equals} from './const';

export class Game {
  // public
  name: string; // variant name

  // protected
  state: BoardState;
  turnHistory: Turn[];
  stateHistory: BoardState[];
  eventHandler: ((ge: GameEvent) => void) | undefined;

  constructor(public isServer: boolean, initial?: BoardState) {
    this.state = initial ?? generateStartState();
    this.turnHistory = [];
    this.stateHistory = [this.state];
  }

  onEvent(handler: (ge: GameEvent) => void) {
    this.eventHandler = handler;
  }

  place(piece: Piece, row: number, col: number) {
    this.state.place(piece, row, col);
  }

  /***********************
   *  Override in variants
   *************************/
  /** Shared */
  pawnHomeRanks: number[] = [1]; // 0 indexed from player's side
  castler: typeof Piece = King;
  canDrop = false;
  activate(
    color: Color,
    piece: Piece,
    row: number,
    col: number
  ): Turn | undefined {
    return;
  }
  modifyTurn(turn: Turn): Turn {
    return turn;
  }
  promotions(turn: Turn): typeof Piece[] | undefined {
    if (turn.piece instanceof Pawn && turn.type === TurnType.MOVE) {
      const pawn = turn.piece;
      if (
        (turn.end.row === 0 && pawn.color === Color.WHITE) ||
        (turn.end.row === this.state.files - 1 && pawn.color === Color.BLACK)
      ) {
        return this.promotesTo(pawn);
      }
    }
  }
  promotesTo(piece?: Piece): typeof Piece[] {
    return [Queen, Rook, Bishop, Knight];
  }
  legalMovesFrom(
    state: BoardState,
    row: number,
    col: number,
    allowCastles = false
  ): (Move | Castle)[] {
    const square = state.getSquare(row, col);
    const piece = square?.occupant;
    if (!piece) return [];

    const moves: (Move | Castle)[] = piece.legalMoves(
      row,
      col,
      state,
      this.turnHistory
    );

    if (piece instanceof Pawn) {
      const yDir = piece.color === Color.WHITE ? -1 : 1;
      // 2 move
      if (
        (this.pawnHomeRanks.includes(row) && piece.color === Color.BLACK) ||
        (this.pawnHomeRanks.includes(state.ranks - row - 1) &&
          piece.color === Color.WHITE)
      ) {
        const skippedSquare = state.getSquare(row + yDir, col);
        const endSquare = state.getSquare(row + 2 * yDir, col);
        if (
          skippedSquare &&
          !skippedSquare.occupant &&
          endSquare &&
          !endSquare.occupant
        ) {
          moves.push({
            type: TurnType.MOVE,
            start: {row, col},
            before: state,
            after: BoardState.copy(state)
              .setTurn(getOpponent(piece.color))
              .place(piece, row + 2 * yDir, col)
              .empty(row, col),
            end: {row: row + 2 * yDir, col},
            piece,
          });
        }
      }
      const enpassant = piece.enPassant(row, col, state, this.turnHistory);
      if (enpassant) {
        moves.push(enpassant);
      }
    }
    if (allowCastles && piece instanceof this.castler) {
      for (const kingside of [true, false]) {
        const move = this.castle(piece.color, kingside);
        if (!!move) {
          let targetCol = col + (kingside ? 2 : -2);
          // If the rook is right next to the king, target it
          if (
            state.getSquare(row, col + (kingside ? 1 : -1))?.occupant instanceof
            Rook
          ) {
            targetCol = col + (kingside ? 1 : -1);
          }
          if (!targetCol) continue;
          // Dummy move for display purposes. Also used in checking positions.
          // The end square is inaccurate, used for UI display rather than true record
          // of position.
          moves.push({
            type: TurnType.CASTLE,
            start: {row, col},
            kingside,
            before: state,
            after: move.after,
            end: {row, col: targetCol}, // Do not rely on this value
            piece,
          });
        }
      }
    }
    return moves;
  }
  winCondition(color: Color, state: BoardState): boolean {
    const opponent = getOpponent(color);
    // fallback if king gets taken
    if (
      !state.pieces
        .filter((piece) => piece.color === opponent)
        .some((piece) => piece.isRoyal)
    ) {
      return true;
    }

    if (!this.knowsInCheck(opponent, state)) return false;
    // Can't get out of check by checkmating
    if (this.knowsInCheck(color, state)) return false;

    const opponentMoves = state.squares
      .flat()
      .filter((square) => square.occupant?.color === opponent)
      .flatMap((square) => this.legalMovesFrom(state, square.row, square.col));
    for (const move of opponentMoves) {
      if (move && !this.knowsInCheck(opponent, move.after)) {
        return false;
      }
    }
    if (this.canDrop && state.banks[opponent]) {
      const bank = state.banks[opponent];
      if (bank.length > 0) {
        const dropStates = state.squares
          .flat()
          .filter((square) => !square.occupant)
          .map((square) =>
            BoardState.copy(state).place(
              new Piece(opponent),
              square.row,
              square.col
            )
          );
        for (const dropState of dropStates) {
          if (!this.knowsInCheck(opponent, dropState)) {
            return false;
          }
        }
      }
    }
    // Opponent is in check and cannot escape it.
    return true;
  }
  validateTurn(color: Color, turn: Turn): boolean {
    if (
      turn.end.row < 0 ||
      turn.end.row >= this.state.ranks ||
      turn.end.col < 0 ||
      turn.end.col >= this.state.files
    ) {
      return false;
    }
    // This check is for the client
    const modifiedTurn = this.modifyTurn(turn);
    if (this.winCondition(color, modifiedTurn.after)) {
      return true;
    }
    // TODO: This call repeats work done in winCondition
    if (this.knowsInCheck(color, modifiedTurn.after)) {
      return false;
    }
    return true;
  }

  /** Server */
  onConnect() {}
  cpuTurn(): Turn | undefined {
    return;
  }
  visibleState(state: BoardState, color: Color) {
    return state;
  }
  visibleTurn(turn: Turn, color: Color): Turn {
    return turn;
  }

  drawCondition(color: Color, state: BoardState): boolean {
    const moves = state.squares
      .flat()
      .filter((square) => square.occupant?.color === color)
      .flatMap((square) => this.legalMovesFrom(state, square.row, square.col));
    for (const move of moves) {
      if (move && !this.knowsInCheck(color, move.after)) {
        return false;
      }
    }

    if (this.canDrop && state.banks[color]) {
      const bank = state.banks[color];
      if (bank.length > 0) {
        const dropStates = state.squares
          .flat()
          .filter((square) => !square.occupant)
          .map((square) =>
            BoardState.copy(state).place(
              new Piece(color),
              square.row,
              square.col
            )
          );
        for (const dropState of dropStates) {
          if (!this.knowsInCheck(color, dropState)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /***********************
   *  Private
   *************************/

  move(
    color: Color,
    piece: Piece,
    srow: number,
    scol: number,
    drow: number,
    dcol: number
  ): Move | undefined {
    if (!this.isWhoseTurn(color, piece)) return;

    const legalMoves = this.legalMovesFrom(
      this.state,
      srow,
      scol,
      /* allowCastles */ false
    ).filter((move) => {
      return (
        move.type === TurnType.MOVE &&
        equals(move.end, {row: drow, col: dcol}) &&
        this.validateTurn(piece.color, move)
      );
    }) as Move[];
    if (legalMoves.length === 0) {
      return; // invalid move
    }
    return legalMoves[0];
  }

  drop(color: Color, piece: Piece, row: number, col: number): Drop | undefined {
    if (!this.canDrop || !this.isWhoseTurn(color, piece)) return;

    const {state} = this;
    const square = state.getSquare(row, col);
    if (!square || square.occupant) {
      return;
    }
    let after = BoardState.copy(state).removeFromBank(piece.color, piece);
    if (!after) {
      return;
    }

    if (piece instanceof Pawn && (row === 0 || row === this.state.ranks - 1)) {
      return;
    }
    after.place(piece, row, col).setTurn(getOpponent(piece.color));

    const drop = {
      before: state,
      after,
      color: piece.color,
      end: {row, col},
      piece,
      type: TurnType.DROP,
    } as Drop;
    if (!this.validateTurn(piece.color, drop)) {
      console.log('illegal drop');
      return;
    }
    return drop;
  }

  castle(color: Color, kingside: boolean): Castle | undefined {
    if (!this.isWhoseTurn(color)) return;

    let target: Pair;
    const cols: number[] = [];
    let rookSquare: Square;
    // If castler of same color moved, return
    if (
      this.turnHistory.some(
        (move) =>
          move.piece instanceof this.castler &&
          (move.type === TurnType.MOVE || move.type === TurnType.CASTLE) &&
          move.piece.color === color
      )
    ) {
      console.log('king moved');
      return;
    }

    // If more than one castler, log and return
    const kingSquares = this.state.squares
      .flat()
      .filter(
        (square) =>
          square?.occupant instanceof this.castler &&
          square.occupant.color === color
      );
    if (kingSquares.length !== 1) {
      console.log('error, expected 1 royal, got %s', kingSquares.length);
      return;
    }

    const kingSquare = kingSquares[0];
    const unmovedRookSquares = this.state.squares
      .flat()
      .filter(
        (square) =>
          square.occupant instanceof Rook &&
          square.occupant.color === color &&
          !this.turnHistory.some(
            (turn) =>
              turn.piece instanceof Rook &&
              turn.type === TurnType.MOVE &&
              equals(turn.end, square)
          )
      );
    const {row, col} = kingSquare;
    if (kingside) {
      rookSquare = unmovedRookSquares.filter(
        (square) => square.col > kingSquare.col
      )?.[0];
      target = {
        row: color === Color.BLACK ? 0 : this.state.ranks - 1,
        col: this.state.files - 2,
      };
    } else {
      rookSquare = unmovedRookSquares.filter(
        (square) => square.col < kingSquare.col
      )?.[0];
      target = {
        row: color === Color.BLACK ? 0 : this.state.ranks - 1,
        col: 2,
      };
    }
    // If there is no square with an unmoved rook on the corresponding
    // side of the king, return
    if (!rookSquare) return;

    for (
      let i = Math.min(kingSquare.col, rookSquare.col, target.col);
      i <= Math.max(kingSquare.col, rookSquare.col, target.col);
      i++
    ) {
      cols.push(i);
    }

    // If any square between the target, rook, and king is obstructed
    // or attacked, or dest square doesn't exist, return
    const isBlocked = cols.some((travelCol) => {
      const square = this.state.getSquare(row, travelCol);
      if (!square) {
        console.log(`attempted to castle through nonexistent square
          , ${row}, ${travelCol}`);
        return false;
      }
      return (
        this.knowsAttackedSquare(color, this.state, row, travelCol) ||
        (square.occupant &&
          square.occupant !== rookSquare.occupant &&
          square.occupant !== kingSquare.occupant)
      );
    });
    if (isBlocked) {
      return;
    }
    const before = this.state;
    const king = kingSquare.occupant!;
    const after = BoardState.copy(before)
      .setTurn(getOpponent(color))
      .empty(rookSquare.row, rookSquare.col)
      .empty(row, col)
      .place(king, target.row, target.col)
      .place(new Rook(color), target.row, target.col + (kingside ? -1 : 1));
    const type = TurnType.CASTLE as const;
    return {
      before,
      after,
      end: target,
      piece: king,
      type,
      start: {row, col},
      kingside,
    };
  }

  promote(
    color: Color,
    promoter: Piece,
    to: Piece,
    srow: number,
    scol: number,
    drow: number,
    dcol: number
  ): Promote | undefined {
    if (!this.isWhoseTurn(color, promoter)) return;

    // Using the piece's own legal moves is intentional because most
    // variants don't allow special moves to result in promotion.
    const legalMoves = promoter
      .legalMoves(srow, scol, this.state, this.turnHistory)
      .filter((move) => {
        return (
          this.validateTurn(promoter.color, move) &&
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
    if (!this.promotions(legalMove)) {
      console.log('bad promotion');
      return;
    }
    const after = BoardState.copy(this.state)
      .setTurn(getOpponent(promoter.color))
      .empty(srow, scol)
      .place(to, drow, dcol);
    const promote = {
      ...legalMove,
      after,
      type: TurnType.PROMOTE as const,
      to,
    };
    return promote;
  }

  // Shared
  knowsInCheck(color: Color, s: BoardState): boolean {
    const state = this.isServer ? this.visibleState(s, color) : s;
    const squaresWithEnemy = state.squares
      .flat()
      .filter((square) => !!square.occupant && square.occupant.color !== color);
    const enemyMoves = squaresWithEnemy.flatMap((square) =>
      this.legalMovesFrom(state, square.row, square.col)
    );

    return enemyMoves.some(
      (move) => move.type === TurnType.MOVE && move.captured?.isRoyal
    );
  }

  // Shared
  knowsAttackedSquare(
    color: Color,
    s: BoardState,
    row: number,
    col: number
  ): boolean {
    const state = this.isServer ? this.visibleState(s, color) : s;
    // put a dummy on the square (mostly for pawns)
    const dummy = new Piece(color);
    const stateWithDummy = BoardState.copy(state)
      .setTurn(getOpponent(color))
      .place(dummy, row, col);

    const squaresWithEnemy = state.squares
      .flat()
      .filter(
        (square) =>
          !!square.occupant && square.occupant.color === getOpponent(color)
      );
    const enemyMoves = squaresWithEnemy.flatMap((square) =>
      this.legalMovesFrom(stateWithDummy, square.row, square.col)
    );

    return enemyMoves.some(
      (move) => move.type === TurnType.MOVE && move.captured === dummy
    );
  }

  // Server
  isWhoseTurn(color: Color, piece?: Piece): boolean {
    if (process.env.NODE_ENV === 'development') return true;

    let result = color === this.state.whoseTurn;
    if (piece) {
      result = result && color === piece.color;
    }
    return result;
  }
}

export enum GameEventName {
  Explode = 'explode',
  Finish = 'finish',
  Highlight = 'highlight',
}
export enum GameEventType {
  On = 'on',
  Off = 'off',
  Temporary = 'temporary',
}
export interface GameEvent {
  pairs: Pair[];
  name: GameEventName;
  type: GameEventType;
}
