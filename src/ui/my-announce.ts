import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import '@polymer/paper-button';

const ANNOUNCE_TEXT = '';

@customElement('my-announce')
export class MyAnnounce extends LitElement {
  static styles = css`
    .announcement {
      left: 0;
      width: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      max-height: 2vh;
      background-color: rgba(219, 117, 83, 0.7);
      padding: 10px;
      position: fixed;
      justify-content: center;
      top: 0;
      color: #ddd;
      cursor: pointer;
    }
    .close-button {
      cursor: pointer;
    }
  `;
  @property({type: Boolean}) open = true;

  onClose = () => {
    this.open = false;
    localStorage.setItem('closed', ANNOUNCE_TEXT);
  }

  connectedCallback() {
    super.connectedCallback();
    if (localStorage.getItem('closed') === ANNOUNCE_TEXT) {
      this.open = false;
    }
  }

  render() {
    if (!this.open || !ANNOUNCE_TEXT) return html``;

    return html`<div class="announcement" @click=${this.onClose}>
       ${ANNOUNCE_TEXT}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-announce': MyAnnounce;
  }
}