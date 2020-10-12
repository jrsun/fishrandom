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
import {Color, RoomAction} from '../chess/const';

@customElement('my-controls')
export class MyControls extends LitElement {
  static styles = css`
    :host {
      max-height: 100%;
      display: block;
    }
    .container {
      display: flex;
      flex-direction: column;
    }
    .buttons {
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
    .buttons > * {
      flex: 1;
      min-width: 20px;
    }
    paper-button {
      background-color: #fefdfa;
    }
    .action-button.claim-draw {
      background-color: #fefdaa;
    }
    :host([offeredDraw]) .action-button.offer-draw {
      background-color: #fefdaa;
    }
    .action-button.offer-draw:hover {
      transition: 0.2s;
      background-color: #fefdaa;
    }
    .action-button.abort:hover {
      transition: 0.2s;
      background-color: #fefdaa;
    }
    .action-button.resign:hover {
      transition: 0.2s;
      background-color: #e2a18b;
    }
  `;
  // public
  @property({type: Object}) socket: SocketIO.Socket;
  @property({type: Array}) turnHistory: Turn[] = [];
  @property({type: Boolean}) playing = false;

  // protected
  @property({type: Number}) viewMoveIndex: number | undefined;
  @property({type: Array}) allowedActions: RoomAction[] = [];
  @property({type: Boolean, reflect: true}) offeredDraw = false;

  updated(changedProperties) {
    if (changedProperties.has('socket')) {
      addMessageHandler(this.socket, 'my-controls', this.handleSocketMessage);
      sendMessage(this.socket, {type: 'getAllowed'});
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

  handleSocketMessage = (message: Message) => {
    if (['appendState', 'initGame', 'reconnect', 'gameOver'].includes(message.type)) {
      this.viewMoveIndex = undefined;
    }
    if (message.type === 'allowedActions') {
      this.allowedActions = message.actions;
    }
    this.offeredDraw = false;
    this.requestUpdate();
  };

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

  onClickAction(action: RoomAction) {
    sendMessage(this.socket, {type: 'roomAction', action});
    if (action === RoomAction.OFFER_DRAW) {
      this.offeredDraw = true;
    }
  }

  onClickNew() {
    this.dispatchEvent(
      new CustomEvent('init-game', {
        bubbles: true,
        composed: true,
      })
    );
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
        <div class="buttons">
          <paper-button
            raised
            .onclick=${this.onClickPrev.bind(this)}
            ?disabled=${this.viewMoveIndex === 0}
            ><</paper-button
          >
          <paper-button
            raised
            .onclick=${this.onClickNext.bind(this)}
            ?disabled=${this.viewMoveIndex === undefined}
            >></paper-button
          >
          ${this.playing ? this.allowedActions.map(action => {
            return html`
              <paper-button
              class="action-button ${action}"
              raised
              .onclick=${() => this.onClickAction(action)}
              >${action.replace(/-/g, ' ')}</paper-button>
            `;
          }) : html`
          <paper-button
            raised
            style="background-color: #bde6c0;"
            ?disabled=${this.playing}
            .onclick=${this.onClickNew.bind(this)}
            >New</paper-button
          >
          <paper-button
            raised
            ?disabled=${this.playing}
            .onclick=${() => {
              location.href = '/';
            }}
            >Exit</paper-button
          >
        `}
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
