import express from 'express';
import path from 'path';
import { Game } from '../chess/game';
import { MoveMessage } from '../common/socket';
import WS from 'ws';

var app = express();

// viewed at http://localhost:8080
app.get('/', function(req, res) {
    res.sendFile(path.join(path.resolve() + '/dist/index.html'));
});

app.use('/dist', express.static(
  path.join(path.resolve() + '/dist')));

app.use('/img', express.static(
  path.join(path.resolve() + '/img')));

console.log('serving on 8080');
app.listen(8080);

const wss = new WS.Server({ port: 8081 });

interface ActiveGames {
  p1: string,
  p2?: string,
  game: Game,
}
const activeGames: ActiveGames[] = [];
const sockets: {[uuid: string]: WS.WebSocket} = {};
 
wss.on('connection', function connection(ws: WS.WebSocket) {
  const uuid = guid();
  sockets[uuid] = ws;
  let game;
  const waitingRoom = activeGames.filter(ag => !ag.p2)[0];
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
      message = JSON.parse(message);
    } catch (e) {
      console.log('malformed message', e);
    }
    console.log('received: %s of type %s', message, message.type);
    if (message.type === 'move') {
      const room = activeGames.find(game => uuid === game.p1 || uuid === game.p2);
      if (!room.p2) {
        console.log('not in a game!');
        return;
      }
      // sanitize
      const {srow, scol, drow, dcol} = message.data as MoveMessage;
      console.log('data:', message.data);
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
        dcol);
      if (move) {
        const message: MoveMessage = {
          srow: move.start.row,
          scol: move.start.col,
          drow: move.end.row,
          dcol: move.end.col,
        };
        // ws.send(JSON.stringify({type: 'move', data: message}));
        sockets[room.p1].send(JSON.stringify({type: 'move', data: message}));
        sockets[room.p2].send(JSON.stringify({type: 'move', data: message}));
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
  }
  //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}