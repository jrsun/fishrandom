import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import { randomInt } from '../utils';
import { addMessageHandler, Message, PlayerInfo } from '../common/message';

interface RankScore {
  name: string;
  score: number;
}

@customElement('my-leaderboard')
export class MyLeaderboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      flex-direction: column;
      /* font-family: "Lucida Console", Monaco, monospace; */
      /* font-family: 'JelleeBold'; */
    }
    
    .title {
      font-size: 20px;
      background-color: rgb(109 111 209);
      color: #efefef;
      border-radius: 2px 2px 0 0;
      font-family: 'JelleeBold';
      padding: 10px;
      text-align: center;
    }

    .card {
      background-color: #efefef;
      border-radius: 4px;
      box-shadow: 0px 7px #cfcfcf;
    }

    .scores {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      max-height: 150px;
      padding: 10px;
      padding-bottom: 15px;
    }

    .score {
      padding: 2px;
      padding-left: 10px;
    }

    .score.me {
      font-weight: bold;
    }

    .my-score {
      color: red;
    }
  `;

  @property({type: Object}) socket: WebSocket;
  @property({type: Object}) player?: PlayerInfo;
  @property({type: Array}) topScores: RankScore[] = [];
  @property({type: Number}) myRank?: number;

  updated(changedProperties) {
    if (changedProperties.has('socket')) {
      addMessageHandler(this.socket, this.handleSocketMessage);
    }
  }

  handleSocketMessage = (message: Message) => {
    if (message.type === 'leader') {
      this.topScores = message.scores;
    } else if (message.type === 'rank') {
      this.myRank = message.rank;
    }
  }

  render() {
    if (!this.player) return;

    const {name, streak} = this.player;
    const {myRank} = this;
    let onLeaderboard = false;

    return html`<div class="card">
      <div class="title">Leaderboard (wins in a row)</div>
      <div class="scores">
        ${this.topScores.map((score, i) => {
          const isMe = score.name === name && score.score === streak && !onLeaderboard;
          if (isMe) {
            onLeaderboard = true;
          }
          return html`<div class="score ${isMe ? 'me' : ''}">
            ${scoreString(score.name, score.score, i+1)}
          </div>`
        })}
        ${!onLeaderboard ? html`
        <div class="score me">
          ${scoreString(name, streak, myRank ? myRank + 1 : '?')}
        </div>` : undefined}
      </div>
    </div>`;
  }
}

function scoreString(user: string, score: number, rank: string|number): string {
  return `${rank}. ${user} - ${score}`;
}

declare global {
  interface HTMLElementTagNameMap {
    'my-leaderboard': MyLeaderboard;
  }
}
