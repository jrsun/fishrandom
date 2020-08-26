import {Game, GameEventType, GameEventName} from '../game';
import {BoardState, generateStartState, squaresFromPos, Phase} from '../state';
import {Move, Turn, TurnType} from '../turn';
import {Color} from '../const';
import Square from '../square';
import {randomChoice} from '../../utils';
import {Piece, King, Rook, Pawn, Knight, Bishop, Queen} from '../piece';

const backRank = [0, 1, 2, 3, 4, 5, 6, 7]
  .map((col) => [
    {row: 0, col},
    {row: 7, col},
  ])
  .flat();

export class Prechess extends Game {
  name = 'Prechess';
  constructor(isServer: boolean) {
    super(
      isServer,
      new BoardState(genInitial().squares, Color.WHITE, {
        [Color.WHITE]: [
          new Knight(Color.WHITE),
          new Knight(Color.WHITE),
          new Bishop(Color.WHITE),
          new Bishop(Color.WHITE),
          new Rook(Color.WHITE),
          new Rook(Color.WHITE),
          new Queen(Color.WHITE),
          new King(Color.WHITE),
        ],
        [Color.BLACK]: [
          new Knight(Color.BLACK),
          new Knight(Color.BLACK),
          new Bishop(Color.BLACK),
          new Bishop(Color.BLACK),
          new Rook(Color.BLACK),
          new Rook(Color.BLACK),
          new Queen(Color.BLACK),
          new King(Color.BLACK),
        ],
      }).setPhase(Phase.PRE)
    );
  }
  canDrop = true;

  onConnect() {
    if (this.eventHandler) {
      if (this.state.extra.phase === Phase.PRE) {
        this.eventHandler({
          type: GameEventType.On,
          name: GameEventName.Highlight,
          pairs: backRank,
        });
      }
    }
  }
  winCondition(color: Color, state: BoardState): boolean {
    if (this.state.extra.phase === Phase.PRE) return false;
    return super.winCondition(color, state);
  }
  modifyTurn(turn: Turn): Turn {
    if (!this.isServer) return turn;

    if (this.turnHistory.length + 1 === 16) {
      if (this.eventHandler) {
        this.eventHandler({
          type: GameEventType.Off,
          name: GameEventName.Highlight,
          pairs: backRank,
        });
      }
      return {
        ...turn,
        after: BoardState.copy(turn.after).setPhase(Phase.NORMAL),
      };
    }
    return turn;
  }
  validateTurn(color: Color, turn: Turn): boolean {
    if (!super.validateTurn(color, turn)) return false;
    const isDrop = turn.type === TurnType.DROP;
    const isPre = this.state.extra.phase === Phase.PRE;
    const validDropRow = color === Color.WHITE ? 7 : 0;
    return (
      (isDrop && isPre && turn.end.row === validDropRow) || (!isDrop && !isPre)
    );
  }
}

function genInitial(): BoardState {
  const piecePositions = {
    1: {},
    6: {},
  };

  for (let col = 0; col < 8; col++) {
    piecePositions[1][col] = new Pawn(Color.BLACK);
    piecePositions[6][col] = new Pawn(Color.WHITE);
  }

  return new BoardState(squaresFromPos(piecePositions), Color.WHITE, {});
}
