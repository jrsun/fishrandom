import { customElement, LitElement, css, html, property } from "lit-element";

const GOLD = ['pipidiaper'];
const SILVER = ['sharjeel'];
const BRONZE = ['quars', 'protector'];

@customElement('my-champions')
export class MyChampions extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    .container {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
    }
  `;

  // protected
  @property({type: Array}) gold: string[] = GOLD;
  @property({type: Array}) silver: string[] = SILVER;
  @property({type: Array}) bronze: string[] = BRONZE;

  render() {
    const {gold, silver, bronze} = this;
    return html`<div class="container">
      <div class="golds">${gold.map(name => html`
        <div class="gold">${name}</div>
      `)}</div>
      <div class="silvers">${silver.map(name => html`
        <div class="silver">${name}</div>
      `)}</div>
      <div class="bronzes">${bronze.map(name => html`
        <div class="bronze">${name}</div>
      `)}</div>
    </div>`;
  }
}