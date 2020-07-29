import {
  Pair,
  equals,
  dedup,
  hash,
  unhash,
  NotImplementedError,
  PAWN_HOME_RANK,
  Color,
  MoveType,
  getOpponent,
} from './const';
import {Move} from './move';
import BoardState from './state';

// Classes

export class Piece {
  name: string;
  isRoyal: boolean;
  constructor(public color: Color) {
    // this.squares = this.game?.state.squares;
  }
  legalMoves(
    row: number,
    col: number,
    state: BoardState,
    moveHistory: Move[]
  ): Move[] {
    return [];
  }
  toFEN(): string {
    return this.name[0];
  }

  get img(): string {
    // override
    return this.color === Color.WHITE ? '_lt.png' : '_dt.png';
  }

  render(): HTMLElement {
    const result = document.createElement('div');
    result.setAttribute('class', 'piece');
    result.style.backgroundImage = `url(/dist/img/${this.img})`;
    return result;
  }

  static freeze(p: Piece): object {
    return {
      _class: 'Piece',
      n: p.name,
      c: p.color,
    };
  }

  static thaw(o): Piece {
    const constructor = ALL_PIECES[o.n];
    return new constructor(o.c);
  }
}

class Leaper extends Piece {
  moves: Pair[];
  legalMoves(row: number, col: number, state: BoardState): Move[] {
    let targets = this.moves
      .flatMap((move) =>
        [-1, 1]
          .map((sign) => move.row * sign)
          .flatMap((first) =>
            [-1, 1].flatMap((sign) => [
              {
                row: first,
                col: move.col * sign,
              },
              {
                row: move.col * sign,
                col: first,
              },
            ])
          )
      )
      .map((relative) => ({row: row + relative.row, col: col + relative.col}));

    targets = targets.filter(
      (target) =>
        !(
          target.row < 0 ||
          target.col < 0 ||
          target.row >= state.ranks ||
          target.col >= state.files
        )
    );
    targets = targets.filter((target) => {
      const occupant = state.getSquare(target.row, target.col)?.occupant;
      return !occupant || occupant.color !== this.color;
    });
    const moves: Move[] = [];
    for (const target of dedup(targets)) {
      const occupant = state.getSquare(target.row, target.col)?.occupant;
      const isCapture = !!(occupant && occupant.color !== this.color);

      moves.push({
        before: state,
        after: new BoardState(state.squares, getOpponent(this.color))
          .place(this, target.row, target.col)
          .empty(row, col),
        piece: this,
        start: {row, col},
        end: target,
        isCapture,
        captured: occupant,
        color: this.color,
        type: MoveType.MOVE,
      });
    }
    return moves;
  }
}

class Rider extends Piece {
  moves: Pair[];
  legalMoves(row: number, col: number, state: BoardState): Move[] {
    return dedup(
      this.moves.flatMap((move) =>
        [-1, 1]
          .map((sign) => move.row * sign)
          .flatMap((first) =>
            [-1, 1].flatMap((sign) => [
              {
                row: first,
                col: move.col * sign,
              },
              {
                row: move.col * sign,
                col: first,
              },
            ])
          )
      )
    ).flatMap((dir) => this.ride(row, col, dir.row, dir.col, state));
  }

  private ride(
    row: number,
    col: number,
    rowDir: number,
    colDir: number,
    state: BoardState
  ): Move[] {
    // ride in one direction until we hit the edge of board or another piece
    const moves: Move[] = [];
    let square = state.getSquare(row + rowDir, col + colDir);

    while (square) {
      if (!square.occupant || square.occupant.color !== this.color) {
        const isCapture = !!(
          square.occupant && square.occupant.color !== this.color
        );
        moves.push({
          before: state,
          after: new BoardState(state.squares, getOpponent(this.color))
            .place(this, square.row, square.col)
            .empty(row, col),
          piece: this,
          start: {row, col},
          end: square,
          isCapture,
          captured: square.occupant,
          color: this.color,
          type: MoveType.MOVE,
        });
      }
      if (square.occupant) {
        break;
      }
      square = state.getSquare(square.row + rowDir, square.col + colDir);
    }
    return moves;
  }
}

// Pieces

export class Bishop extends Rider {
  name = 'Bishop';
  moves = [{row: 1, col: 1}];

