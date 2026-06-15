// SpriteGen.js — procedural pixel-art generator for NEON RIFT.
// All sprites drawn pixel-by-pixel onto offscreen canvases → Phaser textures.
// Heroes and bots generate 6-frame spritesheets (walk[0-3], idle[4-5]) in two
// directional variants: 'side' (right-facing, flip for left) and 'back'
// (character moving away from camera in iso space).

const HERO_FW = 30, HERO_FH = 40; // hero frame size
const BOT_FW  = 26, BOT_FH  = 36; // bot frame size
const ANIM_FRAMES = 6; // 4 walk + 2 idle

class PixelCanvas {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.cv = document.createElement('canvas');
    this.cv.width = w; this.cv.height = h;
    this.ctx = this.cv.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  }
  px(x, y, c) {
    if (!c) return;
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.ctx.fillStyle = c;
    this.ctx.fillRect(x, y, 1, 1);
  }
  rect(x, y, w, h, c) {
    if (!c || w <= 0 || h <= 0) return;
    this.ctx.fillStyle = c;
    this.ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }
  hline(x0, x1, y, c) { for (let x = x0; x <= x1; x++) this.px(x, y, c); }
  vline(x, y0, y1, c) { for (let y = y0; y <= y1; y++) this.px(x, y, c); }
  disc(cx, cy, r, c) {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x*x + y*y <= r*r + r*0.5) this.px(cx+x, cy+y, c);
  }
  ring(cx, cy, r, c) {
    for (let a = 0; a < 360; a += 6) {
      const rad = a * Math.PI / 180;
      this.px(cx + Math.round(Math.cos(rad)*r), cy + Math.round(Math.sin(rad)*r), c);
    }
  }
  diamond(cx, cy, hw, hh, c) {
    for (let y = -hh; y <= hh; y++) {
      const span = Math.round(hw * (1 - Math.abs(y) / hh));
      this.hline(cx - span, cx + span, cy + y, c);
    }
  }
  diamondEdge(cx, cy, hw, hh, c) {
    for (let y = -hh; y <= hh; y++) {
      const span = Math.round(hw * (1 - Math.abs(y) / hh));
      this.px(cx - span, cy + y, c);
      this.px(cx + span, cy + y, c);
    }
  }
  shadow(cx, cy, rw, rh, c) {
    for (let y = -rh; y <= rh; y++)
      for (let x = -rw; x <= rw; x++)
        if ((x*x)/(rw*rw) + (y*y)/(rh*rh) <= 1) this.px(cx+x, cy+y, c);
  }
  toTexture(scene, key) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, this.cv);
  }
  // Registers the canvas as a spritesheet with equal-width frames numbered 0..N-1
  toSpriteSheet(scene, key, fw, fh) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.addCanvas(key, this.cv);
    const n = Math.floor(this.w / fw);
    for (let i = 0; i < n; i++) tex.add(i, 0, i * fw, 0, fw, fh);
  }
}

