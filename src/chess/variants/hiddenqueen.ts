import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move} from '../move';

export class Hiddenqueen extends Game {
  name = 'Hiddenqueen';
  revealed = {
    [Color.WHITE]: false,
    [Color.BLACK]: false,
  };
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
      state.whoseTurn
    );
  }

  winCondition(color: Color): boolean {
    if (super.winCondition(color)) return true;

    if (
      !this.state.pieces
        .filter((piece) => piece.color === getOpponent(color))
        .some((piece) => piece instanceof King)
    ) {
      return true;
    }
    return false;
  }

  attemptMove(
    color: Color,
    piece: Piece,
    srow: number,
    scol: number,
    drow: number,
    dcol: number
  ): Move | undefined {
    if (!this.isServer) {
      return super.attemptMove(color, piece, srow, scol, drow, dcol);
    }
    const move = super.attemptMove(color, piece, srow, scol, drow, dcol);
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

function generateStartState(): BoardState {
  const piecePositions = {
    0: {
      0: new Rook(Color.BLACK),
      1: new Knight(Color.BLACK),
      2: new Bishop(Color.BLACK),
      3: new Queen(Color.BLACK),
      4: new King(Color.BLACK),
      5: new Bishop(Color.BLACK),
      6: new Knight(Color.BLACK),
      7: new Rook(Color.BLACK),
    },
    1: {},
    6: {},
    7: {
      0: new Rook(Color.WHITE),
      1: new Knight(Color.WHITE),
      2: new Bishop(Color.WHITE),
      3: new Queen(Color.WHITE),
      4: new King(Color.WHITE),
      5: new Bishop(Color.WHITE),
      6: new Knight(Color.WHITE),
      7: new Rook(Color.WHITE),
    },
  };

  for (let col = 0; col < 8; col++) {
    piecePositions[1][col] = new Pawn(Color.BLACK);
    piecePositions[6][col] = new Pawn(Color.WHITE);
  }
  const files = [0, 1, 2, 3, 4, 5, 6, 7];
  const bhqf = randomChoice(files);
  piecePositions[1][bhqf] = new QueenPawn(Color.BLACK);
  const whqf = randomChoice(files);
  piecePositions[6][whqf] = new QueenPawn(Color.WHITE);

  const squares: Square[][] = [];
  for (let i = 0; i < 8; i++) {
    const row: Square[] = [];
    for (let j = 0; j < 8; j++) {
      const square = new Square(i, j);
      row.push(square);
      if (piecePositions[i]?.[j]) {
        square.place(piecePositions[i][j]);
      }
    }
    squares.push(row);
  }
  return new BoardState(squares, Color.WHITE);
}
