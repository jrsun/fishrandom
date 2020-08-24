import {Game, GameEventType, GameEventName} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn, Mann} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState, Phase} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Castle, Turn, TurnType} from '../turn';

export class Royalpawn extends Game {
  name = 'Royalpawn';
  constructor(isServer: boolean) {
    super(isServer, genInitial().setPhase(Phase.PRE));
  }
  onConnect() {
    if (this.eventHandler) {
      if (this.state.extra.phase === Phase.PRE) {
        this.eventHandler({
          type: GameEventType.On,
          name: GameEventName.Highlight,
          pairs: [0,1,2,3,4,5,6,7].map(col => ([
            {row: 1, col}, {row: 6, col}
          ])).flat(),
        });
      }
    }
  }
  promotions(turn: Turn): (typeof Piece)[] | undefined {
    if (turn.piece instanceof KingPawn) return;
    return super.promotions(turn);
  }
  visibleState(state: BoardState, color: Color): BoardState {
    const vis = BoardState.copy(state);
    vis.squares = 
      state.squares.map((row) =>
        row.map((square) => {
          const occupant = square.occupant;
          if (
            occupant &&
            occupant instanceof KingPawn &&
            occupant.color === getOpponent(color)
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
          pairs: [0,1,2,3,4,5,6,7].map(col => ([
            {row: 1, col}, {row: 6, col}
          ])).flat(),
        });
      } 
      return {
        ...turn,
        after: BoardState.copy(turn.after).setPhase(Phase.NORMAL),
      }
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

  winCondition(color: Color): boolean {
    if (this.state.extra.phase === Phase.PRE) return false;
    // Win by capturing the king pawn
    if (
      !this.state.pieces
        .filter((piece) => piece.color === getOpponent(color))
        .some((piece) => piece.isRoyal)
    ) {
      return true;
    }

    const myKingSquare = this.state.squares.flat().find(square =>
      square.occupant instanceof KingPawn &&
      square.occupant.color === color
    );

    // King pawn reaching the end wins
    return (
      (myKingSquare?.row === 0 && color === Color.WHITE) ||
      (myKingSquare?.row === this.state.files - 1 && color === Color.BLACK)
    );
  }

  drawCondition(color: Color): boolean {
    const legalMoves = this.state.squares
      .flat()
      .filter((square) => square.occupant?.color === color)
      .flatMap((square) =>
        this.legalMovesFrom(this.state, square.row, square.col, true)
      )
    return legalMoves.length === 0;
  }

  activate(
    color: Color,
    piece: Piece,
    row: number,
    col: number
  ): Turn | undefined {
    if (!this.isWhoseTurn(color, piece)) return;

    let after: BoardState|undefined;
    if (piece.name === 'Pawn') {
      after = BoardState.copy(this.state)
      .setTurn(getOpponent(color))
      .place(new KingPawn(piece.color), row, col);
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
    if (
      turn.end.row < 0 ||
      turn.end.row >= this.state.ranks ||
      turn.end.col < 0 ||
      turn.end.col >= this.state.files
    ) {
      return false;
    }
    const isSelectRoyal = turn.type === TurnType.ACTIVATE && turn.piece.name === 'Pawn';
    const isPre = this.state.extra.phase === Phase.PRE;
    return (isSelectRoyal && isPre) || (!isSelectRoyal && !isPre);
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
    return {
      ...move,
      piece: piece instanceof KingPawn ? new Pawn(color) : piece,
    };
  }
}

export class KingPawn extends Pawn {
  name = 'KingPawn';
  isRoyal = true;
  get img(): string {
    if (this.color === Color.BLACK) {
      return 'svg/rpb.svg';
    } else if (this.color === Color.WHITE) {
      return 'svg/rpw.svg';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
  static freeze(p: KingPawn): object {
    return {
      _class: 'KingPawn',
      n: p.name,
      c: p.color,
    };
  }
  static thaw(o): KingPawn {
    return new KingPawn(o.c);
  }
}

function genInitial(): BoardState {
  const state = generateStartState();
  state.squares[0][4].place(new Mann(Color.BLACK));
  state.squares[7][4].place(new Mann(Color.WHITE));
  return state;
}
