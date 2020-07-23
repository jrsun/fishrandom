import { Pair, Color } from './const';
import Move from './move';
import BoardState from './state';
export declare class Piece {
    color: Color;
    name: string;
    isRoyal: boolean;
    constructor(color: Color);
    legalMoves(row: number, col: number, state: BoardState, moveHistory: Move[]): Move[];
    toString(): string;
    get img(): string;
    render(): HTMLElement;
}
declare class Leaper extends Piece {
    moves: Pair[];
    legalMoves(row: number, col: number, state: BoardState): Move[];
}
declare class Rider extends Piece {
    moves: Pair[];
    legalMoves(row: number, col: number, state: BoardState): Move[];
    private ride;
}
export declare class Bishop extends Rider {
    name: string;
    moves: {
        row: number;
        col: number;
    }[];
    get img(): string;
}
export declare class Rook extends Rider {
    name: string;
    moves: {
        row: number;
        col: number;
    }[];
    get img(): string;
}
export declare class Knight extends Leaper {
    name: string;
    moves: {
        row: number;
        col: number;
    }[];
    get img(): string;
}
export declare class Queen extends Rider {
    name: string;
    moves: {
        row: number;
        col: number;
    }[];
    get img(): string;
}
export declare class King extends Leaper {
    name: string;
    moves: {
        row: number;
        col: number;
    }[];
    isRoyal: boolean;
    get img(): string;
}
export declare class Pawn extends Piece {
    name: string;
    legalMoves(row: number, col: number, state: BoardState, moveHistory: Move[]): Move[];
    private enPassant;
    promote(): void;
    get img(): string;
}
export {};
//# sourceMappingURL=piece.d.ts.map