// BSP dungeon generator — returns tiles[][], rooms[], entities[]
const TILE = { VOID: 0, FLOOR: 1, WALL: 2, DOOR: 3, STAIRS: 4, TORCH: 5, BLOOD: 6, BARREL: 7, FLOOR2: 8 };
const DIR = { N: { x: 0, y: -1 }, S: { x: 0, y: 1 }, E: { x: 1, y: 0 }, W: { x: -1, y: 0 } };

class Rect {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
  get cx() { return Math.floor(this.x + this.w / 2); }
  get cy() { return Math.floor(this.y + this.h / 2); }
  get right() { return this.x + this.w; }
  get bottom() { return this.y + this.h; }
  contains(x, y) { return x >= this.x && x < this.right && y >= this.y && y < this.bottom; }
}

class BSPNode {
  constructor(rect) {
    this.rect = rect;
    this.left = null;
    this.right = null;
    this.room = null;
  }

  split(minSize, rng) {
    if (this.left || this.right) return;
    const horiz = this.rect.h >= this.rect.w;
    const max = (horiz ? this.rect.h : this.rect.w) - minSize * 2;
    if (max < minSize) return;
    const split = minSize + Math.floor(rng() * (max - minSize + 1));
    if (horiz) {
      this.left  = new BSPNode(new Rect(this.rect.x, this.rect.y, this.rect.w, split));
      this.right = new BSPNode(new Rect(this.rect.x, this.rect.y + split, this.rect.w, this.rect.h - split));
    } else {
      this.left  = new BSPNode(new Rect(this.rect.x, this.rect.y, split, this.rect.h));
      this.right = new BSPNode(new Rect(this.rect.x + split, this.rect.y, this.rect.w - split, this.rect.h));
    }
    if (this.rect.w > minSize * 2.5 || this.rect.h > minSize * 2.5) {
      this.left.split(minSize, rng);
      this.right.split(minSize, rng);
    }
  }

  createRoom(rng) {
    if (this.left || this.right) {
      if (this.left)  this.left.createRoom(rng);
      if (this.right) this.right.createRoom(rng);
    } else {
      const pad = 2;
      const maxW = this.rect.w - pad * 2;
      const maxH = this.rect.h - pad * 2;
      const w = 4 + Math.floor(rng() * (maxW - 4));
      const h = 4 + Math.floor(rng() * (maxH - 4));
      const x = this.rect.x + pad + Math.floor(rng() * (maxW - w));
      const y = this.rect.y + pad + Math.floor(rng() * (maxH - h));
      this.room = new Rect(x, y, w, h);
    }
  }

  getRoom() {
    if (this.room) return this.room;
    const l = this.left  ? this.left.getRoom()  : null;
    const r = this.right ? this.right.getRoom() : null;
    if (!l) return r;
    if (!r) return l;
    return Math.random() < 0.5 ? l : r;
  }

  connect(tiles, rng) {
    if (this.left && this.right) {
      this.left.connect(tiles, rng);
      this.right.connect(tiles, rng);
      const a = this.left.getRoom();
      const b = this.right.getRoom();
      if (a && b) carveCorridorLShape(tiles, a.cx, a.cy, b.cx, b.cy);
    }
  }

  collectRooms(rooms) {
    if (this.room) { rooms.push(this.room); return; }
    if (this.left)  this.left.collectRooms(rooms);
    if (this.right) this.right.collectRooms(rooms);
  }
}

function carveCorridorLShape(tiles, x1, y1, x2, y2) {
  // horizontal first, then vertical
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let cx = x1;
  while (cx !== x2) {
    if (tiles[y1]) tiles[y1][cx] = TILE.FLOOR;
    cx += sx;
  }
  let cy = y1;
  while (cy !== y2) {
    if (tiles[cy]) tiles[cy][x2] = TILE.FLOOR;
    cy += sy;
  }
  if (tiles[y2]) tiles[y2][x2] = TILE.FLOOR;
}

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

class DungeonGenerator {
  constructor(width = 48, height = 48) {
    this.width = width;
    this.height = height;
  }

