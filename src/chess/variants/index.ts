import {Classic} from './classic';
import {html, TemplateResult} from 'lit-element';
import {Chess960} from './960';
import {Game} from '../game';

interface VariantInfo {
  game: typeof Game;
  rules: TemplateResult;
}

export const VARIANTS: {[name: string]: VariantInfo} = {
  [Chess960.name]: {
    game: Chess960,
    rules: html`Starting position of the pieces on the players' home ranks is
      randomized.
      <!-- <div class="examples"><img src="../img/variants/960.png"/></div> -->
      <ul>
        <li>Orthodox rules.</li>
        <li>Checkmate to win.</li>
      </ul>`,
  },
  [Classic.name]: {game: Classic, rules: html`The classic game.`},
};
