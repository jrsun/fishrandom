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
import './my-announce';
import '@polymer/paper-dialog';
import '@polymer/paper-toggle-button';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import {PaperDialogElement} from '@polymer/paper-dialog';
import {VARIANTS} from '../chess/variants';
import {PaperDropdownMenuElement} from '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import { randomChoice } from '../utils';

const LIST_OF_FISH = ['fish', 'trout', 'anchovy', 'cod', 'tilapia', 'salmon', 'snapper', 'tuna', 'carp'];

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
      letter-spacing: 0.2em;
    }
    .subtitle {
      font-size: 2vw;
      color: #eeeeee;
      margin-bottom: 2vw;
    }
    .row {
      display: flex;
      flex-direction: row;
      height: 100%;
      width: 100%;
      align-items: center;
    }
    input[type='text'] {
      border-radius: 4px;
      font-size: 25px;
      text-align: center;
      font-family: Verdana, sans-serif;
      border: #888;
      outline: none;
    }
    input[type='text']::placeholder {
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
      border: 1px solid #ccc;
    }
    .button {
      height: 50px;
      font-size: 20px;
      color: #223322;
      margin-bottom: 4vw;
      font-family: 'JelleeBold';
    }
    .play.button {
      background-color: #82d7ba;
    }
    .button.room {
      background-color: #ccc;
    }
    .room-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: 'JelleeBold';
    }
    .room-container > * {
      margin-bottom: 10px;
    }
    #variant-menu {
      width: 40vw;
    }
    paper-dialog {
      /* background-color: #fffeed; */
      border-radius: 4px;
      transform: translate(0, +50px);
    }
    #pet-select {
      border: 1px solid #ccc;
    }
    .instructions {
      max-width: 40vw;
    }
  `;

  private modal?: PaperDialogElement;

  firstUpdated() {
    const modal = this.shadowRoot?.querySelector('#room-modal');
    if (modal) this.modal = modal as PaperDialogElement;
  }

  login(e) {
    e.preventDefault();
    const usernameElement = this.shadowRoot?.querySelector(
      '#username'
    ) as HTMLInputElement;
    const password = this.shadowRoot?.querySelector(
      '#password'
    ) as HTMLInputElement;
    let username = 'fish';
    if (usernameElement?.value) username = usernameElement.value;

    const variantMenu = this.shadowRoot?.querySelector(
      '#variant-menu'
    ) as PaperDropdownMenuElement;
    const variant = variantMenu.value;

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
      body: JSON.stringify({
        username: username,
        password: password.value,
        variant: variant,
      }),
    }).then((data) => {
      localStorage.setItem('name', username);
      location.href = '/game';
    });
  }

  loginPrivate(e) {
    e.preventDefault();

    const password = this.shadowRoot?.querySelector(
      '#password'
    ) as HTMLInputElement;
    if (!password?.value) return;
    this.login(e);
  }

  // onToggle(e) {
  //   const roomInput = this.shadowRoot?.querySelector('#password')!;
  //   if (e.target.checked) {
  //     roomInput.removeAttribute('disabled');
  //   } else {
  //     roomInput.setAttribute('disabled', 'true');
  //   }
  // }

  openModal = () => {
    this.modal?.open();
  };

  render() {
    return html` <my-announce></my-announce>
      <form .onsubmit=${this.login.bind(this)}>
        <div class="container">
          <div class="title">FISHRANDOM</div>
          <div class="subtitle">chess variant roulette</div>
          <input
            id="username"
            type="text"
            autocomplete="off"
            placeholder="Username"
            value=${localStorage.getItem('name') ?? randomChoice(LIST_OF_FISH)}
          />
          <div class="buttons">
            <paper-button
              class="button play"
              raised
              .onclick=${this.login.bind(this)}
              >Play</paper-button
            >
            <paper-button class="button room" raised .onclick=${this.openModal}
              >Private...</paper-button
            >
          </div>
          <input type="submit" style="display: none" />
          <my-release-notes></my-release-notes>
        </div>
        <paper-dialog id="room-modal">
          <div class="room-container">
            <div class="instructions">
              Share password with a friend, or use the password shared with you
              to join.
            </div>
            <input
              id="password"
              type="text"
              autocomplete="off"
              placeholder="Room password"
            />
            <paper-dropdown-menu
              label="Vote for game (Opponent chooses too!)"
              id="variant-menu"
            >
              <paper-listbox slot="dropdown-content" selected="0">
                <paper-item>random</paper-item>
                ${Object.keys(VARIANTS).sort().map((name: string) => {
                  return html`<paper-item>${name}</paper-item>`;
                })}
              </paper-listbox>
            </paper-dropdown-menu>
            <paper-button
              class="button play"
              raised
              .onclick=${this.loginPrivate.bind(this)}
              >Play</paper-button
            >
          </div>
        </paper-dialog>
      </form>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-login': MyLogin;
  }
}
