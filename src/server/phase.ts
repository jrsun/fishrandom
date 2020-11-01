import log from 'log';

import { Room } from "./room";
import { Message, sendMessage, PhaseEnum } from "../common/message";
import { RoomPlayer, toPlayerInfo, addResult } from "./player";
import { Game, GameResultType, GameResult } from "../chess/game";
import { Turn, TurnType, toFEN } from '../chess/turn';
import { saveRoom, updateScore, savePlayer, deleteRoom } from '../db';
import { RoomAction, Color, FIRST_MOVE_ABORT_SECONDS } from '../chess/const';
import { PUBLIC_PLAY_SECONDS, ELO_K, RULES_SECONDS } from './const';

export class Phase {
  game: Game;
  name: PhaseEnum;
  constructor(public room: Room) {
    this.game = room.game;
  }
  handleMessage: (uuid: string, m: Message) => void;
  advance: () => void;

  protected getPlayer = (uuid: string): RoomPlayer|undefined => {
    return this.room.uuidToRoomPlayer(uuid);
  }
  protected getOpponent = (uuid: string): RoomPlayer|undefined => {
    const {room} = this;
    const me = room.uuidToRoomPlayer(uuid);
    return me === room.p1 ? room.p2 : room.p1;
  }
}

export class RulesPhase extends Phase {
  name = PhaseEnum.RULES;
  skips: Set<string>; // uuids that have requested a skip
  timerInterval: any;
  secondsRemaining: number;

  constructor(room: Room) {
    super(room);

    this.skips = new Set<string>();
    this.secondsRemaining = RULES_SECONDS;
    this.timerInterval = setInterval(() => {
      this.secondsRemaining -= 1;
      if (this.secondsRemaining <= 0) {
        this.advance();
      }
    }, 1000);
  }
  handleMessage = (uuid: string, m: Message) => {
    switch (m.type) {
      case 'skipRules':
        this.skips.add(uuid);
        if (this.skips.size === 2) {
          this.advance();
        }
        break;
    }
  }
  advance = () => {
    clearInterval(this.timerInterval);
    this.room.setPhase(PhaseEnum.PLAYING);
  }
}

export class PlayingPhase extends Phase {
  static INCREMENT_MS = 5 * 1000;

  name = PhaseEnum.PLAYING;
  timerInterval: any;

