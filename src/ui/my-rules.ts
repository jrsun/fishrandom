import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
} from 'lit-element';
import {Game} from '../chess/game';
import {ROULETTE_SECONDS} from '../chess/const';

@customElement('my-rules')
export class MyRules extends LitElement {
  static styles = css`
    /* :host {
      display: block;
      margin: 20px;
      max-width: 800px;
      padding: 10px;
      background-color: #efece0;
      padding: 30px;
      border-radius: 4px;
      box-shadow: 0px 7px #dad4c8;
    } */
    :host {
      max-height: 100%;
      width: 300px;
      display: block;
    }
    #title > h3 {
      margin: 0;
      font-family: 'JelleeBold';
    }
    #title {
      margin-bottom: 10px;
    }
    #rules {
      display: flex;
      /* height: 50vh; */
      /* temporary */
      overflow-y: auto;
      flex-direction: column;
      align-items: center;
    }
    .examples {
      overflow-x: auto;
      display: block;
    }
    .examples > img {
      height: 200px;
      width: 200px;
      background-size: cover;
    }
    ul {
      padding-left: 20px;
    }
  `;
  @property({type: Object}) game: Game;
  @property({type: Boolean}) started = false;

  @property({type: Boolean}) realStarted = false;

  updated(changedProperties) {
    // TODO reconnect
    if (changedProperties.has('started')) {
      if (this.started) {
        setTimeout(() => {
          this.realStarted = true;
        }, ROULETTE_SECONDS * 1000);
      } else {
        this.realStarted = false;
      }
    }
  }

  render() {
    if (!this.game) return html`Loading...`; // TODO Loading spinner
    return html`
      <div id="rules">
        <span id="title"><h3>Rules</h3></span>
        <div class="body">
          ${html`${this.getVariantRules()}`}
        </div>
      </div>
    `;
  }

  private getVariantRules() {
    if (!this.realStarted) return html``;
    return VARIANT_INFO[this.game.name] ?? `${this.game.name} rules not found.`;
  }
}

const VARIANT_INFO: {[variant: string]: TemplateResult} = {
  Chess960: html`Starting position of the pieces on the players' home ranks is
    randomized.
    <!-- <div class="examples"><img src="../img/variants/960.png"/></div> -->
    <ul>
      <li>Orthodox rules.</li>
      <li>Checkmate to win.</li>
    </ul>`,
  Classic: html`The classic game.`,
  Knightmate: html`The role of the King and Knight are switched. The King is
    replaced by a <b>Royal Knight</b>, and the Knights are replaced by
    <b>Manns</b>, which are regular pieces that move like Kings.
    <ul>
      <li>Castling allowed.</li>
      <li>Pawn can promote to <b>Mann</b> instead of Knight.</li>
      <li>Checkmate the <b>Royal Knight</b> to win.</li>
    </ul>`,
  Horde: html`White has 36 pawns. Black has a regular chess setup.
    <ul>
      <li>White wins by checkmating the black king.</li>
      <li>Black wins by capturing every pawn.</li>
      <li>White pawns can promote.</li>
    </ul> `,
  Hiddenqueen: html`Both sides have a pawn designated as a hidden queen. This
    queen will remain hidden to the opponent unless it makes a move that would
    be impossible as a pawn. While hidden, the queen does not explicitly give
    check.
    <ul>
      <li>Checkmate or <b>capture</b> the king to win.</li>
      <li>Hidden Queen cannot capture en passant.</li>
      <li>
        Hidden Queen cannot be captured en passant. If you are unable to capture
        an otherwise eligible pawn en passant, it <b>must</b> be the opponent's
        hidden queen.
      </li>
    </ul> `,
  Grasshopper: html`Both sides have a full rank of <b>Grasshoppers</b>. A
    grasshopper moves like a queen, but it MUST hop over another piece to move.
    To be specific, it can only land immediately on the far side of the closest
    piece along a rank, file, or diagonal. If there is an opposing piece there,
    the grasshopper will capture it. If there is a friendly piece, the
    grasshopper cannot move there.
    <ul>
      <li>Orthodox rules.</li>
      <li>Checkmate to win.</li>
      <li>No pawn double move from start.</li>
    </ul> `,
  Dark: html`Each player can only see the squares they can move to.
    <ul>
      <li>Checkmate or <b>capture</b> the king to win.</li>
    </ul> `,
  Pocketknight: html`Each player has a knight in pocket. It can be dropped on an
  empty square anywhere on the board instead of moving a piece.`,
  Secretbomber: html`Each player has a hidden bomber pawn.
    <b>Double click</b> it to destroy it and the pieces on the adjacent eight
    squares.
    <ul>
      <li>Checkmate or <b>explode</b> the king to win.</li>
    </ul>`,
  Maharaja: html`White's sole piece is the powerful <b>Amazon</b>, which moves
    like a Knight + Queen.
    <ul>
      <li>White wins by checkmate.</li>
      <li>Black wins by checkmating the Amazon.</li>
    </ul>`,
  Chess921600: html`Starting position of the pieces on the players' home ranks
    is independently randomized.
    <!-- <div class="examples"><img src="../img/variants/960.png"/></div> -->
    <ul>
      <li>Orthodox rules.</li>
      <li>Checkmate to win.</li>
    </ul>`,
  Dark2r: html`Each player can only see the squares they can move to. In
    addition, each player's piece starting positions are independently
    randomized.
    <ul>
      <li>Checkmate or <b>capture</b> the king to win.</li>
    </ul> `,
  Bario: html`A challenging variant. Your <b>Crescents</b> represent undefined pieces. They can be moved
    as any piece, and then become that piece. For instance, if you move a Crescent
    as a Knight, it will become a Knight. <b>However</b>, you are limited
    to the number of pieces of a regular chess set (i.e., 2 Knights, 2 Bishops, 2
    Rooks, 1 Queen.) So if you have made two Knights, you <b>cannot</b> move
    any Crescents as Knights.
    <br /><br />
    Finally, when every Crescent has become a defined piece, <b>every piece reverts
      to a crescent</b>. This is called a <b>cycle</b>.
    <ul>
      <li>Checkmate or <b>capture</b> the king to win.</li>
      <li>No castling.</li>
      <li>Be wary of triggering a cycle.</li>
      <li>When possible, a Bishop or Rook will be made instead of a Queen.</li>
    </ul> 
  `,
};

declare global {
  interface HTMLElementTagNameMap {
    'my-rules': MyRules;
  }
}
