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
} from './const.js';

// Classes

export class Square {
  piece?: Piece;

  constructor(public row: number, public col: number) {}

  get occupant(): Piece | undefined {
    return this.piece;
  }

  toString(): string {
    if (this.occupant) {
      return `[${this.occupant.toString()}]`;
    }
    return '[ ]';
  }

  render(): HTMLElement {
    const result = document.createElement('div');
    result.setAttribute('class', 'square');
    // result.style.height = `${SQUARE_SIZE}px`;
    // result.style.width = `${SQUARE_SIZE}px`;
    if (this.occupant) {
      result.appendChild(this.occupant.render());
    }
    result.onclick = (e) => {
      result.dispatchEvent(
        new CustomEvent('square-clicked', {
          detail: this,
        })
      );
    };
    return result;
  }

  empty() {
    this.piece = undefined;
  }

  place(piece: Piece) {
    this.piece = piece;
  }
}

export class Piece {
  name: string;
  isRoyal: boolean;
  constructor(
    public color: Color,
    public game?: Game,
    public state?: BoardState
  ) {
    // this.squares = this.game?.state.squares;
  }
  legalMoves(row: number, col: number, game: Game): Move[] {
    return [];
  }
  toString(): string {
    return this.name; // graphic here later or unicode
  }

  get img(): string {
    // override
    return this.color === Color.WHITE ? '_lt.png' : '_dt.png';
  }

  render(): HTMLElement {
    const result = document.createElement('div');
    result.setAttribute('class', 'piece');
    result.style.backgroundImage = `url(../src/chess/img/${this.img})`;
    return result;
  }
}

class Leaper extends Piece {
  moves: Pair[];
  legalMoves(row: number, col: number, game: Game): Move[] {
    const {state} = game;
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
      const isCapture = occupant && occupant.color !== this.color;

      moves.push({
        before: state,
        after: new BoardState(state.squares)
          .place(this, target.row, target.col)
          .empty(row, col),
        piece: this,
        start: {row, col},
        end: target,
        isCapture,
        captured: occupant ? [occupant] : [],
        color: this.color,
        type: MoveType.MOVE,
      });
    }
    return moves;
  }
}

class Rider extends Piece {
  moves: Pair[];
  legalMoves(row: number, col: number, game: Game): Move[] {
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
    ).flatMap((dir) => this.ride(row, col, dir.row, dir.col, game));
  }

  private ride(
    row: number,
    col: number,
    rowDir: number,
    colDir: number,
    game: Game
  ): Move[] {
    // ride in one direction until we hit the edge of board or another piece
    const moves: Move[] = [];
    const {state} = game;
    let square = this.state.getSquare(row + rowDir, col + colDir);

    while (square) {
      if (!square.occupant || square.occupant.color !== this.color) {
        const isCapture =
          square.occupant && square.occupant.color !== this.color;
        moves.push({
          before: state,
          after: new BoardState(state.squares)
            .place(this, square.row, square.col)
            .empty(row, col),
          piece: this,
          start: {row, col},
          end: square,
          isCapture,
          captured: isCapture ? [square.occupant] : [],
          color: this.color,
          type: MoveType.MOVE,
        });
      }
      if (square.occupant) {
        break;
      }
      square = this.state.getSquare(square.row + row, square.col + col);
    }
    return moves;
  }
}

// Pieces

