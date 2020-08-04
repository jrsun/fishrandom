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
app.use(bodyParser.json())

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
  console.log('logged in', req.body);
  if (!req.cookies.uuid) {
    var randomNumber=Math.random().toString();
    randomNumber=randomNumber.substring(2,randomNumber.length);
    res.cookie('uuid',randomNumber, { maxAge: 900000});
  }
  res.end();
});

app.use('/dist', express.static(path.join(path.resolve() + '/dist')));

app.use('/img', express.static(path.join(path.resolve() + '/img')));

console.log('serving on 8080');
app.listen(8080);

const wss = new WS.Server({port: 8081});

const playerToRoom: {[uuid: string]: Room} = {};
const rooms: Room[] = [];
const sockets: {[uuid: string]: WS.WebSocket} = {};

const handleMessage = function (uuid, message: Message) {
  const room = playerToRoom[uuid];
  if (!room) {
    console.log('not in a room! exiting');
    return;
  }
  if (!room!.p2) {
    // console.log('not in a game! continuing anyway');
    // return;
  }

  const game = room.game;
  if (!game) {
    console.log('Game not started');
    return;
  }
  if (message.type === 'turn') {
    // sanitize
    function tg(message: Message): message is TurnMessage {
      return message.type === 'turn';
    }
    if (!tg(message)) {
      console.log('message is not valid move', message);
      return;
    }
    room.handleTurn(uuid, message.turn);
  }
  if (message.type === 'resign') {
    room.handleResign(uuid);
  }
  if (room.state === RoomState.COMPLETED) {
    const index = rooms.indexOf(room);
    if (index > -1) {
      rooms.splice(index, 1);
    }
    delete playerToRoom[room.p1.uuid];
    delete sockets[room.p1.uuid];
    if (room.p2) {
      delete playerToRoom[room.p2.uuid];
      delete sockets[room.p2.uuid];
    }
  }
};

wss.on('connection', function connection(ws: WS.WebSocket, request) {
  console.log('Client connected:', request.headers.origin);
  let uuid = '';

  const cookies = request.headers.cookie?.split(';');
  uuid = cookies?.find(cookie => cookie.startsWith('uuid='))?.split('=')?.[1];
  console.log('Cookie exists:', uuid);
  if (!uuid) {
    console.log('no cookie found');
    return;
  }

  // Close existing websocket, if exists
  sockets[uuid]?.close();
  sockets[uuid] = ws;

  // Register method handler
  addMessageHandler(ws, (message) => {
    handleMessage(uuid, message);
  });

  // Handle existing room
  if (!!playerToRoom[uuid]) {
    console.log('already in a room');
    const activeGame = playerToRoom[uuid].game;
    const activeRoom = playerToRoom[uuid];
    // TODO: waiting
    if (!activeGame) return;
    const color = activeRoom.getColor(uuid);
    activeRoom.reconnect(uuid, ws);

    const igm = {
      type: 'initGame',
      state: activeGame.visibleState(activeGame.state, color),
      variantName: activeGame.name,
      color,
    } as InitGameMessage;
    sendMessage(ws, igm);
    return;
  }
  // TODO: onclose
  sockets[uuid] = ws;
  let room = rooms.filter((ag) => !ag.p2)[0];
  if (!room) {
    room = new Room(uuid, ws);
    rooms.push(room);
    playerToRoom[uuid] = room;
    console.log('game created');
  } else {
    room.p2Connect(uuid, ws);
    let newGame;
    if (argv.game) {
      const uppercase = argv.game.charAt(0).toUpperCase() + argv.game.slice(1);
      newGame = new Variants[uppercase](true);
    } else {
      newGame = new (Variants.Random())(/*isserver*/ true);
    }
    room.game = newGame;
    playerToRoom[uuid] = room;
    console.log('game joined');
    const igmW = {
      type: 'initGame',
      state: newGame.visibleState(newGame.state, Color.WHITE),
      variantName: newGame.name,
      color: Color.WHITE,
    } as InitGameMessage;
    const igmB = {
      ...igmW,
      state: newGame.visibleState(newGame.state, Color.BLACK),
      color: Color.BLACK,
    } as InitGameMessage;
    // console.log('room', room);
    if (room.p1.color === Color.WHITE) {
      sendMessage(room.p1.socket, igmW);
      sendMessage(room.p2?.socket, igmB);
    } else {
      sendMessage(room.p1.socket, igmB);
      sendMessage(room.p2?.socket, igmW);
    }
  }
});