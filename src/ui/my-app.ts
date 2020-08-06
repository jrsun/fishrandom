import {
  LitElement,
  html,
  customElement,
  property,
  css,
} from '../../node_modules/lit-element';
import '@polymer/paper-dialog';
import './my-element';
import {VARIANTS, Chess960} from '../chess/variants/index';
import {
  reviver,
  Message,
  InitGameMessage,
  GameOverMessage,
  GameResult,
  addMessageHandler,
} from '../common/message';
import ConfettiGenerator from 'confetti-js';
import './my-rules';
import './my-piece-picker';
import './my-controls';
import {Game} from '../chess/game';
import BoardState from '../chess/state';
import { Color } from '../chess/const';

@customElement('my-app')
export class MyApp extends LitElement {
  static styles = css`
    .app {
      display: flex;
      flex-direction: column;
      align-items: center;
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
    }
    .active-game-container {
      display: flex;
      flex-direction: column;
      margin-right: 30px;
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
      font-family: 'Jellee';
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
      max-height: calc(100vh - 300px);
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
  }`;

  @property({type: Object}) game?: Game;
  private socket: WebSocket;

  // private
  @property({type: Object}) viewHistoryState: BoardState | undefined;

  private gameResult: string|undefined;
  private player = 'cheems';
  private opponent = 'SwoleDoge94';
  private server = process.env.NODE_ENV === 'development' ? 'localhost' : '167.172.142.144';
  private color?: Color;

  connectedCallback() {
    super.connectedCallback();
    this.handleNewGame();
    this.addEventListener(
      'view-move-changed',
      this.handleViewMoveChanged.bind(this)
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();

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

  handleSocketMessage(message: Message) {
    console.log('Received message of type %s', message.type);
    console.log(message);
    if (message.type === 'initGame') {
      const igm = message as InitGameMessage;
      const {variantName, state, color, player, opponent} = igm;
      this.game = new VARIANTS[variantName](/* isServer=*/ false);
      this.game.turnHistory = [];
      this.game.stateHistory = [state];
      this.game.state = state;
      this.player = player;
      this.opponent = opponent;
      this.color = color;

      this.gameResult = '';

      this.performUpdate();
    } else if (message.type === 'gameOver') {
      const gom = message as GameOverMessage;
      const {turnHistory, stateHistory, result} = gom;
      if (this.game) {
        this.game.turnHistory = turnHistory;
        this.game.stateHistory = stateHistory;
        this.game.state = stateHistory?.[stateHistory.length - 1];
      }

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
    }
  }

  handleViewMoveChanged(e: CustomEvent) {
    console.log('caught view move changed');
    this.viewHistoryState = e.detail as BoardState;
  }

  handleNewGame() {
    const goDialog = this.shadowRoot?.querySelector('paper-dialog');
    goDialog?.close();
 
    this.socket = new WebSocket(`ws://${this.server}:8081`);
    addMessageHandler(this.socket, this.handleSocketMessage.bind(this));
    this.performUpdate();
  }

  renderWaiting() {
    return html`<div class="app">
        <div class="title">
          <h1>
            F I S H R A N D O M
          </h1>
        </div>
        <div class="fish-con"><div class="fish"></div></div>
      </div>`;
  }

  render() {
    if (!this.game || !this.color) return this.renderWaiting();

    return html`<div class="app">
      <canvas id="confetti-canvas"></canvas>
      <div class="title">
        <h1>
          ${this.game.name.toUpperCase().split('').join(' ')}
        </h1>
      </div>
      <div class="game-container">
        <!-- dom-if piece bank -->
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
            <div class="timer opponent">3:45</div>
          </div>
          <div class="board-wrapper card">
            <my-element
              .color=${this.color}
              .socket=${this.socket}
              .game=${this.game}
              .viewHistoryState=${this.viewHistoryState}
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
            <div class="timer player">1:23</div>
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
            <my-rules .game=${this.game}></my-rules>
          </div>
        </div>
      </div>
      <paper-dialog
        entry-animation="scale-up-animation"
        exit-animation="fade-out-animation"
      >
        <h2>${this.gameResult}</h2>
        <div>
          <paper-button raised .onclick=${this.handleNewGame.bind(this)}>
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
