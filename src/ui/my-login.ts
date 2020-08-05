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
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: "JelleeBold";
    }
    .title {
      color: #EEEEEE;
      font-size: 80px;
      margin-bottom: 10px;
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
      flex: 1;
      margin-right: 20px;
      font-size: 40px;
      padding-left: 5px;
      font-family: Verdana, sans-serif;
      border: #888;
      outline: none;
    }
    #username::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
      color: #AAA;
      opacity: 1; /* Firefox */
    }
    #button {
      background-color: #82D7BA;
      height: 50px;
      font-size: 20px;
      color: #223322;
    }
  `;

  login(e) {
    e.preventDefault();
    const input = this.shadowRoot?.querySelector('#username') as HTMLInputElement;
    if (!input?.value) return;

    fetch('/login', {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error,
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify({username: input.value}),
    }).then(data => {
      console.log(data);
      location.reload();
    });
  }

  render() {
    return html`
    <div class="title">F I S H R A N D O M</div>
    <form .onsubmit=${this.login.bind(this)}>
      <div class="row">  
        <input id="username" type="text" autocomplete="off" placeholder="Username"/>
        <paper-button id="button" raised .onclick=${this.login.bind(this)}>Play</paper-button>
        <input type="submit" style="display: none" />
      </div>
    </form>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-login': MyLogin;
  }
}
