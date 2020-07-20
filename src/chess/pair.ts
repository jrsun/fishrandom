export interface Pair {
    row: number;
    col: number;
}

export function equals(a: Pair, b: Pair): boolean {
    return a.row === b.row && a.col === b.col;
}

export function dedup(l: Pair[]): Pair[] {
    const m: {[key: string]: boolean} = {};
    for (const p of l) {
        m[p.row + ',' + p.col] = true;
    }
    return Object.keys(m).map(s => ({row: parseInt(s.split(',')[0]), col: parseInt(s.split(',')[1])}));
}
