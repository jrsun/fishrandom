import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import "@polymer/paper-button/paper-button";
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/iron-icons/iron-icons';

import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import { Game } from '../chess/game';
import { DEMO_VARIANTS, VARIANTS } from '../chess/variants';
import { Color, ROULETTE_SECONDS } from '../chess/const';
import "./my-game";
import "./my-announce";
import "./my-spinner";
import "./my-leaderboard";
import "./my-champions";
import { GameListener } from './game-listener';
import { Piece } from '../chess/piece';
import { Pair } from '../chess/pair';
import { randomChoice, pluralize } from '../common/utils';
import "./my-tooltip";
import { SeekEventType, CancelSeekEventType, LIST_OF_FISH } from './utils';
import { PaperDialogElement } from '@polymer/paper-dialog';
import {PaperDropdownMenuElement} from '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';

// Facebook tracking
declare var fbq: any;

@customElement('my-front-page')
export class MyFrontPage extends LitElement {
  static styles = css`

    /* Whole page */
    :host {
      display: block;
      color: #eee;
      font-family: 'JelleeBold';
      width: 100%;
    }

    .page-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .page-title {
      font-size: 2.5em;
      letter-spacing: 0.2em;
    }
    .page-subtitle {
      font-size: 1em;
      margin-bottom: 2vw;
    }

    /* Components */

    paper-button {
      color: #223322;
      background-color: #ccc;
      font-family: 'JelleeBold';
      margin: 0;
    }

    paper-button[disabled] {
      background-color: #999;
      color: #666;
    }

    .card {
      display: block;
      background-color: #efece0;
      padding: 20px;
      border-radius: 4px;
      box-shadow: 0px 7px #dad4c8;
      color: black;
    }
    .card hr {
      border-color: #efece0;
    }
    input[type='text'] {
      border-radius: 4px;
      font-size: 25px;
      text-align: center;
      font-family: Verdana, sans-serif;
      border: #888;
      outline: none;
    }
    input[type='text']::placeholder {
      /* Chrome, Firefox, Opera, Safari 10.1+ */
      color: #aaa;
      opacity: 1; /* Firefox */
    }
    /* CSS Grid */

    .grid {
      width: 100%;
      display: grid;
      grid-row-gap: 30px;
      grid-column-gap: 40px;
      grid-template-areas:
        "demo"
        "login"
        "play"
        "info"
        "champions"
        "leaderboard";
    }

    @media (min-width: 600px) {
      .page-container {
        padding: 5vw 10vw;
      }
      .grid {
        justify-items: center;
        align-items: center;
        grid-template-areas:
          "demo login"
          "demo play"
          "demo champions"
          "demo leaderboard"
          "demo info";
      }
      .demo {
        /* Aligning to top, but in flex-direction: column, this means aligning to left */
        align-self: flex-start; 
      }
    }

    @media (max-width: 600px) {
      .page-container {
        padding-top: 20px;
      }
      .grid {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    }

    /* Grid Areas */

    /* Champions */
    my-champions {
      grid-area: champions;
      width: 100%;
    }

    /* Demo  */
    .demo {
      grid-area: demo;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .demo-header {
      display: flex;
      align-items: center;
      margin-bottom: 1vw;
    }
    .demo-header>* {
      margin-right: 10px;
    }
    .demo-header>*:last-child {
      margin-right: 0;
    }
    .demo-title {
      font-size: 1em;
      letter-spacing: 0.2em;
    }
    .demo-tooltip {
      background-color: black;
      border-radius: 0.5em;
      width: 1em;
      height: 1em;
      text-align: center;
    }
    .reroll-btn {
      width: 100%;
      border-radius: 0 0 3px 3px;
      background-color: rgb(131 148 244);
    }
    /* Demo dialog */
    #demo-info {
      background-color: rgba(239, 236, 224, 0.95);
      font-size: large;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .demo-instructions {
      font-family: 'JelleeBold';
    }
    .demo-instructions h2 {
      margin: 0;
    }

    /* Login  */
    .login {
      grid-area: login;
      width: 100%;
      display: flex;
      align-items: stretch;
    }
    .login-form {
      display: flex;
      flex: 1;
      /* margin-right: 10px; */
    }
    #username {
      height: 100%;
      width: 100%;
    }
    .play {
      grid-area: play;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .play-buttons {
      width: 100%;
      display: flex;
      margin-bottom: 10px;
    }
    .play-buttons my-tooltip {
      flex: 1;
      height: 100%;
    }

    .play-buttons my-tooltip:first-child {
      margin-right: 10px;
    }

    .seek-btn {
      /* background-color: #82d7ba; */
      background-color: rgb(48 227 166);
    }

    .info {
      grid-area: info;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    /* Leaderboard */
    my-leaderboard {
      grid-area: leaderboard;
      width: 100%;
    }

    /* Spinner */
    .spinner {
      position: absolute;
      transform: translate(-25%, -25%);
    }

    /* Private Room Dialog */
    .room-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: 'JelleeBold';
    }
    .room-container > * {
      margin-bottom: 10px;
    }
    #password {
      width: 40vw;
      padding-left: 10px;
      width: 100%;
      font-size: large;
      border: 1px solid #ccc;
    }
    #variant-menu {
      width: 40vw;
    }
    paper-dialog {
      /* background-color: #fffeed; */
      border-radius: 4px;
      transform: translate(0, +50px);
    }
    .instructions {
      max-width: 40vw;
    }
  `;

