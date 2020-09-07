import redis from 'redis';
import { Room, Player, RoomState } from '../server/room';
import { replacer, reviver } from '../common/message';
import { ResolvePlugin } from 'webpack';
import { RoomSchema } from './schema';

const REDIS_CLIENT = redis.createClient() as RedisClient;
export const PLAYERS: {[uuid: string]: Player} = {};

type RedisFn = (err: Error, res: any) => void;

interface RedisClient {
  set: (key: string, value: string, f: RedisFn) => void,
  get: (key: string, f: RedisFn) => void,
  del: (key: string, f: RedisFn) => void,
}

export async function setRoom (r: Room) {
  return await new Promise((resolve, reject) => {
    if (r.state !== RoomState.PLAYING) {
      REDIS_CLIENT.del(r.id, (err) => {
        if (err) reject(err);
        resolve();
      });
    }
    // REDIS_CLIENT.set()
    REDIS_CLIENT.set(
      r.id,
      JSON.stringify(Room.freeze(r), replacer),
      err => {
        if (err) reject(err);
        resolve();
      }
    );
  })
}

export function deleteRoom(rid: string) {
  REDIS_CLIENT.del(rid, () => {});
}

export async function getRoomSchema (id: string): Promise<RoomSchema|undefined> {
  return await new Promise((resolve, reject) => {
    REDIS_CLIENT.get(id, (err, reply) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(reply, reviver));
      }
    })
  })
}

export async function setPlayer (p: Player) {
  PLAYERS[p.uuid] = p;
  return await new Promise((resolve, reject) => {
    REDIS_CLIENT.set(
      p.uuid,
      JSON.stringify({...p, socket: undefined}),
      (err) => {
        if (err) reject(err);
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
      } else {
        if (!reply) {
          resolve();
        }
        const player = JSON.parse(reply) as Player;
        resolve({
          ...player,
          socket: undefined,
        });
      }
    })
  })
}