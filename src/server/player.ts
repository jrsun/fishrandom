import { Color, RoomAction } from "../chess/const";
import { PlayerInfo } from "../common/message";

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