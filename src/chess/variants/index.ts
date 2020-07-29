import {Classic} from './classic';
import {Chess960} from './960';
import {Game} from '../game';
import {Knightmate} from './knightmate';
import {Horde} from './horde';
import {Hiddenqueen} from './hiddenqueen';
import {randomChoice} from '../../utils';

export const VARIANTS: {[name: string]: typeof Game} = {
  [Chess960.name]: Chess960,
  [Classic.name]: Classic,
  [Knightmate.name]: Knightmate,
  [Horde.name]: Horde,
  [Hiddenqueen.name]: Hiddenqueen,
};

export function Random(): typeof Game {
  return VARIANTS[randomChoice(Object.keys(VARIANTS))];
}

export {Chess960, Classic, Knightmate, Horde, Hiddenqueen};
