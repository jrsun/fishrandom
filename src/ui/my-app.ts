import {
  LitElement,
  html,
  customElement,
  property,
  css,
} from '../../node_modules/lit-element';
import '@polymer/paper-dialog';
import './my-element';
import './my-leaderboard';
import './my-announce';
import {VARIANTS, Chess960, RANDOM_VARIANTS} from '../chess/variants/index';
import {
  reviver,
  Message,
  InitGameMessage,
  GameOverMessage,
  addMessageHandler,
  TimerMessage,
  sendMessage,
  PlayerInfo,
} from '../common/message';
import ConfettiGenerator from 'confetti-js';
import './my-rules';
import './my-piece-picker';
import './my-controls';
import './my-captures';
import './my-release-notes';
import './my-element';

import {Game, GameResult, GameResultType} from '../chess/game';
import {BoardState} from '../chess/state';
import {Color, getOpponent, ROULETTE_SECONDS, Pair, DISCONNECT_TIMEOUT_SECONDS} from '../chess/const';
import {Knight, Piece} from '../chess/piece';
import {randomChoice, memecase} from '../utils';
import Square from '../chess/square';
import {SelectEventType, SelectEventDetail} from './utils';
import {equals} from '../chess/pair';

@customElement('my-app')
export class MyApp extends LitElement {
  static styles = css`
    .app {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    .waiting {
      /* background-attachment: fixed;
      margin:0;
      background-size: 220%;
      background-image: url('/img/bg-dark.svg'); */
      justify-content: center;
      font-family: "JelleeBold";
    }
    .tagline {
      font-family: Georgia, 'Times New Roman', Times, serif;
      color: lightsteelblue;
      font-size: 2vw;
    }
    .title {
      color: #EEEEEE;
      font-family: "JelleeBold";
      text-overflow: clip;
      overflow: hidden;
      white-space: nowrap;
      font-size: 32px;
    }
    .card {
      display: block;
      /* border: solid 1px gray; */
      /* margin: 15px; */
      /* max-width: 800px; */
      background-color: #efece0;
      padding: 20px;
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
        background: none;
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
    }
    .active-game-info.opponent {
      align-items: flex-end;
    }
    .active-game-info.player {
      align-items: flex-start;
    }
    .user-info {
      display: flex;
      color: #eee;
      font-family: 'JelleeBold';
    }
    .user-capture {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .connection-status {
      font-size: 10px;
    }
    .avatar {
      height: 60px;
      width: 60px;
      background-size: cover;
      margin-right: 10px;
      border-radius: 4px;
    }
    .win-streak {
      margin-left: 3px;
      background-color: #eee;
      border-radius: 2px;
      color: #040404;
      font-size: 12px;
      padding: 1px 3px;
    }
    .board-wrapper {
      margin-top: 20px;
      margin-bottom: 27px; /* allow box-shadow */
      display: flex;
      flex-direction: column;
      align-items: center;
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
      min-width: 75px;
      font-family: 'JelleeBold';
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
    .timer.paused {
      opacity: 0.5;
    }
    /* right */
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
      margin-bottom: 50px;
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
    .exit-while-waiting {
      margin-top: 10px;
      background-color: #eee;
    }
    .exit-while-waiting:hover {
      transition: 0.2s;
      background-color: #e2a18b;
    }
    .game-over-dialog {
      display: flex;
      flex-direction:column;
      align-items: center;
    }
    .game-over-result {
      font-family: 'JelleeBold';
    }
    .game-over-reason {
      margin-top: 0;
    }
    .game-over-button:hover {
      transition: 0.2s;
      background-color: #bde6c0;
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
    .blinking {animation: blink 0.5s linear 3;}
    @keyframes blink {
      from {opacity: 0};
    }

    /* CSS Grid */
    .grid {
      width: 100%;
      display: grid;
      grid-row-gap: 30px;
      grid-column-gap: 40px;
      grid-template-areas:
        "game"
        "leaderboard"
        "controls"
        "rules";
    }
    @media (min-width: 600px) {
      .grid {
        grid-template-columns: auto 350px;
        grid-template-rows: auto;
        justify-items: center;
        align-items: start;
        grid-template-areas:
          "game leaderboard"
          "game controls"
          "game rules";
      }
    }
    .bank-wrapper {
      grid-area: bank;
    }
    .active-game-container {
      grid-area: game;
    }
    my-leaderboard {
      grid-area: leaderboard;
      width: 100%;
    }
    .controls {
      grid-area: controls;
      width: 100%;
    }
    .rules {
      grid-area: rules;
    }
  }`;

