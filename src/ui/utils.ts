import { Piece } from "../chess/piece";
import Square from "../chess/square";

export enum SelectEventType {
  PIECE = 'piece-selected-event',
  PROMOTION = 'promotion-event'
}

export interface SelectEventDetail {
  piece?: Piece,
  square?: Square,
}

export function selectPieceEvent(piece?: Piece, square?: Square
): SelectEventDetail {
  return {piece, square};
}