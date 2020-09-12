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
import { Color } from '../chess/const';

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
      min-width: 20px;
    }
    paper-button {
      background-color: #fefdfa;
    }
    :host([oppRequestedDraw]) .draw-button {
      background-color: #bde6c0;
    }
    :host([requestedDraw]) .draw-button {
      background-color: #fefdaa;
    }
    .draw-button:hover {
      transition: 0.2s;
      background-color: #fefdaa;
    }
    .resign-button:hover {
      transition: 0.2s;
      background-color: #e2a18b;
    }
  `;
  // public
  @property({type: Object}) socket: WebSocket;
  @property({type: Array}) turnHistory: Turn[] = [];
  @property({type: Boolean}) playing = false;

  // protected
  @property({type: Number}) viewMoveIndex: number | undefined;
  @property({type: Boolean, reflect: true}) oppRequestedDraw = false;
  @property({type: Boolean, reflect: true}) requestedDraw = false;

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  handleSocketMessage = (message: Message) => {
    if (message.type !== 'replaceState') {
      this.viewMoveIndex = undefined;
    }
    if (message.type === 'replaceState' || message.type === 'appendState') {
      this.oppRequestedDraw = false;
      this.requestedDraw = false;
    }
    if (message.type === 'draw') {
      this.oppRequestedDraw = true;
    }
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

  onClickResign() {
    sendMessage(this.socket, {type: 'resign'});
  }

  onClickDraw() {
    sendMessage(this.socket, {type: 'draw'});
    this.requestedDraw = true;
  }

  onClickNew() {
    this.dispatchEvent(
      new CustomEvent('init-game', {
        bubbles: true,
        composed: true,
      })
    );
  }

  updated(changedProperties) {
    if (changedProperties.has('socket')) {
      addMessageHandler(this.socket, this.handleSocketMessage);
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

  renderDraw() {
    return html`<paper-button
      class="draw-button"
      raised
      ?disabled=${!this.playing}
      .onclick=${this.onClickDraw.bind(this)}
      >${this.oppRequestedDraw ? 'Draw' : 'Draw?'}</paper-button
    >`;
  }

  renderStopGame() {
    const isAbort = (
      !this.turnHistory.some(turn => turn.piece.color === Color.WHITE) ||
      !this.turnHistory.some(turn => turn.piece.color === Color.BLACK)
    )
    return html`<paper-button
      class="resign-button"
      raised
      ?disabled=${!this.playing}
      .onclick=${this.onClickResign.bind(this)}
      >${isAbort ? 'Abort' : 'Resign'}</paper-button
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
          ${this.playing ? this.renderDraw() : undefined}
          ${this.playing
            ? this.renderStopGame()
            : html`
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
