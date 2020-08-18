import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn, Mann} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Castle, Turn} from '../move';

export class Royalpawn extends Game {
  name = 'Royalpawn';
  constructor(isServer: boolean) {
    super(isServer, genInitial());
  }
  visibleState(state: BoardState, color: Color): BoardState {
    if (!this.isServer) return state;

    return new BoardState(
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
      ),
      state.whoseTurn,
      state.banks
    );
  }

  winCondition(color: Color): boolean {
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

  isTurnLegal(color: Color, turn: Turn): boolean {
    if (
      turn.end.row < 0 ||
      turn.end.row >= this.state.ranks ||
      turn.end.col < 0 ||
      turn.end.col >= this.state.files
    ) {
      return false;
    }
    return true;
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
      return 'Chess_fdt45.svg';
    } else if (this.color === Color.WHITE) {
      return 'Chess_flt45.svg';
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
  const files = [0, 1, 2, 3, 4, 5, 6, 7];
  const bhqf = randomChoice(files);
  state.squares[1][bhqf].place(new KingPawn(Color.BLACK));
  const whqf = randomChoice(files);
  state.squares[6][whqf].place(new KingPawn(Color.WHITE));

  state.squares[0][4].place(new Mann(Color.BLACK));
  state.squares[7][4].place(new Mann(Color.WHITE));
  return state;
}
