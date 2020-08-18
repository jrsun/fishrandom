import {Classic} from './classic';
import {Chess960, Chess921600} from './960';
import {Game} from '../game';
import {Knightmate} from './knightmate';
import {Atomic} from './atomic';
import {Horde} from './horde';
import {Dark, Dark2r} from './dark';
import {Hiddenqueen} from './hiddenqueen';
import {Bario} from './bario';
import {Grasshopper} from './grasshopper';
import {Pocketknight} from './pocketknight';
import {Secretbomber} from './secretbomber';
import {Maharaja} from './maharaja';
import {Test} from './test';
import {randomChoice} from '../../utils';

export const VARIANTS: {[name: string]: typeof Game} = {
  Atomic,
  Chess960,
  Classic,
  Bario,
  Knightmate,
  Horde,
  Hiddenqueen,
  Grasshopper,
  Dark,
  Dark2r,
  Pocketknight,
  Test,
  Secretbomber,
  Maharaja,
  Chess921600,
};

export const RANDOM_VARIANTS: {[name: string]: typeof Game} = {
  Atomic,
  Bario,
  Knightmate,
  Horde,
  Hiddenqueen,
  Grasshopper,
  Dark,
  Dark2r,
  Pocketknight,
  Secretbomber,
  Maharaja,
  Chess921600,
  Chess960,
};

export function Random(...except: string[]): typeof Game {
  if (except) {
    return VARIANTS[randomChoice(Object.keys(RANDOM_VARIANTS).filter(
      name => !except.includes(name)
    ))];
  }
  return VARIANTS[randomChoice(Object.keys(RANDOM_VARIANTS))];
}

export {
  Atomic,
  Chess960,
  Bario,
  Pocketknight,
  Classic,
  Knightmate,
  Horde,
  Hiddenqueen,
  Grasshopper,
  Dark,
  Dark2r,
  Secretbomber,
  Test,
  Maharaja,
  Chess921600,
};
