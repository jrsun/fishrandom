import {
  LitElement,
  html,
  customElement,
  property,
  css,
} from '../../node_modules/lit-element';
import {Piece, King} from '../chess/piece';
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
import {Move, toFEN, Turn, TurnType, toEndSquare} from '../chess/move';
import {Color, ROULETTE_SECONDS} from '../chess/const';
import {BoardState} from '../chess/state';
import {Chess960} from '../chess/variants/960';
import {equals} from '../chess/pair';
import './my-piece-picker';
import '@polymer/paper-dialog/paper-dialog';
import {PaperDialogElement} from '@polymer/paper-dialog/paper-dialog';

const SQUARE_SIZE = Math.min(window.innerWidth / 8, 50); // 50
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
      overflow-y: hidden;
    }

    .board-bg {
      background-image: url('/img/bg.svg');
      background-repeat: repeat-y;
      border-radius: 4px;
      display: inline-block;
      background-position-y: 8000px;
      height: 10000px;
      width: ${SQUARE_SIZE * 8}px;
      position: relative;
      transition: none;
    }

    :host([started]) .board-bg {
      background-position-y: 0;
      transition: all ${ROULETTE_SECONDS}s cubic-bezier(0.15, 0.82, 0.58, 1.02);
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

    my-square {
      position: relative;
      transition: none;
    }
    :host([color='black']) my-square {
      top: -8000px;
    }
    :host([color='white']) my-square {
      top: 8000px;
    }
    :host([started]) my-square {
      top: 0;
      transition: all ${ROULETTE_SECONDS}s cubic-bezier(0.15, 0.82, 0.58, 1.02);
    }

    .row {
      height: ${SQUARE_SIZE}px;
    }
  `;

  // public
  @property({type: String, reflect: true}) color: Color;
  @property({type: Object}) game: Game;
  @property({type: Object}) socket: WebSocket;
  @property({type: Number}) viewMoveIndex: number | undefined;
  @property({type: Object}) bankSelectedPiece: Piece | undefined;

  // protected
  @property({type: Object}) selectedPiece: Piece | undefined;
  @property({type: Object}) selectedSquare: Square | undefined;
  @property({type: Object}) arrowStartSquare: Square | undefined;
  @property({type: Object}) promotionSquare: Square | undefined;
  @property({type: Boolean}) gameOver = false;
  @property({type: Boolean, reflect: true}) started = false;
  @property({type: Array}) possibleTargets: Square[] = [];

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
    // Swallow right-click events
    this.addEventListener('contextmenu', e => {e.preventDefault()});
    this.pickerPieceSelected = this.onPiecePicker.bind(this);
    this.addEventListener('promotion-picked', this.pickerPieceSelected);

    this.ods = this.onSquareDragStart.bind(this);
    this.addEventListener('square-dragstart', this.ods);

    this.od = this.onDrop.bind(this);
    this.addEventListener('square-drop', this.od);

    document.body.addEventListener('dragend', (e) => {
      this.draggedSquare = undefined;
      this.requestUpdate();
      e.preventDefault();
    });

    this.gameOver =
      this.game.winCondition(Color.BLACK) ||
      this.game.winCondition(Color.WHITE);
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
    this.removeEventListener('promotion-picked', this.pickerPieceSelected);

    this.removeEventListener('square-dragstart', this.ods);
    this.removeEventListener('square-drop', this.od);
  }

  updated(changedProperties) {
    if (changedProperties.has('socket')) {
      addMessageHandler(this.socket, this.handleSocketMessage.bind(this));
    }
    if (
      changedProperties.has('selectedSquare') ||
      changedProperties.has('selectedPiece')
    ) {
      this.computeTargets(this.selectedPiece, this.selectedSquare);
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
      this.game.turnHistory = [...this.game.turnHistory, turn];
      this.game.stateHistory.push(turn.after);
      this.game.state = turn.after;
      console.log(toFEN(turn));
    }
    // async?
    this.gameOver =
      this.game.winCondition(Color.BLACK) ||
      this.game.winCondition(Color.BLACK);
    this.performUpdate();
  }

  render() {
    const state = this.game.state;

    this.style.setProperty('height', `${SQUARE_SIZE * state.squares.length}px`);
    this.style.setProperty(
      'width',
      `${SQUARE_SIZE * state.squares[0].length}px`
    );

    let uiState: BoardState = state;
    let lastTurn: Turn = this.game.turnHistory[
      this.game.turnHistory.length - 1
    ];
    if (this.viewMoveIndex != null) {
      uiState = this.game.turnHistory[this.viewMoveIndex]?.before ?? state;
      lastTurn = this.game.turnHistory[this.viewMoveIndex - 1];
    }

    // BUG: Promo event keeps firing
    return html`
      <paper-dialog
        id="promotion-modal"
        horizontal-align="left"
        vertical-align="top"
        ><my-piece-picker
          .pieces=${this.game.promotesTo.map((c) => new c(this.color))}
          .eventName=${'promotion-picked'}
        ></my-piece-picker
      ></paper-dialog>
      <div class="board-bg">
        <div
          id="board"
          style=${this.color === Color.BLACK ? 'transform:rotate(180deg);' : ''}
        >
          <canvas id="canvas"></canvas>
          ${uiState.squares.map(
            (row) => html`<div class="row">
              ${row.map(
                (square) => html`<my-square
                  .frozen=${this.viewMoveIndex != null || this.gameOver}
                  .square=${square}
                  .piece=${square.occupant}
                  .dragged=${square === this.draggedSquare}
                  .possible=${this.possibleTargets.includes(square)}
                  .lastMove=${lastTurn &&
                  ((lastTurn.type === TurnType.MOVE &&
                    equals(lastTurn.start, square)) ||
                    equals(lastTurn.end, square))}
                  .color=${this.color}
                  .checked=${square.occupant?.isRoyal &&
                  this.game.knowsAttackedSquare(
                    square.occupant?.color,
                    uiState,
                    square.row,
                    square.col
                  )}
                ></my-square>`
              )}
            </div>`
          )}
        </div>
      </div>
    `;
  }

  // Regular move and castle and drop
  private onSquareClicked(e: CustomEvent) {
    this.dispatchEvent(
      new CustomEvent('board-clicked', {bubbles: true, composed: true})
    );
    if (this.viewMoveIndex != null) return;

    this.eraseCanvas();
    // There's a bug here where updating the game using move doesn't cause rerender.
    const square = e.detail as Square;
    let turn: Turn | undefined;
    if (this.bankSelectedPiece) {
      turn = this.game.drop(
        this.color,
        this.bankSelectedPiece,
        square.row,
        square.col
      );
      if (!turn) {
        console.log('bad drop', square.row, square.col);
        return;
      }
      sendMessage(this.socket, {type: 'turn', turn});
    } else if (this.selectedPiece && this.selectedSquare) {
      if (
        this.selectedSquare.row === square.row &&
        this.selectedSquare.col === square.col
      ) {
        turn = this.game.activate(
          this.color,
          this.selectedPiece,
          square.row,
          square.col
        );
      } else if (
        this.selectedPiece instanceof this.game.castler &&
        this.selectedSquare.row === square.row &&
        (Math.abs(this.selectedSquare.col - square.col) === 2 ||
          (square.occupant instanceof Rook &&
            square.occupant.color === this.color))
      ) {
        turn = this.game.castle(
          this.color,
          square.col - this.selectedSquare.col > 0
        );
      } else {
        turn = this.game.move(
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
      this.game.turnHistory = [...this.game.turnHistory, turn];
      this.game.stateHistory.push(turn.after);
      this.game.state = turn.after;

      sendMessage(this.socket, {type: 'turn', turn});
    } else {
      this.selectedSquare = square;
      this.selectedPiece = square.occupant;
    }
    this.performUpdate();
  }

  private onSquareDragStart(e: CustomEvent) {
    const square = e.detail as Square;
    this.selectedSquare = square;
    this.selectedPiece = square.occupant;
    this.draggedSquare = square;
  }

  private onDrop(e: CustomEvent) {
    return this.onSquareClicked(e);
  }

  // Promotion
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

  // Drawing arrows
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

  computeTargets(piece?: Piece, square?: Square) {
    const {game} = this;
    if (!piece || !square || !game) {
      this.possibleTargets = [];
      return;
    }

    const moves = game.legalMovesFrom(game.state, square.row, square.col, true);
    this.possibleTargets = moves
      .map((move) => toEndSquare(game.state, move))
      .filter((square) => !!square) as Square[];
    setTimeout(() => {
      this.possibleTargets = moves
        .filter((move) => {
          return this.game.isTurnLegal(this.color, move);
        })
        .map((move) => toEndSquare(this.game.state, move))
        .filter((square) => !!square) as Square[];
      this.requestUpdate();
    }, 0);
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

  // private _validateLastMove(
  //   smove: Move,
  //   turnHistory: Turn[],
  //   sstate: BoardState,
  //   stateHistory: BoardState[]
  // ) {
  //   const cmove = turnHistory?.[turnHistory.length - 1];
  //   if (JSON.stringify(cmove, replacer) !== JSON.stringify(smove, replacer)) {
  //     throw new Error(`last client move does not match server,
  //     client: ${JSON.stringify(cmove, replacer)},\n
  //     server:${JSON.stringify(smove, replacer)}`);
  //   }
  //   const cstate = stateHistory?.[stateHistory.length - 1];
  //   if (JSON.stringify(sstate, replacer) !== JSON.stringify(sstate, replacer)) {
  //     throw new Error(`last client state does not match server,
  //     client: ${JSON.stringify(cstate, replacer)},\n
  //     server:${JSON.stringify(sstate, replacer)}`);
  //   }
  // }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
