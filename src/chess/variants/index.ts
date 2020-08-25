import {Classic} from './classic';
import {Chess960, Chess921600} from './960';
import {Game} from '../game';
import {Knightmate} from './knightmate';
import {Atomic} from './atomic';
import {Horde} from './horde';
import {Dark, Dark2r} from './dark';
import {Hiddenqueen} from './hiddenqueen';
import {Royalpawn} from './royalpawn';
import {Chigorin} from './chigorin';
import {Bario} from './bario';
import {Grasshopper} from './grasshopper';
import {Pocketknight} from './pocketknight';
import {Prechess} from './prechess';
import {Stealthbomber} from './stealthbomber';
import {Maharaja} from './maharaja';
import {Football} from './football';
import {Test} from './test';
import {Pieceeater} from './pieceeater';
import {randomChoice} from '../../utils';

export const VARIANTS: {[name: string]: typeof Game} = {
  Atomic,
  Chess960,
  Chigorin,
  Classic,
  Bario,
  Knightmate,
  Pieceeater,
  Football,
  Royalpawn,
  Horde,
  Hiddenqueen,
  Grasshopper,
  Dark,
  Dark2r,
  Pocketknight,
  Test,
  Stealthbomber,
  Maharaja,
  Chess921600,
  Prechess,
};

export const RANDOM_VARIANTS: {[name: string]: typeof Game} = {
  Atomic,
  Bario,
  Chigorin,
  Knightmate,
  Horde,
  Hiddenqueen,
  Royalpawn,
  Grasshopper,
  Dark,
  Dark2r,
  Pocketknight,
  Stealthbomber,
  Maharaja,
  Chess921600,
  Chess960,
  Pieceeater,
  Football,
  // Dice Chess,
  Prechess,
  // Loser's Chess
  // Intrigue
  // Synchrone
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
  Chess960,
  Bario,
  Pocketknight,
  Royalpawn,
  Classic,
  Knightmate,
  Pieceeater,
  Horde,
  Hiddenqueen,
  Grasshopper,
  Dark,
  Dark2r,
  Stealthbomber,
  Test,
  Maharaja,
  Chess921600,
  Atomic,
  Football,
  Chigorin,
  Prechess,
};
