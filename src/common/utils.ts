export function randomInt(...args) {
  if (args.length < 1 || args.length > 2) {
    throw new Error('expected 1 or 2 args');
  }
  const min = args.length === 2 ? args[0] : 0;
  const max = args.length === 2 ? args[1] : args[0];
  return min + Math.floor(Math.random() * (max - min));
}

export function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(arr.length)];
}

export function cartesian<T>(...allEntries: T[][]): T[][] {
  return allEntries.reduce<T[][]>(
    (results, entries) =>
      results
        .map((result) => entries.map((entry) => result.concat([entry])))
        .reduce((subResults, result) => subResults.concat(result), []),
    [[]]
  );
}

export function zip<T>(a: T[], b: T[]): [T, T][] {
  const longer = a.length >= b.length ? a : b;
  const shorter = longer === a ? b : a;
  return longer.map((el, i) => {
    return [el, shorter[i]];
  })
}

export function pluralize(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : noun + 's'}`;
}

// Deterministically map a string to a number between 0 and modulus-1
export function rollingHash(s: string, modulus: number): number {
  const sum = [...s]
    .map((_, i) => s.charCodeAt(i))
    .reduce((a, b) => a + b, 0);
  return sum % modulus;
}