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
  log,
  sendMessage,
  addMessageHandler,
} from '../common/message';
import {Room} from './room';
import WS from 'ws';
import * as Variants from '../chess/variants/index';
import {Move} from '../chess/move';
import {Color} from '../chess/const';
import {randomChoice, randomInt} from '../utils';

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

const playerToRoom: {[uuid: string]: Room} = {};
const rooms: Room[] = [];
const sockets: {[uuid: string]: WS.WebSocket} = {};

const handleMessage = function(uuid, message: Message) {
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
    if (message.type === 'move') {
      // sanitize
      function tg(message: Message): message is MoveMessage {
        return message.type === 'move';
      }
      if (!tg(message)) {
        console.log('message is not valid move', message);
        return;
      }
      room.handleMove(uuid, message.move);
      return;
    }
    if (message.type === 'resign') {
      room.handleResign(uuid);
      return;
    }
  };

wss.on('connection', function connection(ws: WS.WebSocket, request) {
  console.log('Client connected:', request.headers.origin);
  // onclose
  const uuid = guid();
  sockets[uuid] = ws;
  let room = rooms.filter((ag) => !ag.p2)[0];
  if (!room) {
    room = new Room(uuid, ws);
    rooms.push(room);
    playerToRoom[uuid] = room;
    console.log('game created');
  } else {
    room.p2Connect(uuid, ws);
    const newGame = new (Variants.Random())(/*isserver*/true);
    // const newGame = new Variants.Hiddenqueen(true);
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
  addMessageHandler(ws, (message) => {handleMessage(uuid, message)});
  // ws.on('message', function incoming(message) {
  //   const room = playerToRoom[uuid];
  //   if (!room) {
  //     console.log('not in a room! exiting');
  //     return;
  //   }
  //   if (!room!.p2) {
  //     // console.log('not in a game! continuing anyway');
  //     // return;
  //   }

  //   const game = room.game;
  //   try {
  //     message = JSON.parse(message, reviver);
  //   } catch (e) {
  //     console.log('malformed message', e);
  //   }
  //   if (!game) {
  //     console.log('Game not started');
  //     return;
  //   }
  //   if (message.type === 'move') {
  //     // sanitize
  //     function tg(message: Message): message is MoveMessage {
  //       return message.type === 'move';
  //     }
  //     if (!tg(message)) {
  //       console.log('message is not valid move', message);
  //       return;
  //     }
  //     room.handleMove(uuid, message.move);
  //     return;
  //   }
  //   if (message.type === 'resign') {
  //     room.handleResign(uuid);
  //     return;
  //   }
  // });
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
