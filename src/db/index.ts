import redis from 'redis';
import { Room, Player, RoomState } from '../server/room';
import { replacer, reviver } from '../common/message';
import { ResolvePlugin } from 'webpack';
import { RoomSchema } from './schema';

const REDIS_CLIENT = redis.createClient() as RedisClient;
const PLAYERS: {[uuid: string]: Player} = {};
const ROOMS: {[uuid: string]: Room} = {};

type RedisFn = (err: Error, res: any) => void;

interface RedisClient {
  set: (key: string, value: string, f: RedisFn) => void,
  get: (key: string, f: RedisFn) => void,
  del: (key: string, f: RedisFn) => void,
}

export async function saveRoom (r: Room) {
  ROOMS[r.id] = r;
  return await new Promise((resolve, reject) => {
    REDIS_CLIENT.set(
      r.id,
      JSON.stringify(Room.freeze(r), replacer),
      err => {
        if (err) {
          reject(err);
          return;
        } 
        resolve();
      }
    );
  })
}

export function deleteRoom(rid: string) {
  delete ROOMS[rid];
  REDIS_CLIENT.del(rid, () => {});
}

export async function getRoom(id?: string): Promise<Room|undefined> {
  if (!id) return Promise.resolve(undefined);

  if (id in ROOMS) return Promise.resolve(ROOMS[id]);

  // Reconstruct room from DB
  return await new Promise((resolve, reject) => {
    REDIS_CLIENT.get(id, (err, reply) => {
      if (err) {
        reject(err);
        return;
      }
      const rs = JSON.parse(reply, reviver) as RoomSchema|undefined;
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
          const room = Room.thaw(players[0], players[1], rs);
          ROOMS[room.id] = room;
          resolve(room);
        }
      )
    })
  })
}

export async function savePlayer (p: Player) {
  PLAYERS[p.uuid] = p;
  return await new Promise((resolve, reject) => {
    REDIS_CLIENT.set(
      p.uuid,
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
    REDIS_CLIENT.get(id, (err, reply) => {
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