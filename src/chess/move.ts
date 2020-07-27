import {Pair, Color, MoveType} from './const';
import {Piece, Pawn} from './piece';
import BoardState from './state';

export interface Move {
  before: BoardState;
  after: BoardState;
  piece: Piece;
  start: Pair;
  end: Pair;
  isCapture: boolean;
  captured?: Piece;
  color: Color;
  type: string; // 'move', 'castle', etc.
}

export function toAlg(move: Move) {
  const {type, piece, start, end, before, after, isCapture} = move;
  if (type === MoveType.CASTLE) {
    return 'O-O'; // TODO: Queenside
  }
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
  const ambiguousSquares = after.squares.flat()
    .filter(square => {
      const occupant = square.occupant;
      return !!occupant && occupant.color === piece.color &&
      occupant.name === piece.name && occupant.legalMoves(
        square.row,
        square.col,
        before, 
        [], // en passant would never be ambiguous
      ).some(move => move.end.row === end.row && move.end.col === end.col);
    });
  let actor = piece.toFEN();
  if (ambiguousSquares.length) {
    if (!ambiguousSquares.some(amb => amb.col === start.col)) {
      // file disambiguates
      actor += startFile;
    } else if (!ambiguousSquares.some(amb => amb.row === start.row)) {
      // rank disambiguates
      actor += startRank;
    } else {
      // both file and rank necessary
      actor += `${startFile}${startRank}`;
    }
  }
  return `${actor}${capture}${endFile}${endRank}`;
}