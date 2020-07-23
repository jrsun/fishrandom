export default class Square {
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }
    get occupant() {
        return this.piece;
    }
    toString() {
        if (this.occupant) {
            return `[${this.occupant.toString()}]`;
        }
        return '[ ]';
    }
    render() {
        const result = document.createElement('div');
        result.setAttribute('class', 'square');
        // result.style.height = `${SQUARE_SIZE}px`;
        // result.style.width = `${SQUARE_SIZE}px`;
        if (this.occupant) {
            result.appendChild(this.occupant.render());
        }
        result.onclick = (e) => {
            result.dispatchEvent(new CustomEvent('square-clicked', {
                detail: this,
            }));
        };
        return result;
    }
    empty() {
        this.piece = undefined;
    }
    place(piece) {
        this.piece = piece;
    }
}
//# sourceMappingURL=square.js.map