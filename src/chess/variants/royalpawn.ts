import {Game, GameEventType, GameEventName} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn, Mann} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState, Phase} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Castle, Turn, TurnType} from '../turn';
import {SecretPawnGame} from './pawngame';

export class Royalpawn extends SecretPawnGame {
  name = 'Royalpawn';
  constructor(isServer: boolean) {
    super(isServer, genInitial(), KingPawn);
  }
  promotions(turn: Turn): Piece[] | undefined {
    // No need to promote, you win
    if (turn.piece instanceof KingPawn) return;
    return super.promotions(turn);
  }
  winCondition(color: Color, state: BoardState): boolean {
    if (state.extra.phase === Phase.PRE) return false;
    // Win by capturing the king pawn
    if (
      !state.pieces
        .filter((piece) => piece.color === getOpponent(color))
        .some((piece) => piece.isRoyal)
    ) {
      return true;
    }

    const myKingSquare = this.state.squares
      .flat()
      .find(
        (square) =>
          square.occupant instanceof KingPawn && square.occupant.color === color
      );

    // King pawn reaching the end wins
    return (
      (myKingSquare?.row === 0 && color === Color.WHITE) ||
      (myKingSquare?.row === this.state.files - 1 && color === Color.BLACK)
    );
  }

  drawCondition(color: Color): boolean {
    return this.allLegalMoves(color, this.state, true).length === 0;
  }

  validateTurn(color: Color, turn: Turn): boolean {
    if (
      turn.end.row < 0 ||
      turn.end.row >= this.state.ranks ||
      turn.end.col < 0 ||
      turn.end.col >= this.state.files
    ) {
      return false;
    }
    const isSelectRoyal =
      turn.type === TurnType.ACTIVATE && turn.piece.name === 'Pawn';
    const isPre = this.state.extra.phase === Phase.PRE;
    return (isSelectRoyal && isPre) || (!isSelectRoyal && !isPre);
  }
}

export class KingPawn extends Pawn {
  name = 'KingPawn';
  isRoyal = true;
  get img(): string {
    if (this.color === Color.BLACK) {
      return 'svg/rpb.svg';
    } else if (this.color === Color.WHITE) {
      return 'svg/rpw.svg';
    }
    throw new Error(
      'no image for color: ' + this.color + 'for piece ' + this.name
    );
  }
  static freeze(p: KingPawn): object {
    return {
      _class: 'KingPawn',
      n: p.name,
      c: p.color,
    };
  }
  static thaw(o): KingPawn {
    return new KingPawn(o.c);
  }
}

function genInitial(): BoardState {
  const state = generateStartState();
  state.squares[0][4].place(new Mann(Color.BLACK));
  state.squares[7][4].place(new Mann(Color.WHITE));
  return state;
}
