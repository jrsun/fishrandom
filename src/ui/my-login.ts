import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import '@polymer/paper-button';

@customElement('my-login')
export class MyLogin extends LitElement {
  static styles = css`
    .host {
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
    .subtitle {
      color: #eeeeee;
      font-size: 3vw;
      margin-bottom: 1vw;
    }
    .tagline {
      font-family: Georgia, 'Times New Roman', Times, serif;
      color: lightsteelblue;
      font-size: 2vw;
    }
    .row {
      display: flex;
      flex-direction: row;
      height: 100%;
      width: 100%;
      align-items: center;
    }
    #username {
      border-radius: 4px;
      font-size: 25px;
      text-align: center;
      width: 50vw;
      font-family: Verdana, sans-serif;
      border: #888;
      outline: none;
      margin-bottom: 10px;
    }
    #username::placeholder {
      /* Chrome, Firefox, Opera, Safari 10.1+ */
      color: #aaa;
      opacity: 1; /* Firefox */
    }
    #button {
      background-color: #82d7ba;
      height: 50px;
      font-size: 20px;
      color: #223322;
      margin-bottom: 4vw;
    }
  `;

  login(e) {
    e.preventDefault();
    const input = this.shadowRoot?.querySelector(
      '#username'
    ) as HTMLInputElement;
    if (!input?.value) return;

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
      body: JSON.stringify({username: input.value}),
    }).then((data) => {
      console.log(data);
      location.reload();
    });
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
        <paper-button id="button" raised .onclick=${this.login.bind(this)}
          >Play</paper-button
        >
        <input type="submit" style="display: none" />
        <div class="subtitle">8.21 - piece eater</div>
        <div class="subtitle">8.17 - bario / atomic / royal pawn</div>
        <div class="subtitle tagline">theoria incognita</div>
      </div>
    </form>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-login': MyLogin;
  }
}
