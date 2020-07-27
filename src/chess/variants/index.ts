import {Classic} from './classic';
import {Chess960} from './960';
import {Game} from '../game';
import {Knightmate} from './knightmate';
import {Horde} from './horde';

export const VARIANTS: {[name: string]: typeof Game} = {
  [Chess960.name]: Chess960,
  [Classic.name]: Classic,
  [Knightmate.name]: Knightmate,
  [Horde.name]: Horde,
};

export {Chess960, Classic, Knightmate, Horde};
