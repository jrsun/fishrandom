import {LitElement, html, customElement, property, css} from 'lit-element';
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
    .examples>img{
      height: 200px;
      width: 200px;
      background-size:cover;
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
        <span id="title"><h3>Rules</h3></span>
        <div class="body">
          Starting position
          of the pieces on the players' home ranks is randomized.
          <!-- <div class="examples"><img src="../img/variants/960.png"/></div> -->
          <ul>
            <li>Orthodox rules.</li>
            <li>Checkmate to win.</li>
          </ul>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-rules': MyRules;
  }
}
