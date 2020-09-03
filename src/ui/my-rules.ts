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
    #rules {
      transition: none;
      opacity: 0;
    }
    :host([started]) #rules {
      opacity: 1;
      transition: all ${ROULETTE_SECONDS}s cubic-bezier(1, 0.01, 1, 0.01);
    }
  `;
  @property({type: Object}) game: Game;
  @property({type: Boolean, reflect: true}) started = false;

  render() {
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
    </ul>
    Bobby Fischer (1993)`,
  Classic: html`The classic game.`,
  Knightmate: html`Whose Manns is this?
    <ul>
      <li>The King is replaced by a <b>Royal Knight</b>, and the Knights are replaced by
      <b>Manns</b>, which are regular pieces that move like Kings.</li>
      <li>Castling allowed.</li>
      <li>Pawn can promote to <b>Mann</b> instead of Knight.</li>
      <li>Checkmate the <b>Royal Knight</b> to win.</li>
    </ul>
    Bruce Zimov (1972)`,
  Horde: html`White has 36 pawns. Black has a regular chess setup.
    <ul>
      <li>White wins by checkmating the black king.</li>
      <li>Black wins by capturing every pawn.</li>
      <li>White pawns can promote.</li>
    </ul>`,
  Hiddenqueen: html`One of your pawns is secretly a queen. Choose the moment to
    reveal wisely.
    <ul>
      <li>
        As your <b>first move</b>, you <b>must</b> double click a pawn to be a
        secret queen.
      </li>
      <li>Checkmate or <b>capture</b> the king to win.</li>
      <li>Hidden Queen is <b>revealed</b> when it makes a non-pawn move.</li>
      <li>Hidden Queen cannot capture en passant.</li>
      <li>
        Hidden Queen cannot be captured en passant. If you are unable to capture
        an otherwise eligible pawn en passant, it <b>must</b> be the opponent's
        hidden queen.
      </li>
    </ul>
    Etienne Orieux (2019)`,
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
    </ul>
    Joseph Boyer (1950s)`,
  Dark: html`Each player can only see the squares they can move to.
    <ul>
      <li>Checkmate or <b>capture</b> the king to win.</li>
    </ul>
    Jens Baek Nielsen (1997) `,
  Pocketknight: html`Each player has a knight in pocket. It can be dropped on an
  empty square anywhere on the board instead of moving a piece.`,
  Stealthbomber: html`<ul>
      <li>
        As your <b>first move</b>, you <b>must</b> double click a pawn to be a
        secret bomber.
      </li>
      <li>
        <b>Double click a bomb</b> to destroy it and the pieces on the
        neighboring eight squares.
      </li>
      <li>Checkmate or <b>explode</b> the king to win.</li>
      <li>Bomb promotes as a normal pawn.</li>
    </ul>
    Jim Winslow (1991)`,
  // Maharaja: html`White's sole piece is the powerful <b>Amazon</b>, which moves
  //   like a Knight + Queen.
  //   <ul>
  //     <li>White wins by checkmate.</li>
  //     <li>Black wins by checkmating the Amazon.</li>
  //   </ul>`,
  Chess921600: html`Starting position of the pieces on the players' home ranks
    is independently randomized.
    <!-- <div class="examples"><img src="../img/variants/960.png"/></div> -->
    <ul>
      <li>Orthodox rules.</li>
      <li>Checkmate to win.</li>
    </ul>
    Bobby Fischer (1993) `,
  Dark2r: html`Each player can only see the squares they can move to. In
    addition, each player's piece starting positions are independently
    randomized.
    <ul>
      <li>Checkmate or <b>capture</b> the king to win.</li>
    </ul>
    Jens Baek Nielsen (1997) `,
  Bario: html`<b>Crescents</b> can be moved as any standard piece, and then
    become that piece. For instance, if you move a Crescent as a Knight, it will
    become a Knight. <b>However</b>, you are limited to the number of pieces of
    a regular chess set (i.e., 2 Knights, 2 Bishops, 2 Rooks, 1 Queen.) So if
    you have made two Knights, you <b>cannot</b> move any more Crescents as
    Knights.
    <ul>
      <li>
        When no Crescents of a color remain,
        <b>that color's pieces all revert to Crescents.</b>
      </li>
      <li>Checkmate or <b>capture</b> the king to win.</li>
      <li>No castling.</li>
      <li>You may choose which piece to change to if ambiguous.</li>
    </ul>
    Panos Louridas (1998) `,
  Atomic: html`Captures explode the captured piece and all neighboring pieces
    except pawns.
    <ul>
      <li>Checkmate or <b>explode</b> the king to win.</li>
    </ul>`,
  Royalpawn: html`Protect the royal pawn.
    <ul>
      <li>
        As your <b>first move</b>, you <b>must</b> double click a pawn to be
        secretly royal.
      </li>
      <li>Your opponent does not know which pawn is royal.</li>
      <li>Capture the opponent's royal pawn to win.</li>
      <li>Or promote your royal pawn to win.</li>
      <li>There is no check or checkmate.</li>
      <li>
        King is replaced by a Mann which is a regular piece that moves like a
        King.
      </li>
    </ul>
    Chessclub Promotie (1997?) `,
  Pieceeater: html`An uncapturable <b>Elephant</b> wanders the board gobbling
    pieces.
    <ul>
      <li>Elephant moves one space after every turn in any direction.</li>
      <li>
        If you move a piece to a square adjacent to the Elephant, it will
        <b>capture</b> it on that turn, except...
      </li>
      <li>Elephant will not capture or move adjacent to a <b>King</b>.</li>
      <li>Otherwise, the Elephant chooses randomly from the legal squares it can move to.</li>
      <li>
        Each player has an extra <b>pawn</b> drop, anywhere except the first or
        last rank.
      </li>
      <li>Checkmate or capture the opponent's king to win.</li>
    </ul>
    Peter Aronson (2001) `,
  Football: html`Get a piece on your opponent's King or Queen starting squares
    to win.
    <ul>
    <li>Get to d8 or e8 to win as white, d1 or e1 as black.</li>
    <li>Capturing all opponent pieces also wins.</li>
      <li>King can be captured without ending game.</li>
    </ul>
    <a
      href="http://abrobecker.free.fr/chess/fairyblitz.htm#football"
      target="_blank"
      >Source</a
    > `,
  Chigorin: html`The knight army vs the bishop army.
    <ul>
      <li>Pawns only promote to pieces in same color's starting army.</li>
      <li><b>Chancellor</b> moves as Rook + Knight.</li>
      <li>Orthodox rules, checkmate to win.</li>
    </ul>
    Ralph Betza (2002) `,
  Prechess: html`Set up your own starting position.
    <ul>
      <li>
        White and black alternate placing pieces until all pieces are placed.
      </li>
      <li>Then, play continues as a normal chess game.</li>
    </ul>
    Pal Benko (1978) `,
  Riflechess: html`Brap brap brap brap brap
    <ul>
      <li>Pieces do not move when capturing.</li>
      <li>Checkmate to win.</li>
    </ul>
    W. B. Seabrook (1921)`,
  Amazonarmy: html`White's army is top heavy.
    <ul>
      <li>White's Queen is an Amazon which moves as Knight + Queen</li>
      <li>White's Rooks are <b>short</b>. They only move up to 4 squares.</li>
      <li>Checkmate to win.</li>
    </ul>
    W. B. Seabrook (1921)`,
  Antichess: html`Chess for losers.
    <ul>
      <li>Lose all your pieces or have no legal moves to win.</li>
      <li>You <b>must</b> make a capture if you can.</li>
      <li>No castling. King is not royal.</li>
      <li>Pawn also promotes to King</li>
    </ul> `,
  Golemchess: html`So nice it gets captured twice.
    <ul>
      <li>Each side has a <b>Golem</b> (rhino) which moves as a Queen, but
      only a maximum of <b>two</b> squares in any direction.</li>
      <li>The first time it gets captured, the capturer is removed from
        the board and the Golem becomes a <b>Half-Golem</b> (small rhino)
        with the same movement.</li>
      <li>If a Golem captures a Golem, the captured Golem is destroyed,
        but the capturer becomes a Half-Golem.</b></li>
    </ul>
    Peter Aronson and Ben Good
  `,
  Kungfu: html`Gotta go fast.
  <ul>
    <li>After the first move by each player, the game plays in <b>real time</b>.</li>
    <li>Checkmate to win.</li>
  </ul>
  Shizmoo Games, 2000s
  `,
  Instagram: html`The Instagram variation.`,
  Gaychess: html`Two kings.`,
};

declare global {
  interface HTMLElementTagNameMap {
    'my-rules': MyRules;
  }
}
