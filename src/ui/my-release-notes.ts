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
      overflow-y: auto;
      max-height: 25vh;
      background-color: rgba(50, 50, 50, 0.3);
      padding: 10px;
      border-radius: 2px;
    }
    .relnotes {
      color: #eee;
      font-size: 2vw;
    }
    .subtitle {
      color: #eee;
      font-size: 2vw;
    }
    .subtitle:nth-of-type(2) {
      color: #f9ff93;
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
      <div class="relnotes">Release Notes:</div>
      <div class="subtitle">9/3 - right click for arrows / minor tweaks</div>
      <div class="subtitle">8/30 - kungfu / bario improvements</div>
      <div class="subtitle">8/29 - stalemate fix / extended timer for private games / abort game without resigning</div>
      <div class="subtitle">8/28 - golem / antichess / amazon army</div>
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