  constructor(room: Room) {
    super(room);
    // set interval
    this.timerInterval = setInterval(() => {
      const me =
        this.game.state.whoseTurn === room.p1.color ? room.p1 : room.p2;
      const opponent = me === room.p1 ? room.p2 : room.p1;
      me.time -= 1000;
      if (
        (
          // I'm letting my time tick as white, opponent can abort
          opponent.color === Color.BLACK
          && this.game.turnHistory.length === 0
          && (me.time / 1000) < (PUBLIC_PLAY_SECONDS - FIRST_MOVE_ABORT_SECONDS)
        ) || (
          // Opponent has made a move as white, I'm letting my time tick as
          // black, opponent can abort.
          opponent.color === Color.WHITE
          && this.game.turnHistory.some(turn => turn.piece.color === Color.WHITE)
          && !this.game.turnHistory.some(turn => turn.piece.color === Color.BLACK)
          && (me.time / 1000) < (PUBLIC_PLAY_SECONDS - FIRST_MOVE_ABORT_SECONDS)
        )
      ) {
        opponent.allowedActions.add(RoomAction.ABORT);

        sendMessage(opponent.player.socket, {
          type: 'allowedActions',
          actions: Array.from(opponent.allowedActions),
        });
      }
      if (me.time <= 0) {
        log.get(me.name).notice('ran out of time');
        this.wins(opponent.player.uuid, {type: GameResultType.WIN, reason: 'timeout'});
      }
    }, 1000);
  }
  advance = () => {
    clearInterval(this.timerInterval);
    this.room.setPhase(PhaseEnum.DONE);
  };
  handleMessage = (uuid: string, m: Message) => {
    switch (m.type) {
      case 'turn':
        this.handleTurn(uuid, m.turn);
        break;
      case 'roomAction':
        // Certain actions are only allowed during playing phase
        this.handleAction(uuid, m.action);
        break;
      case 'getAllowed':
        // Certain actions are only allowed during playing phase
        break;
    }
  }
  handleTurn = async (uuid: string, turnAttempt: Turn) => {
    const {game, room} = this;
    // Turns only allowed during playing
    const me = this.getPlayer(uuid);
    const opponent = this.getOpponent(uuid);
    if (!me || !opponent) {
      log.warn('in turn, someone used wrong uuid', uuid, room.p1.name);
      return;
    }
    let turn: Turn | undefined;

    const {
      end: {row: drow, col: dcol},
    } = turnAttempt;

    switch (turnAttempt.type) {
      case TurnType.MOVE:
        const {
          start: {row: srow, col: scol},
        } = turnAttempt;

        const piece = game.state.getSquare(srow, scol)?.occupant;
        if (!piece) {
          log.get(me.name).warn('no piece at ', srow, scol);
          return;
        }

        turn = game.move(me.color, piece, srow, scol, drow, dcol);
        break;
      case TurnType.CASTLE:
        const {
          start: {row: crow, col: ccol},
        } = turnAttempt;
        turn = game.castle(me.color, crow, ccol, turnAttempt.kingside);
        break;
      case TurnType.DROP:
        const {piece: droppedPiece} = turnAttempt;
        turn = game.drop(me.color, droppedPiece, drow, dcol);
        break;
      case TurnType.PROMOTE:
        const {
          to,
          piece: promoter,
          start: {row: prow, col: pcol},
        } = turnAttempt;
        turn = game.promote(me.color, promoter, to, prow, pcol, drow, dcol);
        break;
      case TurnType.ACTIVATE:
        const apiece = game.state.getSquare(
          turnAttempt.end.row,
          turnAttempt.end.col
        )?.occupant;
        turn = game.activate(
          me.color,
          turnAttempt.end.row,
          turnAttempt.end.col,
          apiece
        );
        break;
      default:
        throw new Error(`unimplemented turn type ${turnAttempt.type}`);
    }

    turn = game.execute(me.color, turn);
    if (!turn) {
      sendMessage(me.player.socket, {type: 'undo'});
      log.get(me.name).warn('submitted an invalid move, undoing!');
      return;
    }
    log.get(me.name).notice(toFEN(turn));
    saveRoom(room);

    me.time += PlayingPhase.INCREMENT_MS;

    const rm = {
      type: 'replaceState' as const,
      turn: {
        // mostly a no-op on turn, but useful in variants
        ...game.visibleTurn(turn, me.color),
        // state should be universal
        before: game.visibleState(turn.before, me.color),
        after: game.visibleState(turn.after, me.color),
      },
    };
    const am = {
      type: 'appendState' as const,
      turn: {
        ...game.visibleTurn(turn, opponent.color),
        before: game.visibleState(turn.before, opponent.color),
        after: game.visibleState(turn.after, opponent.color),
      },
    };

    await sendMessage(me.player.socket, rm);
    await sendMessage(opponent.player.socket, am);
    room.sendTimers();
    room.resetAllowedActions(room.p1);
    room.resetAllowedActions(room.p2);

    if (this.checkIfOver(me)) return;

    // BUG: Don't let people move before cpuTurn
    this.takeCpuTurn(me);
  }

