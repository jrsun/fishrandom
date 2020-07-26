import {
  LitElement,
  html,
  customElement,
  property,
  css,
} from 'lit-element';
import {Game} from '../chess/game';


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
      width: 300px;
      display: inline-block;
    }
    #title>h3 {
      margin: 0;
    }
  `;

  // private
  @property({type: String}) title: string = '960';
  @property({type: String}) rules: string = 'Shuffled starting positions';

  private socket: WebSocket;

  /**
   * The number of times the button has been clicked.
   */
  @property({type: Number})
  count = 0;

  connectedCallback() {
    super.connectedCallback();
    // TODO socket listener for game change event
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  handleSocketMessage(e: MessageEvent) {
    this.performUpdate();
  }

  render() {
    return html`
      <div id="rules">
  <!-- <span id="title"><h3>${this.title}</h3></span>
        <div class="body">
          ${this.rules}
        </div> -->
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-rules': MyRules;
  }
}
