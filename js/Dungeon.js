const TILE = { VOID: 0, FLOOR: 1, WALL: 2, DOOR: 3, STAIRS: 4, TORCH: 5 };

const ENEMY_DEFS = {
  skeleton: {
    name: 'Skeleton',
    spriteKey: 'skeleton1',
    hp: 10, atk: 4, def: 0, xp: 5, goldMin: 1, goldMax: 3,
  },
  dark_skeleton: {
    name: 'Dark Skeleton',
    spriteKey: 'skeleton2',
    hp: 18, atk: 6, def: 2, xp: 10, goldMin: 2, goldMax: 5,
  },
  vampire: {
    name: 'Vampire',
    spriteKey: 'vampire',
    hp: 30, atk: 10, def: 3, xp: 20, goldMin: 5, goldMax: 12,
  },
};

const ITEM_DATA = {
  sword:     { type: 'weapon', name: 'Iron Sword',   atk: 5,  def: 0, frame: 0,  heal: 0 },
  longsword: { type: 'weapon', name: 'Long Sword',   atk: 8,  def: 0, frame: 1,  heal: 0 },
  axe:       { type: 'weapon', name: 'Battle Axe',   atk: 12, def: 0, frame: 2,  heal: 0 },
  dagger:    { type: 'weapon', name: 'Dagger',       atk: 3,  def: 0, frame: 3,  heal: 0 },
  shield:    { type: 'armor',  name: 'Shield',       atk: 0,  def: 3, frame: 12, heal: 0 },
  leather:   { type: 'armor',  name: 'Leather Vest', atk: 0,  def: 2, frame: 13, heal: 0 },
  chainmail: { type: 'armor',  name: 'Chain Mail',   atk: 0,  def: 5, frame: 14, heal: 0 },
  plate:     { type: 'armor',  name: 'Plate Armor',  atk: 0,  def: 8, frame: 15, heal: 0 },
  potion:    { type: 'potion', name: 'Health Potion',atk: 0,  def: 0, frame: 24, heal: 15 },
  elixir:    { type: 'potion', name: 'Elixir',       atk: 0,  def: 0, frame: 25, heal: 40 },
  scroll:    { type: 'scroll', name: 'Reveal Scroll',atk: 0,  def: 0, frame: 26, heal: 0  },
};

class SeededRng {
  constructor(seed) { this.s = seed >>> 0; }
  next() {
    this.s ^= this.s << 13;
    this.s ^= this.s >> 17;
    this.s ^= this.s << 5;
    return ((this.s >>> 0) / 4294967295);
  }
  between(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
}

class DungeonGenerator {
  generate(floor, seed) {
    this.rng = new SeededRng(seed);
    const W = 30, H = 30;
    const tiles = Array.from({ length: H }, () => Array(W).fill(TILE.VOID));

    const root = new BSPNode(1, 1, W - 2, H - 2);
    root.split(7, this.rng);
    root.createRoom(this.rng);
    root.connect(tiles, this.rng);

    const rooms = [];
    BSPNode.collectRooms(root, rooms);
    if (rooms.length === 0) {
      // Fallback: single room
      rooms.push({ x: 2, y: 2, w: 8, h: 8 });
    }

    rooms.forEach(r => {
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++)
          tiles[y][x] = TILE.FLOOR;
    });

    // Wall pass
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (tiles[y][x] === TILE.VOID) {
          const adj = [[0,-1],[0,1],[-1,0],[1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
          const near = adj.some(([dx,dy]) => {
            const nx=x+dx, ny=y+dy;
            return nx>=0 && ny>=0 && nx<W && ny<H && tiles[ny][nx]===TILE.FLOOR;
          });
          if (near) tiles[y][x] = TILE.WALL;
        }
      }
    }

    // Torches on walls above rooms
    rooms.forEach(r => {
      if (this.rng.next() < 0.7) {
        const tx = r.x + this.rng.between(0, r.w - 1);
        const ty = r.y - 1;
        if (ty >= 0 && tiles[ty][tx] === TILE.WALL) tiles[ty][tx] = TILE.TORCH;
      }
    });

    // Player start: first room center
    const fr = rooms[0];
    const playerStart = { x: Math.floor(fr.x + fr.w/2), y: Math.floor(fr.y + fr.h/2) };

    // Stairs: last room center
    const lr = rooms[rooms.length - 1];
    const stairsPos = { x: Math.floor(lr.x + lr.w/2), y: Math.floor(lr.y + lr.h/2) };
    tiles[stairsPos.y][stairsPos.x] = TILE.STAIRS;

    // Enemies in middle rooms
    const scale = 1 + (floor - 1) * 0.18;
    const entities = [];
    for (let i = 1; i < rooms.length - 1; i++) {
      const room = rooms[i];
      const count = this.rng.between(1, 2 + Math.floor(floor / 3));
      for (let j = 0; j < count; j++) {
        const type = this._enemyType(floor);
        const def = ENEMY_DEFS[type];
        const ex = this.rng.between(room.x + 1, Math.max(room.x + 1, room.x + room.w - 2));
        const ey = this.rng.between(room.y + 1, Math.max(room.y + 1, room.y + room.h - 2));
        if (tiles[ey] && tiles[ey][ex] === TILE.FLOOR) {
          entities.push({
            type, x: ex, y: ey,
            hp: Math.ceil(def.hp * scale), maxHp: Math.ceil(def.hp * scale),
            atk: Math.ceil(def.atk * scale), def: def.def,
            xp: def.xp, goldMin: def.goldMin, goldMax: def.goldMax,
            spriteKey: def.spriteKey, name: def.name, alive: true,
          });
        }
      }
    }

