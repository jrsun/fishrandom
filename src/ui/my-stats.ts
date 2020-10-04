import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import '@polymer/paper-button';
import { addMessageHandler, Message } from '../common/message';

@customElement('my-stats')
export class MyStats extends LitElement {
  static styles = css`
    :host {
      color: #eee;
    }
  `;

  @property({type: Object}) socket: SocketIO.Socket;
  @property({type: Number}) onlineCount?: number;

  updated(changedProperties) {
    if (changedProperties.has('socket')) {
      addMessageHandler(this.socket, this.handleSocketMessage);
    }
  }

  handleSocketMessage = (message: Message) => {
    if (message.type === 'ping') {
      this.onlineCount = message.p;
    }
  }

  render() {
    if (!this.onlineCount) return;
    const plural = this.onlineCount !== 1 ? 's' : '';
    return html`<div class="container">
      <div class="online-count">${this.onlineCount} player${plural} online</div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-stats': MyStats;
  }
}
