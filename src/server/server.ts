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
import {randomChoice, randomInt, uuidToName} from '../utils';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import escape from 'validator/lib/escape';

import log from 'log';
import logNode from 'log-node';
logNode();

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
  if (!req.body.username || req.body.username !== escape(req.body.username)) {
    return;
  }

  log.notice('logged in', req.body.username);
  if (!req.cookies.uuid) {
    var randomNumber = Math.random().toString();
    randomNumber = randomNumber.substring(2, randomNumber.length);
    res.cookie('uuid', randomNumber + '|' + req.body.username, {
      encode: String,
    });
  }
  res.end();
});

app.use(
  '/dist/index.bundle.js',
  express.static(path.join(path.resolve() + '/dist/index.bundle.js'))
);
app.use(
  '/dist/login.bundle.js',
  express.static(path.join(path.resolve() + '/dist/login.bundle.js'))
);

// app.use('/dist/index.bundle.js, ')

app.use('/img', express.static(path.join(path.resolve() + '/img')));
app.use('/font', express.static(path.join(path.resolve() + '/font')));

log.notice('serving on 8080');
app.listen(8080);

const wss = new WS.Server({port: 8081});

interface PlayerInfo {
  uuid: string;
  room?: Room;
  socket: WS.Websocket;
}
const players: {[uuid: string]: PlayerInfo} = {};

wss.on('connection', function connection(ws: WS.WebSocket, request) {
  log.notice('Client connected:', request.headers['user-agent']);
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

const handleMessage = function (uuid, message: Message) {
  const playerLog = log.get(uuidToName(uuid));
  const room = players[uuid].room;
  if (room?.state === RoomState.COMPLETED) {
    delete players[room.p1.uuid].room;
    delete players[room.p2.uuid].room;
  }
  if (message.type === 'newGame') {
    newGame(uuid, players[uuid].socket);
    return;
  }
  if (!room) {
    playerLog.notice('not in a room! exiting');
    return;
  }

  if (message.type === 'turn') {
    // sanitize
    function tg(message: Message): message is TurnMessage {
      return message.type === 'turn';
    }
    if (!tg(message)) {
      log.warn('message is not valid turn message', message);
      return;
    }
    room.handleTurn(uuid, message.turn);
  }
  if (message.type === 'resign') {
    room.handleResign(uuid);
  }
  if (room.state === RoomState.COMPLETED) {
    playerLog.notice('game completed');
    delete players[room.p1.uuid].room;
    delete players[room.p2.uuid].room;
  }
};

const newGame = (() => {
  const waitingUsers: PlayerInfo[] = [];
  return (uuid: string, ws: WebSocket) => {
    const playerLog = log.get(uuidToName(uuid));
    playerLog.notice(`${uuid} requested new game.`);
    // Handle existing room
    const activeRoom = players[uuid].room;
    if (!!activeRoom) {
      playerLog.notice('already in a room');
      activeRoom.reconnect(uuid, ws);
      return;
    }
    if (!waitingUsers.filter((user) => user.uuid !== uuid).length) {
      // If no users are queuing
      if (!waitingUsers.some((user) => user.uuid === uuid)) {
        waitingUsers.unshift(players[uuid]);
      }
      playerLog.notice('waiting', uuid);
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

      playerLog.notice('found a game');
      log.get(uuidToName(p1info.uuid)).notice('after waiting, found a game');
    }
  };
})();
