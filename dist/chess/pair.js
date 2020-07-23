export function equals(a, b) {
    return a.row === b.row && a.col === b.col;
}
export function dedup(l) {
    const m = {};
    for (const p of l) {
        m[p.row + ',' + p.col] = true;
    }
    return Object.keys(m).map((s) => ({
        row: parseInt(s.split(',')[0]),
        col: parseInt(s.split(',')[1]),
    }));
}
//# sourceMappingURL=pair.js.map