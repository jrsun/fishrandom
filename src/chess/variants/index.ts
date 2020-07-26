import {Classic} from './classic';
import {Chess960} from './960';
import {Game} from '../game';

interface VariantInfo {
  game: typeof Game;
  rules: any;
}

export const VARIANTS: {[name: string]: VariantInfo} = {
  [Chess960.name]: {
    game: Chess960,
    rules: `Starting position of the pieces on the players' home ranks is
      randomized.
      <!-- <div class="examples"><img src="../img/variants/960.png"/></div> -->
      <ul>
        <li>Orthodox rules.</li>
        <li>Checkmate to win.</li>
      </ul>`,
  },
  [Classic.name]: {game: Classic, rules: `The classic game.`},
};
