import {Piece} from '../chess/piece';
import Square from '../chess/square';

export enum SelectEventType {
  PIECE_TOGGLE = 'piece-toggle-event',
  PIECE_ON = 'piece-on-event',
  PIECE_OFF = 'piece-off-event',
  PROMOTION = 'promotion-event',
}

export interface SelectEventDetail {
  piece?: Piece;
  square?: Square;
}

export function selectPieceEvent(
  piece?: Piece,
  square?: Square
): SelectEventDetail {
  return {piece, square};
}

export const SQUARE_SIZE = Math.min(50, document.body.clientWidth / 8); //px