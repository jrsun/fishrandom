import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import {Game} from '../chess/game';
import {VARIANTS, Chess960, Classic, Knightmate, Horde} from '../chess/variants/index';
import {Message, InitGameMessage, reviver} from '../common/message';
import '@polymer/paper-button';
import { Move } from '../chess/move';

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
    #controls {
      display: flex;
      justify-content: space-between;
    }
    #controls>* {
      flex: 1;
    }
    paper-button {
      background-color: #FEFDFA;
    }
  `;
  // public
  @property({type: Object}) socket: WebSocket;
  @property({type: Array}) moveHistory: Move[] = [];
  
  // protected
  @property({type: Number}) viewMoveIndex: number|undefined;

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
    if (message.type !== 'replaceState') {
      this.viewMoveIndex = undefined;
    }
  }

  onClickPrev() {
    if (this.viewMoveIndex === undefined) {
      this.viewMoveIndex = this.moveHistory.length;
    }
    this.viewMoveIndex = Math.max(0, this.viewMoveIndex-1);
  }

  onClickNext() {
    if (this.viewMoveIndex === undefined) return;
    this.viewMoveIndex = this.viewMoveIndex+1;

    if (this.viewMoveIndex >= this.moveHistory.length) {
      this.viewMoveIndex = undefined;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('viewMoveIndex')) {
      console.log('fired view move changed');
      this.dispatchEvent(new CustomEvent('view-move-changed', {
        detail: this.viewMoveIndex !== undefined ? this.moveHistory[this.viewMoveIndex]?.before : undefined,
        bubbles: true,
        composed: true,
      }));
    }
  }

  render() {
    return html`
      <div id="controls">
        <paper-button raised .onclick=${this.onClickPrev.bind(this)}><</paper-button>
        <paper-button raised .onclick=${this.onClickNext.bind(this)}>></paper-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-controls': MyControls;
  }
}
