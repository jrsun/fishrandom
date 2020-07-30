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
import {
  replacer,
  reviver,
  Message,
  MoveMessage,
  ReplaceMessage,
  AppendMessage,
  ReplaceAllMessage,
  InitGameMessage,
  addMessageHandler,
} from '../common/message';
import {drawArrow} from '../utils';
import './my-square';
import {VARIANTS} from '../chess/variants';
import {Game} from '../chess/game';
import {Move, toFEN} from '../chess/move';
import {styleMap} from 'lit-html/directives/style-map';
import {Color} from '../chess/const';
import BoardState from '../chess/state';
import {Chess960} from '../chess/variants/960';
import {equals} from '../chess/pair';

const SQUARE_SIZE = Math.min(window.innerWidth / 12, 50); // 50
/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('my-element')
export class MyElement extends LitElement {
  static styles = css`
    /* :host {
      display: block;
      margin: 20px;
      max-width: 800px;
      padding: 10px;
      background-color: #efece0;
      padding: 30px;
      border-radius: 4px;
      box-shadow: 0px 7px #dad4c8;
    } */

    #board {
      background-image: url('/img/bg.svg');
      border-radius: 4px;
      display: inline-block;
      position: relative;
    }

    #canvas {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      pointer-events: none;
      height: 100%;
      z-index: 1;
    }

    .row {
      height: ${SQUARE_SIZE}px;
    }
  `;

  // public
  @property({type: String}) color: Color = Color.WHITE;
  @property({type: Object}) game: Game;
  @property({type: Object}) socket: WebSocket;
  @property({type: Object}) viewHistoryState: BoardState | undefined;

  // protected
  @property({type: Object}) selectedPiece: Piece | undefined;
  @property({type: Object}) selectedSquare: Square | undefined;
  @property({type: Object}) arrowStartSquare: Square | undefined;

  /**
   * The number of times the button has been clicked.
   */
  @property({type: Number})
  count = 0;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('square-clicked', this.onSquareClicked.bind(this));
    this.addEventListener(
      'square-mousedown',
      this.onSquareMousedown.bind(this)
    );
    this.addEventListener('square-mouseup', this.onSquareMouseup.bind(this));
    // this.addEventListener('contextmenu', e => {e.preventDefault()});
    addMessageHandler(this.socket, this.handleSocketMessage.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('square-clicked', this.onSquareClicked.bind(this));
    this.removeEventListener(
      'square-mousedown',
      this.onSquareMousedown.bind(this)
    );
    this.removeEventListener('square-mouseup', this.onSquareMouseup.bind(this));

    this.socket.removeEventListener(
      'message',
      this.handleSocketMessage.bind(this)
    );
  }

  updated(changedProperties) {
    if (changedProperties.has('socket')) {
      addMessageHandler(this.socket, this.handleSocketMessage.bind(this));
    }
  }

