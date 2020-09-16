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
  King,
} from '../piece';
import {Color} from '../const';
import {BoardState, squaresFromPos, generateStartState} from '../state';
import Square from '../square';
import {Royalpawn} from './royalpawn';
import {Turn} from '../turn';

export class Werewolf extends Game {
  // TODO: bug where checkmate with the rhino itself is not mate
  name = 'Werewolf';
  constructor(isServer) {
    super(isServer, genInitial());
  }

  promotesTo(piece: Piece): Piece[] {
    return [Rook, Bishop, Knight].map((t) => new t(piece.color));
  }

  modifyTurn(turn: Turn): Turn {
    // If a wolf wasn't a captured, or it was a king move, return
    if (!(turn.captured instanceof Wolf) || turn.piece instanceof King) {
      return turn;
    }
    const {row, col} = turn.end;
    return {
      ...turn,
      after: turn.after.place(new Wolf(turn.piece.color), row, col),
      captured: turn.piece,
    };
  }
}

function genInitial(): BoardState {
  const state = generateStartState();
  state.place(new Wolf(Color.BLACK), 0, 3);
  state.place(new Wolf(Color.WHITE), 7, 3);

  return state;
}

export class Wolf extends Queen {
  name = 'Wolf';
  max = 3;
  get img(): string {
    if (this.color === Color.BLACK) {
      return 'bdragon.svg';
    } else {
      return 'wdragon.svg';
    }
  }

  static freeze(p: Wolf): object {
    return {
      _class: 'Wolf',
      n: p.name,
      c: p.color,
    };
  }
  static thaw(o): Wolf {
    return new Wolf(o.c);
  }
}