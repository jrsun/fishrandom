const NotImplementedError = Error('not implemented');
const PAWN_HOME_RANK = 1;

enum Color {
  WHITE = 'white',
  BLACK = 'black',
  OTHER = 'other',
}

export const DISCONNECT_TIMEOUT_SECONDS = 30;
export const FIRST_MOVE_ABORT_SECONDS = 15;

/** UI */
export const ROULETTE_SECONDS = 5;

export function getOpponent(color: Color) {
  return color === Color.WHITE ? Color.BLACK : Color.WHITE;
}

export enum RoomAction {
  OFFER_DRAW = 'offer-draw',
  CLAIM_DRAW = 'claim-draw',
  ABORT = 'abort',
  RESIGN = 'resign',
}

export {
  NotImplementedError,
  PAWN_HOME_RANK,
  Color,
};