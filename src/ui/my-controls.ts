import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import {Game} from '../chess/game';
import {toFEN, Turn} from '../chess/turn';
import {styleMap} from 'lit-html/directives/style-map';
import {Message, addMessageHandler, sendMessage} from '../common/message';
import '@polymer/paper-button';
import {Move} from '../chess/turn';

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
      this.dispatchEvent(
        new CustomEvent('view-move-changed', {
          detail: this.viewMoveIndex,
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  renderMove(fen: string, index: number) {
    const styles = {
      cursor: 'pointer',
    };
    if (index + 1 === this.viewMoveIndex) {
      styles['background-color'] = '#FBEC94';
    } else if (
      this.viewMoveIndex === undefined &&
      index === this.turnHistory.length - 1
    ) {
      styles['background-color'] = 'rgb(150, 230, 148)';
    }
    return html`<span
      class="fen"
      style="${styleMap(styles)}"
      @click=${() => {
        this.viewMoveIndex = index + 1;
        if (this.viewMoveIndex >= this.turnHistory.length) {
          this.viewMoveIndex = undefined;
        }
      }}
      >${fen}</span
    >`;
  }

  render() {
    return html`
      <div class="container">
        <div class="fen-display">
          ${this.turnHistory
            .map(toFEN)
            .map((fen: string, i: number) => this.renderMove(fen, i))}
        </div>
        <div class="controls">
          <paper-button raised
            .onclick=${this.onClickPrev.bind(this)}
            ?disabled=${this.viewMoveIndex === 0}
            ><</paper-button
          >
          <paper-button raised
            .onclick=${this.onClickNext.bind(this)}
            ?disabled=${this.viewMoveIndex === undefined}
            >></paper-button
          >
          <paper-button
            raised
            ?disabled=${this.playing}
            .onclick=${this.onClickResign.bind(this)}
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
