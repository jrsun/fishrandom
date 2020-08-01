import {Pair, Color} from './const';
import {Piece, Pawn, King} from './piece';
import BoardState from './state';

export enum TurnType {
  MOVE = 'move',
  CASTLE = 'castle',
  DROP = 'drop',
  PROMOTE = 'promote',
}

export type Turn = Move | Castle | Drop | Promote;

interface BaseTurn {
  before: BoardState;
  after: BoardState;
  color: Color;
  end: Pair;
  piece: Piece;
  type: TurnType; // 'move', 'castle', etc.
}

export interface Move extends BaseTurn {
  type: TurnType.MOVE;
  start: Pair;
  isCapture: boolean;
  captured?: Piece;
}

export interface Castle extends BaseTurn {
  type: TurnType.CASTLE;
  piece: King;
  start: Pair;
  kingside: boolean;
}

export interface Drop extends BaseTurn {
  type: TurnType.DROP;
}

export interface Promote extends BaseTurn {
  type: TurnType.PROMOTE;
  piece: Pawn;
  start: Pair;
  to: Piece;
  isCapture: boolean;
  captured?: Piece;
}

export function toFEN(turn: Turn) {
  switch (turn.type) {
    case TurnType.MOVE:
      return moveToFen(turn as Move);
    case TurnType.CASTLE:
      return (turn as Castle).kingside ? 'O-O' : 'O-O-O';
    default:
      return '?';
  }
}

function moveToFen(move: Move): string {
  const {type, piece, start, end, before, after, isCapture} = move;
  const endFile = (end.col + 10).toString(36);
  const endRank = after.ranks - end.row;
  const startFile = (start.col + 10).toString(36);
  const startRank = after.ranks - start.row;

  if (piece instanceof Pawn) {
    if (!isCapture) {
      return `${endFile}${endRank}`;
    }
    return `${startFile}x${endFile}${endRank}`;
  }
  const capture = isCapture ? 'x' : '';
  const ambiguousSquares = after.squares.flat().filter((square) => {
    const occupant = square.occupant;
    return (
      !!occupant &&
      occupant.color === piece.color &&
      occupant.name === piece.name &&
      occupant
        .legalMoves(
          square.row,
          square.col,
          before,
          [] // en passant would never be ambiguous
        )
        .some((move) => move.end.row === end.row && move.end.col === end.col)
    );
  });
  let actor = piece.toFEN();
  if (ambiguousSquares.length) {
    if (!ambiguousSquares.some((amb) => amb.col === start.col)) {
      // file disambiguates
      actor += startFile;
    } else if (!ambiguousSquares.some((amb) => amb.row === start.row)) {
      // rank disambiguates
      actor += startRank;
    } else {
      // both file and rank necessary
      actor += `${startFile}${startRank}`;
    }
  }
  return `${actor}${capture}${endFile}${endRank}`;
}