  generate(floor, seed) {
    const rand = rng(seed ^ (floor * 7919));
    const W = this.width;
    const H = this.height;

    // Init void
    const tiles = Array.from({ length: H }, () => Array(W).fill(TILE.VOID));

    // BSP
    const root = new BSPNode(new Rect(1, 1, W - 2, H - 2));
    root.split(8, rand);
    root.createRoom(rand);
    root.connect(tiles, rand);

    // Carve rooms into tiles
    const rooms = [];
    root.collectRooms(rooms);
    rooms.forEach(r => {
      for (let y = r.y; y < r.bottom; y++) {
        for (let x = r.x; x < r.right; x++) {
          tiles[y][x] = TILE.FLOOR;
        }
      }
    });

    // Build walls around all floor/corridor tiles
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (tiles[y][x] === TILE.VOID) {
          // if any neighbour is floor, make wall
          let hasFloor = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy, nx = x + dx;
              if (ny >= 0 && ny < H && nx >= 0 && nx < W && tiles[ny][nx] === TILE.FLOOR) {
                hasFloor = true;
              }
            }
          }
          if (hasFloor) tiles[y][x] = TILE.WALL;
        }
      }
    }

    // Place doors at corridor chokepoints (room exits)
    rooms.forEach(room => {
      const exits = this._findExits(tiles, room);
      exits.forEach(({ x, y }) => {
        if (rand() < 0.6) tiles[y][x] = TILE.DOOR;
      });
    });

    // Torches in rooms (1-2 per room)
    rooms.forEach(room => {
      if (rand() < 0.7) {
        tiles[room.y + 1][room.x + 1] = TILE.TORCH;
        if (rand() < 0.4) tiles[room.bottom - 2][room.right - 2] = TILE.TORCH;
      }
    });

    // Blood floor in some rooms
    rooms.forEach(room => {
      if (rand() < 0.3 + floor * 0.04) {
        const bx = room.x + 1 + Math.floor(rand() * (room.w - 2));
        const by = room.y + 1 + Math.floor(rand() * (room.h - 2));
        tiles[by][bx] = TILE.BLOOD;
      }
    });

    // Barrels
    rooms.forEach(room => {
      if (rand() < 0.4) {
        const bx = room.x + 1;
        const by = room.y + 1;
        if (tiles[by][bx] === TILE.FLOOR) tiles[by][bx] = TILE.BARREL;
      }
    });

    // Checkerboard floor in boss room
    const lastRoom = rooms[rooms.length - 1];
    if (floor % 5 === 0 && lastRoom) {
      for (let y = lastRoom.y; y < lastRoom.bottom; y++) {
        for (let x = lastRoom.x; x < lastRoom.right; x++) {
          if (tiles[y][x] === TILE.FLOOR && (x + y) % 2 === 0) {
            tiles[y][x] = TILE.FLOOR2;
          }
        }
      }
    }

    // Player start: center of first room
    const startRoom = rooms[0];
    const playerStart = { x: startRoom.cx, y: startRoom.cy };

    // Stairs: last room
    const stairsRoom = rooms[rooms.length - 1];
    const stairsPos = { x: stairsRoom.cx, y: stairsRoom.cy };
    tiles[stairsPos.y][stairsPos.x] = TILE.STAIRS;

    // Entities (enemies + items)
    const entities = this._placeEntities(tiles, rooms, playerStart, stairsPos, floor, rand);

    return { tiles, rooms, playerStart, stairsPos, entities, width: W, height: H };
  }

  _findExits(tiles, room) {
    const exits = [];
    const perimeter = [];
    for (let x = room.x - 1; x <= room.right; x++) {
      perimeter.push({ x, y: room.y - 1 });
      perimeter.push({ x, y: room.bottom });
    }
    for (let y = room.y; y < room.bottom; y++) {
      perimeter.push({ x: room.x - 1, y });
      perimeter.push({ x: room.right, y });
    }
    perimeter.forEach(({ x, y }) => {
      if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
        if (tiles[y] && tiles[y][x] === TILE.FLOOR) exits.push({ x, y });
      }
    });
    return exits;
  }

  _placeEntities(tiles, rooms, playerStart, stairsPos, floor, rand) {
    const entities = [];
    const enemyTypes = ['jester', 'mime', 'juggler', 'balloondog'];
    const bossTypes  = ['ringmaster'];

    // Skip first room (player spawn) and last room for basic enemies
    for (let ri = 1; ri < rooms.length - 1; ri++) {
      const room = rooms[ri];
      const count = 1 + Math.floor(rand() * (1 + Math.floor(floor / 3)));
      for (let i = 0; i < count; i++) {
        const ex = room.x + 1 + Math.floor(rand() * (room.w - 2));
        const ey = room.y + 1 + Math.floor(rand() * (room.h - 2));
        if (!this._isWalkable(tiles[ey]?.[ex])) continue;
        if (ex === playerStart.x && ey === playerStart.y) continue;
        const type = enemyTypes[Math.floor(rand() * enemyTypes.length)];
        entities.push(this._createEnemy(type, ex, ey, floor, rand));
      }
      // Items
      if (rand() < 0.45) {
        const ix = room.x + 1 + Math.floor(rand() * (room.w - 2));
        const iy = room.y + 1 + Math.floor(rand() * (room.h - 2));
        if (this._isWalkable(tiles[iy]?.[ix])) {
          entities.push(this._createItem(ix, iy, floor, rand));
        }
      }
    }

    // Boss on every 5th floor, in last room
    if (floor % 5 === 0) {
      const lastRoom = rooms[rooms.length - 1];
      entities.push(this._createEnemy('ringmaster', lastRoom.cx, lastRoom.cy + 1, floor, rand));
    }

    // Gold scatter
    rooms.forEach((room, ri) => {
      if (ri === 0) return;
      if (rand() < 0.5) {
        const gx = room.x + 1 + Math.floor(rand() * (room.w - 2));
        const gy = room.y + 1 + Math.floor(rand() * (room.h - 2));
        if (this._isWalkable(tiles[gy]?.[gx])) {
          entities.push({ kind: 'item', type: 'gold', x: gx, y: gy, value: 5 + Math.floor(rand() * 10 * floor) });
        }
      }
    });

    return entities;
  }

  _isWalkable(t) {
    return t === TILE.FLOOR || t === TILE.FLOOR2 || t === TILE.BLOOD;
  }

  _createEnemy(type, x, y, floor, rand) {
    const base = {
      jester:     { hp: 8,  maxHp: 8,  atk: 3,  def: 1, xp: 10, speed: 1,   ranged: false },
      mime:       { hp: 16, maxHp: 16, atk: 7,  def: 4, xp: 20, speed: 2,   ranged: false },
      juggler:    { hp: 12, maxHp: 12, atk: 5,  def: 2, xp: 15, speed: 1,   ranged: true  },
      balloondog: { hp: 6,  maxHp: 6,  atk: 2,  def: 0, xp: 8,  speed: 1,   ranged: false },
      ringmaster: { hp: 40, maxHp: 40, atk: 12, def: 6, xp: 100,speed: 1,   ranged: false },
    }[type];
    const scale = 1 + (floor - 1) * 0.15;
    return {
      kind: 'enemy', type, x, y,
      hp:    Math.round(base.hp    * scale),
      maxHp: Math.round(base.maxHp * scale),
      atk:   Math.round(base.atk   * scale),
      def:   Math.round(base.def   * scale),
      xp:    base.xp,
      speed: base.speed,
      ranged: base.ranged,
      stunned: 0,
      ticksSinceMove: 0,
    };
  }

  _createItem(x, y, floor, rand) {
    const WEAPONS = ['hammer', 'balloon_sword'];
    const ARMORS  = ['big_shoes', 'motley_armor'];
    const CONSUM  = ['cream_pie', 'seltzer', 'mystery_box'];
    const r = rand();
    let type, subtype;
    if (r < 0.3)      { subtype = 'weapon';     type = WEAPONS[Math.floor(rand() * WEAPONS.length)]; }
    else if (r < 0.5) { subtype = 'armor';      type = ARMORS[Math.floor(rand() * ARMORS.length)]; }
    else              { subtype = 'consumable';  type = CONSUM[Math.floor(rand() * CONSUM.length)]; }
    return { kind: 'item', type, subtype, x, y };
  }
}
