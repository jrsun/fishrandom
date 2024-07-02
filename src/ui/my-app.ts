import { customElement, LitElement, css, html, property } from "lit-element";
import io from 'socket.io-client';

import "./my-front-page";
import { SeekEventType, CancelSeekEventType } from "./utils";
import { addMessageHandler, sendMessage, Message } from "../common/message";
import "./my-room";
import "./my-status";
import { MyRoom } from "./my-room";

/** Entry point */
@customElement('my-app')
export class MyApp extends LitElement {
  static styles = css`
    #status-overlay {
      position: fixed;
      bottom: 10px;
      right: 10px;
    }
  `;

  @property({type: Boolean}) seeking = false;
  @property({type: Boolean}) inRoom = false;
  @property({type: Boolean}) connected = false;
  @property({type: Object}) socket: SocketIO.Socket;
  @property({type: Number}) countPlayers?: number;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener(SeekEventType, this.onSeek);
    this.addEventListener(CancelSeekEventType, this.onCancelSeek);
    this.socket = io(':8880') as SocketIO.Socket;
    this.socket.on('connect', () => {
      console.log('socket connected');
      this.connected = true;
      sendMessage(this.socket, {type: 'getGame'});
    });
    this.socket.on('disconnect', () => {
      console.log('socket disconnected');
      this.connected = false;
      this.seeking = false;
    });
    addMessageHandler(this.socket, 'my-app', this.handleSocketMessage);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener(SeekEventType, this.onSeek);
    this.removeEventListener(CancelSeekEventType, this.onCancelSeek);
    this.socket.disconnect();
  }

  handleSocketMessage = (message: Message) => {
    // if (message.type !== 'ping') console.log('my-app', message);
    if (message.type === 'kick') {
      this.inRoom = false;
      this.seeking = false;
      // Reload the page to try to get connected
      location.href = '/';
    }
    if (message.type === 'ping') {
      // Probably move this to a component
      this.countPlayers = message.p;
    }
    if (message.type === 'initGame' || message.type === 'reconnect') {
      this.inRoom = true;
      this.seeking = false;

      /** Because setting inRoom => true here causes <my-room> to render,
       * <my-room>'s listeners will by definition not be ready to listen
       * to this same event, unless we manually pass it down. */
      this.requestUpdate().then(() => {
        const myRoom = this.shadowRoot!.querySelector('my-room') as MyRoom;
        myRoom.handleSocketMessage(message);
      });
    }
  }

  onSeek = () => {
    if (this.socket.disconnected) {
      (this.socket as any).connect();
    }
    this.seeking = true;
    sendMessage(this.socket, {type: 'newGame'});
  }

  onCancelSeek = () => {
    if (this.socket.disconnected) {
      (this.socket as any).connect();
    }
    this.seeking = false;
    sendMessage(this.socket, {type: 'cancelSeek'})
  }

  render() {
    return html`
      ${this.renderChild()}
      ${this.renderStatus()}
    `;
  }

  renderChild() {
    const {countPlayers, inRoom, seeking, socket, connected} = this;
    if (inRoom) {
      return html`<my-room
        .socket=${socket}
        .seeking=${seeking}
        .disconnected=${!connected}
      ></my-room>`;
    } else {
      return html`<my-front-page
      .seeking=${seeking}
      .socket=${socket}
      .countPlayers=${countPlayers}
      ></my-front-page>`;
    }
  }

  renderStatus = () => {
    // Sticky overlay w/ connection status etc
    return html`
      <div id="status-overlay">
        <my-status .socket=${this.socket}></my-status>
      </div>
    `;
  }
}
