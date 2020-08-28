import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import '@polymer/paper-button';
import './my-release-notes';
import '@polymer/paper-toggle-button';
import { PaperToggleButtonElement } from '@polymer/paper-toggle-button';

@customElement('my-login')
export class MyLogin extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .container {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: 'JelleeBold';
    }
    .title {
      color: #eeeeee;
      font-size: 7vw;
      margin-bottom: 1vw;
    }
    .row {
      display: flex;
      flex-direction: row;
      height: 100%;
      width: 100%;
      align-items: center;
    }
    input[type="text"] {
      border-radius: 4px;
      font-size: 25px;
      text-align: center;
      font-family: Verdana, sans-serif;
      border: #888;
      outline: none;
    }
    input[type="text"]::placeholder {
      /* Chrome, Firefox, Opera, Safari 10.1+ */
      color: #aaa;
      opacity: 1; /* Firefox */
    }
    #username {
      margin-bottom: 10px;
      width: 50vw;
    }
    #password {
      width: 40vw;
    }
    #password[disabled] {
      opacity: 0.5;
    }
    #button {
      background-color: #82d7ba;
      height: 50px;
      font-size: 20px;
      color: #223322;
      margin-bottom: 4vw;
    }
    .room-container {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
  `;

  login(e) {
    e.preventDefault();
    const username = this.shadowRoot?.querySelector(
      '#username'
    ) as HTMLInputElement;
    const password = this.shadowRoot?.querySelector(
      '#password'
    ) as HTMLInputElement;
    if (!username?.value) return;

    fetch('/login', {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error,
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    }).then((data) => {
      const user = encodeURIComponent(username.value);
      const pass = password?.value ? encodeURIComponent(password.value) : undefined;
      const gameUrl = new URL('/game', location.href);
      gameUrl.searchParams.append('user', user);
      if (pass) {
        gameUrl.searchParams.append('room', pass);
      }
      location.href = gameUrl.toString();
    });
  }

  onToggle(e) {
    const roomInput = this.shadowRoot?.querySelector('#password')!;
    if (e.target.checked) {
      roomInput.removeAttribute('disabled');
    } else {
      roomInput.setAttribute('disabled', 'true');
    }
  }

  render() {
    return html`<form .onsubmit=${this.login.bind(this)}>
      <div class="container">
        <div class="title">F I S H R A N D O M</div>
        <input
          id="username"
          type="text"
          autocomplete="off"
          placeholder="Username"
        />
        <div class="room-container">
          <paper-toggle-button class="room-toggle" @change=${(e) => this.onToggle(e)}></paper-toggle-button>
          <input
            id="password"
            type="text"
            autocomplete="off"
            placeholder="Private room password"
            disabled
          />
        </div>
        <paper-button id="button" raised .onclick=${this.login.bind(this)}
          >Play</paper-button
        >
        <input type="submit" style="display: none" />
        <my-release-notes></my-release-notes>
      </div>
    </form>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-login': MyLogin;
  }
}