const SpriteGen = {

  // ---- ISOMETRIC TILES ------------------------------------------------
  floorTile(scene, key, top, side, edge, glow) {
    const w = 64, h = 40;
    const pc = new PixelCanvas(w, h);
    const cx = 32, cy = 14, hw = 31, hh = 15;
    for (let d = 0; d < 8; d++) pc.diamondEdge(cx, cy + d, hw, hh, d < 7 ? side : edge);
    for (let y = -hh; y <= hh; y++) {
      const span = Math.round(hw * (1 - Math.abs(y) / hh));
      for (let d = 1; d < 8; d++) { pc.px(cx - span, cy + y + d, side); pc.px(cx + span, cy + y + d, side); }
    }
    pc.diamond(cx, cy, hw, hh, top);
    pc.diamondEdge(cx, cy, hw, hh, edge);
    if (glow) {
      pc.diamond(cx, cy, hw - 6, hh - 3, glow);
      pc.diamondEdge(cx, cy, hw - 6, hh - 3, PAL.white);
    } else {
      pc.px(cx-8, cy-2, PAL.floorLt); pc.px(cx+6, cy+3, PAL.floorLt);
      pc.px(cx+12, cy-4, PAL.floorLt); pc.px(cx-14, cy+4, PAL.floorLt);
    }
    pc.toTexture(scene, key);
  },

  wallCube(scene, key, top, left, right, edge) {
    const w = 64, h = 64;
    const pc = new PixelCanvas(w, h);
    const cx = 32, cy = 22, hw = 31, hh = 15, tall = 22;
    for (let y = -hh; y <= hh; y++) {
      const span = Math.round(hw * (1 - Math.abs(y) / hh));
      for (let xx = cx - span; xx <= cx; xx++) for (let d = 0; d <= tall; d++) pc.px(xx, cy + y + d, left);
      for (let xx = cx; xx <= cx + span; xx++) for (let d = 0; d <= tall; d++) pc.px(xx, cy + y + d, right);
    }
    pc.diamond(cx, cy, hw, hh, top);
    pc.diamondEdge(cx, cy, hw, hh, edge);
    pc.hline(cx-14, cx-2, cy+16, PAL.cyan);
    pc.hline(cx+2, cx+14, cy+16, PAL.magenta);
    pc.toTexture(scene, key);
  },

  payload(scene, key, teamColor) {
    const pc = new PixelCanvas(56, 56);
    const cx = 28;
    pc.shadow(cx, 46, 22, 7, 'rgba(0,0,0,0.35)');
    pc.disc(cx-13, 42, 4, PAL.ink); pc.disc(cx+13, 42, 4, PAL.ink);
    pc.disc(cx-13, 42, 2, PAL.steel); pc.disc(cx+13, 42, 2, PAL.steel);
    pc.rect(cx-18, 30, 36, 12, PAL.iron);
    pc.rect(cx-18, 30, 36, 2, PAL.steel);
    pc.rect(cx-12, 14, 24, 18, PAL.steelDk);
    pc.rect(cx-10, 16, 20, 14, PAL.ink);
    pc.rect(cx-8, 18, 16, 10, teamColor);
    pc.rect(cx-6, 20, 12, 6, PAL.white);
    pc.rect(cx-13, 13, 26, 2, PAL.steel);
    pc.vline(cx-13, 13, 32, PAL.steel); pc.vline(cx+12, 13, 32, PAL.steel);
    pc.vline(cx, 6, 13, PAL.steel);
    pc.disc(cx, 5, 2, teamColor); pc.disc(cx, 5, 1, PAL.white);
    pc.toTexture(scene, key);
  },

  // ---- HERO DIRECTIONAL SPRITESHEETS ----------------------------------
  // Generates hero_{id}_side and hero_{id}_back, each a 6-frame sheet.
  // Frames 0-3: walk cycle, frames 4-5: idle.
  heroSheet(scene, id, opt) {
    ['side', 'back'].forEach(dir => {
      const pc = new PixelCanvas(HERO_FW * ANIM_FRAMES, HERO_FH);
      for (let f = 0; f < ANIM_FRAMES; f++) {
        if (dir === 'side') this._heroSideFrame(pc, f * HERO_FW, opt, f);
        else this._heroBackFrame(pc, f * HERO_FW, opt, f);
      }
      pc.toSpriteSheet(scene, 'hero_' + id + '_' + dir, HERO_FW, HERO_FH);
    });
  },

  // Walk/idle state helpers
  _walkState(frame) {
    const isIdle = frame >= 4;
    const isStride = !isIdle && frame % 2 === 1; // frames 1 & 3
    const rightLead = frame === 1; // frame 1: right foot forward
    const bodyOff = isStride ? -1 : (frame === 5 ? 1 : 0);
    return { isIdle, isStride, rightLead, bodyOff };
  },

  _heroSideFrame(pc, ox, opt, frame) {
    const cx = ox + 15;
    const bulk = opt.bulk || 0;
    const sw = 3 + bulk;
    const { isStride, rightLead, bodyOff: by } = this._walkState(frame);

    // Shadow always at frame bottom regardless of bob
    pc.shadow(cx, 37, 8 + bulk, 3, 'rgba(0,0,0,0.30)');

    // Leg positions: rightLead = right foot forward (further right)
    let lx = cx - 3 - bulk, rx = cx + 1;
    let lh = 6, rh = 6;
    if (isStride && rightLead)  { rx = cx + 4; lx = cx - 5 - bulk; lh = 5; }
    if (isStride && !rightLead) { lx = cx - 2; rx = cx + 3 + bulk; rh = 5; }

    // Boots
    pc.rect(lx - 1, 30 + by, 3 + bulk, 2, opt.accent);
    pc.rect(rx - 1, 30 + by, 3 + bulk, 2, opt.accent);
    // Legs
    pc.rect(lx, 24 + by, 2 + bulk, lh, opt.suitDk);
    pc.rect(rx, 24 + by, 2 + bulk, rh, opt.suitDk);

    // Belt
    pc.hline(cx - sw, cx + sw - 1, 23 + by, opt.accentDk);
    // Torso
    pc.rect(cx - sw, 12 + by, sw * 2, 11, opt.suit);
    pc.rect(cx - sw, 12 + by, sw * 2, 2, opt.suitDk);
    pc.rect(cx - 1, 13 + by, 2, 8, opt.accent);
    pc.px(cx, 15 + by, opt.accentDk);

    // Arms swing opposite to leading foot (right foot → left arm forward)
    let laY = 13 + by, raY = 13 + by;
    if (isStride &&  rightLead) { laY -= 2; raY += 2; }
    if (isStride && !rightLead) { raY -= 2; laY += 2; }

    pc.rect(cx - sw - 2, laY, 2, 8, opt.suit);
    pc.rect(cx + sw,     raY, 2, 7, opt.suit);
    pc.rect(cx - sw - 2, laY + 7, 2, 2, opt.skin);
    pc.rect(cx + sw,     raY + 6, 2, 2, opt.skin);

    // Neck
    pc.rect(cx - 1, 10 + by, 2, 2, opt.skinDk);
    // Head
    pc.rect(cx - 4, 3 + by, 8, 8, opt.skin);
    pc.vline(cx + 3, 4 + by, 10 + by, opt.skinDk);
    // Eyes / visor
    if (opt.visor) {
      pc.rect(cx - 4, 5 + by, 8, 2, PAL.ink);
      pc.rect(cx - 3, 5 + by, 2, 1, opt.visor);
      pc.rect(cx + 1, 5 + by, 2, 1, opt.visor);
    } else {
      pc.px(cx - 2, 6 + by, PAL.ink);
      pc.px(cx + 1, 6 + by, PAL.ink);
      pc.px(cx, 8 + by, opt.skinDk);
    }
    this._headgearSide(pc, cx, 3 + by, opt);
    this._weaponSide(pc, cx, sw, opt, raY);
  },

  _heroBackFrame(pc, ox, opt, frame) {
    const cx = ox + 15;
    const bulk = opt.bulk || 0;
    const sw = 3 + bulk;
    const { isStride, rightLead, bodyOff: by } = this._walkState(frame);

    pc.shadow(cx, 37, 8 + bulk, 3, 'rgba(0,0,0,0.30)');

    // Legs (same stride logic, just viewed from behind)
    let lx = cx - 3 - bulk, rx = cx + 1;
    let lh = 6, rh = 6;
    if (isStride && rightLead)  { rx = cx + 4; lx = cx - 5 - bulk; lh = 5; }
    if (isStride && !rightLead) { lx = cx - 2; rx = cx + 3 + bulk; rh = 5; }

    pc.rect(lx - 1, 30 + by, 3 + bulk, 2, opt.accent);
    pc.rect(rx - 1, 30 + by, 3 + bulk, 2, opt.accent);
    pc.rect(lx, 24 + by, 2 + bulk, lh, opt.suitDk);
    pc.rect(rx, 24 + by, 2 + bulk, rh, opt.suitDk);

    // Back torso
    pc.hline(cx - sw, cx + sw - 1, 23 + by, opt.accentDk);
    pc.rect(cx - sw, 12 + by, sw * 2, 11, opt.suit);
    pc.rect(cx - sw, 12 + by, sw * 2, 2, opt.accentDk);
    pc.rect(cx - 1, 14 + by, 2, 7, opt.accentDk); // spine
    // Back shoulder detail
    pc.hline(cx - sw, cx - sw + 2, 14 + by, opt.accent);
    pc.hline(cx + sw - 3, cx + sw - 1, 14 + by, opt.accent);

    // Arms from behind (swing reversed in appearance)
    let laY = 13 + by, raY = 13 + by;
    if (isStride &&  rightLead) { raY -= 2; laY += 2; }
    if (isStride && !rightLead) { laY -= 2; raY += 2; }

    pc.rect(cx - sw - 2, laY, 2, 8, opt.suit);
    pc.rect(cx + sw,     raY, 2, 7, opt.suit);
    pc.rect(cx - sw - 2, laY + 7, 2, 2, opt.skin);
    pc.rect(cx + sw,     raY + 6, 2, 2, opt.skin);

    // Neck (back)
    pc.rect(cx - 1, 10 + by, 2, 2, opt.skinDk);
    // Head from behind
    pc.rect(cx - 4, 3 + by, 8, 8, opt.skin);
    this._headgearBack(pc, cx, 3 + by, opt);
  },

  _headgearSide(pc, cx, headTop, opt) {
    const ht = headTop;
    if (opt.hairStyle === 'spike') {
      pc.rect(cx - 4, ht - 1, 8, 2, opt.hair);
      pc.rect(cx - 5, ht, 1, 1, opt.hair); pc.rect(cx + 4, ht, 1, 1, opt.hair);
      pc.px(cx - 3, ht - 2, opt.hair); pc.px(cx, ht - 3, opt.hair); pc.px(cx + 3, ht - 2, opt.hair);
      pc.hline(cx - 4, cx + 3, ht + 1, opt.hairDk);
    } else if (opt.hairStyle === 'helmet') {
      pc.rect(cx - 5, ht - 1, 10, 5, opt.suit);
      pc.rect(cx - 5, ht - 1, 10, 1, opt.accent);
      pc.rect(cx - 5, ht + 3, 10, 1, opt.suitDk);
      pc.rect(cx - 6, ht + 1, 1, 3, opt.accent);
      pc.rect(cx + 5, ht + 1, 1, 3, opt.accent);
      pc.rect(cx - 1, ht - 3, 2, 3, opt.accent);
    } else if (opt.hairStyle === 'hood') {
      pc.rect(cx - 5, ht - 1, 10, 4, opt.suit);
      pc.px(cx - 5, ht - 2, opt.accent); pc.px(cx + 4, ht - 2, opt.accent);
      pc.px(cx - 3, ht - 3, opt.accent); pc.px(cx + 2, ht - 3, opt.accent);
      pc.px(cx, ht - 4, opt.accent);
      pc.rect(cx - 5, ht + 2, 10, 1, opt.suitDk);
      pc.vline(cx - 5, ht + 2, ht + 9, opt.hair);
      pc.vline(cx + 4, ht + 2, ht + 9, opt.hair);
    }
  },

  _headgearBack(pc, cx, headTop, opt) {
    const ht = headTop;
    if (opt.hairStyle === 'spike') {
      pc.rect(cx - 4, ht, 8, 8, opt.hair);
      pc.rect(cx - 3, ht - 2, 2, 3, opt.hair);
      pc.px(cx, ht - 3, opt.hair);
      pc.rect(cx + 1, ht - 2, 2, 3, opt.hair);
      pc.hline(cx - 4, cx + 3, ht + 3, opt.hairDk);
    } else if (opt.hairStyle === 'helmet') {
      pc.rect(cx - 5, ht - 1, 10, 10, opt.suit);
      pc.rect(cx - 5, ht - 1, 10, 1, opt.suitDk);
      pc.rect(cx - 5, ht + 2, 10, 1, opt.accentDk);
      pc.rect(cx - 6, ht + 1, 1, 3, opt.accent);
      pc.rect(cx + 5, ht + 1, 1, 3, opt.accent);
      pc.rect(cx - 1, ht - 3, 2, 3, opt.accent);
      pc.rect(cx - 2, ht + 8, 4, 2, opt.suitDk);
    } else if (opt.hairStyle === 'hood') {
      pc.rect(cx - 5, ht - 1, 10, 10, opt.suit);
      pc.rect(cx - 5, ht - 1, 10, 2, opt.suitDk);
      pc.disc(cx - 5, ht, 3, opt.accent); pc.disc(cx + 4, ht, 3, opt.accent);
      pc.disc(cx, ht - 2, 3, opt.accent);
      pc.rect(cx - 5, ht + 8, 10, 2, opt.suitDk);
      pc.rect(cx - 5, ht + 4, 2, 6, opt.hair);
      pc.rect(cx + 3, ht + 4, 2, 6, opt.hair);
    }
  },

  _weaponSide(pc, cx, sw, opt, armY) {
    const wx = cx + sw + 1, wy = armY;
    if (opt.weapon === 'blaster') {
      pc.rect(wx, wy + 1, 6, 3, PAL.steelDk);
      pc.rect(wx, wy + 1, 6, 1, PAL.steel);
      pc.rect(wx + 5, wy + 1, 2, 1, opt.accent);
      pc.rect(wx + 5, wy + 3, 2, 1, opt.accent);
      pc.px(wx + 7, wy + 1, opt.accent); pc.px(wx + 7, wy + 3, opt.accent);
      pc.rect(wx - 1, wy + 3, 2, 2, PAL.iron);
    } else if (opt.weapon === 'gauntlet') {
      pc.rect(wx - 1, wy, 5, 6, opt.accentDk);
      pc.rect(wx - 1, wy, 5, 2, opt.accent);
      pc.rect(wx, wy + 2, 3, 1, PAL.white);
      pc.rect(wx + 3, wy + 1, 2, 4, PAL.steel);
    } else if (opt.weapon === 'staff') {
      pc.vline(wx + 1, wy - 5, wy + 6, PAL.steel);
      pc.disc(wx + 1, wy - 6, 3, opt.accent);
      pc.disc(wx + 1, wy - 6, 1, PAL.white);
    }
  },

  // ---- HERO PORTRAIT (large, detailed, used in Select / results screens) --
  portrait(scene, key, opt) {
    const w = 48, h = 56;
    const pc = new PixelCanvas(w, h);
    const cx = 24;
    for (let r = 26; r > 8; r--) {
      const a = (26 - r) / 18 * 0.5;
      pc.disc(cx, 26, r, `rgba(${this._rgb(opt.accent)},${a.toFixed(2)})`);
    }
    pc.rect(cx - 14, 42, 28, 14, opt.suit);
    pc.rect(cx - 14, 42, 28, 2, opt.suitDk);
    pc.rect(cx - 2, 44, 4, 12, opt.accent);
    pc.rect(cx - 4, 38, 8, 5, opt.skinDk);
    pc.rect(cx - 9, 16, 18, 22, opt.skin);
    pc.rect(cx + 6, 16, 3, 22, opt.skinDk);
    pc.rect(cx - 9, 16, 18, 2, opt.skinDk);
    pc.px(cx - 7, 30, opt.accent); pc.px(cx + 6, 30, opt.accent);
    if (opt.visor) {
      pc.rect(cx - 9, 24, 18, 5, PAL.ink);
      pc.rect(cx - 7, 25, 5, 2, opt.visor);
      pc.rect(cx + 2, 25, 5, 2, opt.visor);
      pc.rect(cx - 7, 25, 5, 1, PAL.white);
    } else {
      pc.rect(cx - 7, 25, 4, 4, PAL.white); pc.rect(cx + 3, 25, 4, 4, PAL.white);
      pc.rect(cx - 6, 26, 2, 2, opt.eye || PAL.ink);
      pc.rect(cx + 4, 26, 2, 2, opt.eye || PAL.ink);
      pc.hline(cx - 3, cx + 2, 34, opt.skinDk);
      pc.px(cx - 4, 33, opt.skinDk); pc.px(cx + 3, 33, opt.skinDk);
    }
    this._portraitHead(pc, cx, opt);
    pc.toTexture(scene, key);
  },

  _portraitHead(pc, cx, opt) {
    if (opt.hairStyle === 'spike') {
      pc.rect(cx - 9, 10, 18, 8, opt.hair);
      pc.rect(cx - 9, 10, 18, 2, opt.hairDk);
      for (let i = -8; i <= 8; i += 4) { pc.rect(cx + i, 4, 2, 7, opt.hair); pc.px(cx + i, 3, opt.hair); }
      pc.rect(cx - 9, 16, 3, 4, opt.hair); pc.rect(cx + 6, 16, 3, 4, opt.hair);
    } else if (opt.hairStyle === 'helmet') {
      pc.rect(cx - 11, 8, 22, 10, opt.suit);
      pc.rect(cx - 11, 8, 22, 3, opt.accent);
      pc.rect(cx - 11, 16, 22, 2, opt.suitDk);
      pc.rect(cx - 2, 4, 4, 6, opt.accent);
      pc.rect(cx - 12, 12, 2, 6, opt.accent); pc.rect(cx + 10, 12, 2, 6, opt.accent);
    } else if (opt.hairStyle === 'hood') {
      pc.rect(cx - 11, 8, 22, 9, opt.suit);
      for (let i = -9; i <= 9; i += 6) { pc.disc(cx + i, 8, 3, opt.accent); pc.disc(cx + i, 8, 1, PAL.white); }
      pc.disc(cx, 4, 3, opt.accent);
      pc.rect(cx - 11, 15, 22, 2, opt.suitDk);
      pc.rect(cx - 11, 16, 3, 8, opt.hair); pc.rect(cx + 8, 16, 3, 8, opt.hair);
    }
  },

  // ---- BOT DIRECTIONAL SPRITESHEETS -----------------------------------
  botSheet(scene, key, variant) {
    const heavy = variant === 'heavy';
    ['side', 'back'].forEach(dir => {
      const pc = new PixelCanvas(BOT_FW * ANIM_FRAMES, BOT_FH);
      for (let f = 0; f < ANIM_FRAMES; f++) {
        if (dir === 'side') this._botSideFrame(pc, f * BOT_FW, heavy, f);
        else this._botBackFrame(pc, f * BOT_FW, heavy, f);
      }
      pc.toSpriteSheet(scene, key + '_' + dir, BOT_FW, BOT_FH);
    });
  },

  _botSideFrame(pc, ox, heavy, frame) {
    const cx = ox + 13;
    const base = heavy ? PAL.redDk : PAL.iron;
    const trim = heavy ? PAL.orange : PAL.red;
    const { isStride, rightLead, bodyOff: by } = this._walkState(frame);

    pc.shadow(cx, 33, heavy ? 9 : 7, 3, 'rgba(0,0,0,0.30)');

    // Hover/legs
    if (heavy) {
      pc.rect(cx - 6, 25 + by, 12, 3, PAL.steelDk);
      pc.disc(cx - 4, 27 + by, 2, trim); pc.disc(cx + 3, 27 + by, 2, trim);
    } else {
      let llx = cx - 3, rlx = cx + 1;
      if (isStride && rightLead)  { rlx = cx + 3; llx = cx - 4; }
      if (isStride && !rightLead) { llx = cx - 2; rlx = cx + 2; }
      pc.rect(llx, 23 + by, 2, 4, PAL.steelDk); pc.rect(rlx, 23 + by, 2, 4, PAL.steelDk);
      pc.rect(llx - 1, 26 + by, 3, 2, PAL.ink); pc.rect(rlx - 1, 26 + by, 3, 2, PAL.ink);
    }

    // Body
    const bw = heavy ? 7 : 5;
    pc.rect(cx - bw, 12 + by, bw * 2, 11, base);
    pc.rect(cx - bw, 12 + by, bw * 2, 2, PAL.steel);
    pc.rect(cx - 1, 14 + by, 2, 7, PAL.ink);
    pc.rect(cx - 1, 15 + by, 2, 2, trim);

    // Arms
    pc.rect(cx - bw - 2, 13 + by, 2, 7, base);
    pc.rect(cx + bw, 13 + by, 2, 7, base);
    if (heavy) { pc.rect(cx + bw + 2, 17 + by, 3, 2, trim); } // heavy muzzle

    // Head
    pc.rect(cx - 4, 5 + by, 8, 7, PAL.steelDk);
    pc.rect(cx - 4, 5 + by, 8, 1, PAL.steel);
    pc.rect(cx - 3, 7 + by, 6, 2, PAL.ink);
    pc.rect(cx - 3, 7 + by, 6, 1, trim);
    pc.px(cx - 2, 8 + by, PAL.white);
    pc.vline(cx, 2 + by, 4 + by, PAL.steel); pc.px(cx, 1 + by, trim);
  },

  _botBackFrame(pc, ox, heavy, frame) {
    const cx = ox + 13;
    const base = heavy ? PAL.redDk : PAL.iron;
    const trim = heavy ? PAL.orange : PAL.red;
    const { isStride, rightLead, bodyOff: by } = this._walkState(frame);

    pc.shadow(cx, 33, heavy ? 9 : 7, 3, 'rgba(0,0,0,0.30)');

    if (heavy) {
      pc.rect(cx - 6, 25 + by, 12, 3, PAL.steelDk);
      pc.disc(cx - 4, 27 + by, 2, trim); pc.disc(cx + 3, 27 + by, 2, trim);
    } else {
      let llx = cx - 3, rlx = cx + 1;
      if (isStride && rightLead)  { rlx = cx + 3; llx = cx - 4; }
      if (isStride && !rightLead) { llx = cx - 2; rlx = cx + 2; }
      pc.rect(llx, 23 + by, 2, 4, PAL.steelDk); pc.rect(rlx, 23 + by, 2, 4, PAL.steelDk);
      pc.rect(llx - 1, 26 + by, 3, 2, PAL.ink); pc.rect(rlx - 1, 26 + by, 3, 2, PAL.ink);
    }

    const bw = heavy ? 7 : 5;
    // Back of body
    pc.rect(cx - bw, 12 + by, bw * 2, 11, base);
    pc.rect(cx - bw, 12 + by, bw * 2, 2, PAL.steelDk);
    pc.rect(cx - 1, 14 + by, 2, 7, PAL.steelDk); // spine visible from back
    // Back power pack
    pc.rect(cx - 2, 14 + by, 4, 5, PAL.steelDk);
    pc.rect(cx - 2, 15 + by, 4, 2, trim);

    pc.rect(cx - bw - 2, 13 + by, 2, 7, base);
    pc.rect(cx + bw,     13 + by, 2, 7, base);

    // Head from behind
    pc.rect(cx - 4, 5 + by, 8, 7, PAL.steelDk);
    pc.rect(cx - 4, 5 + by, 8, 1, trim);
    pc.rect(cx - 4, 11 + by, 8, 1, PAL.steel);
    pc.vline(cx, 2 + by, 4 + by, PAL.steel); pc.px(cx, 1 + by, trim);
  },

  // ---- PROJECTILES / FX -----------------------------------------------
  bolt(scene, key, color) {
    const pc = new PixelCanvas(10, 6);
    pc.rect(1, 2, 7, 2, color);
    pc.rect(0, 2, 1, 2, PAL.white);
    pc.px(8, 1, color); pc.px(8, 4, color);
    pc.rect(2, 1, 4, 1, PAL.white);
    pc.toTexture(scene, key);
  },
  orb(scene, key, color) {
    const pc = new PixelCanvas(10, 10);
    pc.disc(5, 5, 4, color); pc.disc(5, 5, 2, PAL.white); pc.ring(5, 5, 4, color);
    pc.toTexture(scene, key);
  },
  spark(scene, key, color) {
    const pc = new PixelCanvas(6, 6);
    pc.rect(2, 2, 2, 2, PAL.white);
    pc.px(0, 0, color); pc.px(5, 0, color); pc.px(0, 5, color); pc.px(5, 5, color);
    pc.toTexture(scene, key);
  },
  barrier(scene, key, color) {
    const w = 40, h = 48;
    const pc = new PixelCanvas(w, h);
    for (let y = 4; y < h - 4; y++) {
      const t = (y - 4) / (h - 8);
      const span = Math.round(16 * Math.sin(t * Math.PI) + 2);
      pc.px(20 - span, y, color); pc.px(20 + span, y, color);
      if (y % 4 === 0) pc.hline(20 - span, 20 + span, y, `rgba(${this._rgb(color)},0.18)`);
    }
    pc.toTexture(scene, key);
  },

  // ---- UI ICONS -------------------------------------------------------
  icon(scene, key, type, color) {
    const pc = new PixelCanvas(16, 16);
    const c = color, w = PAL.white;
    if (type === 'dash') {
      for (let i = 0; i < 3; i++) { pc.rect(2 + i*4, 6, 2, 4, c); pc.px(4+i*4, 5, c); pc.px(4+i*4, 10, c); }
      pc.rect(12, 7, 2, 2, w);
    } else if (type === 'burst') {
      pc.disc(8, 8, 3, c);
      for (let a = 0; a < 360; a += 45) { const r = a*Math.PI/180; pc.rect(8+Math.round(Math.cos(r)*5)-1, 8+Math.round(Math.sin(r)*5)-1, 2, 2, c); }
      pc.disc(8, 8, 1, w);
    } else if (type === 'shield') {
      for (let y = 2; y < 13; y++) { const t=y/13; const span=Math.round(6*(1-t*0.6)); pc.hline(8-span, 8+span, y, y<4?c:(y<11?c:PAL.ink)); }
      pc.rect(6, 6, 4, 1, w);
    } else if (type === 'slam') {
      pc.rect(5, 2, 6, 6, c); pc.rect(6, 8, 4, 2, c);
      pc.hline(2, 13, 12, c); pc.px(2, 11, c); pc.px(13, 11, c);
      pc.px(0, 13, w); pc.px(15, 13, w);
    } else if (type === 'heal') {
      pc.rect(6, 2, 4, 12, c); pc.rect(2, 6, 12, 4, c);
      pc.rect(7, 3, 2, 10, w); pc.rect(3, 7, 10, 2, w);
    } else if (type === 'nova') {
      pc.ring(8, 8, 6, c); pc.ring(8, 8, 4, c); pc.disc(8, 8, 2, w);
    } else if (type === 'fire') {
      pc.disc(8, 9, 4, c); pc.rect(7, 2, 2, 6, c); pc.px(6, 4, c); pc.px(9, 4, c); pc.disc(8, 9, 1, w);
    } else if (type === 'ult') {
      for (let a = 0; a < 360; a += 72) { const r=a*Math.PI/180; pc.rect(8+Math.round(Math.cos(r)*6)-1, 8+Math.round(Math.sin(r)*6)-1, 2, 2, c); }
      pc.disc(8, 8, 3, c); pc.disc(8, 8, 1, w);
    }
    pc.toTexture(scene, key);
  },

  roleBadge(scene, key, role, color) {
    const pc = new PixelCanvas(18, 18);
    pc.disc(9, 9, 8, PAL.ink); pc.ring(9, 9, 8, color);
    const c = color, w = PAL.white;
    if (role === 'Damage') {
      pc.ring(9, 9, 4, c); pc.vline(9, 4, 14, c); pc.hline(4, 14, 9, c); pc.disc(9, 9, 1, w);
    } else if (role === 'Tank') {
      for (let y = 4; y < 14; y++) { const t=(y-4)/10; const span=Math.round(5*(1-t*0.7)); pc.hline(9-span,9+span,y,c); }
      pc.rect(6, 7, 6, 2, w);
    } else if (role === 'Support') {
      pc.rect(7, 4, 4, 10, c); pc.rect(4, 7, 10, 4, c);
      pc.rect(8, 5, 2, 8, w); pc.rect(5, 8, 8, 2, w);
    }
    pc.toTexture(scene, key);
  },

  _rgb(hex) {
    const h = hex.replace('#','');
    return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)].join(',');
  },
};
