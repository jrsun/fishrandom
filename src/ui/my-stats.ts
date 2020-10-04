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
      addMessageHandler(this.socket, 'my-stats', this.handleSocketMessage);
    }
  }

  handleSocketMessage = (message: Message) => {
    if (message.type === 'ping') {
      this.onlineCount = message.p;
    }
  }

  render() {
    if (!this.onlineCount) return;
    const message = this.onlineCount !== 1 ?
      `${this.onlineCount} players online`:
      'no one is online right now, grab a friend!';
    return html`<div class="container">${message}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-stats': MyStats;
  }
}
