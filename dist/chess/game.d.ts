import BoardState from './state';
import Move from './move';
import { Piece } from './piece';
import Square from './square';
import { Color } from './const';
export declare class Game {
    state: BoardState;
    moveHistory: Move[];
    stateHistory: BoardState[];
    constructor(initial?: BoardState);
    get rules(): string;
    place(piece: Piece, row: number, col: number): void;
    winCondition(color: Color, state: BoardState): boolean;
    move(): void;
    attemptMove(piece: Piece, row: number, col: number, target: Square): void;
    castle(color: Color, row: number, col: number, kingside: boolean): void;
    isMoveLegal(move: Move): boolean;
    isInCheck(color: Color, state: BoardState): boolean;
    isAttackedSquare(color: Color, state: BoardState, row: number, col: number): boolean;
    captureEffects(): void;
}
//# sourceMappingURL=game.d.ts.map