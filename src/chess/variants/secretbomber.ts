import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Turn, Activate, TurnType, Castle, Unknown} from '../turn';

export class Secretbomber extends Game {
  name = 'Secretbomber';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }
  visibleState(state: BoardState, color: Color): BoardState {
    if (!this.isServer) return state;

    return new BoardState(
      state.squares.map((row) =>
        row.map((square) => {
          const occupant = square.occupant;
          if (
            occupant &&
            occupant instanceof BomberPawn &&
            occupant.color !== color
          ) {
            return new Square(square.row, square.col).place(
              new Pawn(occupant.color)
            );
          }
          return square;
        })
      ),
      state.whoseTurn,
      state.banks
    );
  }

  visibleTurn(turn: Turn, color: Color): Turn {
    if (color === turn.piece.color) return turn;
    if (turn.type === TurnType.ACTIVATE && turn.piece instanceof Pawn) {
      return {
        type: TurnType.UNKNOWN,
        before: turn.before,
        after: turn.after,
        end: {row: -1, col: -1},
        captured: turn.captured,
        piece: new Pawn(turn.piece.color),
      };
    }
    if (turn.piece instanceof BomberPawn) {
      return {
        ...turn,
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
    if (!this.checkTurn(color, piece)) return;
    if (piece.color !== color) return;

    let after: BoardState|undefined;
    if (piece instanceof BomberPawn) {
      after = BoardState.copy(this.state)
        .setTurn(getOpponent(color))
        .empty(row - 1, col - 1)
        .empty(row - 1, col)
        .empty(row - 1, col + 1)
        .empty(row, col - 1)
        .empty(row, col)
        .empty(row, col + 1)
        .empty(row + 1, col - 1)
        .empty(row + 1, col)
        .empty(row + 1, col + 1);
    } else if (piece instanceof Pawn) {
      after = BoardState.copy(this.state)
      .setTurn(getOpponent(color))
      .place(new BomberPawn(color), row, col);
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
    if (!this.isTurnLegal(color, turn)) return;
    return turn;
  }

  isTurnLegal(color: Color, turn: Turn): boolean {
    if (!super.isTurnLegal(color, turn)) return false;

    const isSelectBomber = turn.type === TurnType.ACTIVATE && turn.piece.name === 'Pawn';
    const isFirstMove = this.turnHistory.filter(turn => turn.piece.color === color).length === 0;
    return (isSelectBomber && isFirstMove) || (!isSelectBomber && !isFirstMove);
  }
}

export class BomberPawn extends Pawn {
  name = 'BomberPawn';
  get img(): string {
    if (this.color === Color.BLACK) {
      return 'bombb.svg';
    } else if (this.color === Color.WHITE) {
      return 'bombw.svg';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
  static freeze(p: BomberPawn): object {
    return {
      _class: 'BomberPawn',
      n: p.name,
      c: p.color,
    };
  }
  static thaw(o): BomberPawn {
    return new BomberPawn(o.c);
  }
}