import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import {Game} from '../chess/game';
import {toFEN} from '../chess/move';
import {
  VARIANTS,
  Chess960,
  Classic,
  Knightmate,
  Horde,
} from '../chess/variants/index';
import {Message, InitGameMessage, reviver} from '../common/message';
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
  `;
  // public
  @property({type: Object}) socket: WebSocket;
  @property({type: Array}) moveHistory: Move[] = [];

  // protected
  @property({type: Number}) viewMoveIndex: number | undefined;

  private hsm;

  connectedCallback() {
    super.connectedCallback();

    this.hsm = this.handleSocketMessage.bind(this);
    this.socket.addEventListener(
      'message',
      this.hsm,
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.socket.removeEventListener(
      'message',
      this.hsm,
    );
  }

  handleSocketMessage(e: MessageEvent) {
    const message: Message = JSON.parse(e.data, reviver);
    if (message.type !== 'replaceState') {
      this.viewMoveIndex = undefined;
    }
    this.requestUpdate();
  }

  onClickPrev() {
    if (this.viewMoveIndex === undefined) {
      this.viewMoveIndex = this.moveHistory.length;
    }
    this.viewMoveIndex = Math.max(0, this.viewMoveIndex - 1);
  }

  onClickNext() {
    if (this.viewMoveIndex === undefined) return;
    this.viewMoveIndex = this.viewMoveIndex + 1;

    if (this.viewMoveIndex >= this.moveHistory.length) {
      this.viewMoveIndex = undefined;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('socket')) {
      this.socket.addEventListener('message', this.hsm);
    }
    if (changedProperties.has('viewMoveIndex')) {
      console.log('fired view move changed');
      this.dispatchEvent(
        new CustomEvent('view-move-changed', {
          detail:
            this.viewMoveIndex !== undefined
              ? this.moveHistory[this.viewMoveIndex]?.before
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
          ${this.moveHistory
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
