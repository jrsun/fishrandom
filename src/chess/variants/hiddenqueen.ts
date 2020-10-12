import {Game, GameEventType, GameEventName} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState, Phase} from '../state';
import Square from '../square';
import {randomChoice} from '../../common/utils';
import {Move, Castle, Turn, TurnType} from '../turn';
import { Pair, equals } from '../pair';

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
  sideEffects(turn: Turn) {
    if (!this.isServer) return;

    const secondRank: Pair[] = [0, 1, 2, 3, 4, 5, 6, 7]
      .map((col) => [
        {row: 1, col},
        {row: 6, col},
      ])
      .flat();
    if (this.turnHistory.length === 2 && this.eventHandler) {
      this.eventHandler({
        type: GameEventType.Off,
        name: GameEventName.Highlight,
        pairs: secondRank,
      });
    }
    if (turn.type !== TurnType.MOVE) {
      return;
    }
    const {
      piece,
      start: {row, col},
    } = turn;

    // If queenpawn moved in a way that was impossible for a pawn, reveal it.
    if (piece instanceof QueenPawn) {
      const dummyState = BoardState.copy(turn.before).place(
        new Pawn(piece.color),
        row,
        col
      );
      if (
        !this.legalMovesFrom(dummyState, row, col, false).some(
          (pmove) =>
            equals(pmove.end, turn.end) && pmove.captured === turn.captured
        )
      ) {
        this.revealed[piece.color] = true;
      }
    }
  }
  modifyTurn(turn: Turn): Turn {
    // After this turn, 2 moves will have passed.
    if (this.turnHistory.length + 1 === 2) {
      return {
        ...turn,
        after: BoardState.copy(turn.after).setPhase(Phase.NORMAL),
      };
    }
    return turn;
  }

  visibleTurn(turn: Turn, color: Color): Turn {
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
    const {piece} = turn;
    if (this.revealed[piece.color]) {
      return turn;
    }
    // TODO: see your own captured queenpawn
    const visiblePiece =
      piece instanceof QueenPawn ? new Pawn(piece.color) : piece;
    const visibleCapture =
      turn.captured?.color !== color && turn.captured instanceof QueenPawn
        ? new Pawn(turn.captured.color)
        : turn.captured;
    return {
      ...turn,
      piece: visiblePiece,
      captured: visibleCapture,
    };
  }
  activate(
    color: Color,
    row: number,
    col: number,
    piece?: Piece
  ): Turn | undefined {
    if (!piece || !this.isWhoseTurn(color, piece)) return;

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
    return turn;
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
