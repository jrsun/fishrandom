import { customElement, LitElement, css, html, property } from "lit-element";

const KINGS = ['deepblue', 'vladymirvlaches'];
const QUEENS = ['petewah'];
const ROOKS = ['bawacuda'];
const BISHOPS = ['chori'];
const KNIGHTS = ['urojony'];

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
  @property({type: Array}) kings: string[] = KINGS;
  @property({type: Array}) queens: string[] = QUEENS;
  @property({type: Array}) rooks: string[] = ROOKS;
  @property({type: Array}) bishops: string[] = BISHOPS;
  @property({type: Array}) knights: string[] = KNIGHTS;

  render() {
    const {kings, queens, rooks, bishops, knights} = this;
    return html`<div class="container">
      <div class="title">Congrats to last week's top five!</div>
      <div class="ranks">
        <div class="kings rank">
          <img src="/img/svg/klt.svg" /> 
          ${kings.map(name => html`
            <div class="kings name">${name}</div>
          `)}</div>
        <div class="queens rank">
        <img src="/img/svg/qlt.svg" /> 
          ${queens.map(name => html`
          <div class="queens name">${name}</div>
        `)}</div>
        <div class="rooks rank">
          <img src="/img/svg/rlt.svg" /> 
          ${rooks.map(name => html`
          <div class="rooks name">${name}</div>
        `)}</div>
        <div class="bishops rank">
          <img src="/img/svg/blt.svg" /> 
          ${bishops.map(name => html`
          <div class="bishops name">${name}</div>
        `)}</div>
        <div class="knights rank">
          <img src="/img/svg/nlt.svg" /> 
          ${knights.map(name => html`
          <div class="knights name">${name}</div>
        `)}</div>
      </div>
    </div>`;
  }
}