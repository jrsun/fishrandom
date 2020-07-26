import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import {Game} from '../chess/game';
import {VARIANTS} from '../chess/variants/index';
import {Chess960} from '../chess/variants/960';
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
  `;
  // public
  @property({type: Object}) socket: WebSocket;

  // private
  @property({type: String}) variant: string = Chess960.name;

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
          ${this.getVariantRules()}
        </div>
      </div>
    `;
  }

  private getVariantRules() {
    return VARIANTS[this.variant].rules ?? `${this.variant} rules not found.`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-rules': MyRules;
  }
}
