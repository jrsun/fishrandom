import { Color, RoomAction } from "../chess/const";
import { PlayerInfo } from "../common/message";
import LRU from 'lru-cache';
import { GameResult, GameResultType } from "../chess/game";
import { randomInt } from "../common/utils";

// Player outside room
export interface Player {
  uuid: string;
  username: string;
  roomId?: string;
  socket?: SocketIO.Socket;
  lastVariants: string[];
  streak: number;
  elo: number;
  connected?: boolean;
  recentResults?: LRU<string /*roomid*/, GameResult>;
}

// Player inside room
export interface RoomPlayer {
  player: Player;
  color: Color;
  time: number;
  name: string; // for logging namespace
  disconnectTimeout?: ReturnType<typeof setTimeout>; // return value of a disconnect timeout
  allowedActions: Set<RoomAction>;
}

// Serialize player
export const toPlayerInfo = (p: Player): PlayerInfo => {
  const {username, streak, elo, connected} = p;
  return {
    name: username,
    streak,
    elo,
    connected: !!connected,
  };
};

export const addResult = (p: Player, rid: string, r: GameResult) => {
  if (!p.recentResults) {
    p.recentResults = new LRU<string, GameResult>({
      maxAge: randomInt(1000 * 60 * 60) // one hour in ms
    });
  }
  p.recentResults.set(rid, r);
}

// last 5 games were resignations
export const hasResignedRecently = (p: Player): boolean => {
  if (!(p.recentResults instanceof LRU)) return false;

  let resigns = 0;
  p.recentResults.forEach((result) => {
    if (result.reason === 'resignation' && result.type === GameResultType.LOSS) {
      resigns++;
    } else {
      return;
    }
  })
  return resigns >= 5;
}