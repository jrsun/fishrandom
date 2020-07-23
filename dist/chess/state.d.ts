import Square from './square';
import { Piece } from './piece';
export default class BoardState {
    ranks: number;
    files: number;
    squares: Square[][];
    constructor(squares: Square[][]);
    place(piece: Piece, row: number, col: number): BoardState;
    empty(row: number, col: number): BoardState;
    getSquare(row: number, col: number): Square | undefined;
    toString(): string;
}
//# sourceMappingURL=state.d.ts.map