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
import { Color } from '../chess/const';
import "@polymer/paper-button/paper-button";
import "./my-element";
import "./my-announce";
import { GameListener } from './game-listener';
import { Piece } from '../chess/piece';
import { Pair } from '../chess/pair';
import { randomChoice } from '../utils';

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
      background-color: #ccc;
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
    .demo-title {
      font-size: 2vw;
      margin-bottom: 1vw;
      letter-spacing: 0.2em;
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
    }
    #username {
      flex: 1;
      margin-right: 10px;
      padding-left: 10px;
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

    .play-btn {
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

  private gameListener: GameListener;

  connectedCallback() {
    super.connectedCallback();

    this.game = new (randomChoice(DEMO_VARIANTS))(true);
    this.gameListener = new GameListener(this);
    this.gameListener.attach();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.gameListener.detach();
  }

  reroll = () => {
    this.game = new (randomChoice(DEMO_VARIANTS))(true);
  }

  render() {
    const {seeking, game, selectedPiece, selectedSquare} = this;

    return html`
      <div class="header">
        <my-announce></my-announce>
      </div>
      <div class="page-container">
        <div class="page-title">FISHRANDOM</div>
        <div class="page-subtitle">Chess variant roulette</div>
        <div class="grid">
          <div class="demo">
            <div class="demo-title">DEMO: ${game.name.toLocaleUpperCase()}</div>
            <my-element
              .color=${Color.WHITE}
              .game=${this.game}
              ?started=${true}
              .selectedPiece=${selectedPiece}
              .selectedSquare=${selectedSquare}
            ></my-element>
            <paper-button .onclick=${this.reroll} raised class="reroll-btn">Reroll</paper-button>
          </div>
          <div class="login">
            <input
              id="username"
              type="text"
              autocomplete="off"
              ?disabled=${seeking}
              placeholder="Username" />
            <paper-button ?disabled=${seeking} raised class="g-signin-btn">G</paper-button>
          </div>
          <div class="play">
            <paper-button raised class="play-btn">Play</paper-button>
            <paper-button raised class="private-btn">Private</paper-button>
          </div>
          <div class="info card">
            Fishrandom (inspired by
            <a target="_blank" href="https://en.wikipedia.org/wiki/Fischer_random_chess">
             Fischerandom chess aka Chess960</a>) is
            motivated by the idea that by adding an element of randomness,
            it gives players a chance for more creativity and improvisation.
            Instead of randomizing the starting position like in Chess960,
            Fishrandom chooses an entirely random chess variant at the
            beginning of each game. So every game is unexpected and new!
            <hr>
            Please feel free to leave feedback in the
            <a target="_blank" href="https://discord.gg/DpWUJYt">Discord</a>, or email
            <a target="_blank" href="mailto:admin@fishrandom.io">admin@fishrandom.io</a>.
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-front-page': MyFrontPage;
  }
}
