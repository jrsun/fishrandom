export interface Message {
  type: 'move'; // or others
  data: MoveMessage; // or others
}

export interface MoveMessage {
  srow: number;
  scol: number;
  drow: number;
  dcol: number;
}