  get img(): string {
    if (this.color === Color.BLACK) {
      return 'bdt.png';
    } else if (this.color === Color.WHITE) {
      return 'blt.png';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
}

export class Rook extends Rider {
  name = 'Rook';
  moves = [{row: 1, col: 0}];

  get img(): string {
    if (this.color === Color.BLACK) {
      return 'rdt45.png';
    } else if (this.color === Color.WHITE) {
      return 'rlt45.png';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
}

export class Knight extends Leaper {
  name = 'Knight';
  moves = [{row: 1, col: 2}];

  toFEN() {
    return 'N';
  }

  get img(): string {
    if (this.color === Color.BLACK) {
      return 'ndt26.png';
    } else if (this.color === Color.WHITE) {
      return 'nlt.png';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
}

export class Queen extends Rider {
  name = 'Queen';
  moves = [
    {row: 1, col: 1},
    {row: 1, col: 0},
  ];

  get img(): string {
    if (this.color === Color.BLACK) {
      return 'qdt45.png';
    } else if (this.color === Color.WHITE) {
      return 'qlt45.png';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
}

export class King extends Leaper {
  name = 'King';
  moves = [
    {row: 1, col: 1},
    {row: 1, col: 0},
  ];
  isRoyal = true;

  get img(): string {
    if (this.color === Color.BLACK) {
      return 'kdt45.png';
    } else if (this.color === Color.WHITE) {
      return 'klt.png';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
}

export class Pawn extends Piece {
  name = 'Pawn';
  legalMoves(
    row: number,
    col: number,
    state: BoardState,
    moveHistory: Move[]
  ): Move[] {
    // normal move. 2 step. capture, en passant
    const yDir = this.color === Color.WHITE ? -1 : 1;
    let moveTargets = [{row: row + yDir, col}];

    // 2 move
    if (
      (row === PAWN_HOME_RANK && this.color === Color.BLACK) ||
      (row === state.ranks - PAWN_HOME_RANK - 1 && this.color === Color.WHITE)
    ) {
      moveTargets.push({row: row + 2 * yDir, col});
    }

    moveTargets = moveTargets.filter((target) => {
      const square = state.getSquare(target.row, target.col);
      return square && !square.occupant;
    });

    let captureTargets = [
      {row: row + yDir, col: col - 1},
      {row: row + yDir, col: col + 1},
    ];

    captureTargets = captureTargets.filter((target) => {
      const occupant = state.getSquare(target.row, target.col)?.occupant;
      return occupant && occupant.color !== this.color;
    });

    const moves: Move[] = [];
    for (const target of moveTargets) {
      moves.push({
        before: state,
        after: new BoardState(state.squares, getOpponent(this.color))
          .place(this, target.row, target.col)
          .empty(row, col),
        piece: this,
        start: {row, col},
        end: target,
        isCapture: false,
        color: this.color,
        type: MoveType.MOVE,
      });
    }
    for (const target of captureTargets) {
      moves.push({
        before: state,
        after: new BoardState(state.squares, getOpponent(this.color))
          .place(this, target.row, target.col)
          .empty(row, col),
        piece: this,
        start: {row, col},
        end: target,
        isCapture: true,
        captured: state.getSquare(target.row, target.col)?.occupant,
        color: this.color,
        type: MoveType.MOVE,
      });
    }
    const enpassant = this.enPassant(row, col, state, moveHistory);
    if (enpassant) {
      moves.push(enpassant);
    }
    return moves;
  }

  private enPassant(
    row: number,
    col: number,
    state: BoardState,
    moveHistory: Move[]
  ): Move | undefined {
    const yDir = this.color === Color.WHITE ? -1 : 1;
    // en passant
    if (moveHistory.length) {
      const lastMove = moveHistory[moveHistory.length - 1];
      if (
        lastMove.piece instanceof Pawn &&
        lastMove.piece.color !== this.color &&
        Math.abs(lastMove.end.col - col) === 1 &&
        Math.abs(lastMove.end.row - lastMove.start.row) === 2 &&
        lastMove.end.row === row
      ) {
        // need to copy state for history
        const before = state;
        const start = {row, col};
        const end = {row: row + yDir, col: lastMove.end.col};
        const isCapture = true;
        const captured = lastMove.piece;
        const color = this.color;
        const type = MoveType.ENPASSANT;

        const after = new BoardState(state.squares, getOpponent(this.color))
          .place(this, end.row, end.col)
          .empty(row, col)
          // capturing the pawn
          .empty(lastMove.end.row, lastMove.end.col);
        return {
          before,
          after,
          piece: this,
          start,
          end,
          isCapture,
          captured,
          color,
          type,
        };
      }
    }
    return;
  }
  promote() {
    // TODO
  }
  get img(): string {
    if (this.color === Color.BLACK) {
      // return 'bpawn.svg';
      return 'pdt45.png';
    } else if (this.color === Color.WHITE) {
      return 'plt45.png';
      // return 'pawn.svg';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
}

export class RoyalKnight extends Knight {
  name = 'RoyalKnight';
  isRoyal = true;

  toFEN() {
    return 'K';
  }

  get img(): string {
    return this.color === Color.BLACK ? 'knightkingb.png' : 'knightkingw.png';
  }
}

export class Mann extends King {
  name = 'Mann';
  isRoyal = false;

  get img(): string {
    return this.color === Color.BLACK ? 'mannb.png' : 'mannw.png';
  }
}

export const ALL_PIECES: {[name: string]: typeof Piece} = {
  Pawn,
  Bishop,
  Knight,
  Rook,
  Queen,
  King,
  RoyalKnight,
  Mann,
};
