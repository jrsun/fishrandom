import { dedup, PAWN_HOME_RANK, Color, MoveType, } from './const';
import BoardState from './state';
// Classes
export class Piece {
    constructor(color) {
        this.color = color;
        // this.squares = this.game?.state.squares;
    }
    legalMoves(row, col, state, moveHistory) {
        return [];
    }
    toString() {
        return this.name; // graphic here later or unicode
    }
    get img() {
        // override
        return this.color === Color.WHITE ? '_lt.png' : '_dt.png';
    }
    render() {
        const result = document.createElement('div');
        result.setAttribute('class', 'piece');
        result.style.backgroundImage = `url(/dist/img/${this.img})`;
        return result;
    }
}
class Leaper extends Piece {
    legalMoves(row, col, state) {
        var _a;
        let targets = this.moves
            .flatMap((move) => [-1, 1]
            .map((sign) => move.row * sign)
            .flatMap((first) => [-1, 1].flatMap((sign) => [
            {
                row: first,
                col: move.col * sign,
            },
            {
                row: move.col * sign,
                col: first,
            },
        ])))
            .map((relative) => ({ row: row + relative.row, col: col + relative.col }));
        targets = targets.filter((target) => !(target.row < 0 ||
            target.col < 0 ||
            target.row >= state.ranks ||
            target.col >= state.files));
        targets = targets.filter((target) => {
            var _a;
            const occupant = (_a = state.getSquare(target.row, target.col)) === null || _a === void 0 ? void 0 : _a.occupant;
            return !occupant || occupant.color !== this.color;
        });
        const moves = [];
        for (const target of dedup(targets)) {
            const occupant = (_a = state.getSquare(target.row, target.col)) === null || _a === void 0 ? void 0 : _a.occupant;
            const isCapture = occupant && occupant.color !== this.color;
            moves.push({
                before: state,
                after: new BoardState(state.squares)
                    .place(this, target.row, target.col)
                    .empty(row, col),
                piece: this,
                start: { row, col },
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
    legalMoves(row, col, state) {
        return dedup(this.moves.flatMap((move) => [-1, 1]
            .map((sign) => move.row * sign)
            .flatMap((first) => [-1, 1].flatMap((sign) => [
            {
                row: first,
                col: move.col * sign,
            },
            {
                row: move.col * sign,
                col: first,
            },
        ])))).flatMap((dir) => this.ride(row, col, dir.row, dir.col, state));
    }
    ride(row, col, rowDir, colDir, state) {
        // ride in one direction until we hit the edge of board or another piece
        const moves = [];
        let square = state.getSquare(row + rowDir, col + colDir);
        while (square) {
            if (!square.occupant || square.occupant.color !== this.color) {
                const isCapture = square.occupant && square.occupant.color !== this.color;
                moves.push({
                    before: state,
                    after: new BoardState(state.squares)
                        .place(this, square.row, square.col)
                        .empty(row, col),
                    piece: this,
                    start: { row, col },
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
            square = state.getSquare(square.row + rowDir, square.col + colDir);
        }
        return moves;
    }
}
// Pieces
export class Bishop extends Rider {
    constructor() {
        super(...arguments);
        this.name = 'B';
        this.moves = [{ row: 1, col: 1 }];
    }
    get img() {
        if (this.color === Color.BLACK) {
            return 'bdt.png';
        }
        else if (this.color === Color.WHITE) {
            return 'blt.png';
        }
        throw new Error('no image for color: ' + this.color + 'for piece ' + this.name);
    }
}
export class Rook extends Rider {
    constructor() {
        super(...arguments);
        this.name = 'R';
        this.moves = [{ row: 1, col: 0 }];
    }
    get img() {
        if (this.color === Color.BLACK) {
            return 'rdt45.png';
        }
        else if (this.color === Color.WHITE) {
            return 'rlt45.png';
        }
        throw new Error('no image for color: ' + this.color + 'for piece ' + this.name);
    }
}
export class Knight extends Leaper {
    constructor() {
        super(...arguments);
        this.name = 'N';
        this.moves = [{ row: 1, col: 2 }];
    }
    get img() {
        if (this.color === Color.BLACK) {
            return 'ndt26.png';
        }
        else if (this.color === Color.WHITE) {
            return 'nlt.png';
        }
        throw new Error('no image for color: ' + this.color + 'for piece ' + this.name);
    }
}
export class Queen extends Rider {
    constructor() {
        super(...arguments);
        this.name = 'Q';
        this.moves = [
            { row: 1, col: 1 },
            { row: 1, col: 0 },
        ];
    }
    get img() {
        if (this.color === Color.BLACK) {
            return 'qdt45.png';
        }
        else if (this.color === Color.WHITE) {
            return 'qlt45.png';
        }
        throw new Error('no image for color: ' + this.color + 'for piece ' + this.name);
    }
}
export class King extends Leaper {
    constructor() {
        super(...arguments);
        this.name = 'K';
        this.moves = [
            { row: 1, col: 1 },
            { row: 1, col: 0 },
        ];
        this.isRoyal = true;
    }
    get img() {
        if (this.color === Color.BLACK) {
            return 'kdt45.png';
        }
        else if (this.color === Color.WHITE) {
            return 'klt.png';
        }
        throw new Error('no image for color: ' + this.color + 'for piece ' + this.name);
    }
}
export class Pawn extends Piece {
    constructor() {
        super(...arguments);
        this.name = 'P';
    }
    legalMoves(row, col, state, moveHistory) {
        // normal move. 2 step. capture, en passant
        const yDir = this.color === Color.WHITE ? -1 : 1;
        let moveTargets = [{ row: row + yDir, col }];
        // 2 move
        if ((row === PAWN_HOME_RANK && this.color === Color.BLACK) ||
            (row === state.ranks - PAWN_HOME_RANK - 1 && this.color === Color.WHITE)) {
            moveTargets.push({ row: row + 2 * yDir, col });
        }
        moveTargets = moveTargets.filter((target) => {
            const square = state.getSquare(target.row, target.col);
            return !square.occupant;
        });
        let captureTargets = [
            { row: row + yDir, col: col - 1 },
            { row: row + yDir, col: col + 1 },
        ];
        captureTargets = captureTargets.filter((target) => {
            var _a;
            const occupant = (_a = state.getSquare(target.row, target.col)) === null || _a === void 0 ? void 0 : _a.occupant;
            return occupant && occupant.color !== this.color;
        });
        const moves = [];
        for (const target of moveTargets) {
            moves.push({
                before: state,
                after: new BoardState(state.squares)
                    .place(this, target.row, target.col)
                    .empty(row, col),
                piece: this,
                start: { row, col },
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
                start: { row, col },
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
    enPassant(row, col, state, moveHistory) {
        const yDir = this.color === Color.WHITE ? -1 : 1;
        // en passant
        if (moveHistory.length) {
            const lastMove = moveHistory[moveHistory.length - 1];
            if (lastMove.piece instanceof Pawn &&
                lastMove.piece.color !== this.color &&
                Math.abs(lastMove.end.col - col) === 1 &&
                Math.abs(lastMove.end.row - lastMove.start.row) === 2 &&
                lastMove.end.row === row) {
                // need to copy state for history
                const before = state;
                const start = { row, col };
                const end = { row: row + yDir, col: lastMove.end.col };
                const isCapture = true;
                const captured = isCapture ? [lastMove.piece] : [];
                const color = this.color;
                const type = MoveType.ENPASSANT;
                const after = new BoardState(state.squares)
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
    get img() {
        if (this.color === Color.BLACK) {
            return 'pdt45.png';
        }
        else if (this.color === Color.WHITE) {
            return 'plt45.png';
        }
        throw new Error('no image for color: ' + this.color + 'for piece ' + this.name);
    }
}
// interface PlacePieces {
//   [key: string]: Piece;
// }
// Playground
// const SQUARE_SIZE = 50; //px
// let SELECTED_PIECE: Piece | undefined;
// const stdPos = {
//   '0,0': new Rook(Color.BLACK),
//   '0,1': new Knight(Color.BLACK),
//   '0,2': new Bishop(Color.BLACK),
//   '0,3': new Queen(Color.BLACK),
//   '0,4': new King(Color.BLACK),
//   '0,5': new Bishop(Color.BLACK),
//   '0,6': new Knight(Color.BLACK),
//   '0,7': new Rook(Color.BLACK),
//   '1,0': new Pawn(Color.BLACK),
//   '1,1': new Pawn(Color.BLACK),
//   '1,2': new Pawn(Color.BLACK),
//   '1,3': new Pawn(Color.BLACK),
//   '1,4': new Pawn(Color.BLACK),
//   '1,5': new Pawn(Color.BLACK),
//   '1,6': new Pawn(Color.BLACK),
//   '1,7': new Pawn(Color.BLACK),
//   '6,0': new Pawn(Color.WHITE),
//   '6,1': new Pawn(Color.WHITE),
//   '6,2': new Pawn(Color.WHITE),
//   '6,3': new Pawn(Color.WHITE),
//   '6,4': new Pawn(Color.WHITE),
//   '6,5': new Pawn(Color.WHITE),
//   '6,6': new Pawn(Color.WHITE),
//   '6,7': new Pawn(Color.WHITE),
//   '7,0': new Rook(Color.WHITE),
//   '7,1': new Knight(Color.WHITE),
//   '7,2': new Bishop(Color.WHITE),
//   '7,3': new Queen(Color.WHITE),
//   '7,4': new King(Color.WHITE),
//   '7,5': new Bishop(Color.WHITE),
//   '7,6': new Knight(Color.WHITE),
//   '7,7': new Rook(Color.WHITE),
// };
// export const STD_BOARD = BoardState.create(8, 8, stdPos);
// export const STD_GAME = new Game(BoardState.create(8, 8, stdPos));
//# sourceMappingURL=piece.js.map