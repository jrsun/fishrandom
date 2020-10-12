import { customElement, LitElement, html, css } from "lit-element";

@customElement('my-spinner')
export class MySpinner extends LitElement {
  static styles = css`
    .fish-con {
      display: block;
      height: 100px;
      width: 50px;
    }
    .fish {
      height: 50px;
      width: 50px;
      background-image: url(/img/svg/blt.svg);
      background-size: cover;
      transform: rotate(90deg);
      animation:swim 2s linear infinite;

      -webkit-animation-fill-mode:forwards;
      -moz-animation-fill-mode:forwards;
      animation-fill-mode:forwards;
    }
    @keyframes swim {
      from {transform: rotate(90deg)}
      10% {transform: translate(0, 5px) rotate(120deg);}
      25% {transform: translate(0, 25px) rotate(130deg);}
      40% {transform: translate(0, 45px) rotate(120deg);}
      50% {transform: translate(0, 50px) rotate(90deg);}
      60% {transform: translate(0, 45px) rotate(60deg);}
      75% {transform: translate(0, 25px) rotate(50deg);}
      90% {transform: translate(0, 5px) rotate(60deg);}
      to {transform: rotate(90deg)}
    }
  `;

  render() {
    return html`
      <div class="fish-con"><div class="fish"></div></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-spinner': MySpinner;
  }
}