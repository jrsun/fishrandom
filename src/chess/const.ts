interface Pair {
  row: number;
  col: number;
}

const SQUARE_SIZE = 50;

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
}

enum MoveType {
  MOVE = 'move',
  CASTLE = 'castle',
}

export {
  SQUARE_SIZE,
  Pair,
  equals,
  dedup,
  hash,
  unhash,
  NotImplementedError,
  PAWN_HOME_RANK,
  Color,
  MoveType,
};
