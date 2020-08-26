export function randomInt(...args) {
  if (args.length < 1 || args.length > 2) {
    throw new Error('expected 1 or 2 args');
  }
  const min = args.length === 2 ? args[0] : 0;
  const max = args.length === 2 ? args[1] : args[0];
  return min + Math.floor(Math.random() * (max - min));
}

export function memecase(s: string) {
  return s.toUpperCase().split('').join(' ');
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
export function uuidToName(s: string): string {
  return (
    s
      .split('|')?.[1]
      ?.replace(/[^0-9A-Z]+/gi, '')
      .toLocaleLowerCase() ?? 'fish'
  );
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromx,
  fromy,
  tox,
  toy
) {
  var headlen = 5;
  var angle = Math.atan2(toy - fromy, tox - fromx);
  const color = '#CC5757';

  //starting path of the arrow from the start square to the end square and drawing the stroke
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.strokeStyle = color;
  ctx.lineWidth = 14;
  // ctx.lineCap = 'round';
  ctx.stroke();

  //starting a new path from the head of the arrow to one of the sides of the point
  ctx.beginPath();
  ctx.moveTo(tox, toy);
  ctx.lineTo(
    tox - headlen * Math.cos(angle - Math.PI / 5),
    toy - headlen * Math.sin(angle - Math.PI / 5)
  );

  //path from the side point of the arrow, to the other side point
  ctx.lineTo(
    tox - headlen * Math.cos(angle + Math.PI / 5),
    toy - headlen * Math.sin(angle + Math.PI / 5)
  );

  //path from the side point back to the tip of the arrow, and then again to the opposite side point
  ctx.lineTo(tox, toy);
  ctx.lineTo(
    tox - headlen * Math.cos(angle - Math.PI / 5),
    toy - headlen * Math.sin(angle - Math.PI / 5)
  );

  //draws the paths created above
  ctx.strokeStyle = color;

  ctx.lineWidth = 14;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();
}
