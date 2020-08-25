import {Game, GameEventType, GameEventName} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent, Pair} from '../const';
import {BoardState, generateStartState, Phase} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Turn, Activate, TurnType, Castle, Unknown} from '../turn';
import { SecretPawnGame } from './pawngame';

export class Secretbomber extends SecretPawnGame {
  name = 'Secretbomber';
  constructor(isServer: boolean) {
    super(isServer, generateStartState(), BomberPawn);
  }

  activate(
    color: Color,
    piece: Piece,
    row: number,
    col: number
  ): Turn | undefined {
    if (!this.isWhoseTurn(color, piece)) return;
    const activatePawn = super.activate(color, piece, row, col);
    if (activatePawn) {
      return activatePawn;
    }

    if (!(piece instanceof BomberPawn)) {
      return
    }
    const after = BoardState.copy(this.state)
      .setTurn(getOpponent(color));
    const pairs: Pair[] = [];
    for (let i = row - 1; i < row + 2; i++) {
      for (let j = col - 1; j < col + 2; j++) {
        after.empty(i, j);
        pairs.push({row: i, col: j});
      }
    }
    if (this.eventHandler) {
      this.eventHandler({
        pairs,
        name: GameEventName.Explode,
        type: GameEventType.Temporary,
      });
    }
    const turn = {
      type: TurnType.ACTIVATE as const,
      before: this.state,
      after,
      end: {row, col},
      piece,
    };
    if (!this.validateTurn(piece.color, turn)) return;
    return turn;
  }
}

export class BomberPawn extends Pawn {
  name = 'BomberPawn';
  get img(): string {
    if (this.color === Color.BLACK) {
      return 'bombb.svg';
    } else if (this.color === Color.WHITE) {
      return 'bombw.svg';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
  static freeze(p: BomberPawn): object {
    return {
      _class: 'BomberPawn',
      n: p.name,
      c: p.color,
    };
  }
  static thaw(o): BomberPawn {
    return new BomberPawn(o.c);
  }
}