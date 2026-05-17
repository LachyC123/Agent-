// Generates all game textures procedurally using Phaser Graphics.
// Each "sprite sheet" is a single texture with named frames.
const SpriteGen = {
  TS: 24, // tile size in pixels

  // palette
  C: {
    BLACK:    0x000000,
    VOID:     0x05000a,
    DARK:     0x0d0615,
    MID:      0x1a0e2a,
    STONE:    0x2a1e3a,
    STONE2:   0x3a2e4a,
    RED:      0xcc1111,
    RED2:     0xff3333,
    PINK:     0xff8888,
    SKIN:     0xffe0cc,
    SKIN2:    0xffbbaa,
    WHITE:    0xffffff,
    CREAM:    0xf5e6d0,
    YELLOW:   0xffee00,
    GOLD:     0xffaa00,
    ORANGE:   0xff6600,
    ORANGE2:  0xff9933,
    PURPLE:   0x660088,
    PURPLE2:  0xaa33cc,
    VIOLET:   0xcc66ff,
    BLUE:     0x1133aa,
    BLUE2:    0x3366dd,
    CYAN:     0x22aacc,
    GREEN:    0x226622,
    GREEN2:   0x44aa44,
    LIME:     0x88ff44,
    BROWN:    0x6b3a1f,
    BROWN2:   0x8b5a2b,
    GRAY:     0x666677,
    GRAY2:    0x998899,
    TAN:      0xaa9955,
    BLOOD:    0x8b0000,
    FLAME1:   0xff6600,
    FLAME2:   0xffcc00,
    BALLOON_R:0xff4466,
    BALLOON_B:0x44aaff,
    BALLOON_G:0x44ff88,
    BALLOON_Y:0xffee44,
  },

  init(scene) {
    this.generateTiles(scene);
    this.generatePlayer(scene);
    this.generateEnemies(scene);
    this.generateItems(scene);
    this.generateEffects(scene);
    this.generateUI(scene);
  },

  // Draw one "art pixel" (px,py in 8x8 grid coords) at screen offset (ox,oy)
  px(g, col, ox, oy, ps, px, py, w = 1, h = 1) {
    g.fillStyle(col, 1);
    g.fillRect(ox + px * ps, oy + py * ps, ps * w, ps * h);
  },

  // ── TILES ──────────────────────────────────────────────────────────────

  generateTiles(scene) {
    const TS = this.TS;
    const ps = TS / 8; // 3 px per art pixel
    const C = this.C;
    // 10 tiles in a row: floor, wall, door, stairs, torch, blood, void, fog, prop, floor2
    const W = TS * 10;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // TILE 0 — floor
    this.drawFloor(g, 0, 0, TS, ps, C);
    // TILE 1 — wall
    this.drawWall(g, TS, 0, TS, ps, C);
    // TILE 2 — door
    this.drawDoor(g, TS * 2, 0, TS, ps, C);
    // TILE 3 — stairs down
    this.drawStairs(g, TS * 3, 0, TS, ps, C);
    // TILE 4 — torch
    this.drawTorch(g, TS * 4, 0, TS, ps, C);
    // TILE 5 — blood floor
    this.drawBloodFloor(g, TS * 5, 0, TS, ps, C);
    // TILE 6 — void
    g.fillStyle(C.VOID, 1);
    g.fillRect(TS * 6, 0, TS, TS);
    // TILE 7 — fog of war
    g.fillStyle(C.DARK, 1);
    g.fillRect(TS * 7, 0, TS, TS);
    // TILE 8 — prop (broken barrel)
    this.drawBarrel(g, TS * 8, 0, TS, ps, C);
    // TILE 9 — floor2 (carnival flag floor)
    this.drawFloor2(g, TS * 9, 0, TS, ps, C);

    g.generateTexture('tiles', W, TS);
    g.destroy();

    const tex = scene.textures.get('tiles');
    const names = ['floor', 'wall', 'door', 'stairs', 'torch', 'blood', 'void', 'fog', 'barrel', 'floor2'];
    names.forEach((n, i) => tex.add(n, 0, i * TS, 0, TS, TS));
  },

  drawFloor(g, ox, oy, TS, ps, C) {
    g.fillStyle(C.MID, 1);
    g.fillRect(ox, oy, TS, TS);
    // subtle tile lines
    g.fillStyle(C.DARK, 1);
    g.fillRect(ox, oy, TS, 1);
    g.fillRect(ox, oy, 1, TS);
    // corner dots
    g.fillStyle(C.STONE, 0.6);
    g.fillRect(ox + 1, oy + 1, 2, 2);
    g.fillRect(ox + TS - 3, oy + TS - 3, 2, 2);
    // faint pentagram hint
    g.fillStyle(C.PURPLE, 0.4);
    g.fillRect(ox + ps * 3, oy + ps * 1, ps, ps);
    g.fillRect(ox + ps * 1, oy + ps * 4, ps, ps);
    g.fillRect(ox + ps * 5, oy + ps * 4, ps, ps);
    g.fillRect(ox + ps * 2, oy + ps * 6, ps, ps);
    g.fillRect(ox + ps * 4, oy + ps * 6, ps, ps);
  },

  drawWall(g, ox, oy, TS, ps, C) {
    g.fillStyle(C.STONE, 1);
    g.fillRect(ox, oy, TS, TS);
    // bricks
    g.fillStyle(C.DARK, 1);
    g.fillRect(ox, oy + ps * 2, TS, 1);
    g.fillRect(ox, oy + ps * 5, TS, 1);
    g.fillRect(ox + ps * 4, oy, 1, ps * 2);
    g.fillRect(ox + ps * 2, oy + ps * 2, 1, ps * 3);
    g.fillRect(ox + ps * 5, oy + ps * 5, 1, ps * 3);
    // highlight top
    g.fillStyle(C.STONE2, 1);
    g.fillRect(ox, oy, TS, 2);
    // blood drip
    g.fillStyle(C.BLOOD, 1);
    g.fillRect(ox + ps * 3, oy + ps * 1, ps - 1, ps * 3);
    g.fillRect(ox + ps * 3, oy + ps * 3, ps + 1, ps);
  },

  drawDoor(g, ox, oy, TS, ps, C) {
    g.fillStyle(C.BROWN, 1);
    g.fillRect(ox, oy, TS, TS);
    // planks
    g.fillStyle(C.BROWN2, 1);
    g.fillRect(ox + 2, oy, 7, TS);
    g.fillRect(ox + 13, oy, 7, TS);
    // iron bands
    g.fillStyle(C.GRAY, 1);
    g.fillRect(ox, oy + ps * 2, TS, 2);
    g.fillRect(ox, oy + ps * 5, TS, 2);
    // knocker
    g.fillStyle(C.GOLD, 1);
    g.fillRect(ox + ps * 3, oy + ps * 3, ps * 2, ps * 2);
    g.fillStyle(C.DARK, 1);
    g.fillRect(ox + ps * 3 + 2, oy + ps * 3 + 2, ps * 2 - 4, ps * 2 - 4);
    // clown face carved
    g.fillStyle(C.BROWN2, 1);
    g.fillRect(ox + ps * 5, oy + ps * 1, ps * 2, ps * 2);
    g.fillStyle(C.RED, 1);
    g.fillRect(ox + ps * 5 + 3, oy + ps * 1 + 4, 3, 3);
  },

  drawStairs(g, ox, oy, TS, ps, C) {
    g.fillStyle(C.MID, 1);
    g.fillRect(ox, oy, TS, TS);
    // spiral
    g.fillStyle(C.STONE, 1);
    g.fillRect(ox + ps, oy + ps * 2, ps * 6, ps);
    g.fillRect(ox + ps, oy + ps * 4, ps * 5, ps);
    g.fillRect(ox + ps, oy + ps * 6, ps * 4, ps);
    // edge highlight
    g.fillStyle(C.GRAY2, 1);
    g.fillRect(ox + ps, oy + ps * 2, ps * 6, 1);
    g.fillRect(ox + ps, oy + ps * 4, ps * 5, 1);
    g.fillRect(ox + ps, oy + ps * 6, ps * 4, 1);
    // center void
    g.fillStyle(C.DARK, 1);
    g.fillRect(ox + ps * 3, oy + ps * 3, ps * 2, ps * 2);
  },

  drawTorch(g, ox, oy, TS, ps, C) {
    g.fillStyle(C.MID, 1);
    g.fillRect(ox, oy, TS, TS);
    // bracket
    g.fillStyle(C.GRAY, 1);
    g.fillRect(ox + ps * 3, oy + ps * 4, ps * 2, ps * 3);
    g.fillRect(ox + ps * 2, oy + ps * 6, ps * 4, ps);
    // torch body
    g.fillStyle(C.BROWN, 1);
    g.fillRect(ox + ps * 3 + 2, oy + ps * 2, ps - 2, ps * 3);
    // flame
    g.fillStyle(C.FLAME2, 1);
    g.fillRect(ox + ps * 3, oy + ps, ps, ps);
    g.fillStyle(C.FLAME1, 1);
    g.fillRect(ox + ps * 3 - 2, oy + ps, ps + 4, ps * 2);
    g.fillStyle(C.YELLOW, 0.8);
    g.fillRect(ox + ps * 3 + 1, oy, ps - 2, ps);
  },

  drawBloodFloor(g, ox, oy, TS, ps, C) {
    this.drawFloor(g, ox, oy, TS, ps, C);
    // blood splatters
    g.fillStyle(C.BLOOD, 1);
    g.fillRect(ox + ps * 2, oy + ps * 3, ps * 2, ps);
    g.fillRect(ox + ps * 3, oy + ps * 2, ps, ps * 3);
    g.fillRect(ox + ps * 5, oy + ps * 5, ps, ps * 2);
    g.fillRect(ox + ps * 1, oy + ps * 6, ps * 2, ps);
    g.fillStyle(C.RED, 0.5);
    g.fillRect(ox + ps * 4, oy + ps * 4, ps * 3, ps * 2);
  },

  drawBarrel(g, ox, oy, TS, ps, C) {
    g.fillStyle(C.MID, 1);
    g.fillRect(ox, oy, TS, TS);
    g.fillStyle(C.BROWN, 1);
    g.fillRect(ox + ps, oy + ps, ps * 6, ps * 6);
    g.fillStyle(C.BROWN2, 1);
    g.fillRect(ox + ps + 1, oy + ps + 1, ps * 6 - 2, ps * 2 - 1);
    g.fillRect(ox + ps + 1, oy + ps * 4 + 1, ps * 6 - 2, ps * 2 - 1);
    g.fillStyle(C.GRAY, 1);
    g.fillRect(ox + ps, oy + ps * 3, ps * 6, 2);
    g.fillRect(ox + ps, oy + ps * 4, ps * 6, 2);
    // skull
    g.fillStyle(C.CREAM, 1);
    g.fillRect(ox + ps * 3, oy + ps * 2, ps * 2, ps * 2);
    g.fillStyle(C.DARK, 1);
    g.fillRect(ox + ps * 3 + 1, oy + ps * 2 + 2, 2, 2);
    g.fillRect(ox + ps * 4 + 1, oy + ps * 2 + 2, 2, 2);
  },

  drawFloor2(g, ox, oy, TS, ps, C) {
    g.fillStyle(C.MID, 1);
    g.fillRect(ox, oy, TS, TS);
    // checkerboard hint
    g.fillStyle(C.RED, 0.25);
    g.fillRect(ox, oy, ps * 2, ps * 2);
    g.fillRect(ox + ps * 4, oy, ps * 2, ps * 2);
    g.fillRect(ox + ps * 2, oy + ps * 2, ps * 2, ps * 2);
    g.fillRect(ox + ps * 6, oy + ps * 2, ps * 2, ps * 2);
    g.fillRect(ox, oy + ps * 4, ps * 2, ps * 2);
    g.fillRect(ox + ps * 4, oy + ps * 4, ps * 2, ps * 2);
    g.fillRect(ox + ps * 2, oy + ps * 6, ps * 2, ps * 2);
    g.fillRect(ox + ps * 6, oy + ps * 6, ps * 2, ps * 2);
    g.fillStyle(C.DARK, 1);
    g.fillRect(ox, oy, TS, 1);
    g.fillRect(ox, oy, 1, TS);
  },

  // ── PLAYER ─────────────────────────────────────────────────────────────

  generatePlayer(scene) {
    const TS = this.TS;
    const ps = TS / 8;
    const C = this.C;
    // 6 frames: idle, walk1, walk2, attack, hurt, dead
    const W = TS * 6;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    for (let i = 0; i < 6; i++) {
      this.drawPlayerFrame(g, TS * i, 0, TS, ps, C, i);
    }

    g.generateTexture('player', W, TS);
    g.destroy();

    const tex = scene.textures.get('player');
    ['idle', 'walk1', 'walk2', 'attack', 'hurt', 'dead'].forEach((n, i) => {
      tex.add(n, 0, i * TS, 0, TS, TS);
    });

    scene.anims.create({
      key: 'player-walk',
      frames: [{ key: 'player', frame: 'walk1' }, { key: 'player', frame: 'walk2' }],
      frameRate: 8,
      repeat: -1
    });
    scene.anims.create({
      key: 'player-idle',
      frames: [{ key: 'player', frame: 'idle' }],
      frameRate: 1,
      repeat: -1
    });
    scene.anims.create({
      key: 'player-attack',
      frames: [{ key: 'player', frame: 'attack' }],
      frameRate: 8,
      repeat: 0
    });
    scene.anims.create({
      key: 'player-hurt',
      frames: [{ key: 'player', frame: 'hurt' }],
      frameRate: 8,
      repeat: 0
    });
  },

  drawPlayerFrame(g, ox, oy, TS, ps, C, frame) {
    // Hat (jester two-color pointed)
    const hatL = frame === 3 ? C.PURPLE : C.RED;
    const hatR = frame === 3 ? C.GREEN2 : C.YELLOW;
    g.fillStyle(hatL, 1);
    g.fillRect(ox + ps * 1, oy, ps * 2, ps * 2);
    g.fillRect(ox + ps * 1, oy + ps * 2, ps, ps);
    g.fillStyle(hatR, 1);
    g.fillRect(ox + ps * 4, oy, ps * 2, ps * 2);
    g.fillRect(ox + ps * 5, oy + ps * 2, ps, ps);
    g.fillStyle(C.GOLD, 1);
    g.fillRect(ox + ps * 2, oy + ps * 2, ps * 4, ps);
    // pompoms
    g.fillStyle(hatL === C.RED ? C.YELLOW : C.RED, 1);
    g.fillRect(ox + ps, oy - ps + 2, ps + 1, ps + 1);
    g.fillRect(ox + ps * 5, oy - ps + 2, ps + 1, ps + 1);

    // Face
    g.fillStyle(C.WHITE, 1);
    g.fillRect(ox + ps * 2, oy + ps * 3, ps * 4, ps * 2);
    // Eyes
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2 + 2, oy + ps * 3 + 2, ps - 1, ps - 1);
    g.fillRect(ox + ps * 5 - 1, oy + ps * 3 + 2, ps - 1, ps - 1);
    // Teardrop (dark)
    g.fillStyle(C.BLUE2, 1);
    g.fillRect(ox + ps * 2 + 2, oy + ps * 4 + 1, ps - 2, ps - 2);
    // Red nose
    g.fillStyle(C.RED2, 1);
    g.fillRect(ox + ps * 3 + 1, oy + ps * 4, ps + 1, ps);

    // Mouth (twisted grin)
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2 + 1, oy + ps * 5 - 1, ps * 4 - 1, 2);
    g.fillStyle(C.RED, 1);
    g.fillRect(ox + ps * 2 + 2, oy + ps * 5, ps, 2);
    g.fillRect(ox + ps * 4 + 1, oy + ps * 5, ps, 2);

    // Body (diamond pattern)
    const bodyY = oy + ps * 5;
    g.fillStyle(C.RED, 1);
    g.fillRect(ox + ps * 2, bodyY, ps * 4, ps * 2);
    g.fillStyle(C.YELLOW, 0.7);
    g.fillRect(ox + ps * 3, bodyY, ps * 2, ps);
    g.fillRect(ox + ps * 2, bodyY + ps, ps, ps);
    g.fillRect(ox + ps * 5, bodyY + ps, ps, ps);

    // Legs — vary by frame for walk animation
    const legOff1 = (frame === 1) ? -ps : (frame === 2) ? ps : 0;
    const legOff2 = -legOff1;
    g.fillStyle(C.PURPLE, 1);
    g.fillRect(ox + ps * 2, bodyY + ps * 2, ps + 1, ps);
    g.fillRect(ox + ps * 5 - 1, bodyY + ps * 2, ps + 1, ps);
    // Huge clown shoes
    g.fillStyle(C.RED, 1);
    g.fillRect(ox + ps * 1 + legOff1, bodyY + ps * 3, ps * 3, ps);
    g.fillRect(ox + ps * 4 + legOff2, bodyY + ps * 3, ps * 3, ps);

    // Attack pose: arm raised
    if (frame === 3) {
      g.fillStyle(C.GOLD, 1);
      g.fillRect(ox + ps * 6, bodyY, ps * 2, ps);
      g.fillRect(ox + ps * 6, bodyY - ps, ps, ps * 2);
    }
    // Hurt: flash white
    if (frame === 4) {
      g.fillStyle(C.WHITE, 0.5);
      g.fillRect(ox + ps * 2, oy + ps * 3, ps * 4, ps * 5);
    }
    // Dead: fallen
    if (frame === 5) {
      g.fillStyle(C.BLOOD, 0.6);
      g.fillRect(ox, oy + ps * 6, TS, ps * 2);
    }
  },

  // ── ENEMIES ────────────────────────────────────────────────────────────

  generateEnemies(scene) {
    const TS = this.TS;
    const ps = TS / 8;
    const C = this.C;
    // 5 enemy types × 3 frames = 15 columns
    // Types: jester, mime, juggler, balloondog, ringmaster
    const TYPES = 5;
    const FRAMES = 3;
    const W = TS * TYPES * FRAMES;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    const drawers = [
      this.drawJester.bind(this),
      this.drawMime.bind(this),
      this.drawJuggler.bind(this),
      this.drawBalloonDog.bind(this),
      this.drawRingmaster.bind(this),
    ];
    const names = ['jester', 'mime', 'juggler', 'balloondog', 'ringmaster'];

    drawers.forEach((draw, ti) => {
      for (let fi = 0; fi < FRAMES; fi++) {
        draw(g, TS * (ti * FRAMES + fi), 0, TS, ps, C, fi);
      }
    });

    g.generateTexture('enemies', W, TS);
    g.destroy();

    const tex = scene.textures.get('enemies');
    names.forEach((name, ti) => {
      for (let fi = 0; fi < FRAMES; fi++) {
        tex.add(`${name}_${fi}`, 0, TS * (ti * FRAMES + fi), 0, TS, TS);
      }
    });

    // Animations
    names.forEach((name, ti) => {
      scene.anims.create({
        key: `${name}-walk`,
        frames: [
          { key: 'enemies', frame: `${name}_0` },
          { key: 'enemies', frame: `${name}_1` },
        ],
        frameRate: 6,
        repeat: -1
      });
      scene.anims.create({
        key: `${name}-hurt`,
        frames: [{ key: 'enemies', frame: `${name}_2` }],
        frameRate: 2,
        repeat: 0
      });
    });
  },

  drawJester(g, ox, oy, TS, ps, C, frame) {
    // Two-pronged hat (green/purple)
    g.fillStyle(C.GREEN2, 1);
    g.fillRect(ox + ps * 1, oy, ps * 2, ps * 2);
    g.fillStyle(C.PURPLE2, 1);
    g.fillRect(ox + ps * 5, oy, ps * 2, ps * 2);
    g.fillStyle(C.GOLD, 1);
    g.fillRect(ox + ps * 2, oy + ps * 2, ps * 4, ps);
    // bell tips
    g.fillStyle(C.GOLD, 1);
    g.fillRect(ox + ps, oy - 2, ps, ps);
    g.fillRect(ox + ps * 6, oy - 2, ps, ps);
    // face - pale/gaunt
    g.fillStyle(C.SKIN, 1);
    g.fillRect(ox + ps * 2, oy + ps * 3, ps * 4, ps * 2);
    // deep black eyes
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2 + 1, oy + ps * 3 + 2, ps, ps);
    g.fillRect(ox + ps * 5, oy + ps * 3 + 2, ps, ps);
    // stitched mouth
    g.fillStyle(C.RED, 1);
    g.fillRect(ox + ps * 2 + 2, oy + ps * 4 + 2, ps * 3, 2);
    g.fillStyle(C.DARK, 1);
    g.fillRect(ox + ps * 3, oy + ps * 4, 1, ps);
    g.fillRect(ox + ps * 4 + 1, oy + ps * 4, 1, ps);
    // bells
    g.fillStyle(C.GREEN2, 1);
    g.fillRect(ox + ps * 2, oy + ps * 5, ps * 4, ps * 2);
    // walk bob
    const bob = (frame === 1) ? 1 : 0;
    g.fillStyle(C.PURPLE2, 1);
    g.fillRect(ox + ps * 2, oy + ps * 6 + bob, ps + 1, ps);
    g.fillRect(ox + ps * 5 - 1, oy + ps * 6 + bob, ps + 1, ps);
    // hurt flash
    if (frame === 2) {
      g.fillStyle(C.WHITE, 0.4);
      g.fillRect(ox, oy, TS, TS);
    }
  },

  drawMime(g, ox, oy, TS, ps, C, frame) {
    // Beret
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2, oy, ps * 4, ps);
    g.fillRect(ox + ps, oy + ps, ps * 6, ps);
    // face - pure white
    g.fillStyle(C.WHITE, 1);
    g.fillRect(ox + ps * 2, oy + ps * 2, ps * 4, ps * 3);
    // black outlined eyes
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2, oy + ps * 2, ps + 1, ps + 1);
    g.fillRect(ox + ps * 5, oy + ps * 2, ps + 1, ps + 1);
    g.fillStyle(C.WHITE, 1);
    g.fillRect(ox + ps * 2 + 1, oy + ps * 2 + 1, ps - 1, ps - 1);
    g.fillRect(ox + ps * 5 + 1, oy + ps * 2 + 1, ps - 1, ps - 1);
    // mime tear
    g.fillStyle(C.BLUE2, 1);
    g.fillRect(ox + ps * 2 + 1, oy + ps * 3 + 1, 2, ps);
    // frown
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2 + 2, oy + ps * 4 + 1, ps * 3, 2);
    g.fillRect(ox + ps * 2 + 1, oy + ps * 4, 2, 2);
    g.fillRect(ox + ps * 5 + 1, oy + ps * 4, 2, 2);
    // striped body
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2, oy + ps * 5, ps * 4, ps * 2);
    g.fillStyle(C.WHITE, 1);
    g.fillRect(ox + ps * 3, oy + ps * 5, ps, ps * 2);
    g.fillRect(ox + ps * 5, oy + ps * 5, ps, ps * 2);
    // legs
    const step = (frame === 1) ? ps : 0;
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2, oy + ps * 7 - step, ps + 1, ps + step);
    g.fillRect(ox + ps * 5 - 1, oy + ps * 7 + step, ps + 1, ps - step);
    if (frame === 2) {
      g.fillStyle(C.WHITE, 0.4);
      g.fillRect(ox, oy, TS, TS);
    }
  },

  drawJuggler(g, ox, oy, TS, ps, C, frame) {
    // Flame-colored wild hair
    g.fillStyle(C.ORANGE, 1);
    g.fillRect(ox + ps, oy, ps * 6, ps * 2);
    g.fillStyle(C.RED, 1);
    g.fillRect(ox, oy + ps, ps, ps * 2);
    g.fillRect(ox + ps * 7, oy + ps, ps, ps * 2);
    // face
    g.fillStyle(C.SKIN2, 1);
    g.fillRect(ox + ps * 2, oy + ps * 2, ps * 4, ps * 3);
    // wild wide eyes
    g.fillStyle(C.YELLOW, 1);
    g.fillRect(ox + ps * 2, oy + ps * 2 + 1, ps + 1, ps);
    g.fillRect(ox + ps * 5, oy + ps * 2 + 1, ps + 1, ps);
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2 + 2, oy + ps * 2 + 2, ps - 2, ps - 2);
    g.fillRect(ox + ps * 5 + 2, oy + ps * 2 + 2, ps - 2, ps - 2);
    // maniacal grin
    g.fillStyle(C.RED, 1);
    g.fillRect(ox + ps * 2 + 1, oy + ps * 4, ps * 4 - 1, ps - 1);
    g.fillStyle(C.WHITE, 1);
    g.fillRect(ox + ps * 3, oy + ps * 4 + 1, ps, ps - 2);
    g.fillRect(ox + ps * 4 + 1, oy + ps * 4 + 1, ps, ps - 2);
    // vest
    g.fillStyle(C.VIOLET, 1);
    g.fillRect(ox + ps * 2, oy + ps * 5, ps * 4, ps * 2);
    g.fillStyle(C.GOLD, 1);
    g.fillRect(ox + ps * 3, oy + ps * 5, ps * 2, 2);
    g.fillRect(ox + ps * 3, oy + ps * 6, ps * 2, 2);
    // juggling balls
    const ballOff = (frame === 0) ? -ps : (frame === 1) ? 0 : ps;
    g.fillStyle(C.BALLOON_R, 1);
    g.fillRect(ox + ps * 1, oy + ps * 2 + ballOff, ps, ps);
    g.fillStyle(C.BALLOON_B, 1);
    g.fillRect(ox + ps * 6, oy + ps * 3 - ballOff, ps, ps);
    g.fillStyle(C.BALLOON_G, 1);
    g.fillRect(ox + ps * 3, oy + ps + ballOff / 2, ps, ps);
    if (frame === 2) {
      g.fillStyle(C.WHITE, 0.4);
      g.fillRect(ox, oy, TS, TS);
    }
  },

  drawBalloonDog(g, ox, oy, TS, ps, C, frame) {
    const col = frame === 2 ? C.PINK : C.BALLOON_R;
    // body (balloon twist)
    g.fillStyle(col, 1);
    g.fillRect(ox + ps * 2, oy + ps * 3, ps * 5, ps * 3);
    // head balloon
    g.fillRect(ox + ps * 2, oy + ps * 1, ps * 3, ps * 3);
    // ears
    g.fillRect(ox + ps * 1, oy + ps, ps * 2, ps * 2);
    g.fillRect(ox + ps * 4, oy + ps, ps * 2, ps * 2);
    // legs
    const step = (frame === 1) ? ps : 0;
    g.fillRect(ox + ps * 2, oy + ps * 6, ps, ps + step);
    g.fillRect(ox + ps * 3 + 1, oy + ps * 6, ps, ps - step + 1);
    g.fillRect(ox + ps * 5, oy + ps * 6, ps, ps + step);
    // tail
    g.fillStyle(C.BALLOON_Y, 1);
    g.fillRect(ox + ps * 6, oy + ps * 3, ps * 2, ps);
    // dot eyes & nose
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2 + 2, oy + ps * 1 + 3, 2, 2);
    g.fillRect(ox + ps * 3 + 2, oy + ps * 1 + 3, 2, 2);
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 3, oy + ps * 3, ps, 2);
    if (frame === 2) {
      g.fillStyle(C.WHITE, 0.4);
      g.fillRect(ox, oy, TS, TS);
    }
  },

  drawRingmaster(g, ox, oy, TS, ps, C, frame) {
    // tall top hat
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2, oy, ps * 4, ps * 3);
    g.fillStyle(C.RED, 1);
    g.fillRect(ox + ps, oy + ps * 2, ps * 6, ps);
    g.fillRect(ox + ps, oy + ps * 3, ps * 6, ps);
    // pale gaunt face
    g.fillStyle(C.SKIN, 1);
    g.fillRect(ox + ps * 2, oy + ps * 3, ps * 4, ps * 2);
    // sunken eyes
    g.fillStyle(C.DARK, 1);
    g.fillRect(ox + ps * 2, oy + ps * 3, ps, ps);
    g.fillRect(ox + ps * 5, oy + ps * 3, ps, ps);
    g.fillStyle(C.RED, 1);
    g.fillRect(ox + ps * 2 + 1, oy + ps * 3 + 1, ps - 2, ps - 2);
    g.fillRect(ox + ps * 5 + 1, oy + ps * 3 + 1, ps - 2, ps - 2);
    // thin moustache
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2 + 2, oy + ps * 4 + 2, ps, 1);
    g.fillRect(ox + ps * 4 + 2, oy + ps * 4 + 2, ps, 1);
    // red coat
    g.fillStyle(C.RED, 1);
    g.fillRect(ox + ps * 1, oy + ps * 5, ps * 6, ps * 2);
    g.fillStyle(C.GOLD, 1);
    g.fillRect(ox + ps * 3 + 1, oy + ps * 5, ps * 2 - 1, ps * 2);
    // epaulettes
    g.fillStyle(C.GOLD, 1);
    g.fillRect(ox + ps, oy + ps * 5, ps + 1, ps - 1);
    g.fillRect(ox + ps * 6, oy + ps * 5, ps + 1, ps - 1);
    // whip arm (frame 1 = raised)
    if (frame === 1) {
      g.fillStyle(C.BROWN, 1);
      g.fillRect(ox + ps * 7, oy + ps * 3, ps, ps * 3);
    }
    // legs
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox + ps * 2, oy + ps * 7, ps + 1, ps);
    g.fillRect(ox + ps * 5 - 1, oy + ps * 7, ps + 1, ps);
    if (frame === 2) {
      g.fillStyle(C.WHITE, 0.5);
      g.fillRect(ox, oy, TS, TS);
    }
  },

  // ── ITEMS ──────────────────────────────────────────────────────────────

  generateItems(scene) {
    const TS = this.TS;
    const ps = TS / 8;
    const C = this.C;
    // Items: hammer, balloon_sword, cream_pie, seltzer, big_shoes, motley_armor, mystery_box, gold
    const ITEM_NAMES = ['hammer', 'balloon_sword', 'cream_pie', 'seltzer', 'big_shoes', 'motley_armor', 'mystery_box', 'gold'];
    const W = TS * ITEM_NAMES.length;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    this.drawHammer(g, 0, 0, TS, ps, C);
    this.drawBalloonSword(g, TS, 0, TS, ps, C);
    this.drawCreamPie(g, TS * 2, 0, TS, ps, C);
    this.drawSeltzer(g, TS * 3, 0, TS, ps, C);
    this.drawBigShoes(g, TS * 4, 0, TS, ps, C);
    this.drawMotleyArmor(g, TS * 5, 0, TS, ps, C);
    this.drawMysteryBox(g, TS * 6, 0, TS, ps, C);
    this.drawGold(g, TS * 7, 0, TS, ps, C);

    g.generateTexture('items', W, TS);
    g.destroy();

    const tex = scene.textures.get('items');
    ITEM_NAMES.forEach((n, i) => tex.add(n, 0, i * TS, 0, TS, TS));
  },

  drawHammer(g, ox, oy, TS, ps, C) {
    g.fillStyle(C.BROWN, 1);
    g.fillRect(ox + ps * 3, oy + ps * 2, ps * 2, ps * 6);
    g.fillStyle(C.GRAY, 1);
    g.fillRect(ox + ps, oy + ps, ps * 6, ps * 3);
    g.fillStyle(C.GRAY2, 1);
    g.fillRect(ox + ps + 1, oy + ps + 1, ps * 6 - 2, ps);
    g.fillStyle(C.RED, 1);
    g.fillRect(ox + ps * 2, oy + ps * 2, ps, ps);
    g.fillRect(ox + ps * 5, oy + ps * 2, ps, ps);
  },

  drawBalloonSword(g, ox, oy, TS, ps, C) {
    // balloon segments making a sword
    g.fillStyle(C.BALLOON_R, 1);
    g.fillRect(ox + ps * 3, oy + ps, ps * 2, ps * 3);
    g.fillStyle(C.BALLOON_B, 1);
    g.fillRect(ox + ps * 3, oy + ps * 4, ps * 2, ps * 2);
    // guard
    g.fillStyle(C.BALLOON_Y, 1);
    g.fillRect(ox + ps, oy + ps * 4, ps * 6, ps);
    // tip
    g.fillStyle(C.BALLOON_G, 1);
    g.fillRect(ox + ps * 3 + 2, oy, ps - 2, ps);
    // knot handle
    g.fillStyle(C.BALLOON_R, 0.7);
    g.fillRect(ox + ps * 3, oy + ps * 6, ps * 2, ps * 2);
  },

  drawCreamPie(g, ox, oy, TS, ps, C) {
    // pie tin
    g.fillStyle(C.GRAY, 1);
    g.fillRect(ox + ps, oy + ps * 5, ps * 6, ps * 2);
    // cream
    g.fillStyle(C.WHITE, 1);
    g.fillRect(ox + ps * 2, oy + ps * 2, ps * 4, ps * 4);
    g.fillRect(ox + ps, oy + ps * 3, ps * 6, ps * 3);
    // peak
    g.fillRect(ox + ps * 3, oy + ps, ps * 2, ps * 2);
    g.fillRect(ox + ps * 3 + 1, oy, ps, ps);
    // cherry
    g.fillStyle(C.RED2, 1);
    g.fillRect(ox + ps * 3 + 1, oy + ps, ps, ps);
  },

  drawSeltzer(g, ox, oy, TS, ps, C) {
    // bottle
    g.fillStyle(C.CYAN, 1);
    g.fillRect(ox + ps * 2, oy + ps * 3, ps * 4, ps * 5);
    // neck
    g.fillStyle(C.CYAN, 0.8);
    g.fillRect(ox + ps * 3, oy + ps * 2, ps * 2, ps * 2);
    // nozzle
    g.fillStyle(C.GRAY, 1);
    g.fillRect(ox + ps * 3 + 1, oy + ps, ps, ps * 2);
    // label
    g.fillStyle(C.WHITE, 0.8);
    g.fillRect(ox + ps * 2 + 1, oy + ps * 4, ps * 4 - 2, ps * 2);
    g.fillStyle(C.BLUE, 1);
    g.fillRect(ox + ps * 3, oy + ps * 4 + 2, ps * 2, ps - 2);
    // shine
    g.fillStyle(C.WHITE, 0.6);
    g.fillRect(ox + ps * 5, oy + ps * 3, ps, ps * 2);
  },

  drawBigShoes(g, ox, oy, TS, ps, C) {
    g.fillStyle(C.RED, 1);
    g.fillRect(ox, oy + ps * 4, TS, ps * 4);
    // round toe
    g.fillStyle(C.RED2, 1);
    g.fillRect(ox + ps * 5, oy + ps * 3, ps * 3, ps * 4);
    // sole
    g.fillStyle(C.BLACK, 1);
    g.fillRect(ox, oy + ps * 7, TS, ps);
    // laces
    g.fillStyle(C.WHITE, 1);
    g.fillRect(ox + ps * 1, oy + ps * 4, ps * 4, ps);
    g.fillRect(ox + ps * 2, oy + ps * 5, ps * 2, ps);
    g.fillStyle(C.YELLOW, 1);
    g.fillRect(ox + ps * 2, oy + ps * 4 + 2, ps, 3);
    g.fillRect(ox + ps * 4, oy + ps * 4 + 2, ps, 3);
  },

  drawMotleyArmor(g, ox, oy, TS, ps, C) {
    // chest base
    g.fillStyle(C.RED, 1);
    g.fillRect(ox + ps, oy + ps, ps * 6, ps * 6);
    // diamond patches
    g.fillStyle(C.YELLOW, 0.9);
    g.fillRect(ox + ps * 2, oy + ps * 2, ps * 2, ps * 2);
    g.fillRect(ox + ps * 5, oy + ps * 4, ps * 2, ps * 2);
    g.fillStyle(C.GREEN2, 0.9);
    g.fillRect(ox + ps * 4, oy + ps * 2, ps * 2, ps * 2);
    g.fillRect(ox + ps * 2, oy + ps * 5, ps * 2, ps);
    // shoulder bells
    g.fillStyle(C.GOLD, 1);
    g.fillRect(ox, oy + ps, ps * 2, ps * 2);
    g.fillRect(ox + ps * 6, oy + ps, ps * 2, ps * 2);
    // collar
    g.fillStyle(C.WHITE, 1);
    g.fillRect(ox + ps * 2, oy + ps, ps * 4, ps);
  },

  drawMysteryBox(g, ox, oy, TS, ps, C) {
    // box
    g.fillStyle(C.PURPLE, 1);
    g.fillRect(ox + ps, oy + ps * 2, ps * 6, ps * 5);
    // question mark face
    g.fillStyle(C.YELLOW, 1);
    g.fillRect(ox + ps * 3, oy + ps * 3, ps * 2, ps);
    g.fillRect(ox + ps * 4, oy + ps * 3, ps, ps);
    g.fillRect(ox + ps * 4, oy + ps * 4, ps, ps);
    g.fillRect(ox + ps * 3, oy + ps * 5, ps, ps);
    g.fillRect(ox + ps * 3, oy + ps * 6, ps, ps);
    // lid
    g.fillStyle(C.PURPLE2, 1);
    g.fillRect(ox, oy + ps * 2, TS, ps);
    // ribbon
    g.fillStyle(C.BALLOON_R, 1);
    g.fillRect(ox + ps * 3 + 1, oy + ps * 2, ps * 2, ps * 5);
    g.fillStyle(C.BALLOON_R, 1);
    g.fillRect(ox + ps, oy + ps * 3, ps * 6, ps);
  },

  drawGold(g, ox, oy, TS, ps, C) {
    g.fillStyle(C.GOLD, 1);
    g.fillRect(ox + ps * 2, oy + ps * 2, ps * 4, ps * 4);
    g.fillStyle(C.YELLOW, 1);
    g.fillRect(ox + ps * 3, oy + ps, ps * 2, ps * 6);
    g.fillRect(ox + ps, oy + ps * 3, ps * 6, ps * 2);
    g.fillStyle(C.ORANGE, 0.6);
    g.fillRect(ox + ps * 3, oy + ps * 3, ps * 2, ps * 2);
    // shine
    g.fillStyle(C.WHITE, 0.8);
    g.fillRect(ox + ps * 5, oy + ps * 2, ps, ps);
  },

  // ── EFFECTS ────────────────────────────────────────────────────────────

  generateEffects(scene) {
    const TS = this.TS;
    const ps = TS / 8;
    const C = this.C;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    // 4 effects: hit, heal, death, level_up
    const W = TS * 4;
    // hit
    g.fillStyle(C.RED2, 0.9);
    g.fillRect(0, 0, TS, TS);
    g.fillStyle(C.YELLOW, 1);
    g.fillRect(ps, ps, ps, ps);
    g.fillRect(ps * 3, 0, ps * 2, ps * 2);
    g.fillRect(ps * 6, ps, ps, ps);
    g.fillRect(ps * 3, ps * 6, ps * 2, ps * 2);
    g.fillRect(0, ps * 3, ps * 2, ps * 2);
    g.fillRect(ps * 6, ps * 3, ps * 2, ps * 2);
    // heal
    g.fillStyle(C.GREEN2, 0.9);
    g.fillRect(TS, 0, TS, TS);
    g.fillStyle(C.WHITE, 0.9);
    g.fillRect(TS + ps * 3, ps, ps * 2, ps * 6);
    g.fillRect(TS + ps, ps * 3, ps * 6, ps * 2);
    // death
    g.fillStyle(C.BLOOD, 0.9);
    g.fillRect(TS * 2, 0, TS, TS);
    g.fillStyle(C.BLACK, 0.7);
    g.fillRect(TS * 2, 0, TS, TS);
    g.fillStyle(C.RED, 0.6);
    for (let i = 0; i < 5; i++) {
      g.fillRect(TS * 2 + ps * i, ps * (i % 3), ps, ps * 2);
    }
    // level up
    g.fillStyle(C.YELLOW, 1);
    g.fillRect(TS * 3, 0, TS, TS);
    g.fillStyle(C.GOLD, 0.8);
    g.fillRect(TS * 3 + ps * 2, ps, ps * 4, ps * 6);
    g.fillRect(TS * 3 + ps, ps * 3, ps * 6, ps * 2);
    g.fillStyle(C.WHITE, 0.9);
    g.fillRect(TS * 3 + ps * 3, 0, ps * 2, ps * 2);

    g.generateTexture('effects', W, TS);
    g.destroy();

    const tex = scene.textures.get('effects');
    ['hit', 'heal', 'death', 'levelup'].forEach((n, i) => {
      tex.add(n, 0, i * TS, 0, TS, TS);
    });
  },

  // ── UI ELEMENTS ────────────────────────────────────────────────────────

  generateUI(scene) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const C = this.C;
    const bs = 60; // button size

    // D-pad buttons: up, down, left, right, wait (center)
    const buttons = [
      { name: 'btn_up',    x: bs,       y: 0,        w: bs, h: bs },
      { name: 'btn_down',  x: bs,       y: bs * 2,   w: bs, h: bs },
      { name: 'btn_left',  x: 0,        y: bs,       w: bs, h: bs },
      { name: 'btn_right', x: bs * 2,   y: bs,       w: bs, h: bs },
      { name: 'btn_wait',  x: bs,       y: bs,       w: bs, h: bs },
    ];

    buttons.forEach(b => {
      // button bg
      g.fillStyle(C.DARK, 0.85);
      g.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
      g.fillStyle(C.STONE, 0.6);
      g.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
      // border
      g.lineStyle(2, C.PURPLE2, 0.8);
      g.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
    });

    // Arrows
    const mid = bs / 2;
    const arr = 14;
    // up arrow
    g.fillStyle(C.VIOLET, 1);
    g.fillTriangle(bs + mid, 8, bs + mid - arr, bs - 12, bs + mid + arr, bs - 12);
    // down arrow
    g.fillStyle(C.VIOLET, 1);
    g.fillTriangle(bs + mid, bs * 3 - 8, bs + mid - arr, bs * 2 + 12, bs + mid + arr, bs * 2 + 12);
    // left arrow
    g.fillStyle(C.VIOLET, 1);
    g.fillTriangle(8, bs + mid, bs - 12, bs + mid - arr, bs - 12, bs + mid + arr);
    // right arrow
    g.fillStyle(C.VIOLET, 1);
    g.fillTriangle(bs * 3 - 8, bs + mid, bs * 2 + 12, bs + mid - arr, bs * 2 + 12, bs + mid + arr);
    // wait (hourglass)
    g.fillStyle(C.TAN, 1);
    g.fillTriangle(bs + mid, bs + mid, bs + 10, bs + 10, bs + bs - 10, bs + 10);
    g.fillTriangle(bs + mid, bs + mid, bs + 10, bs * 2 - 10, bs + bs - 10, bs * 2 - 10);

    g.generateTexture('dpad', bs * 3, bs * 3);
    g.destroy();
  },
};
