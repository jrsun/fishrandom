import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Castle} from '../move';

export class Hiddenqueen extends Game {
  name = 'Hiddenqueen';
  revealed = {
    [Color.WHITE]: false,
    [Color.BLACK]: false,
  };
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
      ),
      state.whoseTurn,
      state.banks
    );
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
    if (this.revealed[color]) {
      return move;
    }
    // If queenpawn moved in a way that was impossible for a pawn, reveal it.
    if (
      piece instanceof QueenPawn &&
      !new Pawn(color)
        .legalMoves(
          srow,
          scol,
          move.before,
          this.turnHistory.slice(0, this.turnHistory.length - 1)
        )
        .some((pmove) => {
          const matches =
            pmove.end.col === move.end.col &&
            pmove.end.row === move.end.row &&
            pmove.captured === move.captured;
          return matches;
        })
    ) {
      this.revealed[color] = true;
      return move;
    }
    return {
      ...move,
      piece: piece instanceof QueenPawn ? new Pawn(color) : piece,
    };
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

function genInitial(): BoardState {
  const state = generateStartState();
  const files = [0, 1, 2, 3, 4, 5, 6, 7];
  const bhqf = randomChoice(files);
  state.squares[1][bhqf].place(new QueenPawn(Color.BLACK));
  const whqf = randomChoice(files);
  state.squares[6][whqf].place(new QueenPawn(Color.WHITE));

  return state;
}
