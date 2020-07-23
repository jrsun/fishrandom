import { Pair, Color } from './const';
import { Piece } from './piece';
import BoardState from './state';
export default interface Move {
    before: BoardState;
    after: BoardState;
    piece?: Piece;
    start?: Pair;
    end?: Pair;
    isCapture: boolean;
    captured: Piece[];
    color: Color;
    type: string;
}
//# sourceMappingURL=move.d.ts.map