  @property({type: Object}) game?: Game;
  private socket: WebSocket;

  // private
  @property({type: Number}) viewMoveIndex: number | undefined;
  @property({type: Number}) playerTimer?: number;
  @property({type: Object}) playerInfo?: PlayerInfo;
  @property({type: Object}) opponentInfo?: PlayerInfo;
  @property({type: Number}) opponentTimer?: number;
  @property({type: Boolean, reflect: true}) started = false;
  @property({type: Object}) selectedPiece?: Piece;
  @property({type: Object}) selectedSquare?: Pair;

  private gameResult: GameResult | undefined;
  private color?: Color;
  private timerInterval;
  private audio: {
    lowTimePlayed: boolean;
    lowTime: HTMLAudioElement | null | undefined;
    win: HTMLAudioElement | null | undefined;
    lose: HTMLAudioElement | null | undefined;
    roulette: HTMLAudioElement | null | undefined;
  };
  private unloaded?: boolean;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener(
      'view-move-changed',
      this.handleViewMoveChanged.bind(this)
    );
    this.addEventListener('init-game', this.initGame);
    this.addEventListener(SelectEventType.PIECE_TOGGLE, this.onPieceToggle);
    this.addEventListener(SelectEventType.PIECE_ON, this.onPieceOn);
    this.addEventListener(SelectEventType.PIECE_OFF, this.onPieceOff);

    // Unload
    const onUnload = (e) => {
      // Hack: if onUnload itself is async, it triggers the confirmation dialog.
      (async () => {
        await sendMessage(this.socket, {type: 'exit' as const});
      })();
    };
    window.onbeforeunload = onUnload;
    window.onunload = onUnload;