    // Items in rooms
    const items = [];
    for (let i = 0; i < rooms.length; i++) {
      if (this.rng.next() < 0.65) {
        const room = rooms[i];
        const ix = this.rng.between(room.x + 1, Math.max(room.x + 1, room.x + room.w - 2));
        const iy = this.rng.between(room.y + 1, Math.max(room.y + 1, room.y + room.h - 2));
        if (tiles[iy] && tiles[iy][ix] === TILE.FLOOR) {
          items.push({ type: this._itemType(floor), x: ix, y: iy });
        }
      }
    }

    return { tiles, rooms, playerStart, stairsPos, entities, items, w: W, h: H };
  }

  _enemyType(floor) {
    const r = this.rng.next();
    if (floor <= 3) return r < 0.65 ? 'skeleton' : 'dark_skeleton';
    if (floor <= 6) { if (r < 0.2) return 'skeleton'; if (r < 0.7) return 'dark_skeleton'; return 'vampire'; }
    return r < 0.3 ? 'dark_skeleton' : 'vampire';
  }

  _itemType(floor) {
    const r = this.rng.next();
    const wMax = Math.min(floor, 4), aMax = Math.min(floor, 4);
    if (r < 0.35) return 'potion';
    if (r < 0.50) return 'elixir';
    if (r < 0.70) return ['sword','longsword','axe','dagger'][this.rng.between(0, wMax - 1)];
    if (r < 0.88) return ['shield','leather','chainmail','plate'][this.rng.between(0, aMax - 1)];
    return 'scroll';
  }
}

class BSPNode {
  constructor(x, y, w, h) {
    this.x=x; this.y=y; this.w=w; this.h=h;
    this.left=null; this.right=null; this.room=null;
  }
  split(minSize, rng) {
    if (this.left || this.right) return;
    const horiz = this.w > this.h ? false : this.h > this.w ? true : rng.next() > 0.5;
    const size = horiz ? this.h : this.w;
    if (size < minSize * 2) return;
    const max = size - minSize;
    if (max <= minSize) return;
    const sp = minSize + Math.floor(rng.next() * (max - minSize + 1));
    if (horiz) {
      this.left  = new BSPNode(this.x, this.y,      this.w, sp);
      this.right = new BSPNode(this.x, this.y + sp, this.w, this.h - sp);
    } else {
      this.left  = new BSPNode(this.x,      this.y, sp,          this.h);
      this.right = new BSPNode(this.x + sp, this.y, this.w - sp, this.h);
    }
    this.left.split(minSize, rng);
    this.right.split(minSize, rng);
  }
  createRoom(rng) {
    if (this.left && this.right) { this.left.createRoom(rng); this.right.createRoom(rng); return; }
    const margin = 2;
    const rw = Math.max(4, Math.floor(3 + rng.next() * Math.max(1, this.w - 4)));
    const rh = Math.max(4, Math.floor(3 + rng.next() * Math.max(1, this.h - 4)));
    const rx = this.x + margin + Math.floor(rng.next() * Math.max(0, this.w - rw - margin));
    const ry = this.y + margin + Math.floor(rng.next() * Math.max(0, this.h - rh - margin));
    this.room = { x: rx, y: ry, w: Math.min(rw, this.x + this.w - rx - 1), h: Math.min(rh, this.y + this.h - ry - 1) };
  }
  getRoom() {
    if (this.room) return this.room;
    const l = this.left ? this.left.getRoom() : null;
    const r = this.right ? this.right.getRoom() : null;
    return l || r;
  }
  connect(tiles, rng) {
    if (!this.left || !this.right) return;
    this.left.connect(tiles, rng);
    this.right.connect(tiles, rng);
    const lr = this.left.getRoom(), rr = this.right.getRoom();
    if (lr && rr) carveCorridor(tiles,
      Math.floor(lr.x + lr.w/2), Math.floor(lr.y + lr.h/2),
      Math.floor(rr.x + rr.w/2), Math.floor(rr.y + rr.h/2));
  }
  static collectRooms(node, arr) {
    if (!node) return;
    if (node.room) arr.push(node.room);
    BSPNode.collectRooms(node.left, arr);
    BSPNode.collectRooms(node.right, arr);
  }
}

function carveCorridor(tiles, x1, y1, x2, y2) {
  const W = tiles[0].length, H = tiles.length;
  const mark = (x, y) => { if (x>=0&&y>=0&&x<W&&y<H) tiles[y][x] = TILE.FLOOR; };
  let x=x1, y=y1;
  while (x!==x2) { mark(x,y); x += x<x2?1:-1; }
  while (y!==y2) { mark(x,y); y += y<y2?1:-1; }
  mark(x,y);
}
