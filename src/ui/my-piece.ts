/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

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
    .piece {
      height: 100%;
      width: 100%;
      display: inline-block;
      background-image: url('/img/_dt.png');
      background-size: cover;
      position: absolute;
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
        style="background-image:url(/img/${this.piece.img});
          top:${this.piece.name === 'P' ? '-6px': '0'}"
      ></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-piece': MyPiece;
  }
}