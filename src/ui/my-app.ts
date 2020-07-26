import {
  LitElement,
  html,
  customElement,
  property,
  css,
} from '../../node_modules/lit-element';
import './my-element';
import './my-rules';

@customElement('my-app')
export class MyApp extends LitElement {
  static styles = css`
    .app {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .title {
      color: #EEEEEE;
      font-family: "JelleeBold"
    }
    .card {
      display: inline-block;
      /* border: solid 1px gray; */
      /* margin: 15px; */
      /* max-width: 800px; */
      padding: 10px;
      background-color: #efece0;
      padding: 30px;
      border-radius: 4px;
      box-shadow: 0px 7px #dad4c8;
    }
    .game-container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
    }
    .active-game-container {
      display: flex;
      flex-direction: column;
      margin-right: 30px;
    }
    .active-game-info {
      display: flex;
      flex-direction: row;
      /* align-items: center; */
      justify-content: space-between;
    }
    .active-game-info.opponent {
      align-items: flex-end;
    }
    .active-game-info.player {
      align-items: flex-start;
    }
    .user-info {
      display: flex;
    }
    .user-capture {
      display: flex;
      flex-direction: column;
    }
    .avatar {
      height: 40px;
      width: 40px;
      background-size: cover;
    }
    .board-wrapper {
      margin: 20px 0;
    }
    .username {
      color: #eee;
      font-family: 'JelleeBold';
    }
    /* timer */
    .timer {
      font-size: 30px;
      /* display: inline-block; */
      /* border: solid 1px gray; */
      /* margin: 15px; */
      /* max-width: 800px; */
      background-color: #efece0;
      padding: 10px;
      padding-left: 60px;
      border-radius: 4px;
      font-family: 'Jellee';
    }
    .timer.opponent {
      background-color: #344155;
      color: #99b;
      box-shadow: 0px 7px #243145;
    }
    .timer.player {
      background-color: #ddd;
      color: #344155;
      box-shadow: 0px 7px #bbb;
    }
  }`;

  render() {
    return html`<div class="app">
      <div class="title"><h1>9 6 0</h1></div>
      <div class="game-container">
        <!-- dom-if piece bank -->
        <div class="active-game-container">
          <div class="active-game-info opponent">
            <!-- this will be a component -->
            <div class="user-info">
              <div class="avatar" style="background-image:url(../img/swoledoge.png)"></div>
              <div class="user-capture">
                <div class="username">SwoleDoge94</div>
                <div class="captures"></div>
              </div>
            </div>
            <div class="timer opponent">3:45</div>
          </div>
          <div class="board-wrapper card"><my-element></my-element></div>
          <div class="active-game-info player">
            <!-- this will be a component -->
            <div class="user-info">
              <div class="avatar" style="background-image:url(../img/cheems.jpeg)"></div>
              <div class="user-capture">
                <div class="username">cheems</div>
                <div class="captures"></div>
              </div>
            </div>
            <div class="timer player">1:23</div>
          </div>
        </div>
        <div class="card"><my-rules></my-rules></div>
      </div>
    </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
