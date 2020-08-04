import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import {Game} from '../chess/game';
import {toFEN, Turn} from '../chess/move';
import {
  VARIANTS,
  Chess960,
  Classic,
  Knightmate,
  Horde,
} from '../chess/variants/index';
import {
  Message,
  InitGameMessage,
  reviver,
  ResignMessage,
  addMessageHandler,
  sendMessage,
} from '../common/message';
import '@polymer/paper-button';
import {Move} from '../chess/move';

@customElement('my-controls')
export class MyControls extends LitElement {
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
    :host {
      max-height: 100%;
      width: 300px;
      display: block;
    }
    .container {
      display: flex;
      flex-direction: column;
    }
    .controls {
      display: flex;
      justify-content: space-between;
    }
    .fen-display {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
      margin-bottom: 20px;
      background-color: #fefefa;
      min-height: 30px;
      /* max-height: 60px; */
      align-items: center;
      border-radius: 2px;
      box-shadow: #ddc 0 -3px;
      padding-top: 5px;
      padding-bottom: 5px;
      padding-left: 10px;
    }
    .fen {
      margin-right: 10px;
    }
    .controls > * {
      flex: 1;
    }
    paper-button {
      background-color: #fefdfa;
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
      /* transform: rotate(90deg); */
      /* -webkit-animation:swim ease-in 1;
      -moz-animation:swim ease-in 1; */
      /* animation:swim 2s cubic-bezier(.41,.01,.57,.99) infinite; */
      animation:swim 2s linear infinite;

      -webkit-animation-fill-mode:forwards;
      -moz-animation-fill-mode:forwards;
      animation-fill-mode:forwards;

      /* -webkit-animation-duration:1s;
      -moz-animation-duration:1s;
      animation-duration:1s; */
    }
    /* @-webkit-keyframes swim { from { opacity:0; } to { opacity:1; } }
    @-moz-keyframes swim { from { opacity:0; } to { opacity:1; } } */
    @keyframes swim {
      from {transform: rotate(90deg)}
      10% {transform: translate(0, 5px) rotate(1deg);}
      25% {transform: translate(0, 25px) rotate(125deg);}
      40% {transform: translate(0, 45px) rotate(130deg);}
      50% {transform: translate(0, 50px) rotate(90deg);}
      60% {transform: translate(0, 45px) rotate(60deg);}
      75% {transform: translate(0, 25px) rotate(50deg);}
      90% {transform: translate(0, 5px) rotate(60deg);}
      to {transform: rotate(90deg)}
    }
    /* @keyframes swim {
      from {}
      50% {transform: translate(0, 25px)}
      to {transform: translate(0, 50px)}
    } */
  `;
  // public
  @property({type: Object}) socket: WebSocket;
  @property({type: Array}) turnHistory: Turn[] = [];
  @property({type: Boolean}) playing = true;

  // protected
  @property({type: Number}) viewMoveIndex: number | undefined;

  private hsm;

  connectedCallback() {
    super.connectedCallback();

    this.hsm = this.handleSocketMessage.bind(this);
    // addMessageHandler(this.socket, this.hsm);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // this.socket.removeEventListener('message', this.hsm);
  }

  handleSocketMessage(message: Message) {
    if (message.type !== 'replaceState') {
      this.viewMoveIndex = undefined;
    }
    this.requestUpdate();
  }

  onClickPrev() {
    if (this.viewMoveIndex === undefined) {
      this.viewMoveIndex = this.turnHistory.length;
    }
    this.viewMoveIndex = Math.max(0, this.viewMoveIndex - 1);
  }

  onClickNext() {
    if (this.viewMoveIndex === undefined) return;
    this.viewMoveIndex = this.viewMoveIndex + 1;

    if (this.viewMoveIndex >= this.turnHistory.length) {
      this.viewMoveIndex = undefined;
    }
  }

  onClickResign() {
    sendMessage(this.socket, {type: 'resign'});
  }

  updated(changedProperties) {
    if (changedProperties.has('socket')) {
      addMessageHandler(this.socket, this.hsm);
    }
    if (changedProperties.has('viewMoveIndex')) {
      console.log('fired view move changed');
      this.dispatchEvent(
        new CustomEvent('view-move-changed', {
          detail:
            this.viewMoveIndex !== undefined
              ? this.turnHistory[this.viewMoveIndex]?.before
              : undefined,
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  render() {
    return html`
      <div class="container">
        <div class="fen-display">
          ${this.turnHistory
            .map(toFEN)
            .map((fen: string) => html`<span class="fen">${fen}</span>`)}
        </div>
        <div class="controls">
          <paper-button raised .onclick=${this.onClickPrev.bind(this)}
            ><</paper-button
          >
          <paper-button raised .onclick=${this.onClickNext.bind(this)}
            >></paper-button
          >
          <paper-button raised ?disabled=${this.playing} .onclick=${this.onClickResign.bind(this)}
            >Resign</paper-button
          >
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-controls': MyControls;
  }
}
