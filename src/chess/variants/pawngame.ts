import {Game, GameEventType, GameEventName} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent, Pair} from '../const';
import {BoardState, generateStartState, Phase} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Turn, Activate, TurnType, Castle, Unknown} from '../turn';

const secondRank: Pair[] = [0, 1, 2, 3, 4, 5, 6, 7]
  .map((col) => [
    {row: 1, col},
    {row: 6, col},
  ])
  .flat();

export class SecretPawnGame extends Game {
  secret: typeof Piece;
  constructor(isServer: boolean, state: BoardState, piece: typeof Piece) {
    super(isServer, state.setPhase(Phase.PRE));
    this.secret = piece;
  }
  onConnect() {
    if (this.eventHandler) {
      if (this.state.extra.phase === Phase.PRE) {
        this.eventHandler({
          type: GameEventType.On,
          name: GameEventName.Highlight,
          pairs: secondRank,
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
          occupant instanceof this.secret &&
          occupant.color !== color
        ) {
          return new Square(square.row, square.col).place(
            new Pawn(occupant.color)
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
          pairs: secondRank,
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
    const {piece, captured} = turn;

    if (turn.type === TurnType.ACTIVATE && turn.piece.name === 'Pawn') {
      return {
        type: TurnType.UNKNOWN,
        before: turn.before,
        after: turn.after,
        end: {row: -1, col: -1},
        captured: turn.captured,
        piece: new Pawn(turn.piece.color),
      };
    }
    const visiblePiece =
      color !== piece.color && piece instanceof this.secret
        ? new Pawn(piece.color)
        : piece;
    const visibleCapture =
      color !== captured?.color && captured instanceof this.secret
        ? new Pawn(captured.color)
        : captured;
    return {
      ...turn,
      piece: visiblePiece,
      captured: visibleCapture,
    };
  }

  activate(
    color: Color,
    piece: Piece,
    row: number,
    col: number
  ): Turn | undefined {
    if (!this.isWhoseTurn(color, piece) || !(piece.name === 'Pawn')) return;

    const after = BoardState.copy(this.state)
      .setTurn(getOpponent(color))
      .place(new this.secret(piece.color), row, col);

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
    const isSelect =
      turn.type === TurnType.ACTIVATE && turn.piece.name === 'Pawn';
    const isPre = this.state.extra.phase === Phase.PRE;
    return (isSelect && isPre) || (!isSelect && !isPre);
  }
}
