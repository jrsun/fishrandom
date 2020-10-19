import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/iron-icons/iron-icons';

import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import { randomInt } from '../common/utils';
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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
    }
    
    .title {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      background-color: rgb(109 111 209);
      color: #efefef;
      border-radius: 2px 2px 0 0;
      font-family: 'JelleeBold';
      padding: 10px;
      text-align: center;
    }

    paper-icon-button {
      width: 2em;
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
      max-height: 10em;
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

  @property({type: Object}) socket: SocketIO.Socket;
  @property({type: Object}) player?: PlayerInfo;
  @property({type: Array}) topScores: RankScore[] = [];
  @property({type: Number}) myRank?: number;

  updated(changedProperties) {
    if (changedProperties.has('socket')) {
      addMessageHandler(this.socket, 'my-leaderboard', this.handleSocketMessage);
    }
  }

  handleSocketMessage = (message: Message) => {
    if (message.type === 'ping') {
      this.topScores = message.scores;
    } else if (message.type === 'rank') {
      this.myRank = message.rank;
    }
  }

  render() {
    const {player} = this;

    return html`<div class="card">
      <div class="title">Weekly leaderboard
        <my-tooltip>
          <paper-icon-button slot="tooltip" icon="info">
          </paper-icon-button>
          <div slot="tooltiptext">Live updated leaderboard displaying
            the players with the highest number of wins IN A ROW this week.
            Resets weekly on Sunday.
          </div>
        </my-tooltip>
      </div>
      <div class="scores">
        ${this.topScores.map((score, i) => {
          const isMe = score.name === player?.name && score.score === player?.streak;
          return html`<div class="score ${isMe ? 'me' : ''}">
            ${scoreString(score.name, score.score, i+1)}
          </div>`
        })}
        ${player ? html`
        <hr />
        <div class="score me">
          Current wins: ${player.streak}
        </div>` : html``}
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
