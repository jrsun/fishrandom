import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import {Game} from '../chess/game';
import {ROULETTE_SECONDS, Color, getOpponent} from '../chess/const';
import { addMessageHandler, Message, AppendMessage, ReplaceMessage } from '../common/message';
import { Piece } from '../chess/piece';
import { Turn } from '../chess/move';

type PieceName = string;

@customElement('my-captures')
export class MyCaptures extends LitElement {
  static styles = css`
    :host {
      /* max-height: 100%;
      width: 300px; */
      display: block;
    }
  `;
  
  // Protected
  @property({type: String}) color: Color;
  @property({type: Array}) turnHistory: Turn[];

  addPiece(m: Map<PieceName, number>, p: PieceName) {
    const value = m.get(p);
    if (value !== undefined) {
      m.set(p, value + 1);
    } else {
      m.set(p, 1);
    }
  }

  capturedFromHistory(history: Turn[]): Map<PieceName, number> {
    const pieces = new Map<PieceName, number>();
    for (const turn of history) {
      if (turn.captured?.color === getOpponent(this.color)) {
        this.addPiece(pieces, turn.captured.name);
      }
    }
    return pieces;
  }

  render() {
    return html`<div>${
      Array.from(
        this.capturedFromHistory(this.turnHistory)
      ).map(([p, count]) => html`<div
      class="captured-piece">${p}: ${count}</div>`
    )}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-captures': MyCaptures;
  }
}
