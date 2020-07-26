import express from 'express';
import path from 'path';
import {Game} from '../chess/game';
import {
  replacer,
  reviver,
  Message,
  ReplaceMessage,
  AppendMessage,
  MoveMessage,
  ReplaceAllMessage,
  InitGameMessage,
} from '../common/message';
import WS from 'ws';
import {Move} from '../chess/move';
import {Chess960} from '../chess/variants/960';
import {Color} from '../chess/const';

var app = express();

// viewed at http://localhost:8080
app.get('/', function (req, res) {
  res.sendFile(path.join(path.resolve() + '/dist/index.html'));
});

app.use('/dist', express.static(path.join(path.resolve() + '/dist')));

app.use('/img', express.static(path.join(path.resolve() + '/img')));

console.log('serving on 8080');
app.listen(8080);

const wss = new WS.Server({port: 8081});

interface ActiveGames {
  p1: string;
  p2?: string;
  game: Game;
}
const activeGames: ActiveGames[] = [];
const sockets: {[uuid: string]: WS.WebSocket} = {};

wss.on('connection', function connection(ws: WS.WebSocket) {
  // onclose
  const uuid = guid();
  sockets[uuid] = ws;
  let game;
  const waitingRoom = activeGames.filter((ag) => !ag.p2)[0];
  if (!waitingRoom) {
    game = new Chess960();
    activeGames.push({p1: uuid, game});
    console.log('game created');
  } else {
    waitingRoom.p2 = uuid;
    game = waitingRoom.game;
    console.log('game joined');
    // const ram = {
    //   type: 'replaceAll',
    //   moveHistory: game.moveHistory,
    //   stateHistory: game.stateHistory,
    // } as ReplaceAllMessage;
    const igmW = {
      type: 'initGame',
      state: game.state,
      variantName: game.name,
      color: Color.WHITE,
    } as InitGameMessage;
    const igmB = {
      ...igmW,
      color: Color.BLACK,
    } as InitGameMessage;
    if (Math.random() > 0.5) {
      sockets[waitingRoom.p1].send(JSON.stringify(igmW, replacer));
      sockets[waitingRoom.p2].send(JSON.stringify(igmB, replacer));
    } else {
      sockets[waitingRoom.p1].send(JSON.stringify(igmB, replacer));
      sockets[waitingRoom.p2].send(JSON.stringify(igmW, replacer));
    }
  }
  console.log('active: ', activeGames);
  ws.on('message', function incoming(message) {
    try {
      message = JSON.parse(message, reviver);
    } catch (e) {
      console.log('malformed message', e);
    }
    console.log('Received message of type %s', message.type);
    if (message.type === 'move') {
      // sanitize
      function tg(message: Message): message is MoveMessage {
        return message.type === 'move';
      }
      if (!tg(message)) {
        console.log('message is not valid move', message);
        return;
      }
      const {
        start: {row: srow, col: scol},
        end: {row: drow, col: dcol},
      } = message.move as Move;
      console.log('Move: (%s, %s) -> (%s, %s)', srow, scol, drow, dcol);

      const room = activeGames.find(
        (game) => uuid === game.p1 || uuid === game.p2
      );
      if (!room) {
        console.log('not in a room! exiting');
        return;
      }
      if (!room!.p2) {
        // console.log('not in a game! continuing anyway');
        // return;
      }
      const piece = game.state.getSquare(srow, scol)?.occupant;
      if (!piece) {
        console.log('no piece at ', srow, scol);
        return;
      }
      const move = game.attemptMove(
        game.state.getSquare(srow, scol)?.occupant,
        srow,
        scol,
        drow,
        dcol
      );
      if (move) {
        // we should send the mover a `replaceState` and the opponent an
        // `appendState`
        ws.send(
          JSON.stringify(
            {type: 'replaceState', move, state: game.state} as ReplaceMessage,
            replacer
          )
        );
        const other =
          room.p1 === uuid ? room.p2 : room.p2 === uuid ? room.p1 : undefined;
        if (other) {
          sockets[other]?.send(
            JSON.stringify(
              {type: 'appendState', move, state: game.state} as AppendMessage,
              replacer
            )
          );
        }
      } else {
        console.log('bad move!');
      }
    }
  });

  ws.send(JSON.stringify({type: 'hello'}));
});

//generates random id;
let guid = () => {
  let s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
  return (
    s4() +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    s4() +
    s4()
  );
};
