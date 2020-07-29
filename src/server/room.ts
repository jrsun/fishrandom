import {Game} from '../chess/game';
import {randomChoice} from '../utils';
import {Move} from '../chess/move';
import {Color, getOpponent} from '../chess/const';
import {
  AppendMessage,
  replacer,
  ReplaceMessage,
  GameResult,
  GameOverMessage,
} from '../common/message';

// States progress from top to bottom within a room.
enum RoomState {
  WAITING = 'waiting',
  RULES = 'rules',
  PLAYING = 'playing',
  COMPLETED = 'completed',
}

interface PlayerInfo {
  uuid: string;
  color: Color;
  socket: WebSocket;
}

export class Room {
  // public
  game?: Game;

  p1: PlayerInfo;
  p2?: PlayerInfo;

  // protected
  state: RoomState;

  constructor(uuid: string, socket: WebSocket, state = RoomState.WAITING) {
    this.p1 = {
      uuid,
      socket,
      color: randomChoice([Color.WHITE, Color.BLACK]),
    };
  }

  p2Connect(uuid: string, socket: WebSocket) {
    this.p2 = {
      uuid,
      socket,
      color: getOpponent(this.p1.color),
    };
    this.state = RoomState.PLAYING; // RULES
  }

  handleMove(uuid: string, moveAttempt: Move) {
    if (!this.game || !this.p2) return;
    const player = this.p1.uuid === uuid ? this.p1 : this.p2;
    const opponent = player === this.p1 ? this.p2 : this.p1;

    const {
      start: {row: srow, col: scol},
      end: {row: drow, col: dcol},
    } = moveAttempt;
    const game = this.game;

    const piece = game.state.getSquare(srow, scol)?.occupant;
    if (!piece) {
      console.log('no piece at ', srow, scol);
      return;
    }
    console.log('%s: (%s, %s) -> (%s, %s)', piece.name, srow, scol, drow, dcol);

    const move = game.attemptMove(player.color, piece, srow, scol, drow, dcol);
    if (move) {
      // we should send the mover a `replaceState` and the opponent an
      // `appendState`
      const rm = JSON.stringify(
        {
          type: 'replaceState',
          move: {
            ...move,
            before: game.visibleState(move.before, player.color),
            after: game.visibleState(move.after, player.color),
          },
          state: game.visibleState(game.state, player.color),
        } as ReplaceMessage,
        replacer
      );
      const am = JSON.stringify(
        {
          type: 'appendState',
          move: {
            ...move,
            before: game.visibleState(move.before, opponent.color),
            after: game.visibleState(move.after, opponent.color),
          },
          state: game.visibleState(game.state, opponent.color),
        } as AppendMessage,
        replacer
      );

      player.socket.send(rm);
      opponent.socket.send(am);
    } else {
      console.log('bad move!');
      // const rm = JSON.stringify(
      //   {
      //     type: 'replaceState',
      //     move: game.moveHistory.length ? game.moveHistory[game.moveHistory.length-1] : null,
      //     state: game.visibleState(game.state, player.color)
      //   } as ReplaceMessage,
      //   replacer);
      // player.socket.send(rm);
    }
    if (game.winCondition(player.color)) {
      this.state = RoomState.COMPLETED;
      player.socket.send(
        JSON.stringify(
          {
            type: 'gameOver',
            stateHistory: this.game.stateHistory,
            moveHistory: this.game.moveHistory,
            result: GameResult.WIN,
          } as GameOverMessage,
          replacer
        )
      );
      opponent.socket.send(
        JSON.stringify(
          {
            type: 'gameOver',
            stateHistory: this.game.stateHistory,
            moveHistory: this.game.moveHistory,
            result: GameResult.LOSS,
          } as GameOverMessage,
          replacer
        )
      );
      player.socket.close();
      opponent.socket.close();
    }
  }
}