    this.wsConnect();
  }

  onPieceOff = () => {
    this.selectedSquare = undefined;
    this.selectedPiece = undefined;
  }
  onPieceOn = (e: CustomEvent) => this.onPieceSelected(e, false);
  onPieceToggle = (e: CustomEvent) => this.onPieceSelected(e, true);
  onPieceSelected = (e: CustomEvent, toggle: boolean) => {
    const {piece, square} = e.detail;
    if (
      piece &&
      square?.row !== undefined &&
      square?.col !== undefined &&
      (!toggle || !equals(square, this.selectedSquare))
    ) {
      this.selectedSquare = {row: square.row, col: square.col};
    } else {
      this.selectedSquare = undefined;
    }
    this.selectedPiece = piece as Piece;
  }

  onUnload = () => {
    if (this.unloaded) return;
    this.unloaded = true;
    sendMessage(this.socket, {type: 'exit'}, true);
    this.socket.onclose = () => {};
    this.socket.close();
  };

  wsConnect() {
    if (process.env.NODE_ENV === 'development') {
      this.socket = new WebSocket('ws://localhost:8081');
    } else {
      this.socket = new WebSocket(`wss://${location.hostname}:8081`);
    }
    this.socket.onopen = () => {
      addMessageHandler(this.socket, this.handleSocketMessage.bind(this));
      this.requestUpdate().then(() => {
        // set up child event listeners
        this.initGame();
      });
    };

    this.socket.onclose = (e) => {
      if (this.game && !this.gameResult) {
        console.log(
          'Socket closed during game. Reconnect will be attempted in 1 second.',
          e.reason
        );
        setTimeout(() => {
          // if game isn't over, start
          this.wsConnect();
        }, 1000);
      } else {
        console.warn('Socket closed.');
        location.href = '/';
      }
    };

    this.socket.onerror = (e) => {
      console.error('Socket encountered error: ', e, 'Closing socket');
      this.socket.close();
    };
  }

  firstUpdated() {
    this.audio = {
      lowTimePlayed: false,
      lowTime: document.querySelector('#low-time-audio') as HTMLAudioElement,
      win: document.querySelector('#win-audio') as HTMLAudioElement,
      lose: document.querySelector('#lose-audio') as HTMLAudioElement,
      roulette: document.querySelector('#roulette-audio') as HTMLAudioElement,
    };
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
    this.removeEventListener('init-game', this.initGame);
    this.removeEventListener(SelectEventType.PIECE_TOGGLE, this.onPieceToggle);
    this.removeEventListener(SelectEventType.PIECE_ON, this.onPieceOn);
    this.removeEventListener(SelectEventType.PIECE_OFF, this.onPieceOff);
    this.socket.close();
  }

  onInitGame() {
    // Reset animations in child elements
    this.started = false;
    this.performUpdate();

    setTimeout(() => {
      this.started = true;
    }, 0);

    // Animate title
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
    if (this.audio.roulette) {
      this.audio.roulette.volume = 0.5;
      this.audio.roulette?.play();
    }
  }

  handleSocketMessage(message: Message) {
    // if (message.type !== 'leader') console.log(message);
    if (message.type === 'kick') {
      location.href = '/';
    }
    if (message.type === 'initGame' || message.type === 'reconnect') {
      const {variantName, state, color, player, opponent} = message;
      this.game = new VARIANTS[variantName](/* isServer=*/ false);
      this.game.turnHistory = [];
      this.game.stateHistory = [state];
      this.gameResult = undefined;
      this.selectedPiece = undefined;
      this.selectedSquare = undefined;

      this.audio.lowTimePlayed = false;
      clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.game?.state.whoseTurn === this.color) {
          if (this.playerTimer) {
            this.playerTimer = Math.max(this.playerTimer - 1000, 0);
            if (this.playerTimer === 10 * 1000) {
              const timerEl = this.shadowRoot?.querySelector('.timer.player');
              timerEl?.classList.add('blinking');
              const {lowTime, lowTimePlayed} = this.audio;
              if (lowTime && !lowTimePlayed) {
                this.audio.lowTimePlayed = true;

                lowTime.volume = 0.6;
                lowTime.play();
                lowTime.volume = 1;
              }
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
      this.playerInfo = player;
      this.opponentInfo = opponent;
      this.color = color;

      if (message.type === 'initGame') this.onInitGame();
    } else if (message.type === 'gameOver') {
      const gom = message as GameOverMessage;
      const {turnHistory, stateHistory, result, player, opponent} = gom;
      this.playerInfo = player;
      this.opponentInfo = opponent;
      if (this.game) {
        this.game.turnHistory = turnHistory;
        this.game.stateHistory = stateHistory;
        this.game.state = stateHistory?.[stateHistory.length - 1];
      }
      clearInterval(this.timerInterval);

      this.gameResult = result;
      const goDialog = this.shadowRoot?.querySelector('paper-dialog');
      goDialog?.open();
      if (result.type === GameResultType.WIN) {
        const canvas = this.shadowRoot?.querySelector('#confetti-canvas');
        var confettiSettings = {target: canvas};
        var confetti = new ConfettiGenerator(confettiSettings);
        confetti.render();
        this.audio.win?.play();
        setTimeout(() => {
          confetti.clear();
        }, 5000);
      } else {
        this.audio.lose?.play();
      }
      this.performUpdate();
    } else if (message.type === 'timer') {
      const tim = message as TimerMessage;
      this.playerTimer = tim.player;
      this.opponentTimer = tim.opponent;
    } else if (message.type === 'playerInfo') {
      this.playerInfo = message.player;
      this.opponentInfo = message.opponent;
    }
  }

  handleViewMoveChanged(e: CustomEvent) {
    this.viewMoveIndex = e.detail;
  }

  initGame = () => {
    const goDialog = this.shadowRoot?.querySelector('paper-dialog');
    goDialog?.close();

    this.gameResult = undefined;
    this.game = undefined;
    this.color = undefined;
    if (!(this.socket.readyState === 1)) {
      this.wsConnect();
    } else {
      sendMessage(this.socket, {type: 'newGame'});
    }
  };

  renderWaiting() {
    return html`<div class="app waiting">
      <my-announce></my-announce>
      <div>
        <h1 class="title">
          Waiting for opponent...
        </h1>
      </div>
      <div class="fish-con"><div class="fish"></div></div>
      <my-release-notes></my-release-notes>
      <paper-button
        class="exit-while-waiting"
        raised
        .onclick=${() => {
          location.href = '/';
        }}
        >Back</paper-button
      >
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

    return html`<div class="bank-wrapper grid-item">
      <div class="card bank">
        <my-piece-picker
          .eventName=${SelectEventType.PIECE_TOGGLE}
          .pieces=${this.game.state.banks[opponent]}
          .needsTarget=${true}
          .selectedPiece=${this.selectedPiece}
        >
        </my-piece-picker>
      </div>
      <div class="card bank">
        <my-piece-picker
          .eventName=${SelectEventType.PIECE_TOGGLE}
          .pieces=${this.game.state.banks[player]}
          .needsTarget=${true}
          .selectedPiece=${this.selectedPiece}
        >
        </my-piece-picker>
      </div>
    </div>`;
  }

  render() {
    if (!this.game || !this.color) return this.renderWaiting();

    return html`<div class="app">
      <my-announce></my-announce>
      <canvas id="confetti-canvas"></canvas>
      <div>
        <h1 class="title">
          ${this.started
            ? this.game?.name.toUpperCase().split('').join(' ')
            : ''}
        </h1>
      </div>
      <div class="game-container grid">
        ${this.renderBanks()}
        <div class="active-game-container grid-item">
          <div class="active-game-info opponent">
            <div class="user-info">
              <div
                class="avatar"
                style="background-image:url(../img/swoledoge.jpg)"
              ></div>
              <div class="user-capture">
                <div>
                  <span class="username">${this.opponentInfo?.name}</span>
                  <span class="opponent win-streak">
                    ${this.opponentInfo?.elo}
                  </span>
                </div>
                <div class="opponent connection-status">
                    ${this.opponentInfo?.connected ?
                      'Connected' :
                      `Disconnected... auto-resign in ${DISCONNECT_TIMEOUT_SECONDS} seconds`
                    }
                </div>
                <div class="captures">
                  <my-captures
                    .turnHistory=${this.game?.turnHistory ?? []}
                    .color=${this.color ? getOpponent(this.color) : Color.BLACK}
                  ></my-captures>
                </div>
              </div>
            </div>
            <div
              class="timer opponent ${this.game.state.whoseTurn ===
                getOpponent(this.color) && !this.gameResult
                ? ''
                : 'paused'}"
            >
              ${this.renderTimer(this.opponentTimer)}
            </div>
          </div>
          <div class="board-wrapper card">
            <my-element
              .color=${this.color}
              .socket=${this.socket}
              .game=${this.game}
              .viewMoveIndex=${this.viewMoveIndex}
              .started=${this.started}
              .selectedPiece=${this.selectedPiece}
              .selectedSquare=${this.selectedSquare}
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
                <div>
                  <span class="username">${this.playerInfo?.name}</span>
                  <span class="player win-streak">
                    ${this.playerInfo?.elo}
                  </span>
                </div>
                <div class="captures">
                  <my-captures
                    .turnHistory=${this.game?.turnHistory ?? []}
                    .color=${this.color}
                  ></my-captures>
                </div>
              </div>
            </div>
            <div
              class="timer player ${this.game.state.whoseTurn === this.color &&
              !this.gameResult
                ? ''
                : 'paused'}"
            >
              ${this.renderTimer(this.playerTimer)}
            </div>
          </div>
        </div>
        <my-leaderboard class="grid-item"
          .socket=${this.socket}
          .player=${this.playerInfo}
        ></my-leaderboard>
        <div class="controls grid-item">
          <my-controls
            class="card"
            .socket=${this.socket}
            .turnHistory=${this.game?.turnHistory ?? []}
            .playing=${!this.gameResult}
          ></my-controls>
        </div>
        <div class="card rules grid-item">
          <my-rules .game=${this.game} .started=${this.started}></my-rules>
        </div>
      </div>
      <paper-dialog
        class="game-over-dialog"
        entry-animation="scale-up-animation"
        exit-animation="fade-out-animation"
      >
        <h2 class="game-over-result">${memecase(this.gameResult?.type ?? '')}</h2>
        <div class="game-over-reason">${
          this.gameResult?.reason ?
          `by ${this.gameResult.reason}` :
          ''
        }</div>
        <div>
          <paper-button
            class="game-over-button"
            raised
            .onclick=${this.initGame.bind(this)}
          >
            New Game
          </paper-button>
        </div>
      </paper-dialog>
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
