interface Pair {
  row: number;
  col: number;
}

function equals(a: Pair, b: Pair): boolean {
  return a.row === b.row && a.col === b.col;
}

function dedup(l: Pair[]): Pair[] {
  const m: {[key: string]: boolean} = {};
  for (const p of l) {
    m[p.row + ',' + p.col] = true;
  }
  return Object.keys(m).map((s) => ({
    row: parseInt(s.split(',')[0]),
    col: parseInt(s.split(',')[1]),
  }));
}

function hash(p: Pair): string {
  return p.row + ',' + p.col;
}

function unhash(s: string): Pair {
  return {row: parseInt(s.split(',')[0]), col: parseInt(s.split(',')[1])};
}

const NotImplementedError = Error('not implemented');
const PAWN_HOME_RANK = 1;

enum Color {
  WHITE = 'white',
  BLACK = 'black',
  OTHER = 'other',
}

/** UI */
export const ROULETTE_SECONDS = 5;

export function getOpponent(color: Color) {
  return color === Color.WHITE ? Color.BLACK : Color.WHITE;
}

export {
  Pair,
  equals,
  dedup,
  hash,
  unhash,
  NotImplementedError,
  PAWN_HOME_RANK,
  Color,
};
