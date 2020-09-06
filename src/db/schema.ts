import {Color} from '../chess/const';
import {Turn} from '../chess/turn';
import {BoardState} from '../chess/state';

export interface RoomSchema {
  players: {
    [uuid: string]: {
      time: number;
      name: string;
      color: Color;
    };
  };
  turnHistory: Turn[];
  stateHistory: BoardState[];
  variant: string;
}
