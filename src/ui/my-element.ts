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

import {
  LitElement,
  html,
  customElement,
  property,
  css,
} from '../../node_modules/lit-element';
import {Piece} from '../chess/piece';
import Square from '../chess/square';
// import {MoveMessage} from '../common/message';
import {replacer, reviver} from '../common/message';
import './my-square';
import {Game} from '../chess/game';
import {Move} from '../chess/move';
import {styleMap} from 'lit-html/directives/style-map';
import {SQUARE_SIZE, Color} from '../chess/const';

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
      /* border: solid 1px gray; */
      margin: 20px;
      max-width: 800px;
      padding: 10px;
      background-color: #efece0;
      padding: 30px;
      border-radius: 4px;
      box-shadow: 0px 7px #dad4c8;
    }

    #board {
      background-image: url('/img/bg.svg');
      border-radius: 4px;
      display: inline-block;
    }

    .row {
      height: ${SQUARE_SIZE}px;
    }
  `;

  // public
  @property({type: String}) color?: Color;
  @property({type: Object}) game: Game = new Game();

  // protected
  @property({type: Object}) selectedPiece: Piece | undefined;
  @property({type: Object}) selectedSquare: Square | undefined;

  private socket: WebSocket;

  /**
   * The number of times the button has been clicked.
   */
  @property({type: Number})
  count = 0;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('square-clicked', this.onSquareClicked.bind(this));

    this.socket = new WebSocket('ws://localhost:8081');
    this.socket.onopen = function (e) {}.bind(this);
    this.socket.onmessage = this.handleSocketMessage.bind(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('square-clicked', this.onSquareClicked.bind(this));
  }

  handleSocketMessage(e: MessageEvent) {
    const message = JSON.parse(e.data, reviver);
    console.log('Received message of type %s', message.type);
    console.log(message);
    if (message.type === 'move') {
      const {start, end} = message.data as Move;
      this.game.attemptMove(
        this.game.state.getSquare(start.row, start.col)?.occupant,
        start.row,
        start.col,
        end.row,
        end.col
      );
    }
    this.performUpdate();
  }

  render() {
    const state = this.game.state;

    this.style.setProperty('height', `${SQUARE_SIZE * state.squares.length}px`);
    this.style.setProperty(
      'width',
      `${SQUARE_SIZE * state.squares[0].length}px`
    );
    if (this.color === Color.BLACK) {
      this.style.setProperty('transform', 'rotate(180deg)');
    }

    return html`
      <div id="board">
        ${state.squares.map(
          (row) => html`<div class="row">
            ${row.map(
              (square) => html`<my-square
                .square=${square}
                .piece=${square.occupant}
                .selected=${square === this.selectedSquare}
                .possible=${this.possibleMoves.includes(square)}
                .color=${this.color}
              ></my-square>`
            )}
          </div>`
        )}
      </div>
    `;
  }

  private onSquareClicked(e: CustomEvent) {
    // There's a bug here where updating the game using attemptMove doesn't cause rerender.
    const square = e.detail as Square;
    if (this.selectedPiece) {
      const move = this.game.attemptMove(
        this.selectedPiece,
        this.selectedSquare.row,
        this.selectedSquare.col,
        square.row,
        square.col
      );

      this.selectedSquare = null;
      this.selectedPiece = null;
      if (!move) {
        return;
      }
      this.socket.send(
        JSON.stringify(
          {
            type: 'move',
            data: move,
          },
          replacer
        )
      );
    } else {
      this.selectedSquare = square;
      this.selectedPiece = square.occupant;
    }
    this.performUpdate();
  }

  get possibleMoves(): Square[] {
    if (!this.selectedPiece) return [];

    return this.selectedPiece
      .legalMoves(
        this.selectedSquare.row,
        this.selectedSquare.col,
        this.game.state,
        this.game.moveHistory
      )
      .filter((move) => {
        return this.game.isMoveLegal(move);
      })
      .map((move) => this.game.state.getSquare(move.end.row, move.end.col));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
