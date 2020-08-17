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

type PieceImg = string;

@customElement('my-captures')
export class MyCaptures extends LitElement {
  static styles = css`
    :host {
      /* max-height: 100%;
      width: 300px; */
      display: flex;
    }
    .captured-piece {
      height: 20px;
      width: 20px;
      background-size: cover;
    }
  `;
  
  // Protected
  @property({type: String}) color: Color;
  @property({type: Array}) turnHistory: Turn[];

  addPiece(m: Map<PieceImg, number>, p: PieceImg) {
    const value = m.get(p);
    if (value !== undefined) {
      m.set(p, value + 1);
    } else {
      m.set(p, 1);
    }
  }

  capturedFromHistory(history: Turn[]): Map<PieceImg, number> {
    const pieces = new Map<PieceImg, number>();
    for (const turn of history) {
      if (turn.captured?.color === getOpponent(this.color)) {
        this.addPiece(pieces, turn.captured.img);
      }
    }
    return pieces;
  }

  render() {
    return html`${
      Array.from(
        this.capturedFromHistory(this.turnHistory)
      ).map(([img, count]) => html`<span
      class="captured-piece" style="background-image:url(../img/${img});"></span>`
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-captures': MyCaptures;
  }
}
