import {Game} from '../game';
import {Rook, Knight, Bishop, King, Piece, Queen, Pawn} from '../piece';
import {Color, getOpponent, equals} from '../const';
import {BoardState, generateStartState} from '../state';
import Square from '../square';
import {randomChoice, cartesian} from '../../utils';
import {Move, TurnType, Turn} from '../turn';
import {dedup, Pair} from '../pair';

export class Pieceeater extends Game {
  name = 'Pieceeater';
  canDrop = true;
  constructor(isServer: boolean) {
    super(isServer, generateInitial());
  }
  cpuTurn(): Turn|undefined {
    const square = this.state.squares.flat().filter(square => square.occupant instanceof Elephant)[0];
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

export class Elephant extends Piece {
  name = 'Elephant';
  moves = [
    {row: 1, col: 1},
    {row: 1, col: 0},
  ];
  get img(): string {
    return 'Chess_ert45.svg';
  }
  move(row: number, col: number, state: BoardState, turnHistory: Turn[]): Move|undefined {
    const dirs: [number, number][] = 
      cartesian([-1, 0, 1], [-1, 0, 1]).filter(
        ([r, c]) => r !== 0 || c !== 0
      ) as [number, number][];
    const kingSquares = state.squares.flat()
      .filter(square => square.occupant instanceof King);
    const squares = dirs.map(([r, c]) => state.getSquare(row+r, col+c))
      .filter(square =>
        !!square &&
        // Must not be adjacent/diagonal to a king
        !kingSquares.some(ks =>
          Math.max(
            Math.abs(ks.row - square.row),
            Math.abs(ks.col - square.col),
          ) <= 1
        )) as Square[];
    const lastTurn = turnHistory[turnHistory.length-1];
    let end: Pair = randomChoice(squares);

    if (lastTurn && squares.some(square => equals(square, lastTurn.end))) {
      end = lastTurn.end;
    }
    if (!end) return;
    return {
      type: TurnType.MOVE,
      captured: state.getSquare(end.row, end.col)?.occupant,
      start: {row, col},
      before: state,
      after: BoardState.copy(state)
        .empty(row, col)
        .place(this, end.row, end.col),
      end,
      piece: this,
    };
  }

  static freeze(p: Elephant): object {
    return {
      _class: 'Elephant',
      n: p.name,
    };
  }
  static thaw(o): Elephant {
    return new Elephant(Color.OTHER);
  }
}

function generateInitial(): BoardState {
  const state = generateStartState();
  const squares = state.squares;
  for (let col = 0; col < 8; col++) {
    squares[1][col].place(new Pawn(Color.BLACK));
    squares[6][col].place(new Pawn(Color.WHITE));
  }
  squares[4][3].place(new Elephant(Color.OTHER));

  const banks = {
    [Color.WHITE]: [new Pawn(Color.WHITE)],
    [Color.BLACK]: [new Pawn(Color.BLACK)],
  }
  return new BoardState(squares, Color.WHITE, banks);
}
