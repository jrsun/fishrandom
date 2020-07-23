import Square from './square';
export default class BoardState {
    constructor(squares) {
        this.ranks = 8;
        this.files = 8;
        this.ranks = squares.length;
        this.files = squares[0].length;
        const newSquares = [];
        for (const row of squares) {
            const newRow = [];
            for (const square of row) {
                const newSquare = new Square(square.row, square.col);
                newRow.push(newSquare);
                if (square.occupant) {
                    newSquare.place(square.occupant);
                }
            }
            newSquares.push(newRow);
        }
        this.squares = newSquares;
    }
    place(piece, row, col) {
        const square = this.getSquare(row, col);
        if (!square) {
            throw new Error('square out of bounds' + row + ',' + col);
        }
        square.place(piece);
        return this;
    }
    empty(row, col) {
        const square = this.getSquare(row, col);
        if (!square) {
            throw new Error('square out of bounds' + row + ',' + col);
        }
        square.empty();
        return this;
    }
    getSquare(row, col) {
        var _a;
        return (_a = this.squares[row]) === null || _a === void 0 ? void 0 : _a[col];
    }
    toString() {
        let result = '';
        for (const row of this.squares) {
            for (const square of row) {
                result += square.toString();
            }
            result += '<br>';
        }
        return result;
    }
}
//# sourceMappingURL=state.js.map