class Bishop extends Rider {
  name = 'B';
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

class Rook extends Rider {
  name = 'R';
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

class Knight extends Leaper {
  name = 'N';
  moves = [{row: 1, col: 2}];

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

class Queen extends Rider {
  name = 'Q';
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

class King extends Leaper {
  name = 'K';
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

class Pawn extends Piece {
  name = 'P';
  legalMoves(row: number, col: number, game: Game): Move[] {
    const {moveHistory, state} = game;
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
      return !square.occupant;
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
        after: new BoardState(state.squares)
          .place(this, target.row, target.col)
          .empty(row, col),
        piece: this,
        start: {row, col},
        end: target,
        isCapture: false,
        captured: [],
        color: this.color,
        type: MoveType.MOVE,
      });
    }
    for (const target of captureTargets) {
      moves.push({
        before: state,
        after: new BoardState(state.squares)
          .place(this, target.row, target.col)
          .empty(row, col),
        piece: this,
        start: {row, col},
        end: target,
        isCapture: true,
        captured: [state.getSquare(target.row, target.col).occupant],
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
        const captured = isCapture ? [lastMove.piece] : [];
        const color = this.color;
        const type = MoveType.ENPASSANT;

        const after = new BoardState(this.state.squares)
          .place(this, end.row, end.col)
          .empty(row, col);
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
      return 'pdt45.png';
    } else if (this.color === Color.WHITE) {
      return 'plt45.png';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
}

// Game state

export class Game {
  state: BoardState;
  moveHistory: Move[];
  stateHistory: BoardState[];

  // PAWN_HOME_RANK = 1;

  constructor(initial: BoardState) {
    this.state = initial;
    this.moveHistory = [];
    this.stateHistory = [];
  }

  get rules(): string {
    throw NotImplementedError;
  }

  place(piece: Piece, row: number, col: number) {
    this.state.place(piece, row, col);
    piece.game = this;
  }

  winCondition(color: Color, state: BoardState): boolean {
    throw NotImplementedError;
  }

  move() {
    // state.attemptMove (x2 for double chess)
    // captureEffects
    // winCondition
  }

  // override in variants
  attemptMove(piece: Piece, row: number, col: number, target: Square) {
    const legalMoves = piece
      .legalMoves(row, col, this)
      .filter(this.isMoveLegal);
    const legalMove = legalMoves.find((move) => equals(move.end, target));
    if (!legalMove) {
      console.log('invalid move', piece.name, target);
      console.log('legal moves are', legalMoves);
      return; // invalid move
    }
    if (legalMove.isCapture) {
      this.captureEffects();
    }

    // before and after are same object
    this.moveHistory.push(legalMove);
    this.stateHistory.push(legalMove.after);
    this.state = legalMove.after;
  }

  isMoveLegal(move: Move): boolean {
    if (
      move.end.row < 0 ||
      move.end.row >= this.state.ranks ||
      move.end.col < 0 ||
      move.end.col >= this.state.files
    ) {
      return false;
    }
    // check
    return true;
  }

  captureEffects() {
    // in atomic chess, explode, etc.
  }
}

interface PlacePieces {
  [key: string]: Piece;
}

export class BoardState {
  ranks: number = 8;
  files: number = 8;
  squares: Square[][];
  game: Game;

  constructor(squares: Square[][]) {
    this.ranks = squares.length;
    this.files = squares[0].length;
    for (const row of squares) {
      const newRow = [];
      for (const square of row) {
        const newSquare = new Square(square.row, square.col);
        newRow.push(newSquare);
        if (square.occupant) {
          newSquare.place(square.occupant);
        }
      }
    }
    this.squares = squares;
  }

  static create(ranks: number, files: number, pieces?: PlacePieces) {
    const p = pieces ?? [];
    const squares = [] as Square[][];
    for (let i = 0; i < ranks; i++) {
      const rank = [] as Square[];
      for (let j = 0; j < files; j++) {
        const square = new Square(i, j);
        rank.push(square);
        const piece: Piece | undefined = p[hash({row: i, col: j})];
        if (piece) {
          square.place(piece);
        }
      }
      squares.push(rank);
    }
    const state = new BoardState(squares);
    for (const piece of Object.values(p)) {
      piece.state = state;
    }
    return state;
  }

  // get pieces(): Piece[] {
  //   const result: Piece[] = [];
  //   for (const row of this.squares) {
  //     for (const square of row) {
  //       if (square.occupant) {
  //         result.push(square.occupant);
  //       }
  //     }
  //   }
  //   return result;
  // }

  place(piece: Piece, row: number, col: number): BoardState {
    const square = this.getSquare(row, col);
    if (!square) {
      throw new Error('square out of bounds' + row + ',' + col);
    }
    square.place(piece);
    return this;
  }

  empty(row: number, col: number): BoardState {
    const square = this.getSquare(row, col);
    if (!square) {
      throw new Error('square out of bounds' + row + ',' + col);
    }
    square.empty();
    return this;
  }

  getSquare(row: number, col: number): Square | undefined {
    return this.squares[row]?.[col];
  }

  toString(): string {
    let result = '';
    for (const row of this.squares) {
      for (const square of row) {
        result += square.toString();
      }
      result += '<br>';
    }
    return result;
  }

  // isInCheck(color: Color): boolean {
  //   const opposingPieces = this.squares
  //     .flat()
  //     .map((square) => square.occupant)
  //     .filter((occupant) => !!occupant && occupant.color !== color);
  //   const opposingControlledSquares = dedup(
  //     opposingPieces.flatMap((piece) => piece!.legalMoves())
  //   );
  //   const ownRoyalSquares = this.squares
  //     .flat()
  //     .filter(
  //       (square) =>
  //         !!square.occupant &&
  //         square.occupant.color === color &&
  //         square.occupant.isRoyal
  //     );

  //   return ownRoyalSquares.some((square) =>
  //     opposingControlledSquares.map(hash).includes(hash(square))
  //   );
  // }

  render(): HTMLElement {
    const result = document.createElement('div');
    result.setAttribute('id', 'board');
    result.style.height = `${SQUARE_SIZE * this.squares.length}px`;
    result.style.width = `${SQUARE_SIZE * this.squares[0].length}px`;
    for (const row of this.squares) {
      const r = document.createElement('div');
      r.style.height = `${SQUARE_SIZE}px`;
      for (const square of row) {
        // result += `<div class="square" style="height:${SQUARE_SIZE}px;width:${SQUARE_SIZE}px">`;
        r.appendChild(square.render());
        // result += '</div>';
      }
      result.appendChild(r);
    }
    return result;
  }
}

interface Move {
  before: BoardState;
  after: BoardState;
  piece: Piece;
  start?: Pair;
  end?: Pair;
  isCapture: boolean;
  captured: Piece[];
  color: Color;
  type: string; // 'move', 'castle', etc.
}

// Playground

const SQUARE_SIZE = 50; //px
let SELECTED_PIECE: Piece | undefined;

// function renderBoardAscii(g: Game) {
//     const board = document.getElementById('board-ascii');
//     if (!board) {
//         console.log('no board found');
//         return;
//     }
//     board.innerHTML = `<div>${g.state.toString()}</div>`;
// }

// function renderBoard(g: Game) {
//     const container = document.getElementById('container');
//     if (!container) {
//         console.log('no board found');
//         return;
//     }
//     if (container.firstElementChild) {
//         container.removeChild(container.firstElementChild);
//     }
//     container.appendChild(g.state.render());
//     // board.innerHTML = `<div>${g.state.render()}</div>`;
// }

const stdPos = {
  '0,0': new Rook(Color.BLACK),
  '0,1': new Knight(Color.BLACK),
  '0,2': new Bishop(Color.BLACK),
  '0,3': new Queen(Color.BLACK),
  '0,4': new King(Color.BLACK),
  '0,5': new Bishop(Color.BLACK),
  '0,6': new Knight(Color.BLACK),
  '0,7': new Rook(Color.BLACK),
  '1,0': new Pawn(Color.BLACK),
  '1,1': new Pawn(Color.BLACK),
  '1,2': new Pawn(Color.BLACK),
  '1,3': new Pawn(Color.BLACK),
  '1,4': new Pawn(Color.BLACK),
  '1,5': new Pawn(Color.BLACK),
  '1,6': new Pawn(Color.BLACK),
  '1,7': new Pawn(Color.BLACK),
  '6,0': new Pawn(Color.WHITE),
  '6,1': new Pawn(Color.WHITE),
  '6,2': new Pawn(Color.WHITE),
  '6,3': new Pawn(Color.WHITE),
  '6,4': new Pawn(Color.WHITE),
  '6,5': new Pawn(Color.WHITE),
  '6,6': new Pawn(Color.WHITE),
  '6,7': new Pawn(Color.WHITE),
  '7,0': new Rook(Color.WHITE),
  '7,1': new Knight(Color.WHITE),
  '7,2': new Bishop(Color.WHITE),
  '7,3': new Queen(Color.WHITE),
  '7,4': new King(Color.WHITE),
  '7,5': new Bishop(Color.WHITE),
  '7,6': new Knight(Color.WHITE),
  '7,7': new Rook(Color.WHITE),
};

export const STD_BOARD = BoardState.create(8, 8, stdPos);
export const STD_GAME = new Game(BoardState.create(8, 8, stdPos));
// game.place(new Rook(Color.BLACK) , 3, 3);
// game.place(new Queen(Color.WHITE) , 2, 2);

// renderBoardAscii(game);
// renderBoard(game);
