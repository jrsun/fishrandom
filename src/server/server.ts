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
import {Room, RoomState, Player} from './room';
import WS from 'ws';
import * as Variants from '../chess/variants/index';
import {Color} from '../chess/const';
import yargs from 'yargs';
import {randomChoice, randomInt} from '../utils';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import escape from 'validator/lib/escape';

import log from 'log';
import logNode from 'log-node';
import {Game} from '../chess/game';
import { WAITING } from './waiting';
logNode();

var app = express();
var wsCounter = 0;

setInterval(() => {
  log.notice('Active websockets:', wsCounter);
  log.notice('Players:', Object.keys(players));
}, 60 * 1000);

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

/** HTTP entry point */
app.get('/', function (req, res) {
  if (gameSettings[req.cookies.uuid]) {
    res.sendFile(path.join(path.resolve() + '/dist/index.html'));
  } else {
    res.sendFile(path.join(path.resolve() + '/dist/login.html'));
  }
});

interface GameSettings {
  username: string;
  password?: string;
}

const gameSettings: {
  [uuid: string]: GameSettings
} = {};

/** Login page */
app.post('/login', function (req, res) {
  if (!req.body.username || req.body.username !== escape(req.body.username)) {
    return;
  }

  const {username, password} = req.body;
  log.notice('logged in', username);
  let uuid = req.cookies.uuid;
  if (!uuid) {
    var randomNumber = Math.random().toString();
    uuid = randomNumber.substring(2, randomNumber.length);
    res.cookie('uuid', uuid, {
      encode: String,
    });
  }
  const escapedUser = username.replace(/[^0-9A-Za-z]+/gi, '').toLocaleLowerCase() ?? "fish";
  gameSettings[uuid] = {username: escapedUser, password};
  res.end();
});

/** Static files */
app.use(
  '/dist/index.bundle.js',
  express.static(path.join(path.resolve() + '/dist/index.bundle.js'))
);
app.use(
  '/dist/login.bundle.js',
  express.static(path.join(path.resolve() + '/dist/login.bundle.js'))
);

app.use('/img', express.static(path.join(path.resolve() + '/img')));
app.use('/font', express.static(path.join(path.resolve() + '/font')));
app.use('/snd', express.static(path.join(path.resolve() + '/snd')));

log.notice('serving on 8080');
app.listen(8080);

const wss = new WS.Server({
  port: process.env.NODE_ENV === 'development' ? 8081 : 8082,
});

/** Game server state */

const players: {[uuid: string]: Player} = {};

wss.on('connection', function connection(ws: WebSocket, request) {
  ws.addEventListener('close', () => {
    log.notice(
      'Client disconnected:',
      players[uuid]?.username,
    );
    wsCounter--;
  });
  log.notice(
    'Socket connected',
    request.headers['x-forwarded-for'] || request.connection.remoteAddress
  );
  wsCounter++;
  let uuid = '';

  const cookies = request.headers.cookie?.split(';');
  uuid = cookies?.find((cookie) => cookie.startsWith('uuid='))?.split('=')?.[1];
  if (!uuid) {
    log.notice('connected without uuid');
    return;
  }
  if (!gameSettings[uuid]) {
    return;
  }
  log.notice(
    'User connected:',
    gameSettings[uuid].username,
  );

  if (players[uuid]) {
    // maybe need to close the old socket here
    players[uuid].username = gameSettings[uuid].username;
    players[uuid].socket = ws;
  } else {
    players[uuid] = {
      uuid,
      username: gameSettings[uuid].username,
      streak: 0,
      lastVariants: [],
      socket: ws,
      elo: 1500,
    };
  }

  addMessageHandler(ws, (message) => {
    handleMessage(uuid, message);
  });
});

/** Handle websocket messages and delegate to room */
const handleMessage = function (uuid, message: Message) {
  const playerLog = log.get(players[uuid].username);
  const room = players[uuid].room;
  if (message.type === 'newGame') {
    const activeRoom = players[uuid].room;
    if (!!activeRoom) {
      // Handle existing room
      playerLog.notice('already in a room, reconnecting');
      activeRoom.reconnect(uuid, players[uuid].socket);
      return;
    }
    newGame(players[uuid], gameSettings[uuid].password);
    return;
  }
  if (
    message.type === 'exit' &&
    WAITING.hasPlayer(players[uuid])
  ) {
    // Clean up references if a player left while waiting
    playerLog.notice('left the game');
    WAITING.deletePlayer(players[uuid]);
    delete gameSettings[uuid];
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
    try {
      room.handleTurn(uuid, message.turn);
    } catch (e) {
      log.error('ERR: fatal turn error', e);
    }
  }
  if (message.type === 'resign') {
    room.handleResign(uuid);
  }
  if (room.state === RoomState.COMPLETED) {
    playerLog.notice('game completed');
  }
};

/** Handle new game message */
const newGame = (player: Player, password?: string) => {
  const playerLog = log.get(player.username);
  playerLog.notice(`${player.uuid} requested new ${!password ? 'open' : 'private'} game.`);

  const opponent = WAITING.pop(password);
  if (!opponent || opponent === player) {
    WAITING.add(player, password);
    playerLog.notice('waiting', player.uuid);
    return;
  }
  let NG: typeof Game;
  if (argv.game) {
    const uppercase = argv.game.charAt(0).toUpperCase() + argv.game.slice(1);
    NG = Variants[uppercase];
  } else {
    NG = Variants.Random(
      /**except*/
      ...opponent.lastVariants,
      ...player.lastVariants
    );
  }
  const room = new Room(opponent, player, NG);
  opponent.room = room;
  player.room = room;

  // Set the last variant
  addLastVariant(opponent, room.game.name);
  addLastVariant(player, room.game.name);

  playerLog.notice('found a game');
  log.get(opponent.username).notice('after waiting, found a game');
};

const EXCLUDE_LAST_N_VARIANTS = 5;
const addLastVariant = (player: Player, variant: string) => {
  player.lastVariants.unshift(variant);
  player.lastVariants = player.lastVariants.slice(0, EXCLUDE_LAST_N_VARIANTS);
}