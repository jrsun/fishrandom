const SQUARE_SIZE = 50;
function equals(a, b) {
    return a.row === b.row && a.col === b.col;
}
function dedup(l) {
    const m = {};
    for (const p of l) {
        m[p.row + ',' + p.col] = true;
    }
    return Object.keys(m).map((s) => ({
        row: parseInt(s.split(',')[0]),
        col: parseInt(s.split(',')[1]),
    }));
}
function hash(p) {
    return p.row + ',' + p.col;
}
function unhash(s) {
    return { row: parseInt(s.split(',')[0]), col: parseInt(s.split(',')[1]) };
}
const NotImplementedError = Error('not implemented');
const PAWN_HOME_RANK = 1;
var Color;
(function (Color) {
    Color["WHITE"] = "white";
    Color["BLACK"] = "black";
})(Color || (Color = {}));
var MoveType;
(function (MoveType) {
    MoveType["MOVE"] = "move";
    MoveType["CASTLE"] = "castle";
    MoveType["ENPASSANT"] = "enpassant";
})(MoveType || (MoveType = {}));
export { SQUARE_SIZE, equals, dedup, hash, unhash, NotImplementedError, PAWN_HOME_RANK, Color, MoveType, };
//# sourceMappingURL=const.js.map