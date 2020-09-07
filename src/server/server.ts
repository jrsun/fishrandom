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
import {WAITING} from './waiting';
import { getRoomSchema, setPlayer, getPlayer, setRoom, deleteRoom, PLAYERS } from '../db';
import { RoomSchema } from '../db/schema';
logNode();

var app = express();
var wsCounter = 0;

setInterval(() => {
  log.notice('Active websockets:', wsCounter);
  // log.notice('Players:', Object.);
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
  res.sendFile(path.join(path.resolve() + '/dist/login.html'));
});

app.get('/game', function (req, res) {
  if (!req.cookies.uuid) {
    // if (!req.cookies.uuid || !gameSettings[req.cookies.uuid]) {
    res.redirect('/');
    return;
  }
  res.sendFile(path.join(path.resolve() + '/dist/index.html'));
});

interface GameSettings {
  username: string;
  password?: string;
  variant?: string;
}

const gameSettings: {
  [uuid: string]: GameSettings;
} = {};

/** Login page */
app.post('/login', function (req, res) {
  if (!req.body.username || req.body.username !== escape(req.body.username)) {
    return;
  }

  const {username, password, variant} = req.body;
  log.notice('logged in', username);
  let uuid = req.cookies.uuid;
  if (!uuid) {
    var randomNumber = Math.random().toString();
    uuid = randomNumber.substring(2, randomNumber.length);
    res.cookie('uuid', uuid, {
      encode: String,
    });
  }
  const escapedUser =
    username
      .replace(/[^0-9A-Za-z]+/gi, '')
      .toLocaleLowerCase()
      .slice(0, 15) ?? 'fish';
  // REDIS
  gameSettings[uuid] = {username: escapedUser, password, variant};
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

const rooms: {[uuid: string]: Room} = {};

wss.on('connection', async function connection(ws: WebSocket, request) {
  ws.addEventListener('close', () => {
    log.notice('Client disconnected:', uuid);
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
    log.notice('connected without uuid, kicking');
    kick(ws);
    return;
  }
  // REDIS
  // if (!gameSettings[uuid]) {
  //   log.notice('connected without gamesettings, kicking');
  //   kick(ws, uuid);
  //   return;
  // }
  // log.notice('User connected:', gameSettings[uuid].username);

  // load these from redis
  let player = await getPlayer(uuid) as Player|undefined;
  if (player) {
    // maybe need to close the old socket here
    player.socket = ws;
  } else {
    player = {
      uuid,
      username: randomChoice(['a','b','c','d','e','f']),
      streak: 0,
      lastVariants: [],
      elo: 1500,
      socket: ws,
    };
  }
  setPlayer(player);

  addMessageHandler(ws, (message) => {
    handleMessage(ws, player!, message);
  });
});

/** Handle websocket messages and delegate to room */
const handleMessage = async function (ws: WebSocket, player: Player, message: Message) {  
  const playerLog = log.get(player.username);
  // REDIS get room id, then fetch room
  const roomId = player.roomId;
  // TEMP TEMP
  let room = roomId ? rooms[roomId] : undefined;
  if (roomId && !room) {
    const schema = await getRoomSchema(roomId);
    if (schema) {
      const me = player; 
      const opponentUuid = Object.keys(schema.players).find(uuid => uuid !== me.uuid);
      if (!opponentUuid) {
        kick(ws, me.uuid);
        return;
      }
  
      const opponent = await getPlayer(opponentUuid);
      if (!opponent) {
        console.log('kicking because no opponent');
        kick(ws, player.uuid);
        return;
      }
      console.log('reloaded room from db');
      room = Room.thaw(me, opponent, schema);
      rooms[room.id] = room;
    }
  }

  if (message.type === 'newGame') {
    if (!!room) {
      // Handle existing room
      playerLog.notice('already in a room, reconnecting');
      room.reconnect(player.uuid, ws);
      return;
    }
    newGame(
      player,
      // gameSettings[player.uuid].password,
      // gameSettings[player.uuid].variant
    );
    return;
  }
  // TODO it's no longer the same player object
  if (message.type === 'exit' && WAITING.hasPlayer(player.uuid)) {
    // Clean up references if a player left while waiting
    playerLog.notice('left the game');
    kick(ws, player.uuid);
    return;
  }
  if (!room) {
    playerLog.notice('not in a room, kicking');
    kick(ws, player.uuid);
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
      room.handleTurn(player.uuid, message.turn);
    } catch (e) {
      log.error('ERR: fatal turn error', e);
    }
  }
  if (message.type === 'resign') {
    room.handleResign(player.uuid);
  }
  if (room.state === RoomState.COMPLETED) {
    delete rooms[room.id];
    playerLog.notice('game completed');
  }
};

/** Handle new game message */
const newGame = async (player: Player, password?: string, variant?: string) => {
  const playerLog = log.get(player.username);
  playerLog.notice(
    `${player.uuid} requested new ${
      !password ? 'open' : 'private'
    } game with variant ${variant ?? 'unspecified'}.`
  );

  let selectedVariant = (variant || argv.game) ?? '';
  selectedVariant =
    selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1);
  if (!(selectedVariant in Variants.VARIANTS)) {
    selectedVariant = undefined;
  }

  const entry = WAITING.pop(password);
  if (!entry || entry.uuid === player.uuid) {
    WAITING.add(player.uuid, password, selectedVariant);
    playerLog.notice('waiting', player.uuid);
    return;
  }
  const {uuid: opponentUuid, variant: opVariant} = entry;
  const opponent = await getPlayer(opponentUuid);
  if (!opponent) {
    return; // TEMP
  }
  let NG: typeof Game;

  const v = randomChoice([selectedVariant, opVariant].filter((n) => !!n));

  if (v && v in Variants.VARIANTS) {
    NG = Variants.VARIANTS[v];
  } else {
    NG = Variants.Random(
      /**except*/
      ...opponent.lastVariants,
      ...player.lastVariants
    );
  }
  let room: Room;
  const p1color = randomChoice([Color.WHITE, Color.BLACK]);

  const randomNumber = Math.random().toString();
  const roomId = randomNumber.substring(2, randomNumber.length);
  if (password || process.env.NODE_ENV === 'development') {
    room = new Room(
      roomId,
      opponent,
      player,
      NG,
      p1color,
      99 * 60 * 1000,
      99 * 60 * 1000
    );
  } else {
    room = new Room(roomId, opponent, player, NG, p1color);
  }
  rooms[room.id] = room;
  room.initGame();
  opponent.roomId = room.id;
  player.roomId = room.id;
  setPlayer(player);
  setPlayer(opponent);

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
};

const kick = async (ws: WebSocket, uuid?: string) => {
  if (uuid) {
    WAITING.deletePlayer(uuid);
    const player = await getPlayer(uuid);
    if (player) {
      const roomId = player.roomId;
      if (roomId) {
        deleteRoom(roomId);
        const room = rooms[roomId];
        if (room) {
          // This shouldn't happen, but end the room just in case.
          room.wins(
            room.p1.player.uuid === uuid
              ? room.p2.player.uuid
              : room.p1.player.uuid
          );
        }
      }

    }
    delete gameSettings[uuid];
  }
  sendMessage(ws, {type: 'kick'});
  ws.close();
};
