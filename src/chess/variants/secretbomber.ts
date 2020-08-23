import {Game, GameEventType, GameEventName} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent, Pair} from '../const';
import {BoardState, generateStartState} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Turn, Activate, TurnType, Castle, Unknown} from '../turn';

export class Secretbomber extends Game {
  name = 'Secretbomber';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }
  onConnect() {
    if (this.eventHandler) {
      this.eventHandler({
        type: GameEventType.Turn,
        name: GameEventName.Highlight,
        pairs: [0,1,2,3,4,5,6,7].map(col => ([
          {row: 1, col}, {row: 6, col}
        ])).flat(),
      });
    }
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
    if (turn.piece instanceof BomberPawn) {
      return {
        ...turn,
        piece: new Pawn(turn.piece.color),
      };
    } else if (turn.type === TurnType.ACTIVATE) {
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

    let after: BoardState|undefined;
    if (piece instanceof BomberPawn) {
      after = BoardState.copy(this.state)
        .setTurn(getOpponent(color));
      const pairs: Pair[] = [];
      for (let i = row - 1; i < row + 2; i++) {
        for (let j = col - 1; j < col + 2; j++) {
          after.empty(i, j);
          pairs.push({row: i, col: j});
        }
      }
      if (this.eventHandler) {
        this.eventHandler({
          pairs,
          name: GameEventName.Explode,
          type: GameEventType.Temporary,
        });
      }
    } else if (piece instanceof Pawn) {
      after = BoardState.copy(this.state)
      .setTurn(getOpponent(color))
      .place(new BomberPawn(piece.color), row, col);
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

  validateTurn(color: Color, turn: Turn): boolean {
    if (!super.validateTurn(color, turn)) return false;

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