import {LitElement, html, customElement, property, css} from 'lit-element';
import {Piece} from '../chess/piece';

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('my-piece')
export class MyPiece extends LitElement {
  static styles = css`
    :host {
      height: 100%;
      width: 100%;
      display: inline-block;
      /* background-image: url('/img/_dt.png'); */
      /* background-size: cover; */
      position: absolute;
    }
    .piece {
      height: 100%;
      width: 100%;
      /* display: inline-block;
      background-image: url('/img/_dt.png'); */
      background-size: cover;
      position: absolute;
      cursor: pointer;
    }
  `;

  /**
   * The name to say "Hello" to.
   */
  @property({type: Object})
  piece: Piece;

  render() {
    return html`
      <div
        class="piece ${this.piece.name}"
        style="background-image:url(/img/${this.piece.img});"
      ></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-piece': MyPiece;
  }
}