  takeCpuTurn(justMovedPlayer: RoomPlayer) {
    const {room, game} = this;
    const {p1, p2} = room;

    let turn = game.cpuTurn();
    if (!turn) return;
    turn = game.modifyTurn(turn);
    if (!turn) return;

    game.state = turn.after;
    game.turnHistory.push(turn);
    game.stateHistory.push(turn.after);
    saveRoom(room);

    const am1 = {
      type: 'appendState' as const,
      turn: {
        ...game.visibleTurn(turn, p1.color),
        before: game.visibleState(turn.before, p1.color),
        after: game.visibleState(turn.after, p1.color),
      },
    };
    const am2 = {
      type: 'appendState' as const,
      turn: {
        ...game.visibleTurn(turn, p2.color),
        before: game.visibleState(turn.before, p2.color),
        after: game.visibleState(turn.after, p2.color),
      },
    };

    sendMessage(p1.player.socket, am1);
    sendMessage(p2.player.socket, am2);
    this.checkIfOver(justMovedPlayer);
  }

  // Action handlers

  handleAction(uuid: string, action: RoomAction) {
    const me = this.getPlayer(uuid);
    if (!me) {
      log.warn('no such player in room', uuid);
      return;
    }
    // Check if action is allowed
    if (!(me.allowedActions.has(action))) {
      log.get(me.name).warn('attempted illegal action', action);
      return;
    }
    log.get(me.name).notice('executed room action', action);
    if (action === RoomAction.RESIGN) {
      this.handleResign(uuid);
    } else if (action === RoomAction.OFFER_DRAW) {
      this.handleOfferDraw(uuid);
    } else if (action === RoomAction.CLAIM_DRAW) {
      this.handleDraw(uuid);
    } else if (action === RoomAction.ABORT) {
      this.handleAbort();
    }
  }

  private handleResign(uuid: string) {
    const opponent = this.getOpponent(uuid);
    if (!opponent) {
      log.warn('no such opponent to resign to', uuid);
      return;
    }
    return this.wins(
      opponent.player.uuid,
      {
        type: GameResultType.WIN,
        reason: 'resignation',
      }
    );
  }

  private handleOfferDraw(uuid: string) {
    const opponent = this.getOpponent(uuid);
    if (!opponent) return;

    // Opponent cannot offer draw if you've already offered
    if (!opponent.allowedActions.has(RoomAction.CLAIM_DRAW)) {
      opponent.allowedActions.delete(RoomAction.OFFER_DRAW);
      opponent.allowedActions.add(RoomAction.CLAIM_DRAW);
      sendMessage(opponent.player.socket, {
        type: 'allowedActions',
        actions: Array.from(opponent.allowedActions),
      });
    }
  }

  private handleDraw(uuid: string) {
    return this.draws({type: GameResultType.DRAW, reason: 'agreement'});
  }

  private handleAbort() {
    const {room} = this;
    // TODO: limit this
    const gom = {
      type: 'gameOver' as const,
      stateHistory: this.game.stateHistory,
      turnHistory: this.game.turnHistory,
      result: {
        type: GameResultType.ABORTED,
      }
    };
    sendMessage(room.p1.player.socket, {
      ...gom,
      player: toPlayerInfo(room.p1.player),
      opponent: toPlayerInfo(room.p2.player),
    });
    sendMessage(room.p2.player.socket, {
      ...gom,
      player: toPlayerInfo(room.p2.player),
      opponent: toPlayerInfo(room.p1.player),
    });
    this.end();
  }

  // Game end

  checkIfOver(me: RoomPlayer): boolean {
    // player is who just moved
    const {game, room} = this;

    const opponent = this.getOpponent(me.player.uuid);
    if (!me || !opponent) {
      return false;
    }
    const playerWin = game.winCondition(me.color, game.state);
    const opponentWin = game.winCondition(opponent.color, game.state);
    if (playerWin) {
      this.wins(me.player.uuid, playerWin);
      return true;
    } else if (opponentWin) {
      this.wins(opponent.player.uuid, opponentWin);
      return true;
    }
    // Whoever's turn it is got stalemated
    const whoseTurn = game.state.whoseTurn;
    const drawResult = game.drawCondition(whoseTurn, game.state);
    if (drawResult) {
      this.draws(drawResult);
      return true;
    }
    return false;
  }

