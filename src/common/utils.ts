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