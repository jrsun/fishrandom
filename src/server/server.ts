import express from 'express';
import path from 'path';
import {
  Message,
  TurnMessage,
  InitGameMessage,
  sendMessage,
  addMessageHandler,
  ReplaceMessage,
} from '../common/message';
import {Room, RoomState} from './room';
import WS from 'ws';
import * as Variants from '../chess/variants/index';
import {Color} from '../chess/const';
import yargs from 'yargs';
import {randomChoice, randomInt} from '../utils';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import escape from 'validator/lib/escape';

var app = express();

const argv = yargs
  .option('game', {
    alias: 'g',
    description: 'Choose a game to limit. Default is random',
    type: 'string',
  })
  .help()
  .alias('help', 'h').argv;

app.use(cookieParser());
app.use(bodyParser.json());

// viewed at http://localhost:8080
app.get('/', function (req, res) {
  // if (!req.cookies.uuid) {
  //   var randomNumber=Math.random().toString();
  //   randomNumber=randomNumber.substring(2,randomNumber.length);
  //   res.cookie('uuid',randomNumber, { maxAge: 900000});
  // }
  if (req.cookies.uuid) {
    res.sendFile(path.join(path.resolve() + '/dist/index.html'));
  } else {
    res.sendFile(path.join(path.resolve() + '/dist/login.html'));
  }
});

// viewed at http://localhost:8080
app.post('/login', function (req, res) {
  if (!req.body.username || req.body.username !== escape(req.body.username))
    return;

  console.log('logged in', req.body.username);
  if (!req.cookies.uuid) {
    var randomNumber = Math.random().toString();
    randomNumber = randomNumber.substring(2, randomNumber.length);
    res.cookie('uuid', randomNumber + '|' + req.body.username, {
      httpOnly: true,
    });
  }
  res.end();
});

app.use('/dist', express.static(path.join(path.resolve() + '/dist')));

app.use('/img', express.static(path.join(path.resolve() + '/img')));

console.log('serving on 8080');
app.listen(8080);

const wss = new WS.Server({port: 8081});

interface PlayerInfo {
  uuid: string;
  room?: Room;
  socket: WS.Websocket;
}
const players: {[uuid: string]: PlayerInfo} = {};
// const rooms: Room[] = [];
// const sockets: {[uuid: string]: WS.WebSocket} = {};

const handleMessage = function (uuid, message: Message) {
  if (message.type === 'newGame') {
    delete players[uuid].room;
    newGame(uuid, players[uuid].socket);
    return;
  }
  const room = players[uuid].room;
  if (!room) {
    console.log('not in a room! exiting');
    return;
  }

  if (message.type === 'turn') {
    // sanitize
    function tg(message: Message): message is TurnMessage {
      return message.type === 'turn';
    }
    if (!tg(message)) {
      console.log('message is not valid turn message', message);
      return;
    }
    room.handleTurn(uuid, message.turn);
  }
  if (message.type === 'resign') {
    room.handleResign(uuid);
  }
  if (room.state === RoomState.COMPLETED) {
    delete players[room.p1.uuid].room;
    delete players[room.p2.uuid].room;
  }
};

wss.on('connection', function connection(ws: WS.WebSocket, request) {
  console.log('Client connected:', request.headers.origin);
  let uuid = '';

  const cookies = request.headers.cookie?.split(';');
  uuid = cookies?.find((cookie) => cookie.startsWith('uuid='))?.split('=')?.[1];
  if (!uuid) {
    ws.close();
    return;
  }

  if (players[uuid]) {
    // Close existing websocket, if exists
    players[uuid].socket.close();
    players[uuid].socket = ws;
  } else {
    players[uuid] = {uuid, socket: ws};
  }

  // Register method handler
  addMessageHandler(ws, (message) => {
    handleMessage(uuid, message);
  });
});

const newGame = (() => {
  const waitingUsers: PlayerInfo[] = [];
  return (uuid: string, ws: WebSocket) => {
    console.log(`${uuid} requested new game.`)
    // Handle existing room
    const activeRoom = players[uuid].room;
    if (!!activeRoom) {
      console.log('already in a room');
      activeRoom.reconnect(uuid, ws);
      return;
    }
    if (!waitingUsers.filter((user) => user.uuid !== uuid).length) {
      // If no users are queuing
      waitingUsers.unshift(players[uuid]);
      console.log('waiting', uuid);
    } else {
      // If a user is queuing
      const p1info = waitingUsers.pop()!;
      let newGame;
      if (argv.game) {
        const uppercase =
          argv.game.charAt(0).toUpperCase() + argv.game.slice(1);
        newGame = new Variants[uppercase](true);
      } else {
        newGame = new (Variants.Random())(/*isserver*/ true);
      }
      const room = new Room(p1info.uuid, p1info.socket, uuid, ws, newGame);
      p1info.room = room;
      players[uuid].room = room;

      console.log('joined');
    }
  };
})();
