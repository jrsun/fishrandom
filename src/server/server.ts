import express from 'express';
import path from 'path';
import {Game} from '../chess/game';
import {replacer, reviver} from '../common/message';
import WS from 'ws';
import {Move} from '../chess/move';

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
    game = new Game();
    activeGames.push({p1: uuid, game});
    console.log('game created');
  } else {
    waitingRoom.p2 = uuid;
    game = waitingRoom.game;
    console.log('game joined');
    // send initial state
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
      const {
        start: {row: srow, col: scol},
        end: {row: drow, col: dcol},
      } = message.data as Move;
      console.log('Move: (%s, %s) -> (%s, %s)', srow, scol, drow, dcol);

      const room = activeGames.find(
        (game) => uuid === game.p1 || uuid === game.p2
      );
      if (!room.p2) {
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
        sockets[room.p1]?.send(
          JSON.stringify({type: 'move', data: move}, replacer)
        );
        sockets[room.p2]?.send(
          JSON.stringify({type: 'move', data: move}, replacer)
        );
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
