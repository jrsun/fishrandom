import {Game, GameEventName, GameEventType} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn, Amazon, Chancellor, Princess, ALL_PIECES} from '../piece';
import {Color, getOpponent} from '../const';
import {BoardState, generateStartState} from '../state';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Move, Turn, Activate, TurnType, Castle} from '../turn';

export class Absorption extends Game {
  name = 'Absorption';
  constructor(isServer: boolean) {
    super(isServer, generateStartState());
  }

  modifyTurn(turn: Turn): Turn {
    if (!turn.captured) return turn;

    const {row, col} = turn.end;
    const after = BoardState.copy(turn.after);

    const newPieceType = combinePieces(turn.piece, turn.captured);
    after.place(
      new newPieceType(turn.piece.color),
      row,
      col,
    );

    return {
      ...turn,
      after,
    };
  }
}

const DESC_PIECES = ['Amazon', 'Princess', 'Queen', 'Chancellor', 'Rook', 'Knight', 'Bishop', 'Pawn'] as const;
const LEVEL_2_PIECES = ['Princess', 'Queen', 'Chancellor'];

const combinePieces = (captor: Piece, captured: Piece): typeof Piece => {
  const pieces = [captor.name, captured.name];
  if (captor.name === 'King') return King;
  if (captor.name === captured.name) return ALL_PIECES[captor.name];

  if (pieces.every(p => LEVEL_2_PIECES.includes(p))) {
    return Amazon;
  }
  if (
    (pieces.includes('Bishop') && pieces.includes('Chancellor')) ||
    (pieces.includes('Rook') && pieces.includes('Princess')) || 
    (pieces.includes('Queen') && pieces.includes('Knight'))
  ) {
    return Amazon;
  }

  if (pieces.includes('Bishop') && pieces.includes('Knight')) {
    return Princess;
  }
  if (pieces.includes('Bishop') && pieces.includes('Rook')) {
    return Queen;
  }
  if (pieces.includes('Knight') && pieces.includes('Rook')) {
    return Chancellor;
  }

  for (const p of DESC_PIECES) {
    if (captor.name === p) return ALL_PIECES[p];
    if (captured.name === p) return ALL_PIECES[p];
  }
  return Pawn;
}
