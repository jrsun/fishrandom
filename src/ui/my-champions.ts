import { customElement, LitElement, css, html, property } from "lit-element";

const GOLD = ['once'];
const SILVER = ['deepblue'];
const BRONZE = ['booger'];

@customElement('my-champions')
export class MyChampions extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .title {
      font-size: 20px;
      background-color: rgb(72 134 74 / 1);
      color: #efefef;
      border-radius: 2px 0 0 2px;
      font-family: 'JelleeBold';
      padding: 10px;
      text-align: center;
      height: 100%;
    }
    .container {
      background-color: #efefef;
      border-radius: 2px;
      box-shadow: 0px 7px #cfcfcf;
      color: #333;
    }
    .ranks {
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      padding: 10px;
    }
    .rank {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 10px;
    }
  `;

  // protected
  @property({type: Array}) gold: string[] = GOLD;
  @property({type: Array}) silver: string[] = SILVER;
  @property({type: Array}) bronze: string[] = BRONZE;

  render() {
    const {gold, silver, bronze} = this;
    return html`<div class="container">
      <div class="title">Congrats to last week's top three!</div>
      <div class="ranks">
        <div class="golds rank">
          <img src="/img/svg/klt.svg" /> 
          ${gold.map(name => html`
            <div class="gold name">${name}</div>
          `)}</div>
        <div class="silvers rank">
        <img src="/img/svg/rlt.svg" /> 
          ${silver.map(name => html`
          <div class="silver name">${name}</div>
        `)}</div>
        <div class="bronzes rank">
        <img src="/img/svg/blt.svg" /> 
          ${bronze.map(name => html`
          <div class="bronze name">${name}</div>
        `)}</div>
      </div>
    </div>`;
  }
}