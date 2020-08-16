import {
  LitElement,
  html,
  customElement,
  property,
  css,
} from '../../node_modules/lit-element';
import '@polymer/paper-dialog';
import './my-element';
import {VARIANTS, Chess960, RANDOM_VARIANTS} from '../chess/variants/index';
import {
  reviver,
  Message,
  InitGameMessage,
  GameOverMessage,
  GameResult,
  addMessageHandler,
  TimerMessage,
  sendMessage,
} from '../common/message';
import ConfettiGenerator from 'confetti-js';
import './my-rules';
import './my-piece-picker';
import './my-controls';
import {Game} from '../chess/game';
import {BoardState} from '../chess/state';
import {Color, getOpponent, ROULETTE_SECONDS} from '../chess/const';
import {Knight, Piece} from '../chess/piece';
import {MyElement} from './my-element';
import {randomChoice, memecase} from '../utils';

@customElement('my-app')
export class MyApp extends LitElement {
  static styles = css`
    .app {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      width: 100%;
    }
    .title {
      color: #EEEEEE;
      font-family: "JelleeBold"
    }
    .card {
      display: block;
      /* border: solid 1px gray; */
      /* margin: 15px; */
      /* max-width: 800px; */
      padding: 10px;
      background-color: #efece0;
      padding: 30px;
      border-radius: 4px;
      box-shadow: 0px 7px #dad4c8;
    }
    .game-container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: stretch;
      justify-content: center;
    }
    .bank-wrapper {
      position: relative;
      top: 8000px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-right: 20px;
    }
    :host([started]) .bank-wrapper {
      top: 0;
      transition: all ${ROULETTE_SECONDS}s cubic-bezier(0.15, 0.82, 0.58, 1.02);
    }
    .bank {
      padding: 10px;
    }
    .bank:first-child {
      margin-bottom: 20px;
    }
    .active-game-container {
      display: flex;
      flex-direction: column;
      margin-right: 30px;
    }
    @media only screen and (max-width: 600px) {
      .active-game-container {
        margin-right: 0;
        margin-top: 20px;
      }
      .board-wrapper.card {
        padding: 0px;
        border-radius: 0;
        box-shadow: none;
      }
      .bank-wrapper { flex-direction: row;}
      .bank:first-child{
        margin-bottom: 0;
        margin-right: 20px;
      }
    }
    .active-game-info {
      display: flex;
      flex-direction: row;
      /* align-items: center; */
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .active-game-info.opponent {
      align-items: flex-end;
    }
    .active-game-info.player {
      align-items: flex-start;
    }
    .user-info {
      display: flex;
    }
    .user-capture {
      display: flex;
      flex-direction: column;
    }
    .avatar {
      height: 40px;
      width: 40px;
      background-size: cover;
      margin-right: 10px;
      border-radius: 4px;
    }
    .board-wrapper {
      margin: 20px 0;
    }
    .username {
      color: #eee;
      font-family: 'JelleeBold';
    }
    /* timer */
    .timer {
      font-size: 30px;
      /* display: inline-block; */
      /* border: solid 1px gray; */
      /* margin: 15px; */
      /* max-width: 800px; */
      background-color: #efece0;
      padding: 10px;
      padding-left: 60px;
      border-radius: 4px;
      font-family: 'JelleeBold';
      min-width: 75px;
    }
    .timer.opponent {
      background-color: #344155;
      color: #99b;
      box-shadow: 0px 7px #243145;
    }
    .timer.player {
      background-color: #ddd;
      color: #344155;
      box-shadow: 0px 7px #bbb;
    }
    /* right */
    .right-panel {
      display: flex;
      flex-direction: column;
    }
    .controls {
      margin-bottom: 30px;
    }
    .rules {
      flex: 1;
    }
    paper-dialog {
      font-family: 'JelleeBold';
      border-radius: 2px;
    }
    #confetti-canvas {
      height: 100%;
      width: 100%;
      position: absolute;
      pointer-events: none;
      z-index: 2;
    }
    .fish-con {
      display: block;
      height: 100px;
      width: 50px;
    }
    .fish {
      height: 50px;
      width: 50px;
      background-image: url(/img/svg/blt.svg);
      background-size: cover;
      transform: rotate(90deg);
      animation:swim 2s linear infinite;

      -webkit-animation-fill-mode:forwards;
      -moz-animation-fill-mode:forwards;
      animation-fill-mode:forwards;
    }
    .game-over-dialog {
      display: flex;
      flex-direction:column;
      align-items: center;
    }
    .game-over-result {
      font-family: 'JelleeBold';
    }
    .game-over-button:hover {
      transition: 0.2s;
      background-color: #82d7ba;
      font-weight: bold;
    }
    @keyframes swim {
      from {transform: rotate(90deg)}
      10% {transform: translate(0, 5px) rotate(120deg);}
      25% {transform: translate(0, 25px) rotate(130deg);}
      40% {transform: translate(0, 45px) rotate(120deg);}
      50% {transform: translate(0, 50px) rotate(90deg);}
      60% {transform: translate(0, 45px) rotate(60deg);}
      75% {transform: translate(0, 25px) rotate(50deg);}
      90% {transform: translate(0, 5px) rotate(60deg);}
      to {transform: rotate(90deg)}
    }
    .blinking {animation: blink 0.5s linear 7;}
    @keyframes blink {
      from {color: #d80c0c};
    }

    .footer {
      /* position: fixed; */
      /* background-color: var(--google-blue-300); */
      margin-top: 100px;
      /* padding: 5px; */
      /* border-top-left-radius: 4px; */
      /* bottom: 0; */
      /* right: 0; */
    }
    .footer a {
      color: #6a0dad;
    }
  }`;

