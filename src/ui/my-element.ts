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
  TurnMessage,
  ReplaceMessage,
  AppendMessage,
  InitGameMessage,
  addMessageHandler,
  sendMessage,
} from '../common/message';
import {Queen, Rook, Bishop, Knight} from '../chess/piece';

import {drawArrow} from '../utils';
import './my-square';
import {VARIANTS} from '../chess/variants';
import {Game} from '../chess/game';
import {Move, toFEN, Turn, TurnType} from '../chess/move';
import {styleMap} from 'lit-html/directives/style-map';
import {Color} from '../chess/const';
import BoardState from '../chess/state';
import {Chess960} from '../chess/variants/960';
import {equals} from '../chess/pair';
import './my-piece-picker';
import '@polymer/paper-dialog/paper-dialog';
import {PaperDialogElement} from '@polymer/paper-dialog/paper-dialog';

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
    :host {
      display: inline-block;
    }

    #board {
      background-image: url('/img/bg.svg');
      background-repeat: no-repeat;
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
  @property({type: String}) color: Color;
  @property({type: Object}) game: Game;
  @property({type: Object}) socket: WebSocket;
  @property({type: Object}) viewHistoryState: BoardState | undefined;

  // protected
  @property({type: Object}) selectedPiece: Piece | undefined;
  @property({type: Object}) selectedSquare: Square | undefined;
  @property({type: Object}) arrowStartSquare: Square | undefined;
  @property({type: Object}) promotionSquare: Square | undefined;

  draggedSquare: Square | undefined;

  pickerPieceSelected: () => void;
  ods: () => void;
  od: () => void;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('square-clicked', this.onSquareClicked.bind(this));
    this.addEventListener(
      'square-mousedown',
      this.onSquareMousedown.bind(this)
    );
    this.addEventListener('square-mouseup', this.onSquareMouseup.bind(this));
    // this.addEventListener('contextmenu', e => {e.preventDefault()});
    // addMessageHandler(this.socket, this.handleSocketMessage.bind(this));
    this.pickerPieceSelected = this.onPiecePicker.bind(this);
    this.addEventListener('picker-piece-selected', this.pickerPieceSelected);

    this.ods = this.onDragStart.bind(this);
    this.addEventListener('square-dragstart', this.ods);

    this.od = this.onDrop.bind(this);
    this.addEventListener('square-drop', this.od);
    
    document.body.addEventListener('dragend', (e) => {
      this.draggedSquare = undefined;
      this.requestUpdate();
      e.preventDefault();
    });
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
    this.removeEventListener('picker-piece-selected', this.pickerPieceSelected);

    this.removeEventListener('square-dragstart', this.ods);
    this.removeEventListener('square-drop', this.od);
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
      const {turn} = rm;
      const {turnHistory: turnHistory, stateHistory} = this.game;
      // this._validateLastMove(move, turnHistory, state, stateHistory);
      turnHistory[turnHistory.length - 1] = turn;
      stateHistory[stateHistory.length - 1] = turn.after;
      this.game.state = turn.after;
      console.log(toFEN(turn));
    } else if (message.type === 'appendState') {
      const am = message as AppendMessage;
      const {turn} = am;
      this.game.turnHistory.push(turn);
      this.game.stateHistory.push(turn.after);
      this.game.state = turn.after;
      console.log(toFEN(turn));
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

    const lastTurn = this.game.turnHistory[this.game.turnHistory.length - 1];

    return html`
      <paper-dialog id="promotion-modal" horizontal-align="left" vertical-align="top"
        ><my-piece-picker
          .pieces=${this.game.promotesTo.map((c) => new c(this.color))}
        ></my-piece-picker
      ></paper-dialog>
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
                .dragged=${square === this.draggedSquare}
                .possible=${this.possibleMoves.includes(square)}
                .lastMove=${lastTurn &&
                ((lastTurn.type === TurnType.MOVE &&
                  equals(lastTurn.start, square)) ||
                  equals(lastTurn.end, square))}
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
    let turn: Turn | undefined;
    if (this.selectedPiece && this.selectedSquare) {
      if (
        this.selectedPiece.isRoyal &&
        this.selectedSquare.row === square.row &&
        Math.abs(this.selectedSquare.col - square.col) === 2
      ) {
        turn = this.game.castle(
          this.color,
          square.col - this.selectedSquare.col > 0
        );
      } else {
        turn = this.game.attemptMove(
          this.color,
          this.selectedPiece,
          this.selectedSquare.row,
          this.selectedSquare.col,
          square.row,
          square.col
        );
        if (
          this.selectedPiece.promotable &&
          ((turn?.end.row === 0 && this.selectedPiece.color === Color.WHITE) ||
            (turn?.end.row === this.game.state.files - 1 &&
              this.selectedPiece.color === Color.BLACK))
        ) {
          // On promotion, rollback move
          const lastTurn = this.game.turnHistory.pop();
          this.game.stateHistory.pop();
          if (lastTurn) {
            this.game.state = lastTurn.before;
          }
          // popup the promotion modal
          const promotionModal = this.shadowRoot!.querySelector(
            '#promotion-modal'
          ) as PaperDialogElement;
          this.promotionSquare = square;
          promotionModal.positionTarget = this;
          promotionModal.open();
          return;
        }
      }

      this.selectedSquare = undefined;
      this.selectedPiece = undefined;
      if (!turn) {
        return;
      }
      sendMessage(this.socket, {type: 'turn', turn});
    } else {
      this.selectedSquare = square;
      this.selectedPiece = square.occupant;
    }
    this.performUpdate();
  }

  private onDragStart(e: CustomEvent) {
    const square = e.detail as Square;
    this.selectedSquare = square;
    this.selectedPiece = square.occupant;
    this.draggedSquare = square;
  }

  private onDrop(e: CustomEvent) {
    return this.onSquareClicked(e);
  }

  private onPiecePicker(e: CustomEvent) {
    const piece = e.detail as Piece;
    if (!this.promotionSquare || !this.selectedSquare || !this.selectedPiece)
      return;

    const turn = this.game.promote(
      this.color,
      this.selectedPiece,
      piece,
      this.selectedSquare?.row,
      this.selectedSquare?.col,
      this.promotionSquare.row,
      this.promotionSquare.col
    );
    if (!turn) return;
    sendMessage(this.socket, {type: 'turn', turn});
    this.selectedSquare = undefined;
    this.selectedPiece = undefined;
    const promotionModal = this.shadowRoot!.querySelector('#promotion-modal');
    (promotionModal as PaperDialogElement).close();
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
      this.game.turnHistory
    )
      .filter((move) => {
        return this.game.isTurnLegal(this.color, move);
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
    turnHistory: Turn[],
    sstate: BoardState,
    stateHistory: BoardState[]
  ) {
    const cmove = turnHistory?.[turnHistory.length - 1];
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
