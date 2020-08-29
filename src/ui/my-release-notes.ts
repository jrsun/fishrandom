import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import '@polymer/paper-button';

@customElement('my-release-notes')
export class MyReleaseNotes extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .subtitle {
      color: #eeeeee;
      font-size: 2vw;
    }
    .tagline {
      font-family: Georgia, 'Times New Roman', Times, serif;
      color: lightsteelblue;
      font-size: 1vw;
      margin-top: 1vw;
    }
  `;

  render() {
    return html`
      <div class="subtitle">Release Notes:</div>
      <div class="subtitle">8/28 - antichess / amazon army</div>
      <div class="subtitle">8/27 - rifle chess</div>
      <div class="subtitle">8/26 - private rooms / elo</div>
      <div class="subtitle">8/24 - prechess</div>
      <div class="subtitle">8/22 - football / chigorin</div>
      <div class="subtitle">8/21 - piece eater</div>
      <div class="subtitle">8/17 - bario / atomic / royal pawn</div>
      <div class="subtitle tagline">theoria incognita</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-release-notes': MyReleaseNotes;
  }
}
