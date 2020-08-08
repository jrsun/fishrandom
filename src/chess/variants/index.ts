import {Classic} from './classic';
import {Chess960} from './960';
import {Game} from '../game';
import {Knightmate} from './knightmate';
import {Horde} from './horde';
import {Dark} from './dark';
import {Hiddenqueen} from './hiddenqueen';
import {Grasshopper} from './grasshopper';
import {randomChoice} from '../../utils';

export const VARIANTS: {[name: string]: typeof Game} = {
  Chess960,
  Classic,
  Knightmate,
  Horde,
  Hiddenqueen,
  Grasshopper,
  Dark,
};

export function Random(): typeof Game {
  return VARIANTS[randomChoice(Object.keys(VARIANTS))];
}

export {Chess960, Classic, Knightmate, Horde, Hiddenqueen, Grasshopper, Dark};
