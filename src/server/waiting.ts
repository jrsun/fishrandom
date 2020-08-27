import { Player } from "./room";

class Waiting {
  open: Set<Player> = new Set<Player>();
  private: Map<string, Player> = new Map<string, Player>();

  addToOpen(player: Player) {
    this.open.add(player);
  }

  hasOpen(): boolean {
    return !!this.open.size;
  }

  popOpen(): Player|undefined {
    const first = Array.from(this.open)[0];
    if (!first) return;
    this.open.delete(first);
    return first;
  }

  addToPrivate(player: Player, password: string) {
    this.private.set(password, player);
  }

  popPrivate(password: string): Player|undefined {
    const player = this.private.get(password);
    if (!player) return;
    this.private.delete(password);
    return player;
  }

  hasPlayer(player: Player): boolean {
    if (this.open.has(player)) return true;

    for (const [pass, p] of this.private) {
      if (p === player) {
        return true;
      }
    }
    return false;
  }

  add(player: Player, password?: string) {
    if (password) {
      return this.addToPrivate(player, password);
    } else {
      return this.addToOpen(player);
    }
  }

  pop(password?: string): Player|undefined {
    if (password) {
      return this.popPrivate(password);
    } else {
      return this.popOpen();
    }
  }

  deletePlayer(player: Player): boolean {
    const wasInOpen = this.open.delete(player);
    if (wasInOpen) return true;
    for (const [pass, p] of this.private) {
      if (p === player) {
        this.private.delete(pass);
        return true;
      }
    }
    return false;
  }
}

export const WAITING = new Waiting();
