import {
  Pair,
  equals,
  dedup,
  hash,
  unhash,
  NotImplementedError,
  Color,
  getOpponent,
} from './const';
import {Move, Turn, TurnType} from './turn';
import {BoardState} from './state';

// Classes
export class Piece {
  name: string;
  isRoyal: boolean;
  promotable: boolean;
  constructor(public color: Color) {
    // this.squares = this.game?.state.squares;
  }
  legalMoves(
    row: number,
    col: number,
    state: BoardState,
    turnHistory: Turn[]
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
  jumps: Pair[];
  legalMoves(row: number, col: number, state: BoardState): Move[] {
    let targets = this.jumps
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

      moves.push({
        before: state,
        after: BoardState.copy(state)
          .setTurn(getOpponent(this.color))
          .place(this, target.row, target.col)
          .empty(row, col),
        piece: this,
        start: {row, col},
        end: target,
        captured: occupant,
        type: TurnType.MOVE,
      });
    }
    return moves;
  }
}

export class Rider extends Piece {
  moves: Pair[];
  max?: number;
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

    let count = 0;
    while (square && (this.max ? count < this.max : true)) {
      count += 1;
      if (!square.occupant || square.occupant.color !== this.color) {
        moves.push({
          before: state,
          after: BoardState.copy(state)
            .setTurn(getOpponent(this.color))
            .place(this, square.row, square.col)
            .empty(row, col),
          piece: this,
          start: {row, col},
          end: square,
          captured: square.occupant,
          type: TurnType.MOVE,
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
      return 'bdt.svg';
    } else if (this.color === Color.WHITE) {
      return 'blt.svg';
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
      return 'rdt.svg';
    } else if (this.color === Color.WHITE) {
      return 'rlt.svg';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
}

export class Rook4 extends Rook {
  name = 'Rook4';
  max = 4;

  get img(): string {
    if (this.color === Color.BLACK) {
      return 'r4dt.svg';
    } else if (this.color === Color.WHITE) {
      return 'r4lt.svg';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
}

export class Knight extends Leaper {
  name = 'Knight';
  jumps = [{row: 1, col: 2}];

  toFEN() {
    return 'N';
  }

  get img(): string {
    if (this.color === Color.BLACK) {
      return 'svg/ndt.svg';
    } else if (this.color === Color.WHITE) {
      return 'svg/nlt.svg';
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
      return 'svg/qdt.svg';
    } else if (this.color === Color.WHITE) {
      return 'svg/qlt.svg';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
}

export class King extends Leaper {
  name = 'King';
  jumps = [
    {row: 1, col: 1},
    {row: 1, col: 0},
  ];
  isRoyal = true;

  get img(): string {
    if (this.color === Color.BLACK) {
      return 'svg/kdt.svg';
    } else if (this.color === Color.WHITE) {
      return 'svg/klt.svg';
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
    turnHistory: Turn[]
  ): Move[] {
    // normal move. 2 step. capture, en passant
    const yDir = this.color === Color.WHITE ? -1 : 1;
    let moveTargets = [{row: row + yDir, col}];

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
      return occupant && occupant.color === getOpponent(this.color);
    });

    const moves: Move[] = [];
    for (const target of moveTargets) {
      moves.push({
        before: state,
        after: BoardState.copy(state)
          .setTurn(getOpponent(this.color))
          .place(this, target.row, target.col)
          .empty(row, col),
        piece: this,
        start: {row, col},
        end: target,
        type: TurnType.MOVE,
      });
    }
    for (const target of captureTargets) {
      moves.push({
        before: state,
        after: BoardState.copy(state)
          .setTurn(getOpponent(this.color))
          .place(this, target.row, target.col)
          .empty(row, col),
        piece: this,
        start: {row, col},
        end: target,
        captured: state.getSquare(target.row, target.col)?.occupant,
        type: TurnType.MOVE,
      });
    }

    return moves;
  }

  enPassant(
    row: number,
    col: number,
    state: BoardState,
    turnHistory: Turn[]
  ): Move | undefined {
    const yDir = this.color === Color.WHITE ? -1 : 1;
    // en passant
    if (turnHistory.length) {
      let lastMove: Turn|undefined;
      for (let i = turnHistory.length-1; i >= 0; i--) {
        // BUG: Veto chess
        if (turnHistory[i].cpu) continue;
        lastMove = turnHistory[i];
        break;
      }
      if (!lastMove || lastMove.type !== TurnType.MOVE) return;

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
        const captured = lastMove.piece;
        const type = TurnType.MOVE;

        const after = BoardState.copy(state)
          .setTurn(getOpponent(this.color))
          .place(this, end.row, end.col)
          .empty(row, col)
          // capturing the pawn
          .empty(lastMove.end.row, lastMove.end.col);
        return {
          enpassant: true,
          before,
          after,
          piece: this,
          start,
          end,
          captured,
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
      return 'pdt.svg';
    } else if (this.color === Color.WHITE) {
      return 'plt.svg';
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
    return this.color === Color.BLACK ? 'kkdt.svg' : 'kklt.svg';
  }
}

export class Amazon extends Piece {
  name = 'Amazon';

  toFEN() {
    return 'A';
  }

  legalMoves(row, col, state): Move[] {
    return [
      ...new Knight(this.color).legalMoves(row, col, state),
      ...new Queen(this.color).legalMoves(row, col, state),
    ].map((move: Move) => {
      const {end, after} = move;
      return {
        ...move,
        after: after.place(this, end.row, end.col),
        piece: this,
      };
    });
  }

  get img(): string {
    return this.color === Color.BLACK ? 'svg/adt.svg' : 'svg/alt.svg';
  }
}

export class AmazonRoyal extends Amazon {
  name = 'AmazonRoyal';
  isRoyal = true;
}

export class Chancellor extends Piece {
  name = 'Chancellor';

  toFEN() {
    return 'C';
  }

  legalMoves(row, col, state): Move[] {
    return [
      ...new Knight(this.color).legalMoves(row, col, state),
      ...new Rook(this.color).legalMoves(row, col, state),
    ].map((move: Move) => {
      const {end, after} = move;
      return {
        ...move,
        after: after.place(this, end.row, end.col),
        piece: this,
      };
    });
  }

  get img(): string {
    if (this.color === Color.BLACK) {
      return 'cdt45.svg';
    } else {
      return 'clt45.svg';
    }
  }
}

export class Princess extends Piece {
  name = 'Princess';

  toFEN() {
    return 'P';
  }

  legalMoves(row, col, state): Move[] {
    return [
      ...new Knight(this.color).legalMoves(row, col, state),
      ...new Bishop(this.color).legalMoves(row, col, state),
    ].map((move: Move) => {
      const {end, after} = move;
      return {
        ...move,
        after: after.place(this, end.row, end.col),
        piece: this,
      };
    });
  }

  get img(): string {
    if (this.color === Color.BLACK) {
      return 'prncsb.svg';
    } else {
      return 'prncsw.svg';
    }
  }
}

export class Mann extends King {
  name = 'Mann';
  isRoyal = false;

  get img(): string {
    return this.color === Color.BLACK ? 'mdt.svg' : 'mlt.svg';
  }
}

export class Zero extends Piece {
  name = 'Zero';
  isRoyal = false;

  // TODO Fix
  legalMoves(row, col, state): Move[] {
    return [
      ...new Knight(this.color).legalMoves(row, col, state),
      ...new Queen(this.color).legalMoves(row, col, state),
    ].map((move: Move) => {
      const {end, after} = move;
      return {
        ...move,
        after: after.place(this, end.row, end.col),
        piece: this,
      };
    });
  }

  get img(): string {
    return this.color === Color.BLACK ? 'moondt.svg' : 'moonlt.svg'; // TEMP
  }
}

export const ALL_PIECES: {[name: string]: typeof Piece} = {
  Pawn,
  Bishop,
  Knight,
  Chancellor,
  Rook,
  Queen,
  King,
  RoyalKnight,
  Mann,
  AmazonRoyal,
  Amazon,
  Zero,
  Rook4,
  Princess,
};
