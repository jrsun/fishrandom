import { Piece } from './piece';
export default class Square {
    row: number;
    col: number;
    piece?: Piece;
    constructor(row: number, col: number);
    get occupant(): Piece | undefined;
    toString(): string;
    render(): HTMLElement;
    empty(): void;
    place(piece: Piece): void;
}
//# sourceMappingURL=square.d.ts.map