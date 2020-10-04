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

import './my-square';
import {classMap, ClassInfo} from 'lit-html/directives/class-map';

import {VARIANTS} from '../chess/variants';
import {Game, GameEvent, GameEventType, GameEventName} from '../chess/game';
import {Move, toFEN, Turn, TurnType, toEndSquare} from '../chess/turn';
import {Color, ROULETTE_SECONDS, getOpponent} from '../chess/const';
import {BoardState} from '../chess/state';
import {Chess960} from '../chess/variants/960';
import {equals, hash, Pair} from '../chess/pair';
import './my-piece-picker';
import '@polymer/paper-dialog/paper-dialog';
import {PaperDialogElement} from '@polymer/paper-dialog/paper-dialog';
import {MySquare} from './my-square';
import {selectPieceEvent, SelectEventType, SelectEventDetail, SQUARE_SIZE, drawArrow} from './utils';

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
      transition-property: background-position-y;
    }

    #canvas {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      pointer-events: none;
      height: 100%;
      z-index: 2;
    }

    my-square {
      position: relative;
      transition: none;
    }
    :host my-square {
      top: 8000px;
    }
    :host([started]) my-square {
      top: 0;
      transition: all ${ROULETTE_SECONDS}s cubic-bezier(0.15, 0.82, 0.58, 1.02);
      transition-property: top;
    }

    .row {
      height: ${SQUARE_SIZE}px;
    }
    :host([viewMoveIndex]) .board-bg {
      opacity: 0.95;
    }
  `;

  // public
  @property({type: String, reflect: true}) color: Color;
  @property({type: Object}) game: Game;
  @property({type: Object}) socket: SocketIO.Socket;
  @property({type: Number, reflect: true}) viewMoveIndex: number | undefined;

  // protected
  @property({type: Object}) selectedPiece: Piece | undefined;
  @property({type: Object}) selectedSquare: Pair | undefined;
  @property({type: Object}) arrowStartSquare: Square | undefined;
  @property({type: Object}) promotionSquare: Pair | undefined;
  @property({type: Boolean}) gameOver = false;
  @property({type: Boolean, reflect: true}) started = false;
  @property({type: Array}) possibleTargets: Square[] = [];
  @property({type: Array}) promotions: Piece[] | undefined;

  audio: {[name: string]: HTMLAudioElement | null | undefined} = {};
  canvas: HTMLCanvasElement;
  pairToClass: {[pair: string]: {[name: string]: boolean}} = {};
  promotionFromSquare: Pair | undefined;
  promotee: Piece | undefined;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('square-clicked', this.onSquareClicked.bind(this));
    this.addEventListener(
      'square-mousedown',
      this.onSquareMousedown.bind(this)
    );
    this.addEventListener('square-mouseup', this.onSquareMouseup.bind(this));
    if (process.env.NODE_ENV !== 'development') {
      this.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
    }
    this.addEventListener(SelectEventType.PROMOTION, this.onPiecePicker);
    this.addEventListener('square-dragstart', this.onSquareDragStart);
    this.addEventListener('square-drop', this.onDrop);
    this.addEventListener('square-double', this.onDoubleClick);

    document.body.addEventListener('dragend', (e) => {
      // this.requestUpdate();
      e.preventDefault();
    });

    this.gameOver =
      !!(this.game.winCondition(Color.BLACK, this.game.state) ||
      this.game.winCondition(Color.WHITE, this.game.state));
  }

  firstUpdated() {
    this.audio.move = this.shadowRoot?.querySelector('#move-audio');
    this.audio.capture = this.shadowRoot?.querySelector('#capture-audio');
    const canvas = this.shadowRoot?.querySelector('canvas');
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    this.canvas = canvas;
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('square-clicked', this.onSquareClicked.bind(this));
    this.removeEventListener(
      'square-mousedown',
      this.onSquareMousedown.bind(this)
    );
    this.removeEventListener('square-mouseup', this.onSquareMouseup.bind(this));

    this.removeEventListener('promotion-picked', this.onPiecePicker);
    this.removeEventListener('square-dragstart', this.onSquareDragStart);
    this.removeEventListener('square-drop', this.onDrop);
    this.removeEventListener('square-double', this.onDoubleClick);
  }

  updated(changedProperties) {
    if (changedProperties.has('socket')) {
      addMessageHandler(this.socket, 'my-element', this.handleSocketMessage);
    }
    if (
      changedProperties.has('selectedSquare') ||
      changedProperties.has('selectedPiece')
    ) {
      this.computeTargets(this.selectedPiece, this.selectedSquare);
    }
  }

  handleSocketMessage = (message: Message) => {
    const {turnHistory, stateHistory} = this.game;
    if (message.type === 'replaceState') {
      const rm = message as ReplaceMessage;
      const {turn} = rm;
      turnHistory[turnHistory.length - 1] = turn;
      stateHistory[stateHistory.length - 1] = turn.after;
      this.game.state = turn.after;
    } else if (message.type === 'appendState') {
      const am = message as AppendMessage;
      const {turn} = am;
      this.playSound(turn);
      this.game.turnHistory = [...turnHistory, turn];
      this.game.stateHistory.push(turn.after);
      this.game.state = turn.after;
      
      this.game.sideEffects(turn);
    } else if (message.type === 'gameEvent') {
      const {pairs, type, name} = message.content;
      for (const pair of pairs) {
        if (!this.pairToClass[hash(pair)]) {
          this.pairToClass[hash(pair)] = {};
        }
        this.pairToClass[hash(pair)][name] = !(type === GameEventType.Off);
      }
      if (type === GameEventType.Temporary) {
        setTimeout(() => {
          for (const pair of pairs) {
            this.pairToClass[hash(pair)][name] = false;
          }
          this.performUpdate();
        }, 200);
      }
    } else if (message.type === 'undo') {
      this.game.turnHistory = turnHistory.slice(0, turnHistory.length - 1);
      this.game.stateHistory = stateHistory.slice(0, stateHistory.length - 1);
      this.game.state = stateHistory[this.game.stateHistory.length - 1];
    }
    // async?
    this.gameOver =
      !!(this.game.winCondition(Color.WHITE, this.game.state) ||
      this.game.winCondition(Color.BLACK, this.game.state));
    this.performUpdate();
  };

  render() {
    const state = this.game.state;

    this.style.setProperty('height', `${SQUARE_SIZE * state.squares.length}px`);
    this.style.setProperty(
      'width',
      `${SQUARE_SIZE * state.squares[0].length}px`
    );

    let uiState: BoardState = state;
    let squaresInTurnsSincePlayerChange: Pair[] = [];
    const lastTurn = (
      this.viewMoveIndex === null ||
      this.viewMoveIndex === undefined
    ) ?
      this.game.turnHistory.length - 1 :
      this.viewMoveIndex - 1;
    for (let i = lastTurn; i >= 0; i--) {
      const turn = this.game.turnHistory[i] as Turn|undefined;
      if (!turn) continue;
      squaresInTurnsSincePlayerChange.push({row: turn.end.row, col: turn.end.col});
      if ('start' in turn) {
        squaresInTurnsSincePlayerChange.push({row: turn.start.row, col: turn.start.col});
      }
      if ([Color.WHITE, Color.BLACK].includes(turn.piece.color)) {
        break;
      }
    }
    if (this.viewMoveIndex != null) {
      uiState = this.game.turnHistory[this.viewMoveIndex]?.before ?? state;
    }

    let squares = uiState.squares;
    if (this.color === Color.BLACK) {
      const reversed: Square[][] = [];
      for (const row of [...uiState.squares].reverse()) {
        reversed.push([...row].reverse());
      }
      squares = reversed;
    }

    // BUG: Promo event keeps firing
    return html`
      <audio
        id="move-audio"
        src="../../snd/move-piece.mp3"
        preload="auto"
      ></audio>
      <audio
        id="capture-audio"
        src="../../snd/chess-capture.mp3"
        preload="auto"
      ></audio>
      <paper-dialog
        id="promotion-modal"
        horizontal-align="left"
        vertical-align="top"
        ><my-piece-picker
          .pieces=${this.promotions ?? []}
          .eventName=${SelectEventType.PROMOTION}
        ></my-piece-picker
      ></paper-dialog>
      <div class="board-bg">
        <div id="board">
          <canvas id="canvas"></canvas>
          ${squares.map(
            (row) => html`<div class="row">
              ${row.map(
                (square) => html`<my-square
                  class=${classMap(this.pairToClass[hash(square)])}
                  .frozen=${this.viewMoveIndex != null || this.gameOver}
                  .square=${square}
                  .selected=${equals(square, this.selectedSquare)}
                  .piece=${square.occupant}
                  .possible=${this.possibleTargets.some((target) =>
                    equals(target, square)
                  )}
                  .lastMove=${squaresInTurnsSincePlayerChange.some(s => {
                    return equals(s, square)
                  })}
                  .checked=${!!(
                    square.occupant?.isRoyal &&
                    this.game.knowsAttackedSquare(
                      square.occupant?.color,
                      uiState,
                      square.row,
                      square.col
                    )
                  )}
                  .color=${this.color}
                ></my-square>`
              )}
            </div>`
          )}
        </div>
      </div>
    `;
  }

  // Regular move and castle and promotion trigger
  private onSquareClicked(e: CustomEvent) {
    // Get rid of arrows
    this.eraseCanvas();
    // Let parent handle board selection state
    this.dispatchEvent(
      new CustomEvent('board-clicked', {bubbles: true, composed: true})
    );

    /* Turn logic */
    if (this.viewMoveIndex != null) return;
    const {row, col} = e.detail.square as Square;
    const square = this.game.state.getSquare(row, col);
    if (!square) return;

    // Don't do anything async after this
    this.dispatchEvent(
      new CustomEvent(SelectEventType.PIECE_TOGGLE, {
        composed: true,
        bubbles: true,
        detail: selectPieceEvent(square.occupant, square),
      })
    );

    let turn: Turn | undefined;
    if (this.selectedPiece && !this.selectedSquare) {
      // Drop
      const turn = this.game.drop(
        this.color,
        this.selectedPiece,
        square.row,
        square.col
      );
      const exTurn = this.game.execute(this.color, turn);
      if (!exTurn) {
        return;
      }
      this.dispatchEvent(
        new CustomEvent(SelectEventType.PIECE_OFF, {
          composed: true,
          bubbles: true,
        })
      );

      sendMessage(this.socket, {type: 'turn', turn: exTurn});
      if (exTurn.captured) {
        this.audio.capture?.play();
      } else {
        this.audio.move?.play();
      }
    }
    if (this.selectedPiece && this.selectedSquare) {
      if (
        this.selectedPiece instanceof this.game.castler &&
        this.selectedSquare.row === row &&
        (Math.abs(this.selectedSquare.col - col) === 2 ||
          (square.occupant instanceof Rook &&
            square.occupant.color === this.color))
      ) {
        turn = this.game.castle(
          this.color,
          this.selectedSquare.row,
          this.selectedSquare.col,
          col - this.selectedSquare.col > 0
        );
      } else {
        turn = this.game.move(
          this.color,
          this.selectedPiece,
          this.selectedSquare.row,
          this.selectedSquare.col,
          row,
          col
        );
      }
      if (!turn) return;

      const promotions = this.game.promotions(turn);
      if (promotions?.length) {
        if (promotions.length === 1) {
          // If only one possible promotion, just do it.
          const pturn = this.game.promote(
            this.color,
            this.selectedPiece,
            promotions[0],
            turn.start.row,
            turn.start.col,
            turn.end.row,
            turn.end.col
          );
          turn = pturn ?? turn;
        } else {
          // Else, popup the modal
          this.promotions = promotions;
          const promotionModal = this.shadowRoot!.querySelector(
            '#promotion-modal'
          ) as PaperDialogElement;
          this.promotionFromSquare = {row: turn.start.row, col: turn.start.col};
          this.promotionSquare = {row, col};
          this.promotee = turn.piece;
          promotionModal.positionTarget = this;
          promotionModal.open();
          // Early return to avoid saving the move.
          return;
        }
      }

      turn = this.game.execute(this.color, turn);
      if (!turn) return;

      this.dispatchEvent(
        new CustomEvent(SelectEventType.PIECE_OFF, {
          composed: true,
          bubbles: true,
        })
      );

      sendMessage(this.socket, {type: 'turn', turn});
      if (turn.captured) {
        this.audio.capture?.play();
      } else {
        this.audio.move?.play();
      }
    }
    this.performUpdate();
  }

  onSquareDragStart = (e: CustomEvent) => {
    const square = e.detail as Square;
    this.dispatchEvent(
      new CustomEvent(SelectEventType.PIECE_ON, {
        composed: true,
        bubbles: true,
        detail: selectPieceEvent(square.occupant, square),
      })
    );
  };

  // Drop
  onDrop = (e: CustomEvent) => {
    const {square, piece, start, type} = e.detail;

    if (type === 'drop') {
      let turn: Turn | undefined = this.game.drop(
        this.color,
        piece,
        square.row,
        square.col
      );

      turn = this.game.execute(this.color, turn);
      if (!turn) return;

      sendMessage(this.socket, {type: 'turn', turn});
      if (turn.captured) {
        this.audio.capture?.play();
      } else {
        this.audio.move?.play();
      }
      this.performUpdate();
      return;
    }
    this.dispatchEvent(
      new CustomEvent(SelectEventType.PIECE_ON, {
        composed: true,
        bubbles: true,
        detail: selectPieceEvent(piece, start),
      })
    );
    this.onSquareClicked(e);
  };

  // Activate
  private onDoubleClick = (e: CustomEvent) => {
    const square = e.detail as Square;
    let turn = this.game.activate(
      this.color,
      square.row,
      square.col,
      square.occupant
    );
    turn = this.game.execute(this.color, turn);
    if (!turn) {
      return;
    }

    sendMessage(this.socket, {type: 'turn', turn});
    this.audio.move?.play();
    this.performUpdate();
  };

  // Promotion
  onPiecePicker = (e: CustomEvent) => {
    const {piece} = e.detail as SelectEventDetail;
    if (
      !this.promotionSquare ||
      !this.promotionFromSquare ||
      !this.promotee ||
      !piece
    )
      return;

    let turn: Turn | undefined = this.game.promote(
      this.color,
      this.promotee,
      piece,
      this.promotionFromSquare?.row,
      this.promotionFromSquare?.col,
      this.promotionSquare.row,
      this.promotionSquare.col
    );

    turn = this.game.execute(this.color, turn);
    if (!turn) return;

    sendMessage(this.socket, {type: 'turn', turn});
    this.audio.move?.play();

    this.dispatchEvent(
      new CustomEvent(SelectEventType.PIECE_OFF, {
        composed: true,
        bubbles: true,
      })
    );
    const promotionModal = this.shadowRoot!.querySelector('#promotion-modal');
    (promotionModal as PaperDialogElement).close();
    this.performUpdate();
  };

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

  // Highlight squares to move to
  computeTargets(piece?: Piece, square?: Pair) {
    const {game} = this;
    if (!piece || !square || !game) {
      this.possibleTargets = [];
      return;
    }
    const moves = game.legalMovesFrom(game.state, square.row, square.col, true);
    if (game.knowsInCheck(this.color, game.state) || moves.length < 10) {
      // If in check, or few moves, compute immediately
      this.possibleTargets = moves
        .filter((move) => this.game.validateTurn(piece.color, move))
        .map((move) => toEndSquare(game.state, move))
        .filter((square) => !!square) as Square[];
    } else {
      // Else, do it async
      this.possibleTargets = moves
        .map((move) => toEndSquare(game.state, move))
        .filter((square) => !!square) as Square[];
      setTimeout(() => {
        this.possibleTargets = moves
          .filter((move) => {
            return this.game.validateTurn(piece.color, move);
          })
          .map((move) => toEndSquare(this.game.state, move))
          .filter((square) => !!square) as Square[];
        this.requestUpdate();
      }, 0);
    }
  }

  private drawArrow(srow: number, scol: number, erow: number, ecol: number) {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const toxy = (rc: number) => {
      if (this.color === Color.WHITE) {
        return SQUARE_SIZE / 2 + SQUARE_SIZE * rc;
      } else {
        return SQUARE_SIZE * 8 - SQUARE_SIZE * rc - SQUARE_SIZE / 2;
      }
    };
    drawArrow(ctx, toxy(scol), toxy(srow), toxy(ecol), toxy(erow));
  }

  private eraseCanvas() {
    const canvas = this.shadowRoot?.querySelector('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  playSound = (turn: Turn) => {
    if (turn.captured) {
      this.audio.capture?.play();
    } else {
      this.audio.move?.play();
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
