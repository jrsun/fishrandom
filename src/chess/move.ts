import {Pair, Color} from './const';
import {Piece, Pawn, King} from './piece';
import {BoardState} from './state';
import Square from './square';

export enum TurnType {
  MOVE = 'move',
  CASTLE = 'castle',
  DROP = 'drop',
  PROMOTE = 'promote',
  UNKNOWN = 'unknown',
  ACTIVATE = 'activate',
}

export type Turn = Move | Castle | Drop | Promote | Unknown | Activate;

interface BaseTurn {
  before: BoardState;
  after: BoardState;
  end: Pair;
  piece: Piece;
  type: TurnType; // 'move', 'castle', etc.
  captured?: Piece;
}

export interface Move extends BaseTurn {
  type: TurnType.MOVE;
  start: Pair;
}

export interface Castle extends BaseTurn {
  type: TurnType.CASTLE;
  start: Pair;
  kingside: boolean;
}

export interface Drop extends BaseTurn {
  type: TurnType.DROP;
}

export interface Promote extends BaseTurn {
  type: TurnType.PROMOTE;
  start: Pair;
  to: Piece;
}

export interface Unknown extends BaseTurn {
  type: TurnType.UNKNOWN;
}

export interface Activate extends BaseTurn {
  type: TurnType.ACTIVATE;
}

export function toFEN(turn: Turn) {
  const {
    end: {row, col},
    after,
  } = turn;
  const file = (col + 10).toString(36);
  const rank = after.ranks - row;

  switch (turn.type) {
    case TurnType.MOVE:
      return moveToFen(turn as Move);
    case TurnType.CASTLE:
      return (turn as Castle).kingside ? 'O-O' : 'O-O-O';
    case TurnType.PROMOTE:
      return `${moveToFen({
        ...turn,
        type: TurnType.MOVE,
      } as Move)}=${turn.to.toFEN()}`;
    case TurnType.DROP:
      return `${turn.piece.toFEN()}@${file}${rank}`;
    case TurnType.ACTIVATE:
      return `@${file}${rank}`;
    default:
      return '?';
  }
}

export function toEndSquare(state: BoardState, turn: Turn): Square | undefined {
  return state.getSquare(turn.end.row, turn.end.col);
}

function moveToFen(move: Move): string {
  const {type, piece, start, end, before, after, captured} = move;
  const endFile = (end.col + 10).toString(36);
  const endRank = after.ranks - end.row;
  const startFile = (start.col + 10).toString(36);
  const startRank = after.ranks - start.row;
  const isCapture = !!captured;

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
      // TODO: pass in game so we can use legalMovesFrom
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
