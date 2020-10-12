import {Game, GameEventType, GameEventName} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState, Phase} from '../state';
import Square from '../square';
import {randomChoice} from '../../common/utils';
import {Move, Turn, Activate, TurnType, Castle, Unknown} from '../turn';
import {SecretPawnGame} from './pawngame';
import { Pair } from '../pair';

export class Stealthbomber extends SecretPawnGame {
  name = 'Stealthbomber';
  constructor(isServer: boolean) {
    super(isServer, generateStartState(), BomberPawn);
  }

  sideEffects(turn: Turn) {
    super.sideEffects(turn);

    if (turn.piece instanceof BomberPawn && turn.type === TurnType.ACTIVATE) {
      const {
        end: {row, col},
      } = turn;
      const pairs: Pair[] = [];
      for (let i = row - 1; i < row + 2; i++) {
        for (let j = col - 1; j < col + 2; j++) {
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
    }
  }

  activate(
    color: Color,
    row: number,
    col: number,
    piece?: Piece
  ): Turn | undefined {
    if (!piece || !this.isWhoseTurn(color, piece)) return;
    const activatePawn = super.activate(color, row, col, piece);
    if (activatePawn) {
      return activatePawn;
    }

    if (!(piece instanceof BomberPawn)) {
      return;
    }
    const after = BoardState.copy(this.state).setTurn(getOpponent(color));
    for (let i = row - 1; i < row + 2; i++) {
      for (let j = col - 1; j < col + 2; j++) {
        after.empty(i, j);
      }
    }
    return {
      type: TurnType.ACTIVATE as const,
      before: this.state,
      after,
      end: {row, col},
      piece,
    };
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