  @property({type: Object}) game?: Game;
  private socket: WebSocket;

  // private
  @property({type: Number}) viewMoveIndex: number | undefined;
  @property({type: Number}) playerTimer?: number;
  @property({type: Number}) opponentTimer?: number;
  @property({type: Object}) bankSelectedPiece: Piece | undefined;
  @property({type: Boolean, reflect: true}) started = false;

  private gameResult: string | undefined;
  private player = 'cheems';
  private opponent = 'SwoleDoge94';
  private color?: Color;
  private timerInterval;

  connectedCallback() {
    super.connectedCallback();

    this.socket = new WebSocket(`ws://${location.hostname}:8081`);
    this.socket.onopen = () => {
      this.requestNewGame();
      addMessageHandler(this.socket, this.handleSocketMessage.bind(this));
    };

    this.addEventListener(
      'view-move-changed',
      this.handleViewMoveChanged.bind(this)
    );
    window.onbeforeunload = () => {
      sendMessage(this.socket, {type: 'exit' as const});
    };
    // Bank-related
    this.addEventListener('bank-picked', (e: CustomEvent) => {
      this.bankSelectedPiece = e.detail as Piece;
    });
    this.addEventListener('board-clicked', () => {
      this.bankSelectedPiece = undefined;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    clearInterval(this.timerInterval);

    this.socket.removeEventListener('open', function (e) {}.bind(this));
    this.socket.removeEventListener(
      'message',
      this.handleSocketMessage.bind(this)
    );
    this.removeEventListener(
      'view-move-changed',
      this.handleViewMoveChanged.bind(this)
    );
  }

  onInitGame() {
    // Reset animations in child elements
    this.started = false;
    this.performUpdate();

    setTimeout(() => {
      this.started = true;
    }, 0);

    const titleEl = this.shadowRoot?.querySelector('.title');
    const titleScrambler = setInterval(() => {
      if (titleEl) {
        titleEl.innerHTML = memecase(
          randomChoice(Object.keys(RANDOM_VARIANTS))
        );
      }
    }, 50);
    setTimeout(() => {
      clearInterval(titleScrambler);
      if (titleEl) {
        titleEl.innerHTML =
          this.game?.name.toUpperCase().split('').join(' ') ?? '';
      }
    }, ROULETTE_SECONDS * 1000);
  }

  handleSocketMessage(message: Message) {
    console.log('Received message of type %s', message.type);
    console.log(message);
    if (message.type === 'initGame' || message.type === 'reconnect') {
      const {variantName, state, color, player, opponent} = message;
      this.game = new VARIANTS[variantName](/* isServer=*/ false);
      this.game.turnHistory = [];
      this.game.stateHistory = [state];

      this.timerInterval = setInterval(() => {
        if (this.game?.state.whoseTurn === this.color) {
          if (this.playerTimer) {
            this.playerTimer = Math.max(this.playerTimer - 1000, 0);
            if (this.playerTimer === 10 * 1000) {
              const timerEl = this.shadowRoot?.querySelector('.timer.player');
              timerEl?.classList.add('blinking');
            }
          }
        } else {
          if (this.opponentTimer) {
            this.opponentTimer = Math.max(this.opponentTimer - 1000, 0);
            if (this.opponentTimer === 10 * 1000) {
              const timerEl = this.shadowRoot?.querySelector('.timer.opponent');
              timerEl?.classList.add('blinking');
            }
          }
        }
      }, 1000);

      if (message.type === 'reconnect') {
        this.started = true;
        this.game.turnHistory = message.turnHistory;
        this.game.stateHistory = message.stateHistory;
      }

      this.game.state = state;
      this.player = player;
      this.opponent = opponent;
      this.color = color;

      this.gameResult = '';
      if (message.type === 'initGame') this.onInitGame();
    } else if (message.type === 'gameOver') {
      const gom = message as GameOverMessage;
      const {turnHistory, stateHistory, result} = gom;
      if (this.game) {
        this.game.turnHistory = turnHistory;
        this.game.stateHistory = stateHistory;
        this.game.state = stateHistory?.[stateHistory.length - 1];
      }
      clearInterval(this.timerInterval);

      this.gameResult = result;
      const goDialog = this.shadowRoot?.querySelector('paper-dialog');
      goDialog?.open();
      if (result === GameResult.WIN) {
        const canvas = this.shadowRoot?.querySelector('#confetti-canvas');
        var confettiSettings = {target: canvas};
        var confetti = new ConfettiGenerator(confettiSettings);
        confetti.render();
        setTimeout(() => {
          confetti.clear();
        }, 5000);
      }
      this.performUpdate();
    } else if (message.type === 'timer') {
      const tim = message as TimerMessage;
      this.playerTimer = tim.player;
      this.opponentTimer = tim.opponent;
    }
  }

  handleViewMoveChanged(e: CustomEvent) {
    this.viewMoveIndex = e.detail;
    console.log('caught view move changed');
  }

  requestNewGame() {
    const goDialog = this.shadowRoot?.querySelector('paper-dialog');
    goDialog?.close();

    this.game = undefined;
    this.color = undefined;
    sendMessage(this.socket, {type: 'newGame'});
  }

  renderWaiting() {
    return html`<div class="app">
      <div>
        <h1 class="title">
          Waiting for players...
        </h1>
      </div>
      <div class="fish-con"><div class="fish"></div></div>
    </div>`;
  }

  renderTimer(ms?: number): string {
    if (!ms || ms < 0 || isNaN(ms)) return '0:00';
    const s = ms / 1000;
    const secondString = s % 60 < 10 ? `0${s % 60}` : s % 60;
    return `${Math.floor(s / 60)}:${secondString}`;
  }

  renderBanks() {
    if (!this.game || !this.color) return;
    if (!this.game.canDrop) return;
    const player = this.color;
    const opponent = getOpponent(this.color);

    // TODO: Banks when randomizing anim?
    return html`<div class="bank-wrapper">
      <div class="card bank">
        <my-piece-picker .pieces=${this.game.state.banks[opponent]}>
        </my-piece-picker>
      </div>
      <div class="card bank">
        <my-piece-picker
          .pieces=${this.game.state.banks[player]}
          .selected=${this.bankSelectedPiece}
          .eventName=${'bank-picked'}
          .needsTarget=${true}
        >
        </my-piece-picker>
      </div>
    </div>`;
  }

  render() {
    if (!this.game || !this.color) return this.renderWaiting();

    return html`<div class="app">
      <canvas id="confetti-canvas"></canvas>
      <div>
        <h1 class="title">
          ${this.started
            ? this.game?.name.toUpperCase().split('').join(' ')
            : ''}
        </h1>
      </div>
      <div class="game-container">
        ${this.renderBanks()}
        <div class="active-game-container">
          <div class="active-game-info opponent">
            <!-- this will be a component -->
            <div class="user-info">
              <div
                class="avatar"
                style="background-image:url(../img/swoledoge.jpg)"
              ></div>
              <div class="user-capture">
                <div class="username">${this.opponent}</div>
                <div class="captures"></div>
              </div>
            </div>
            <div class="timer opponent">
              ${this.renderTimer(this.opponentTimer)}
            </div>
          </div>
          <div class="board-wrapper card">
            <my-element
              .color=${this.color}
              .socket=${this.socket}
              .game=${this.game}
              .bankSelectedPiece=${this.bankSelectedPiece}
              .viewMoveIndex=${this.viewMoveIndex}
              .started=${this.started}
            ></my-element>
          </div>
          <div class="active-game-info player">
            <!-- this will be a component -->
            <div class="user-info">
              <div
                class="avatar"
                style="background-image:url(../img/cheems.jpeg)"
              ></div>
              <div class="user-capture">
                <div class="username">${this.player}</div>
                <div class="captures"></div>
              </div>
            </div>
            <div class="timer player">
              ${this.renderTimer(this.playerTimer)}
            </div>
          </div>
        </div>
        <div class="right-panel">
          <div class="card controls">
            <my-controls
              .socket=${this.socket}
              .turnHistory=${this.game.turnHistory}
              .playing=${!!this.gameResult}
            ></my-controls>
          </div>
          <div class="card rules">
            <my-rules .game=${this.game} .started=${this.started}></my-rules>
          </div>
        </div>
      </div>
      <div class="footer">
        <a target="_blank" href="https://discord.gg/DpWUJYt">Discord</a>
      </div>
      <paper-dialog
        class="game-over-dialog"
        entry-animation="scale-up-animation"
        exit-animation="fade-out-animation"
      >
        <h2 class="game-over-result">${memecase(this.gameResult ?? '')}</h2>
        <div>
          <paper-button
            class="game-over-button"
            raised
            .onclick=${this.requestNewGame.bind(this)}
          >
            New Game
          </paper-button>
        </div>
      </paper-dialog>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
