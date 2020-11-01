import {Piece} from '../chess/piece';
import Square from '../chess/square';
import { rollingHash } from '../common/utils';

// Select events
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

// Events
export const SeekEventType = 'seek-game';
export const CancelSeekEventType = 'cancel-seek-game';

// Constants
export const LIST_OF_FISH = ['fish', 'trout', 'anchovy', 'cod', 'tilapia', 'salmon', 'snapper', 'tuna', 'carp'];
export const SQUARE_SIZE = Math.min(50, document.body.clientWidth / 8); //px

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromx,
  fromy,
  tox,
  toy
) {
  var headlen = 5;
  var angle = Math.atan2(toy - fromy, tox - fromx);
  const color = '#CC5757';

  //starting path of the arrow from the start square to the end square and drawing the stroke
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  // ctx.lineCap = 'round';
  ctx.stroke();

  //starting a new path from the head of the arrow to one of the sides of the point
  ctx.beginPath();
  ctx.moveTo(tox, toy);
  ctx.lineTo(
    tox - headlen * Math.cos(angle - Math.PI / 5),
    toy - headlen * Math.sin(angle - Math.PI / 5)
  );

  //path from the side point of the arrow, to the other side point
  ctx.lineTo(
    tox - headlen * Math.cos(angle + Math.PI / 5),
    toy - headlen * Math.sin(angle + Math.PI / 5)
  );

  //path from the side point back to the tip of the arrow, and then again to the opposite side point
  ctx.lineTo(tox, toy);
  ctx.lineTo(
    tox - headlen * Math.cos(angle - Math.PI / 5),
    toy - headlen * Math.sin(angle - Math.PI / 5)
  );

  //draws the paths created above
  ctx.strokeStyle = color;

  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
) {
  const color = '#CC5757';

  ctx.strokeStyle = color;
  ctx.lineWidth = 5;

  //starting path of the arrow from the start square to the end square and drawing the stroke
  ctx.beginPath();

  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.stroke();
}

// Avatar

const AVATAR_IMGS = [
  'goldfish.svg',
  'pufferfish.svg',
  'bluefish.svg',
  'shark.svg',
].map(s => '/img/avatar/' + s);

export function getAvatarImg(username?: string): string {
  if (!username) return '';

  const index = rollingHash(username, AVATAR_IMGS.length);

  return AVATAR_IMGS[index];
}