  wins(uuid: string, result: GameResult) {
    const {room, game} = this;
    const me = this.getPlayer(uuid);
    const opponent = this.getOpponent(uuid);
    if (!me || !opponent) {
      log.warn('Someone sent the wrong uuid', uuid, me?.player.uuid, opponent?.player.uuid);
      return;
    }

    const gom = {
      type: 'gameOver' as const,
      stateHistory: game.stateHistory,
      turnHistory: game.turnHistory,
    };

    if (room.ranked) {
      // Set streak
      me.player.streak += 1;
      opponent.player.streak = 0;
      updateScore(me.player.uuid, me.player.streak);
      updateScore(opponent.player.uuid, 0);

      // Set ELO
      const ra = me.player.elo;
      const rb = opponent.player.elo;
      const ea = 1 / (1 + 10 ** ((rb - ra) / 400));
      const eb = 1 / (1 + 10 ** ((ra - rb) / 400));

      const ran = Math.ceil(ra + ELO_K * (1 - ea));
      const rbn = Math.ceil(rb + ELO_K * (0 - eb));
      me.player.elo = ran;
      opponent.player.elo = rbn;

      // Add resignation

      addResult(me.player, room.id, result);
      addResult(opponent.player, room.id, {...result, type: GameResultType.LOSS});
    }

    sendMessage(me.player.socket, {
      ...gom,
      result: result,
      player: toPlayerInfo(me.player),
      opponent: toPlayerInfo(opponent.player),
    });
    sendMessage(opponent.player.socket, {
      ...gom,
      result: {...result, type: GameResultType.LOSS},
      player: toPlayerInfo(opponent.player),
      opponent: toPlayerInfo(me.player),
    });
    this.end();

    log.get(me.name).notice('won');
    log.get(opponent.name).notice('lost');
  }

  draws(result: GameResult) {
    const {room} = this;
    const gom = {
      type: 'gameOver' as const,
      stateHistory: this.game.stateHistory,
      turnHistory: this.game.turnHistory,
      result,
    };

    if (room.ranked) {
      const me = room.p1;
      const opponent = room.p2;

      const ra = me.player.elo;
      const rb = opponent.player.elo;
      const ea = 1 / (1 + 10 ** ((rb - ra) / 400));
      const eb = 1 / (1 + 10 ** ((ra - rb) / 400));

      const ran = Math.ceil(ra + ELO_K * (0.5 - ea));
      const rbn = Math.ceil(rb + ELO_K * (0.5 - eb));
      me.player.elo = ran;
      opponent.player.elo = rbn;
    }

    sendMessage(room.p1.player.socket, {
      ...gom,
      player: toPlayerInfo(room.p1.player),
      opponent: toPlayerInfo(room.p2.player),
    });
    sendMessage(room.p2.player.socket, {
      ...gom,
      player: toPlayerInfo(room.p2.player),
      opponent: toPlayerInfo(room.p1.player),
    });
    this.end();

    log.get(room.p1.name).notice('draw');
    log.get(room.p2.name).notice('draw');
  }

  end() {
    const {room} = this;
    clearInterval(this.timerInterval);

    room.sendTimers();
    room.sendRanks();
    delete room.p1.player.roomId;
    delete room.p2.player.roomId;
    if (room.p1.disconnectTimeout) {
      clearInterval(room.p1.disconnectTimeout);
    }
    if (room.p2.disconnectTimeout) {
      clearInterval(room.p2.disconnectTimeout);
    }
    savePlayer(room.p1.player);
    savePlayer(room.p2.player);
    deleteRoom(room.id);

    this.advance();
  }
}

export class DonePhase extends Phase {
  name = PhaseEnum.DONE;

  advance = () => {
    log.warn('cant advance done');
  }
}

export const PHASE_MAP = new Map<PhaseEnum, typeof Phase>([
  [PhaseEnum.RULES, RulesPhase],
  [PhaseEnum.PLAYING, PlayingPhase],
  [PhaseEnum.DONE, DonePhase],
])
