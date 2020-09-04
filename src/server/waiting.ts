import {Player} from './room';

class Waiting {
  open: Set<Player> = new Set<Player>();
  private: Map<string, {player: Player, variant?: string}> =
    new Map<string, {player: Player, variant?: string}>();

  addToOpen(player: Player) {
    this.open.add(player);
  }

  hasOpen(): boolean {
    return !!this.open.size;
  }

  popOpen(): Player | undefined {
    const first = Array.from(this.open)[0];
    if (!first) return;
    this.open.delete(first);
    return first;
  }

  addToPrivate(player: Player, password: string, variant?: string) {
    this.private.set(password, {player, variant});
  }

  popPrivate(password: string): {player: Player, variant?: string} | undefined {
    const entry = this.private.get(password);
    if (!entry) return;
    this.private.delete(password);
    return entry;
  }

  hasPlayer(player: Player): boolean {
    if (this.open.has(player)) return true;

    for (const [pass, p] of this.private) {
      if (p.player === player) {
        return true;
      }
    }
    return false;
  }

  add(player: Player, password?: string, variant?: string) {
    if (password) {
      return this.addToPrivate(player, password, variant);
    } else {
      return this.addToOpen(player);
    }
  }

  pop(password?: string): {player: Player, variant?: string} | undefined {
    if (password) {
      return this.popPrivate(password);
    } else {
      const player = this.popOpen();
      if (player) return {player};
    }
  }

  deletePlayer(player: Player): boolean {
    const wasInOpen = this.open.delete(player);
    if (wasInOpen) return true;
    for (const [pass, p] of this.private) {
      if (p.player === player) {
        this.private.delete(pass);
        return true;
      }
    }
    return false;
  }
}

export const WAITING = new Waiting();
