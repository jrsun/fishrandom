import {Classic} from './classic';
import {Chess960} from './960';
import {Game} from '../game';
import {Knightmate} from './knightmate';
import {Horde} from './horde';
import {Dark} from './dark';
import {Hiddenqueen} from './hiddenqueen';
import {Grasshopper} from './grasshopper';
import {Pocketknight} from './pocketknight';
import {Test} from './test';
import {randomChoice} from '../../utils';

export const VARIANTS: {[name: string]: typeof Game} = {
  Chess960,
  Classic,
  Knightmate,
  Horde,
  Hiddenqueen,
  Grasshopper,
  Dark,
  Pocketknight,
  Test,
};

const RANDOM_VARIANTS: {[name: string]: typeof Game} = {
  Knightmate,
  Horde,
  Hiddenqueen,
  Grasshopper,
  Dark,
  Pocketknight,
};

export function Random(): typeof Game {
  return VARIANTS[randomChoice(Object.keys(RANDOM_VARIANTS))];
}

export {
  Chess960,
  Pocketknight,
  Classic,
  Knightmate,
  Horde,
  Hiddenqueen,
  Grasshopper,
  Dark,
  Test,
};
