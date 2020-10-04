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
// import {Maharaja} from './maharaja';
import {Football} from './football';
import {Test} from './test';
import {Gobbler} from './pieceeater';
import {Shooting} from './rifle';
import {Amazonarmy} from './amazonarmy';
import {Losers} from './antichess';
import {Golemchess} from './golem';
import {Kungfu} from './kungfu';
import {Instagram} from './instagram';
import {Gaychess} from './gaychess';
import {Monster} from './monster';
import {Veto} from './veto';
import {Werewolf} from './werewolf';
import {Pawnside} from './pawnside';
import {Knightrider} from './knightrider';
import {Absorption} from './absorption';

import {randomChoice, zip} from '../../utils';

export const VARIANTS: {[name: string]: typeof Game} = {
  Atomic,
  Chess960,
  Chigorin,
  Classic,
  Bario,
  Knightmate,
  Gobbler,
  Football,
  Royalpawn,
  Horde,
  Hiddenqueen,
  Grasshopper,
  Dark,
  Dark2r,
  Pocketknight,
  // Test,
  Stealthbomber,
  // Maharaja,
  Chess921600,
  Prechess,
  Shooting,
  Amazonarmy,
  Losers,
  Golemchess,
  Kungfu,
  Instagram,
  Gaychess,
  Monster,
  Veto,
  Werewolf,
  Pawnside,
  Knightrider,
  Absorption,
};

export const RANDOM_VARIANTS: {[name: string]: typeof Game} = {
  Atomic,
  Bario,
  // Chigorin,
  Knightmate,
  Horde,
  Hiddenqueen,
  Royalpawn,
  Grasshopper,
  Dark,
  // Dark2r,
  // Pocketknight,
  Stealthbomber,
  // Chess921600,
  // Chess960,
  Gobbler,
  Football,
  Shooting,
  // Prechess,
  Amazonarmy,
  Losers,
  Golemchess,
  // Kungfu,
  // Instagram,
  Gaychess,
  Monster,
  Veto,
  Werewolf,
  Pawnside,
  Knightrider,
  Absorption,
};

// Takes two arrays of recently played variants ordered from most to least recent
// and returns a variant that minimizes staleness.
export function Random(recent: string[], recent2: string[]): typeof Game {
  const staleness: {[variant: string]: number} = {};
  for (const variant of Object.keys(RANDOM_VARIANTS)) {
    staleness[variant] = 0;
  }
  const recents = zip(recent, recent2);
  for (const [i, [v1, v2]] of recents.slice(0, SAVE_LAST_N_VARIANTS).entries()) {
    // recents is pairs of variants from most stale to least
    if (staleness[v1] !== undefined) {
      staleness[v1] = Math.max(staleness[v1] ?? 0, SAVE_LAST_N_VARIANTS - i);
    }
    if (staleness[v2] !== undefined) {
      staleness[v2] = Math.max(staleness[v2] ?? 0, SAVE_LAST_N_VARIANTS - i);
    }
  }
  let minStaleness = recent.length + 1;
  let possibleVariants: string[] = [];
  for (const [variant, s] of Object.entries(staleness)) {
    if (!(variant in RANDOM_VARIANTS)) continue;
    if (s === minStaleness) {
      possibleVariants.push(variant);
    } else if (s < minStaleness) {
      possibleVariants = [variant];
      minStaleness = s;
    }
  }
  return VARIANTS[randomChoice(possibleVariants)];
}
export const SAVE_LAST_N_VARIANTS = 10;


export {
  Losers,
  Chess960,
  Bario,
  Pocketknight,
  Royalpawn,
  Classic,
  Knightmate,
  Gobbler,
  Horde,
  Hiddenqueen,
  Grasshopper,
  Dark,
  Dark2r,
  Stealthbomber,
  Test,
  // Maharaja,
  Chess921600,
  Atomic,
  Football,
  Chigorin,
  Prechess,
  Shooting,
  Amazonarmy,
  Golemchess,
  Kungfu,
  Instagram,
  Gaychess,
  Monster,
  Veto,
  Werewolf,
  Pawnside,
  Knightrider,
  Absorption,
};
