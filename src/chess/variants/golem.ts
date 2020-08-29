import {Game} from '../game';
import {RoyalKnight, Mann, Rook, Bishop, Queen, Pawn, Piece, Knight} from '../piece';
import {Color} from '../const';
import {BoardState, squaresFromPos, generateStartState} from '../state';
import Square from '../square';
import {Royalpawn} from './royalpawn';
import { Turn } from '../turn';

export class Golemchess extends Game {
  name = 'Golemchess';
  constructor(isServer) {
    super(isServer, genInitial());
  }

  promotesTo(): typeof Piece[] {
    return [Queen, Rook, Bishop, Knight, Golem];
  }

  modifyTurn(turn: Turn): Turn {
    if (!(turn.captured instanceof Golem)) {
      return turn;
    }
    const {row, col} = turn.end;
    if (turn.piece instanceof Golem) {
      return {
        ...turn,
        after: turn.after.place(new Halfgolem(turn.piece.color), row, col),
      }
    } else {
      return {
        ...turn,
        after: turn.after.place(new Halfgolem(turn.captured.color), row, col),
      }
    }
  }
}

function genInitial(): BoardState {
  const state = generateStartState();
  state.place(new Golem(Color.BLACK), 0, 3);
  state.place(new Golem(Color.WHITE), 7, 3);

  return state;
}

export class Golem extends Queen {
  name = 'Golem';
  max = 2;
  get img(): string {
    if (this.color === Color.BLACK) {
      return 'brhino.svg';
    } else {
      return 'wrhino.svg';
    }
  }

  static freeze(p: Golem): object {
    return {
      _class: 'Golem',
      n: p.name,
      c: p.color,
    };
  }
  static thaw(o): Golem {
    return new Golem(o.c);
  }
}

export class Halfgolem extends Queen {
  name = 'Halfgolem';
  max = 2;
  get img(): string {
    if (this.color === Color.BLACK) {
      return 'brhinosmall.svg';
    } else {
      return 'wrhinosmall.svg';
    }
  }

  static freeze(p: Halfgolem): object {
    return {
      _class: 'Halfgolem',
      n: p.name,
      c: p.color,
    };
  }
  static thaw(o): Halfgolem {
    return new Halfgolem(o.c);
  }
}