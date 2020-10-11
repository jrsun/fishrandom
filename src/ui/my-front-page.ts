import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import { Game } from '../chess/game';
import { DEMO_VARIANTS } from '../chess/variants';
import { Color, ROULETTE_SECONDS } from '../chess/const';
import "@polymer/paper-button/paper-button";
import "./my-game";
import "./my-announce";
import { GameListener } from './game-listener';
import { Piece } from '../chess/piece';
import { Pair } from '../chess/pair';
import { randomChoice } from '../utils';
import "./my-tooltip";
import { SeekEventType, CancelSeekEventType } from './utils';

@customElement('my-front-page')
export class MyFrontPage extends LitElement {
  static styles = css`

    /* Whole page */
    :host {
      display: block;
      color: #eee;
      font-family: 'JelleeBold';
      height: 100%;
      width: 100%;

      background-size: 220%;
      background-image: url('/img/bg-dark.svg');
    }

    .page-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .page-title {
      font-size: 4vw;
      letter-spacing: 0.2em;
    }
    .page-subtitle {
      font-size: 2vw;
      margin-bottom: 2vw;
    }

    /* Components */

    paper-button {
      color: #223322;
      background-color: #ccc;
      font-family: 'JelleeBold';
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
        "info";
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
          "demo info";
      }
    }

    /* Grid Areas */

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
      font-size: 2vw;
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

    .login {
      grid-area: login;
      width: 100%;
      display: flex;
      align-items: stretch;
    }
    .login-form {
      display: flex;
      flex: 1;
      margin-right: 10px;
    }
    #username {
      padding-left: 10px;
      width: 100%;
      font-size: large;
    }

    .play {
      grid-area: play;
      display: flex;
      width: 100%;
    }
    .play paper-button {
      flex: 1;
    }

    .play paper-button:first-child {
      margin-right: 10px;
    }

    .seek-btn {
      background-color: #82d7ba;
    }

    .info {
      grid-area: info;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
  `;

  // public
  @property({type: Boolean}) seeking = false;

  // protected
  @property({type: Object}) game: Game; // demo
  @property({type: Object}) selectedPiece: Piece|undefined;
  @property({type: Object}) selectedSquare: Pair|undefined;
  @property({type: Boolean}) rouletteToggle = true;

  private gameListener: GameListener;
  private audio: {roulette: HTMLAudioElement|null|undefined};

  // lifecycle

  connectedCallback() {
    super.connectedCallback();

    this.game = new (randomChoice(Object.values(DEMO_VARIANTS)))(true);
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
  }

  // render
  render() {
    const {seeking, game, selectedPiece, selectedSquare, rouletteToggle} = this;

    return html`
      <div class="header">
        <my-announce></my-announce>
      </div>
      <div class="page-container">
        <div class="page-title">FISHRANDOM</div>
        <div class="page-subtitle">Chess variant roulette</div>
        <div class="grid">
          <div class="demo">
            <div class="demo-header">
              <div class="demo-title">
                ${game.name.toLocaleUpperCase()}
              </div>
              <my-tooltip>
                <div slot="tooltip" class="demo-tooltip">?</div>
                <div slot="tooltiptext" class="demo-tooltiptext">
                  You can play both sides in this practice mode.
                </div>
              </my-tooltip>
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
          <div class="login">
            <form class="login-form" .onsubmit=${this.seek}>
              <input
                id="username"
                type="text"
                autocomplete="off"
                ?disabled=${seeking}
                placeholder="Username" />
            </form>
            <paper-button ?disabled=${seeking} raised class="g-signin-btn">G</paper-button>
          </div>
          <div class="play">
            ${this.renderPlay()}
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
            <a target="_blank" href="https://discord.gg/DpWUJYt">Discord</a>, or email
            <a target="_blank" href="mailto:admin@fishrandom.io">admin@fishrandom.io</a>.
          </div>
        </div>
      </div>
    `;
  }

  renderPlay = () => {
    const {seeking} = this;
    return html`
      ${seeking ?
        html`<paper-button .onclick=${this.cancelSeek}>Cancel</paper-button>`
      : html`<paper-button .onclick=${this.seek} ?disabled=${seeking} raised class="seek-btn">Play</paper-button>`
      }
      <paper-button ?disabled=${seeking} raised class="private-btn">Private</paper-button>
    `;
  }

  // methods

  reroll = () => {
    this.game = new (randomChoice(Object.values(DEMO_VARIANTS)))(true);
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

  getUsernameContent = (): string|undefined => {
    const usernameElement = this.shadowRoot?.querySelector(
      '#username'
    ) as HTMLInputElement;
    return usernameElement?.value;
  }

  // auth
  seek = (e: Event) => {
    console.log('fire seek');
    e.preventDefault();

    const username = this.getUsernameContent() || 'guest';

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
        // password: password.value,
        // variant: variant,
      }),
    }).then(() => {
      // seek game
      localStorage.setItem('name', username);
      console.log(username);
      this.dispatchEvent(new CustomEvent(
        SeekEventType,
        {
          bubbles: true,
          composed: true,
        }
      ));
    });
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
