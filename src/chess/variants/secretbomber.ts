import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Turn, Activate, TurnType} from '../move';

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

  activate(color: Color, piece: Piece, row: number, col: number): Activate|undefined {
    if (!(piece instanceof BomberPawn)) return;
    if (piece.color !== color) return;
    
    const after = BoardState.copy(this.state)
      .setTurn(getOpponent(color))
      .empty(row-1, col-1)
      .empty(row-1, col)
      .empty(row-1, col+1)
      .empty(row, col-1)
      .empty(row, col)
      .empty(row, col+1)
      .empty(row+1, col-1)
      .empty(row+1, col)
      .empty(row+1, col+1);
    
    const turn = {
      type: TurnType.ACTIVATE,
      before: this.state,
      after,
      end: {row, col},
      piece,
    } as Activate;
    this.turnHistory.push(turn);
    this.stateHistory.push(after);
    this.state = after;
    return turn;
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

    return {
      ...move,
      piece: piece instanceof BomberPawn ? new Pawn(color) : piece,
    };
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
  piecePositions[1][bhqf] = new BomberPawn(Color.BLACK);
  const whqf = randomChoice(files);
  piecePositions[6][whqf] = new BomberPawn(Color.WHITE);

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
  return new BoardState(squares, Color.WHITE, {});
}
