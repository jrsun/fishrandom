import {Color} from '../chess/const';
import {Turn} from '../chess/turn';
import {BoardState} from '../chess/state';

export interface RoomSchema {
  id: string;
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