  handleSocketMessage(message: Message) {
    // const message: Message = JSON.parse(e.data, reviver);
    if (message.type === 'replaceState') {
      const rm = message as ReplaceMessage;
      const {move} = rm;
      const {moveHistory, stateHistory} = this.game;
      // this._validateLastMove(move, moveHistory, state, stateHistory);
      this.game.moveHistory[this.game.moveHistory.length - 1] = move;
      this.game.stateHistory[this.game.stateHistory.length - 1] = move.after;
      this.game.state = move.after;
      console.log(toFEN(move));
    } else if (message.type === 'appendState') {
      const am = message as AppendMessage;
      const {move} = am;
      this.game.moveHistory.push(move);
      this.game.stateHistory.push(move.after);
      this.game.state = move.after;
      console.log(toFEN(move));
    } else if (message.type === 'replaceAll') {
      const ram = message as ReplaceAllMessage;
      const {moveHistory, stateHistory} = ram;
      this.game.moveHistory = moveHistory;
      this.game.stateHistory = stateHistory;
      this.game.state = stateHistory[stateHistory.length - 1];
    } else if (message.type === 'initGame') {
      const igm = message as InitGameMessage;
      this.color = igm.color;
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

    const lastMove = this.game.moveHistory[this.game.moveHistory.length - 1];

    return html`
      <div
        id="board"
        style=${this.color === Color.BLACK ? 'transform:rotate(180deg);' : ''}
      >
        <canvas id="canvas"></canvas>
        ${(this.viewHistoryState ?? state).squares.map(
          (row) => html`<div class="row">
            ${row.map(
              (square) => html`<my-square
                .square=${square}
                .piece=${square.occupant}
                .selected=${square === this.selectedSquare}
                .possible=${this.possibleMoves.includes(square)}
                .lastMove=${lastMove &&
                (equals(lastMove.start, square) ||
                  equals(lastMove.end, square))}
                .color=${this.color}
              ></my-square>`
            )}
          </div>`
        )}
      </div>
    `;
  }

  private onSquareClicked(e: CustomEvent) {
    if (this.viewHistoryState) return;

    this.eraseCanvas();
    // There's a bug here where updating the game using attemptMove doesn't cause rerender.
    const square = e.detail as Square;
    if (this.selectedPiece && this.selectedSquare) {
      const move = this.game.attemptMove(
        this.color,
        this.selectedPiece,
        this.selectedSquare.row,
        this.selectedSquare.col,
        square.row,
        square.col
      );

      this.selectedSquare = undefined;
      this.selectedPiece = undefined;
      if (!move) {
        return;
      }
      this.socket.send(
        JSON.stringify(
          {
            type: 'move',
            move,
          } as MoveMessage,
          replacer
        )
      );
    } else {
      this.selectedSquare = square;
      this.selectedPiece = square.occupant;
    }
    this.performUpdate();
  }

  private onSquareMousedown(e: CustomEvent) {
    const square = e.detail as Square;
    this.arrowStartSquare = square;
  }
  private onSquareMouseup(e: CustomEvent) {
    if (!this.arrowStartSquare) return;
    const square = e.detail as Square;
    const {row, col} = this.arrowStartSquare;
    this.arrowStartSquare = undefined;

    if (row === square.row && col === square.col) return;
    this.drawArrow(row, col, square.row, square.col);
  }

  // updated() {
  //   this.drawArrow(1, 4, 3, 4);
  // }

  get possibleMoves(): Square[] {
    if (!this.selectedPiece || !this.selectedSquare) return [];

    const squares = this.selectedPiece!.legalMoves(
      this.selectedSquare!.row,
      this.selectedSquare!.col,
      this.game.state,
      this.game.moveHistory
    )
      .filter((move) => {
        return this.game.isMoveLegal(move);
      })
      .map((move) => this.game.state.getSquare(move.end.row, move.end.col));

    return squares.filter((square) => !!square) as Square[];
  }

  private drawArrow(srow: number, scol: number, erow: number, ecol: number) {
    const canvas = this.shadowRoot?.querySelector('canvas');
    if (!canvas) return;

    canvas.width = canvas.offsetWidth; // BUG this should only happen once
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const toxy = (rc: number) => SQUARE_SIZE / 2 + SQUARE_SIZE * rc;
    drawArrow(ctx, toxy(scol), toxy(srow), toxy(ecol), toxy(erow));
    // drawArrow(ctx, 75, 75, 75, 125);
  }

  private eraseCanvas() {
    const canvas = this.shadowRoot?.querySelector('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  private _validateLastMove(
    smove: Move,
    moveHistory: Move[],
    sstate: BoardState,
    stateHistory: BoardState[]
  ) {
    const cmove = moveHistory?.[moveHistory.length - 1];
    if (JSON.stringify(cmove, replacer) !== JSON.stringify(smove, replacer)) {
      throw new Error(`last client move does not match server,
      client: ${JSON.stringify(cmove, replacer)},\n
      server:${JSON.stringify(smove, replacer)}`);
    }
    const cstate = stateHistory?.[stateHistory.length - 1];
    if (JSON.stringify(sstate, replacer) !== JSON.stringify(sstate, replacer)) {
      throw new Error(`last client state does not match server,
      client: ${JSON.stringify(cstate, replacer)},\n
      server:${JSON.stringify(sstate, replacer)}`);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
