type Uuid = string;

class Waiting {
  open: Set<Uuid> = new Set<Uuid>();
  private: Map<string, {uuid: Uuid; variant?: string}> = new Map<
    string,
    {uuid: Uuid; variant?: string}
  >();

  private addToOpen(uuid: Uuid) {
    this.open.add(uuid);
  }

  private addToPrivate(uuid: Uuid, password: string, variant?: string) {
    this.private.set(password, {uuid, variant});
  }

  hasOpen(): boolean {
    return !!this.open.size;
  }

  popOpen(): Uuid | undefined {
    const first = Array.from(this.open)[0];
    if (!first) return;
    this.open.delete(first);
    return first;
  }

  popPrivate(password: string): {uuid: Uuid; variant?: string} | undefined {
    const entry = this.private.get(password);
    if (!entry) return;
    this.private.delete(password);
    return entry;
  }

  hasPlayer(uuid: Uuid): boolean {
    if (this.open.has(uuid)) return true;

    for (const [pass, p] of this.private) {
      if (p.uuid === uuid) {
        return true;
      }
    }
    return false;
  }

  add(uuid: Uuid, password?: string, variant?: string) {
    this.deletePlayer(uuid);
    if (password) {
      return this.addToPrivate(uuid, password, variant);
    } else {
      return this.addToOpen(uuid);
    }
  }

  pop(password?: string): {uuid: Uuid; variant?: string} | undefined {
    if (password) {
      return this.popPrivate(password);
    } else {
      const uuid = this.popOpen();
      if (uuid) return {uuid};
    }
  }

  deletePlayer(uuid: Uuid): boolean {
    const wasInOpen = this.open.delete(uuid);
    if (wasInOpen) return true;
    for (const [pass, p] of this.private) {
      if (p.uuid === uuid) {
        this.private.delete(pass);
        return true;
      }
    }
    return false;
  }
}

export const WAITING = new Waiting();
