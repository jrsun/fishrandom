import redis from 'redis';
import { Room, Player, RoomState } from '../server/room';
import { replacer, reviver } from '../common/message';
import { ResolvePlugin } from 'webpack';
import log from 'log';
import zlib from 'zlib';
import { RoomSchema } from './schema';

const REDIS_CLIENT = redis.createClient() as RedisClient;
const PLAYERS: {[uuid: string]: Player} = {};
const ROOMS: {[uuid: string]: Room} = {};

setInterval(() => {
  log.notice('Players:', Object.keys(PLAYERS).length);
}, 60 * 1000);

type RedisFn = (err: Error, res: any) => void;

interface RedisClient {
  set: (key: string, value: string, f: RedisFn) => void,
  get: (key: string, f: RedisFn) => void,
  del: (key: string, f: RedisFn) => void,
}

export async function saveRoom (r: Room) {
  ROOMS[r.id] = r;
  return await new Promise((resolve, reject) => {
    const s = JSON.stringify(Room.freeze(r), replacer);
    zlib.gzip(s, (err, buffer) => {
      if (err) {
        console.error('Failed to compress and save message %s', s);
        return;
      }
      REDIS_CLIENT.set(
        `room:${r.id}`,
        buffer.toString('base64'),
        err => {
          if (err) {
            reject(err);
            return;
          } 
          resolve();
        }
      );
    });
  })
}

export function deleteRoom(rid: string) {
  delete ROOMS[rid];
  REDIS_CLIENT.del(`room:${rid}`, () => {});
}

export async function getRoom(id?: string): Promise<Room|undefined> {
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
      }
      const zipped = Buffer.from(reply, 'base64');
      zlib.gunzip(zipped, (err, data) => {
        if (err) {
          reject(err);
        }
        let rs: RoomSchema|undefined;
        try {
          rs = JSON.parse(data.toString(), reviver) as RoomSchema|undefined;
        } catch (e) {
          reject(e);
        }
        if (!rs) {
          resolve();
          return;
        }
        const playerUuids = Object.keys(rs.players);
        Promise.all(playerUuids.map(uuid => getPlayer(uuid))).then(
          players => {
            if (players.length !== 2 || !players[0] || !players[1]) {
              console.error('attempted to get room without 2 players');
              resolve();
              return;
            }
            const room = Room.thaw(players[0], players[1], rs!);
            ROOMS[room.id] = room;
            resolve(room);
          }
        )
      });
    })
  })
}

export async function savePlayer (p: Player) {
  PLAYERS[p.uuid] = p;
  return await new Promise((resolve, reject) => {
    REDIS_CLIENT.set(
      `player:${p.uuid}`,
      JSON.stringify({...p, socket: undefined}),
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('created player', p.uuid);
        resolve();
      },
    )
  });
}

export async function getPlayer(id: string): Promise<Player|undefined> {
  if (id in PLAYERS) return Promise.resolve(PLAYERS[id]);

  return await new Promise((resolve, reject) => {
    REDIS_CLIENT.get(`player:${id}`, (err, reply) => {
      if (err) {
        reject(err);
        return;
      }
      if (!reply) {
        resolve();
      }
      const player = JSON.parse(reply) as Player;
      PLAYERS[id] = player;
      resolve({
        ...player,
        socket: undefined,
      });
    })
  })
}