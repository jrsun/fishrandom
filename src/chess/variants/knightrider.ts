import {Game} from '../game';
import {
  RoyalKnight,
  Mann,
  Rook,
  Bishop,
  Queen,
  Pawn,
  Piece,
  Knight,
  Chancellor,
  Rider,
} from '../piece';
import {Color} from '../const';
import {BoardState, squaresFromPos, generateStartState} from '../state';
import Square from '../square';

export class Knightrider extends Game {
  name = 'Knightrider';
  constructor(isServer) {
    super(isServer, genInitial());
  }

  promotesTo(piece: Piece): Piece[] {
    return [Rook, Bishop, Queen, Nightrider].map((t) => new t(piece.color));
  }
}

function genInitial(): BoardState {
  const state = generateStartState();
  state.place(new Nightrider(Color.BLACK), 0, 1);
  state.place(new Nightrider(Color.BLACK), 0, 6);
  state.place(new Nightrider(Color.WHITE), 7, 1);
  state.place(new Nightrider(Color.WHITE), 7, 6);

  return state;
}

export class Nightrider extends Rider {
  name = 'Nightrider'
  moves = [
    {row: 1, col: 2},
  ]

  toFen() { return 'N'; }

  get img(): string {
    if (this.color === Color.BLACK) {
      return 'bnightrider.svg';
    } else if (this.color === Color.WHITE) {
      return 'wnightrider.svg';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
  static freeze(p: Nightrider): object {
    return {
      _class: 'Nightrider',
      n: p.name,
      c: p.color,
    };
  }
  static thaw(o): Nightrider {
    return new Nightrider(o.c);
  }
}
