import { customElement, LitElement, css, html, property } from "lit-element";
import "./my-front-page";

@customElement('my-app')
export class MyApp extends LitElement {
  static styles = css``;

  @property({type: Boolean}) seeking = false;
  @property({type: Boolean}) inRoom = false;

  render() {
    return html`
      ${this.renderChild()}
    `;
  }

  renderChild() {
    const {inRoom, seeking} = this;
    if (inRoom) {
      return html`<my-room></my-room>`;
    } else {
      return html`<my-front-page .seeking=${seeking}></my-front-page>`;
    }
  }
}