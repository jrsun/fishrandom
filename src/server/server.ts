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
import {savePlayer, getPlayer, deleteRoom, getRoom, getTopK} from '../db';
logNode();

var app = express();
var wsCounter = 0;

setInterval(() => {
  log.notice('Active websockets:', wsCounter);
}, 60 * 1000);

setInterval(() => {
  getTopK(10).then(async result => {
    if (!result) return;

    const scores: any[] = [];
    for (const [uuid, score] of Object.entries(result)) {
      // remove this await
      const player = await getPlayer(uuid);
      if (!player) continue;
      scores.push({name: player.username, score});
    }
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'leader',
          scores,
          score: undefined,
        }));
      }
    });
  })
}, 1 * 1000);

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
    res.redirect('/');
    return;
  }
  res.sendFile(path.join(path.resolve() + '/dist/index.html'));
});

interface GameSettings {
  password?: string;
  variant?: string;
}

const gameSettings: {
  [uuid: string]: GameSettings | undefined;
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
      maxAge: 2147483647,
    });
  }
  const escapedUser =
    username
      .replace(/[^0-9A-Za-z]+/gi, '')
      .toLocaleLowerCase()
      .slice(0, 15) ?? 'fish';
  gameSettings[uuid] = {password, variant};

  getPlayer(uuid).then((player) => {
    if (player) {
      log.notice('User logged in :', escapedUser);
      savePlayer({
        ...player,
        username: escapedUser,
      });
      return;
    }
    // Account creation
    log.notice('User signed up:', escapedUser);
    savePlayer({
      uuid,
      username: escapedUser,
      streak: 0,
      lastVariants: [],
      elo: 1500,
    });
  });

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

wss.on('connection', async function connection(ws: WebSocket, request) {
  const cookies = request.headers.cookie?.split(';');
  const uuid = cookies
    ?.find((cookie) => cookie.startsWith('uuid='))
    ?.split('=')?.[1];
  if (!uuid) {
    log.notice('connected without uuid, kicking');
    kick(ws);
    return;
  }
  // Attach this early to be ready for client initGame
  addMessageHandler(ws, (message) => {
    handleMessage(ws, uuid, message);
  });

  ws.addEventListener('close', () => {
    getPlayer(uuid).then((player) => {
      log.notice('Client disconnected:', player?.username);
      const deleted = WAITING.deletePlayer(uuid);
      if (deleted) {
        log.notice('Removed from waiting:', player?.username);
      }
    });
    wsCounter--;
  });
  log.notice(
    'Socket connected',
    request.headers['x-forwarded-for'] || request.connection.remoteAddress
  );
  wsCounter++;
});

/** Handle websocket messages and delegate to room */
const handleMessage = async function (
  ws: WebSocket,
  uuid: string,
  message: Message
) {
  const player = await getPlayer(uuid);
  if (!player) {
    kick(ws, uuid);
    return;
  }
  player.socket = ws;
  const playerLog = log.get(player.username);
  const roomId = player.roomId;
  const room = await getRoom(roomId);

  if (message.type === 'newGame') {
    if (!!room) {
      // Handle existing room
      playerLog.notice('already in a room, reconnecting');
      room.reconnect(player.uuid, ws);
      return;
    }
    newGame(
      player,
      gameSettings[player.uuid]?.password,
      gameSettings[player.uuid]?.variant
    );
    return;
  }
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
  if (message.type === 'draw') {
    room.handleDraw(player.uuid);
  }
  if (room.state === RoomState.COMPLETED) {
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

  let selectedVariant = (argv.game || variant) ?? '';
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
    console.error('Fetched opponent from waiting, but they were missing!!');
    if (player.socket) {
      kick(player.socket!, player.uuid);
    }
    return;
  }
  let NG: typeof Game;

  const v = randomChoice([selectedVariant, opVariant].filter((n) => !!n));

  if (v && v in Variants.VARIANTS) {
    NG = Variants.VARIANTS[v];
  } else {
    NG = Variants.Random(
      /**except*/
      opponent.lastVariants,
      player.lastVariants
    );
    // Set the last variant
    addLastVariant(opponent, NG.name);
    addLastVariant(player, NG.name);
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
      !password, // only ranked if open
      p1color,
      99 * 60 * 1000,
      99 * 60 * 1000,
    );
  } else {
    room = new Room(roomId, opponent, player, NG, /*ranked*/true, p1color);
  }
  room.initGame();
  opponent.roomId = room.id;
  player.roomId = room.id;
  savePlayer(player);
  savePlayer(opponent);

  playerLog.notice('found a game');
  log.get(opponent.username).notice('after waiting, found a game');
};

const SAVE_LAST_N_VARIANTS = 20;
const addLastVariant = (player: Player, variant: string) => {
  player.lastVariants.unshift(variant);
  player.lastVariants = player.lastVariants.slice(0, SAVE_LAST_N_VARIANTS);
};

const kick = async (ws: WebSocket, uuid?: string) => {
  if (uuid) {
    WAITING.deletePlayer(uuid);
    const player = await getPlayer(uuid);
    if (player) {
      const roomId = player.roomId;
      if (roomId) {
        console.error('kicked someone out of existing room!!');
        // Shouldn't happen, but just delete the room
        deleteRoom(roomId);
      }
    }
    delete gameSettings[uuid];
  }
  sendMessage(ws, {type: 'kick'});
  ws.close();
};
