import redis from 'redis';
import {Room} from '../server/room';
import {replacer, reviver} from '../common/message';
import {ResolvePlugin} from 'webpack';
import log from 'log';
import zlib from 'zlib';
import LRU from 'lru-cache';
import {RoomSchema} from './schema';
import { Player } from '../server/player';
import { GameResultType } from '../chess/game';

const REDIS_CLIENT = redis.createClient() as RedisClient;
const PLAYERS: {[uuid: string]: Player} = {};
const ROOMS: {[uuid: string]: Room} = {};

setInterval(() => {
  log.notice('Players:', Object.keys(PLAYERS).length);
}, 60 * 1000);

type RedisFn = (err: Error, res: any) => void;

interface RedisClient {
  set: (key: string, value: string, f: RedisFn) => void;
  setex: (key: string, ttl: string, value: string, f: RedisFn) => void;
  get: (key: string, f: RedisFn) => void;
  del: (key: string, f: RedisFn) => void;
  zadd: (...any) => void;
  zrevrange: (key: string, start: number, end: number, withScores: 'WITHSCORES', f: RedisFn) => void;
  zrevrank: (key: string, username: string, f: RedisFn) => void;
  zscore: (key: string, username: string, f: RedisFn) => void;
}

const SCORES_KEY = 'scores:streak';

/**
 * DB Schema
 * 
 * room:{room_id} -> {room_schema}
 * player:{player_id} -> {player}
 * scores:streak -> sorted set of uuid -> streak
 */

export async function saveRoom(r: Room) {
  ROOMS[r.id] = r;
  return await new Promise<void>((resolve, reject) => {
    const s = JSON.stringify(Room.freeze(r), replacer);
    zlib.gzip(s, (err, buffer) => {
      if (err) {
        console.error('Failed to compress and save message %s', s);
        return;
      }
      // 300 = 5 * 60 seconds
      REDIS_CLIENT.setex(`room:${r.id}`, '300', buffer.toString('base64'), (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
}

export function deleteRoom(rid: string) {
  delete ROOMS[rid];
  REDIS_CLIENT.del(`room:${rid}`, () => {});
}

export async function getRoom(id?: string): Promise<Room | undefined> {
  if (!id) return Promise.resolve(undefined);

  if (id in ROOMS) return Promise.resolve(ROOMS[id]);

  // Reconstruct room from DB
  return await new Promise((resolve, reject) => {
    REDIS_CLIENT.get(`room:${id}`, (err, reply) => {
      if (err) {
        reject(err);
        return;
      }
      if (!reply) {
        resolve(undefined);
        return;
      }
      const zipped = Buffer.from(reply, 'base64');
      zlib.gunzip(zipped, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        let rs: RoomSchema | undefined;
        try {
          rs = JSON.parse(data.toString(), reviver) as RoomSchema | undefined;
        } catch (e) {
          reject(e);
          return;
        }
        if (!rs) {
          resolve(undefined);
          return;
        }
        const playerUuids = Object.keys(rs.players);
        Promise.all(playerUuids.map((uuid) => getPlayer(uuid))).then(
          (players) => {
            if (players.length !== 2 || !players[0] || !players[1]) {
              console.error('attempted to get room without 2 players');
              resolve(undefined);
              return;
            }
            try {
              const room = Room.thaw(players[0], players[1], rs!);
              ROOMS[room.id] = room;
              resolve(room);
            } catch (e) {
              console.error('couldnt thaw room', e);
              deleteRoom(id);
            }
          }
        );
      });
    });
  });
}

export async function savePlayer(p: Player) {
  PLAYERS[p.uuid] = p;
  return await new Promise<void>((resolve, reject) => {
    REDIS_CLIENT.set(
      `player:${p.uuid}`,
      JSON.stringify({...p, socket: undefined, recentResults: undefined}),
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
}

export async function getPlayer(id: string): Promise<Player | undefined> {
  if (id in PLAYERS) return Promise.resolve(PLAYERS[id]);

  return await new Promise<Player|undefined>((resolve, reject) => {
    REDIS_CLIENT.get(`player:${id}`, (err, reply) => {
      if (err) {
        reject(err);
        return;
      }
      if (!reply) {
        resolve(undefined);
      }
      const player = JSON.parse(reply) as Player;
      PLAYERS[id] = player;
      resolve({
        ...player,
        socket: undefined,
        recentResults: undefined,
      });
    });
  });
}

// Updates score if new score exceeds previous
export async function updateScore(username: string, score: number) {
  return await new Promise((resolve, reject) => {
    REDIS_CLIENT.zscore(SCORES_KEY, username, (err, prevScore) => {
      if (err) {
        log.warn('redis error:', err);
        resolve(undefined);
      }
      if (score > prevScore) {
        REDIS_CLIENT.zadd(SCORES_KEY, score, username, (err, reply) => {
          if (err) {
            reject(err);
            return;
          }
          if (!reply) {
            resolve(undefined);
          }
          resolve(reply);
        })
      }
    })
  });
}

export async function getTopK(k: number): Promise<undefined|{[name: string]: number}> {
  return await new Promise((resolve, reject) => {
    REDIS_CLIENT.zrevrange(SCORES_KEY, 0, k - 1, 'WITHSCORES', (err, reply) => {
      if (err) {
        reject(err);
        return;
      }
      if (!reply) {
        resolve(undefined);
      }
      const topKToScores = {};
      for (let i=0; i < reply.length; i +=2) {
        const name = reply[i];
        const score = parseInt(reply[i+1], 10);
        topKToScores[name] = score;
      }
      resolve(topKToScores);
    })
  })
}

export async function getRevRank(uuid: string): Promise<undefined|number> {
  return await new Promise((resolve, reject) => {
    REDIS_CLIENT.zrevrank(SCORES_KEY, uuid, (err, reply) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(reply);
    })
  })
}
