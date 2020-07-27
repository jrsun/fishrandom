import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import {Game} from '../chess/game';
import {
  VARIANTS,
  Chess960,
  Classic,
  Knightmate,
  Horde,
} from '../chess/variants/index';
import {Message, InitGameMessage, reviver} from '../common/message';

@customElement('my-rules')
export class MyRules extends LitElement {
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
    #title > h3 {
      margin: 0;
      font-family: 'JelleeBold';
    }
    #title {
      margin-bottom: 10px;
    }
    #rules {
      display: flex;
      height: 50vh;
      /* temporary */
      overflow-y: auto;
      flex-direction: column;
      align-items: center;
    }
    .examples {
      overflow-x: auto;
      display: block;
    }
    .examples > img {
      height: 200px;
      width: 200px;
      background-size: cover;
    }
    ul {
      padding-left: 20px;
    }
  `;
  // public
  @property({type: Object}) socket: WebSocket;

  // private
  @property({type: String}) variant: string;

  /**
   * The number of times the button has been clicked.
   */
  @property({type: Number})
  count = 0;

  connectedCallback() {
    super.connectedCallback();

    this.socket.addEventListener('open', function (e) {}.bind(this));
    this.socket.addEventListener(
      'message',
      this.handleSocketMessage.bind(this)
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.socket.removeEventListener('open', function (e) {}.bind(this));
    this.socket.removeEventListener(
      'message',
      this.handleSocketMessage.bind(this)
    );
  }

  handleSocketMessage(e: MessageEvent) {
    const message: Message = JSON.parse(e.data, reviver);
    if (message.type === 'initGame') {
      const igm = message as InitGameMessage;
      this.variant = igm.variantName;
    }
  }

  render() {
    if (!this.variant) return html`Loading...`; // TODO Loading spinner
    return html`
      <div id="rules">
        <span id="title"><h3>Rules</h3></span>
        <div class="body">
          ${html`${this.getVariantRules()}`}
        </div>
      </div>
    `;
  }

  private getVariantRules() {
    return VARIANT_INFO[this.variant] ?? `${this.variant} rules not found.`;
  }
}

const VARIANT_INFO: {[variant: string]: TemplateResult} = {
  [Chess960.name]: html`Starting position of the pieces on the players' home
    ranks is randomized.
    <!-- <div class="examples"><img src="../img/variants/960.png"/></div> -->
    <ul>
      <li>Orthodox rules.</li>
      <li>Checkmate to win.</li>
    </ul>`,
  [Classic.name]: html`The classic game.`,
  [Knightmate.name]: html`The role of the King and Knight are switched. The King
    is replaced by a <b>Royal Knight</b>, and the Knights are replaced by
    <b>Manns</b>, which are regular pieces that move like Kings.
    <ul>
      <li>Castling allowed.</li>
      <li>Pawn can promote to <b>Mann</b> instead of Knight.</li>
      <li>Checkmate the <b>Royal Knight</b> to win.</li>
    </ul>`,
  [Horde.name]: html`White has 36 pawns. Black has a regular chess setup.
    <ul>
      <li>White wins by checkmating the black king.</li>
      <li>Black wins by capturing every pawn.</li>
      <li>White pawns can promote.</li>
    </ul> `,
};

declare global {
  interface HTMLElementTagNameMap {
    'my-rules': MyRules;
  }
}
