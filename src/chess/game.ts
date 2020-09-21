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
    row: number,
    col: number,
    piece?: Piece
  ): Turn | undefined {
    return;
  }
  sideEffects(turn: Turn) {}
  modifyTurn(turn: Turn): Turn {
    return turn;
  }
  promotions(turn: Turn): Piece[] | undefined {
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
  promotesTo(piece: Piece): Piece[] {
    const types = [Queen, Rook, Bishop, Knight];
    return types.map((t) => new t(piece.color));
  }
  legalMovesFrom(
    state: BoardState,
    row: number,
    col: number,
    allowCastle: boolean
  ): Turn[] {
    const square = state.getSquare(row, col);
    const piece = square?.occupant;
    if (!piece) return [];

    const moves: Turn[] = piece.legalMoves(row, col, state, this.turnHistory);

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
    if (allowCastle && piece instanceof this.castler) {
      for (const kingside of [true, false]) {
        const move = this.castle(piece.color, row, col, kingside);
        if (!!move) {
          let targetCol = col + (kingside ? 2 : -2);
          // If the rook is right next to the king, target it
          if (
            state.getSquare(row, col + (kingside ? 1 : -1))?.occupant instanceof
            Rook
          ) {
            targetCol = col + (kingside ? 1 : -1);
          }
          if (targetCol === undefined) continue;
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
    return moves.map((turn) => this.modifyTurn(turn));
  }
  allLegalMoves(color: Color, state: BoardState, allowCastle: boolean): Turn[] {
    const moves: Turn[] = [];
    for (const square of state.squares.flat()) {
      const {row, col, occupant} = square;
      if (state.banks?.[color]) {
        for (const droppable of state.banks[color]) {
          const drop = this.drop(color, droppable, row, col);
          if (drop) {
            moves.push(drop);
          }
        }
      }

      if (occupant && occupant.color === color) {
        moves.push(...this.legalMovesFrom(state, row, col, allowCastle));
      }

      const activate = this.activate(color, row, col, square.occupant);
      if (activate) {
        moves.push(activate);
      }
    }
    return moves;
  }
  winCondition(color: Color, state: BoardState): GameResult|undefined {
    const opponent = getOpponent(color);
    // Capturing the King wins with highest priority.
    const royalty = state.pieces.filter(piece => piece.isRoyal);
    if (
      royalty.some(piece => piece.color === color) &&
      !royalty.some(piece => piece.color === opponent)
    ) {
      return {
        type: GameResultType.WIN,
        reason: 'king capture',
      };
    }

    // Opponent is not in check, so they can't be mated.
    if (!this.knowsInCheck(opponent, state)) return;
    // Player is in check.
    if (this.knowsInCheck(color, state)) return;

    // See if checked opponent has any saving moves.
    for (const move of this.allLegalMoves(opponent, state, false)) {
      if (
        move.after.whoseTurn === opponent ||
        !this.knowsInCheck(opponent, move.after)
      ) {
        return;
      }
    }
    // Opponent is in check and cannot escape it.
    return {
      type: GameResultType.WIN,
      reason: 'checkmate',
    };
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
    if (this.winCondition(color, turn.after)) {
      return true;
    }
    // TODO: This call repeats work done in winCondition
    if (
      turn.after.whoseTurn === getOpponent(color) &&
      this.knowsInCheck(color, turn.after)
    ) {
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

  // Always check this after winCondition
  drawCondition(color: Color, state: BoardState): GameResult|undefined {
    if (this.knowsInCheck(color, state)) return;
    if (
      state.pieces.length === 2 &&
      state.pieces.every((p) => p instanceof King)
    )
      return {
        type: GameResultType.DRAW,
        reason: 'insufficient material',
      };
    for (const move of this.allLegalMoves(color, state, true)) {
      if (
        move.after.whoseTurn === color ||
        !this.knowsInCheck(color, move.after)
      ) {
        return;
      }
    }
    return {
      type: GameResultType.DRAW,
      reason: 'stalemate',
    };
  }

  /***********************
   *  Private
   *************************/
  execute(color: Color, turn?: Turn): Turn | undefined {
    if (!turn) return undefined;

    if (turn.type !== TurnType.MOVE) {
      // HACK: legalMoves is already modified because
      // they could change, but others will not
      turn = this.modifyTurn(turn);
    }

    const isValid = this.validateTurn(color, turn);
    if (!isValid) return undefined;

    this.turnHistory = [...this.turnHistory, turn];
    this.stateHistory.push(turn.after);
    this.state = turn.after;

    this.sideEffects(turn);

    return turn;
  }
  move(
    color: Color,
    piece: Piece,
    srow: number,
    scol: number,
    drow: number,
    dcol: number
  ): Move | undefined {
    if (!this.isWhoseTurn(color, piece)) return;

    const legalMoves = this.legalMovesFrom(this.state, srow, scol, true).filter(
      (move) => {
        return (
          move.type === TurnType.MOVE &&
          equals(move.end, {row: drow, col: dcol})
        );
      }
    ) as Move[];
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
    return drop;
  }

  castle(
    color: Color,
    row: number,
    col: number,
    kingside: boolean
  ): Castle | undefined {
    if (!this.isWhoseTurn(color)) return;

    let target: Pair;
    const cols: number[] = [];
    let rookSquare: Square;

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
    const castler = this.state.getSquare(row, col)?.occupant;
    if (!(castler instanceof this.castler)) return;
    if (this.turnHistory.some((move) =>
      equals(move.end, {row, col}) &&
      'start' in move &&
      !equals(move.end, move.start)
    )) {
      return;
    }
    let rookTargetCol: number | undefined;
    if (kingside) {
      rookSquare = unmovedRookSquares.filter((square) => square.col > col)?.[0];
      target = {
        row: color === Color.BLACK ? 0 : this.state.ranks - 1,
        col: this.state.files - 2,
      };
      rookTargetCol = target.col - 1;
    } else {
      rookSquare = unmovedRookSquares.filter((square) => square.col < col)?.[0];
      target = {
        row: color === Color.BLACK ? 0 : this.state.ranks - 1,
        col: 2,
      };
      rookTargetCol = target.col + 1;
    }
    // If there is no square with an unmoved rook on the corresponding
    // side of the king, return
    if (!rookSquare) return;

    for (
      let i = Math.min(col, rookSquare.col, target.col, rookTargetCol);
      i <= Math.max(col, rookSquare.col, target.col, rookTargetCol);
      i++
    ) {
      cols.push(i);
    }

    // If any square between the target, rook, and, rook target, king is obstructed
    // or doesn't exist, return
    const isBlocked = cols.some((travelCol) => {
      const square = this.state.getSquare(row, travelCol);
      if (!square) {
        console.log(`attempted to castle through nonexistent square
          , ${row}, ${travelCol}`);
        return false;
      }
      return (square.occupant &&
          square.occupant !== rookSquare.occupant &&
          square.occupant !== castler);
    });
    for (
      let i = Math.min(col, rookSquare.col, target.col, rookTargetCol);
      i <= Math.max(col, rookSquare.col, target.col, rookTargetCol);
      i++
    ) {
      cols.push(i);
    }
    if (isBlocked) {
      return;
    }

    let kingCols: number[] = [];
    for (
      let i = Math.min(col, target.col);
      i <= Math.max(col, target.col);
      i++
    ) {
      kingCols.push(i);
    }

    // If any square between the target and king is attacked
    // or doesn't exist, return
    const isAttacked = kingCols.some((travelCol) => {
      const square = this.state.getSquare(row, travelCol);
      if (!square) {
        console.log(`attempted to castle through nonexistent square
          , ${row}, ${travelCol}`);
        return false;
      }
      return (
        this.knowsAttackedSquare(color, this.state, row, travelCol)
      );
    });
    if (isAttacked) {
      return;
    }

    const before = this.state;
    const king = castler!;
    const after = BoardState.copy(before)
      .setTurn(getOpponent(color))
      .empty(rookSquare.row, rookSquare.col)
      .empty(row, col)
      .place(king, target.row, target.col)
      .place(rookSquare.occupant!, target.row, rookTargetCol);
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

    const legalMoves = promoter
      .legalMoves(srow, scol, this.state, this.turnHistory)
      .filter((move) => {
        return move.end.col === dcol && move.end.row === drow;
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
      this.legalMovesFrom(state, square.row, square.col, false)
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

    // Avoids an infinite recursion.
    const enemyMovesWithoutCastle = this.allLegalMoves(
      getOpponent(color),
      stateWithDummy,
      false
    );

    return enemyMovesWithoutCastle.some(
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

export enum GameResultType {
  WIN = 'win',
  DRAW = 'draw',
  LOSS = 'loss',
  ABORTED = 'aborted',
}

export interface GameResult {
  type: GameResultType,
  reason?: string,
}

export enum GameEventName {
  Explode = 'explode',
  Finish = 'finish',
  Highlight = 'highlight',
  Veto = 'veto',
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
