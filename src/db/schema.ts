import {Color} from '../chess/const';
import {Turn} from '../chess/turn';
import {BoardState} from '../chess/state';
import { PhaseEnum } from '../common/message';

export interface RoomSchema {
  id: string;
  ranked: boolean;
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
  phase: PhaseEnum;
}
