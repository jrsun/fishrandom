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
    :host {
      max-height: 100%;
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
      <li>
        The King is replaced by a <b>Royal Knight</b>, and the Knights are
        replaced by <b>Manns</b>, which are regular pieces that move like Kings.
      </li>
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
        <b>that color's pieces all revert to Crescents and all pieces
          once again are available for transformation.</b>
      </li>
      <li>Checkmate or <b>capture</b> the king to win.</li>
      <li>No castling.</li>
      <li>You may choose which piece to change to if ambiguous.</li>
      <li>You can have two bishops of the same color.</li>
    </ul>
    Panos Louridas (1957) `,
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
  Gobbler: html`An uncapturable <b>Elephant</b> wanders the board gobbling
    pieces.
    <ul>
      <li>
        Elephant moves to a random empty adjacent square after each turn, with
        two exceptions.
      </li>
      <li>#1: Elephant will not capture or move adjacent to a <b>King</b>.</li>
      <li>
        #2: If you move a piece to a square adjacent to the Elephant, it will
        <b>capture</b> it on that turn, unless #1 applies.
      </li>
      <li>If the Elephant has no legal moves, it will not move.</li>
      <li>Checkmate or capture the opponent's king to win.</li>
    </ul>
    Based on Piece Eater by Peter Aronson (2001) `,
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
  Shooting: html`Brap brap brap
    <ul>
      <li>
        Pieces shoot each other to capture (they don't move when capturing.)
      </li>
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
  Losers: html`Chess for losers.
    <ul>
      <li>Initial position of pieces are randomized.</li>
      <li>Lose all your pieces or have no legal moves to win.</li>
      <li>You <b>must</b> make a capture if you can.</li>
      <li>No castling. King is not royal.</li>
      <li>Pawn also promotes to King</li>
    </ul> `,
  Golemchess: html`So nice, you gotta capture twice.
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
      <li>
        After the first move by each player, the game plays in <b>real time</b>.
      </li>
      <li>Checkmate to win.</li>
    </ul>
    Shizmoo Games, 2000s `,
  Instagram: html`The Instagram variation.`,
  Gaychess: html`Two kings.
    <ul>
      <li>Checkmate either king to win.</li>
      <li>
        Forking both the kings wins, because there is no way to defend or move
        both.
      </li>
      <li>
        Pinning the kings against each other wins if the opponent cannot block.
      </li>
    </ul>
    Two Kings by Rob McCarter (1997) `,
  Monster: html`White moves twice for every Black move, but only has four pawns.
    <ul>
      <li>
        White <b>must</b> move twice every turn, either a single piece two
        times, or two pieces once each.
      </li>
      <li>Checkmate to win. White can also capture the black king.</li>
      <li>
        White can move into check with their first move, but must move out of
        check with their second move, except when capturing the black king.
      </li>
    </ul>`,
  Veto: html`Second best moves.
    <ul>
      <li>
        When your opponent makes a move, you have one <b>veto</b>. If you veto,
        the opponent must make a different move.
      </li>
      <li><b>Double click</b> the red square to veto.</li>
      <li><b>Double click</b> the green square to accept.</li>
      <li>King capture <b>cannot be vetoed.</b></li>
      <li>If you veto the opponent's only legal move, it is checkmate if
        they are in check, and stalemate if not.</li>
    </ul>
    Known bugs: Captured pieces show even if capture is vetoed. `,
  Werewolf: html`Convert by capturing.
  <ul>
    <li>Werewolf moves up to 3 squares as a Queen.</li>
    <li>Capturing a werewolf with any piece <b>sacrifices</b> that piece
    and changes the werewolf to your color, except...</li>
    <li>When the capturer is a King, the werewolf is captured normally.</li>
    <li>Pawn <b>cannot</b> promote to Werewolf.</li>
  </ul>
  H. G. Muller (2015)
  `,
  Pawnside: html`Pawns can move sideways one square without capturing.
  <ul>
    <li>Pawns can execute the initial double-move as long as they
      are on their starting rank.</li>
    <li>Checkmate to win.</li>
  </ul>
  As far as I know, the first appearance of this variant is in the recent paper
  due to Tomašev, Paquet, Hassabis, and Kramnik, "Assessing Game Balance with AlphaZero:
  Exploring Alternative Rule Sets in Chess." However, if this is not the case,
  please let me know.
  `,
  Knightrider: html`Knights are replaced by Nightriders.
  <ul>
    <li>A <b>Nightrider</b> is a ranging piece that moves any number of steps
    as a <b>Knight</b> in the same direction, unless blocked.</li>
    <li>Checkmate to win.</li>
  </ul>
  Piece by T. R. Dawson (1925), variant by Uray M. János (2013)
  `,
  Absorption: html`Captures absorb powers.
  <ul>
    <li>When a piece (except King and Pawn) captures another, it gains its movement abilities.</li>
    <li>For instance, a Rook capturing a Bishop becomes a Queen (R + B).</li>
    <li>Knight and Rook make a (N + R) compound, and Knight and Bishop make a (N + B) compound.</li>
    <li>An Amazon (N + R + B) can be formed in multiple ways.</li>
    <li>When a pawn captures a piece, it becomes that piece.</li>
  </ul>
  `,
};

declare global {
  interface HTMLElementTagNameMap {
    'my-rules': MyRules;
  }
}
