import {Game, GameEventType, GameEventName} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent, equals} from '../const';
import {BoardState, generateStartState, Phase} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Castle, Turn, TurnType} from '../turn';

export class Hiddenqueen extends Game {
  name = 'Hiddenqueen';
  revealed = {
    [Color.WHITE]: false,
    [Color.BLACK]: false,
  };
  constructor(isServer: boolean) {
    super(isServer, generateStartState().setPhase(Phase.PRE));
  }
  onConnect() {
    if (this.eventHandler) {
      if (this.state.extra.phase === Phase.PRE) {
        this.eventHandler({
          type: GameEventType.On,
          name: GameEventName.Highlight,
          pairs: [0, 1, 2, 3, 4, 5, 6, 7]
            .map((col) => [
              {row: 1, col},
              {row: 6, col},
            ])
            .flat(),
        });
      }
    }
  }
  visibleState(state: BoardState, color: Color): BoardState {
    const vis = BoardState.copy(state);
    vis.squares = state.squares.map((row) =>
      row.map((square) => {
        const occupant = square.occupant;
        if (
          occupant &&
          occupant instanceof QueenPawn &&
          occupant.color !== color
        ) {
          if (this.revealed[occupant.color]) {
            return new Square(square.row, square.col).place(
              new Queen(occupant.color)
            );
          } else {
            return new Square(square.row, square.col).place(
              new Pawn(occupant.color)
            );
          }
        }
        if (
          occupant &&
          occupant instanceof QueenPawn &&
          occupant.color === color &&
          this.revealed[color]
        ) {
          return new Square(square.row, square.col).place(
            new Queen(occupant.color)
          );
        }
        return square;
      })
    );
    return vis;
  }
  modifyTurn(turn: Turn): Turn {
    if (!this.isServer) return turn;

    if (this.turnHistory.length + 1 === 2) {
      if (this.eventHandler) {
        this.eventHandler({
          type: GameEventType.Off,
          name: GameEventName.Highlight,
          pairs: [0, 1, 2, 3, 4, 5, 6, 7]
            .map((col) => [
              {row: 1, col},
              {row: 6, col},
            ])
            .flat(),
        });
      }
      return {
        ...turn,
        after: BoardState.copy(turn.after).setPhase(Phase.NORMAL),
      };
    }
    return turn;
  }

  visibleTurn(turn: Turn, color: Color): Turn {
    if (color === turn.piece.color) return turn;
    if (turn.type === TurnType.ACTIVATE) {
      return {
        type: TurnType.UNKNOWN,
        before: turn.before,
        after: turn.after,
        end: {row: -1, col: -1},
        captured: turn.captured,
        piece: new Pawn(turn.piece.color),
      };
    }
    return turn;
  }
  activate(
    color: Color,
    piece: Piece,
    row: number,
    col: number
  ): Turn | undefined {
    if (!this.isWhoseTurn(color, piece)) return;

    let after: BoardState | undefined;
    if (piece.name === 'Pawn') {
      after = BoardState.copy(this.state)
        .setTurn(getOpponent(color))
        .place(new QueenPawn(piece.color), row, col);
    } else {
      return;
    }
    const turn = {
      type: TurnType.ACTIVATE as const,
      before: this.state,
      after,
      end: {row, col},
      piece,
    };
    if (!this.validateTurn(piece.color, turn)) return;
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
    if (!this.isServer) {
      return super.move(color, piece, srow, scol, drow, dcol);
    }
    const move = super.move(color, piece, srow, scol, drow, dcol);
    if (!move) return;
    if (this.revealed[piece.color]) {
      return move;
    }
    // If queenpawn moved in a way that was impossible for a pawn, reveal it.
    if (piece instanceof QueenPawn) {
      const dummyState = BoardState.copy(move.before).place(
        new Pawn(piece.color),
        srow,
        scol
      );
      if (
        !this.legalMovesFrom(dummyState, srow, scol, false).some(
          (pmove) =>
            equals(pmove.end, move.end) && pmove.captured === move.captured
        )
      ) {
        this.revealed[piece.color] = true;
        return move;
      }
    }
    // TODO: see your own captured queenpawn
    const visiblePiece = (piece.color !== color && piece instanceof QueenPawn) ? new Pawn(piece.color) : piece;
    const visibleCapture = (move.captured?.color !== color && move.captured instanceof QueenPawn) ? new Pawn(move.captured.color) : move.captured;
    return {
      ...move,
      piece: visiblePiece,
      captured: visibleCapture,
    };
  }
  validateTurn(color: Color, turn: Turn): boolean {
    if (!super.validateTurn(color, turn)) return false;
    const isSelectQueen = turn.type === TurnType.ACTIVATE;
    const isPre = this.state.extra.phase === Phase.PRE;
    return (isSelectQueen && isPre) || (!isSelectQueen && !isPre);
  }
}

export class QueenPawn extends Queen {
  name = 'QueenPawn';
  get img(): string {
    if (this.color === Color.BLACK) {
      return 'gdt.svg';
    } else if (this.color === Color.WHITE) {
      return 'glt.svg';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
  static freeze(p: QueenPawn): object {
    return {
      _class: 'QueenPawn',
      n: p.name,
      c: p.color,
    };
  }
  static thaw(o): QueenPawn {
    return new QueenPawn(o.c);
  }
}
