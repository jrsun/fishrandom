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
import {BoardState, Game, STD_GAME, Piece, Square} from './chess/piece';
import './ui/my-square';
import { styleMap } from 'lit-html/directives/style-map';
import {SQUARE_SIZE, Color} from './chess/const';

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('my-element')
export class MyElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
      max-width: 800px;
    }

    #board {
      background-image: url('../img/bg.svg');
      display: inline-block;
    }

    .row {
      height: ${SQUARE_SIZE}px;
    }
  `;

  // public
  @property({type: String}) color?: Color;
  @property({type: Object}) game: Game = STD_GAME;

  // protected
  @property({type: Object}) selectedPiece: Piece|undefined;
  @property({type: Object}) selectedSquare: Square|undefined;

  /**
   * The number of times the button has been clicked.
   */
  @property({type: Number})
  count = 0;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('square-clicked', this.onSquareClicked.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('square-clicked', this.onSquareClicked.bind(this));
  }

  render() {
    const state = this.game.state;

    this.style.setProperty('height', `${SQUARE_SIZE*state.squares.length}px`);
    this.style.setProperty('width', `${SQUARE_SIZE*state.squares[0].length}px`);
    if (this.color === Color.BLACK) {
      this.style.setProperty('transform', 'rotate(180deg)');
    }

    return html`
      <div id="board">
        ${state.squares.map(row => html`<div class="row">
          ${row.map(square => html`<my-square
            .square=${square}
            .piece=${square.occupant}
            .selected=${square === this.selectedSquare}
            .possible=${this.possibleMoves.includes(square)}
            .color=${this.color}>`)}
        </div>`)}
      </div>
    `;
  }

  private onSquareClicked(e: CustomEvent) {
    // There's a bug here where updating the game using attemptMove doesn't cause rerender.
    const square = e.detail as Square;
    // this.selectedSquare = square;
    if (this.selectedPiece) {
      if (this.selectedPiece === square.occupant) {
        this.selectedPiece = null;
        return;
      }
      const result = this.game.attemptMove(this.selectedPiece.color, this.selectedPiece, square);
      if (result) {
        this.selectedPiece = null;
        return;
      }
    }

    this.selectedPiece = square.occupant;
    this.performUpdate();
  }

  get possibleMoves(): Square[] {
    if (!this.selectedPiece) return [];

    return this.selectedPiece.legalMoves().map(pair => this.game.state.getSquare(pair.row, pair.col));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
