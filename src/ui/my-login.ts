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
    .title {
      /* color: #EEEEEE; */
      font-family: "JelleeBold";
      font-size: 25px;
      margin-bottom: 10px;
    }
    .card {
      display: flex;
      flex-direction: column;
      align-items: center;
      /* border: solid 1px gray; */
      /* margin: 15px; */
      /* max-width: 800px; */
      padding: 10px;
      background-color: #efece0;
      padding: 30px;
      border-radius: 4px;
      box-shadow: 0px 7px #dad4c8;
    }
  `;

  login() {
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
    return html`<div class="card">
      <div class="title">F I S H R A N D O M</div>
      <input id="username" type="text" placeholder="Username"/>
      <paper-button raised .onclick=${this.login.bind(this)}>Submit</paper-button>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-login': MyLogin;
  }
}
