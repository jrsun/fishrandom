import { customElement, LitElement, property, html, css } from "lit-element";


@customElement('my-status')
export class MyStatus extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    
    .container {
      border-radius: 4px;
      background-color: rgba(200, 200, 200, 0.5);
      padding-right: 10px;
    }

    .disconnected paper-icon-button {
      color: red;
    }

    .connected paper-icon-button {
      color: green;
    }

    .content {
      display: flex;
      align-items: center;
    }
  `;

  @property({type: Object}) socket?: SocketIO.Socket;

  private timerInterval;

  connectedCallback() {
    super.connectedCallback();
    this.timerInterval = setInterval(() => {
      this.requestUpdate();
    }, 1000);
  }

  disconnectedCallback() {
    clearInterval(this.timerInterval);
  }

  render() {
    const {socket} = this;
    return html`<div class="container">
      ${socket?.connected ? 
        this.renderConnected() :
        this.renderDisconnected()}
    </div>`;
  }

  renderConnected() {
    return html`<div class="connected content">
      <paper-icon-button icon="check"></paper-icon-button>
      <div>Connected</div>
    </div>`;
  }

  renderDisconnected() {
    return html`<div class="disconnected content">
      <paper-icon-button icon="close"></paper-icon-button>
      <div>Disconnected</div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-status': MyStatus;
  }
}