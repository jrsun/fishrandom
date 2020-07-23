import { LitElement } from 'lit-element';
import { Piece } from '../chess/piece';
import Square from '../chess/square';
import { Color } from '../chess/const';
import './my-piece';
/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
export declare class MySquare extends LitElement {
    static styles: import("lit-element").CSSResult;
    square: Square;
    piece?: Piece;
    color?: Color;
    selected: boolean;
    possible: boolean;
    render(): import("lit-element").TemplateResult;
    private _onClick;
}
declare global {
    interface HTMLElementTagNameMap {
        'my-square': MySquare;
    }
}
//# sourceMappingURL=my-square.d.ts.map