  // public
  @property({type: Boolean}) seeking = false;
  @property({type: Object}) socket: SocketIO.Socket;
  @property({type: Number}) countPlayers?: number;

  // protected
  @property({type: Object}) game: Game; // demo
  @property({type: Object}) selectedPiece: Piece|undefined;
  @property({type: Object}) selectedSquare: Pair|undefined;
  @property({type: Boolean}) rouletteToggle = true;
  @property({type: Boolean}) privateModalOpened = false;

  private gameListener: GameListener;
  private audio: {roulette: HTMLAudioElement|null|undefined};
  private roomModal: PaperDialogElement;

  // lifecycle

  connectedCallback() {
    super.connectedCallback();

    this.game = new (randomChoice(Object.values(DEMO_VARIANTS)))(true).demoize();
    this.gameListener = new GameListener(this);
    this.gameListener.attach();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.gameListener.detach();
  }

  firstUpdated() {
    this.audio = {
      roulette: document.querySelector('#roulette-audio') as HTMLAudioElement,
    }
    this.roomModal = this.shadowRoot!.querySelector('#room-modal') as PaperDialogElement;
  }

  // render
  render() {
    const {countPlayers, seeking, game, selectedPiece, selectedSquare, rouletteToggle} = this;

    return html`
      <div class="header">
        <my-announce></my-announce>
      </div>
      <div class="page-container">
        <div class="page-title">FISHRANDOM</div>
        <div class="page-subtitle">Chess variant roulette</div>
        <div class="grid">
          <div class="login">
            <form class="login-form" .onsubmit=${(e: Event) => {
              e.preventDefault();
              this.seek();
            }}>
              <input
                id="username"
                type="text"
                autocomplete="off"
                ?disabled=${seeking}
                placeholder="Username"
                value=${localStorage.getItem('name') ?? randomChoice(LIST_OF_FISH)} />
            </form>
            <!-- <paper-button ?disabled=${seeking} raised class="g-signin-btn">G</paper-button> -->
          </div>
          <div class="play">
            ${this.renderPlayButtons()}
            ${this.seeking ?
              html`<div class="spinner">
                <my-spinner></my-spinner>
              </div>` : html``
            }
            ${ countPlayers !== undefined ?
              html`<div class="count-players">${pluralize(countPlayers, 'player')} online</div>` :
              html``
            }
          </div>
          <div class="demo">
            <div class="demo-header">
              <div class="demo-title">
                ${game.name.toLocaleUpperCase()}
              </div>
              <paper-icon-button icon="info" .onclick=${this.openDemoInfo}>
              </paper-icon-button>
            </div>
            <my-game
              .color=${Color.WHITE}
              .game=${game}
              ?started=${rouletteToggle}
              .selectedPiece=${selectedPiece}
              .selectedSquare=${selectedSquare}
            ></my-game>
            <paper-button .onclick=${this.reroll} raised class="reroll-btn">Reroll</paper-button>
          </div>
          <div class="info card">
            <b>Fishrandom</b> is randomized chess variant roulette. Inspired by
            <a target="_blank" href="https://en.wikipedia.org/wiki/Fischer_random_chess">
             Fischer random chess aka Chess960</a>, it is
            motivated by the idea that adding an element of randomness gives
            players a chance for more creativity and improvisation.
            Instead of randomizing the starting position like in Chess960,
            Fishrandom chooses an entirely random
            <a target="_blank" href="https://en.wikipedia.org/wiki/List_of_chess_variants">
            chess variant</a> at the beginning of each game.
            So every game is unexpected and new!
            <hr>
            Please feel free to leave feedback in the
            <a target="_blank" href="https://discord.gg/sERxRBHb97">Discord</a>, or email
            <a target="_blank" href="mailto:admin@fishrandom.io">admin@fishrandom.io</a>.
          </div>
          <my-champions></my-champions>
          <my-leaderboard .socket=${this.socket}></my-leaderboard>
        </div>
        ${this.renderPrivateModal()}
        ${this.renderDemoInfoModal()}
      </div>
    `;
  }

