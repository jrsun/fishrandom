import { generateInitialWithGobbler, Elephant } from './pieceeater';
import { Dark } from '.';
import { Turn } from '../turn';
import { Color } from '../const';

export class Darkgobbler extends Dark {
  name = 'Darkgobbler'
  constructor(isServer: boolean) {
    super(isServer, generateInitialWithGobbler());
  }
  cpuTurn(): Turn | undefined {
    const square = this.state.squares
      .flat()
      .filter((square) => square.occupant instanceof Elephant)[0];
    if (!square) return;
    const elephant = square.occupant as Elephant;
    if (!elephant) return;
    return elephant.move(square.row, square.col, this.state, this.turnHistory);
  }
  validateTurn(color: Color, turn: Turn): boolean {
    if (turn.captured instanceof Elephant) return false;
    return super.validateTurn(color, turn);
  }
}