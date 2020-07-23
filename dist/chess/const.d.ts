interface Pair {
    row: number;
    col: number;
}
declare const SQUARE_SIZE = 50;
declare function equals(a: Pair, b: Pair): boolean;
declare function dedup(l: Pair[]): Pair[];
declare function hash(p: Pair): string;
declare function unhash(s: string): Pair;
declare const NotImplementedError: Error;
declare const PAWN_HOME_RANK = 1;
declare enum Color {
    WHITE = "white",
    BLACK = "black"
}
declare enum MoveType {
    MOVE = "move",
    CASTLE = "castle",
    ENPASSANT = "enpassant"
}
export { SQUARE_SIZE, Pair, equals, dedup, hash, unhash, NotImplementedError, PAWN_HOME_RANK, Color, MoveType, };
//# sourceMappingURL=const.d.ts.map