  renderPlayButtons = () => {
    const {seeking} = this;
    return html`
      <div class="play-buttons">
        ${seeking ?
          html`
            <my-tooltip class="cancel-seek-wrapper">
              <paper-button
                .onclick=${this.cancelSeek}
                slot="tooltip">Seeking...</paper-button>
              <div slot="tooltiptext">Cancel searching for a game.</div>
            </my-tooltip>
          `
        : html`
          <my-tooltip class="seek-btn-wrapper">
            <paper-button
              .onclick=${() => this.seek()}
              ?disabled=${seeking}
              raised
              class="seek-btn"
              slot="tooltip"
            >Play random</paper-button>
            <div slot="tooltiptext">Play a random variant against online players.
            </div>
          </my-tooltip>`
        }
        <my-tooltip class="private-btn-wrapper">
          <paper-button
            ?disabled=${seeking}
            .onclick=${() => {
              this.roomModal?.open();
            }}
            slot="tooltip"
            raised class="private-btn"
          >Play friend</paper-button>
          <div slot="tooltiptext">Choose variant and create a private game
            with a friend using a shared room code.</div>
        </my-tooltip>
      </div>
    `;
  }

  renderPrivateModal = () => {
    return html`
    <paper-dialog id="room-modal">
      <div class="room-container">
        <div class="instructions">
          Share password with a friend, or use the password shared with you
          to join.
        </div>
        <input
          id="password"
          type="text"
          autocomplete="off"
          placeholder="Room password"
        />
        <paper-dropdown-menu
          label="Vote for game (Opponent chooses too!)"
          id="variant-menu"
        >
          <paper-listbox slot="dropdown-content" selected="0">
            <paper-item>random</paper-item>
            ${Object.keys(VARIANTS).sort().map((name: string) => {
              return html`<paper-item>${name}</paper-item>`;
            })}
          </paper-listbox>
        </paper-dropdown-menu>
        <paper-button
          class="seek-btn"
          raised
          .onclick=${() => {
            if (!this.getInputContent('#password')) return;
            this.roomModal.close();
            this.seek(/*private*/true);
          }}
          >Play</paper-button
        >
      </div>
    </paper-dialog>`;
  }

  renderDemoInfoModal = () => {
    return html`
    <paper-dialog id="demo-info">
      <h2>Practice mode</h2>
      <div>This is a practice board where you can try out some
        of the variants. You can play as both sides.
      </div>
      <hr>
      <my-rules .game=${this.game} ?started=${true}></my-rules>
    </paper-dialog>`;
  }

  // methods

  openDemoInfo = () => {
    const demoInfoModal = this.shadowRoot!.querySelector('#demo-info') as PaperDialogElement;
    demoInfoModal.open();
  }

  reroll = () => {
    this.game = new (randomChoice(Object.values(DEMO_VARIANTS)))(true).demoize();

    this.rouletteToggle = false;
    setTimeout(() => {this.rouletteToggle = true}, 0);

    // Animate title
    const titleEl = this.shadowRoot?.querySelector('.demo-title');
    const titleScrambler = setInterval(() => {
      if (titleEl) {
        titleEl.innerHTML = randomChoice(Object.keys(DEMO_VARIANTS)).toLocaleUpperCase();
      }
    }, 50);
    setTimeout(() => {
      clearInterval(titleScrambler);
      if (titleEl) {
        titleEl.innerHTML =
          this.game?.name.toLocaleUpperCase();
      }
    }, ROULETTE_SECONDS * 1000);
    if (this.audio.roulette) {
      this.audio.roulette.volume = 0.5;
      this.audio.roulette.pause();
      this.audio.roulette.currentTime = 0;
      this.audio.roulette.play();
    }
  }

  getInputContent = (selector: string): string|undefined => {
    const el = this.shadowRoot?.querySelector(selector) as HTMLInputElement;
    return el?.value;
  }

  // auth
  seek = (isPrivate=false) => {
    const username = this.getInputContent('#username') || 'guest';
    const password = isPrivate ? this.getInputContent('#password') : undefined;
    const variant = isPrivate ? this.getInputContent('#variant-menu') : undefined;

    fetch('/login', {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow', // manual, *follow, error,
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify({
        username: username,
        password: password || undefined,
        variant: variant || undefined,
      }),
    }).then(() => {
      // seek game
      localStorage.setItem('name', username);
      this.dispatchEvent(new CustomEvent(
        SeekEventType,
        {
          bubbles: true,
          composed: true,
        }
      ));
    });
    fbq('track', 'Lead', {username, private: !!password, variant});
  }

  cancelSeek = () => {
    this.dispatchEvent(new CustomEvent(
      CancelSeekEventType,
      {
        bubbles: true,
        composed: true,
      }
    ));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-front-page': MyFrontPage;
  }
}
