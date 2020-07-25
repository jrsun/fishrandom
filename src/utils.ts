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
