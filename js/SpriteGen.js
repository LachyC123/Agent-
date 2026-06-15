// SpriteGen.js — procedural pixel-art generator for NEON RIFT.
// Everything is drawn pixel-by-pixel onto an offscreen canvas and registered as
// a Phaser texture. No external image files: the whole art set is "hand crafted"
// in code so the style stays perfectly consistent.

class PixelCanvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.cv = document.createElement('canvas');
    this.cv.width = w;
    this.cv.height = h;
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
    if (!c) return;
    this.ctx.fillStyle = c;
    this.ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }
  // mirror-aware horizontal pair around vertical axis cx
  pair(cx, dx, y, c) {
    this.px(cx - dx, y, c);
    this.px(cx + dx, y, c);
  }
  hline(x0, x1, y, c) {
    for (let x = x0; x <= x1; x++) this.px(x, y, c);
  }
  vline(x, y0, y1, c) {
    for (let y = y0; y <= y1; y++) this.px(x, y, c);
  }
  // filled circle (chunky)
  disc(cx, cy, r, c) {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y <= r * r + r * 0.5) this.px(cx + x, cy + y, c);
  }
  ring(cx, cy, r, c) {
    for (let a = 0; a < 360; a += 6) {
      const rad = a * Math.PI / 180;
      this.px(cx + Math.round(Math.cos(rad) * r), cy + Math.round(Math.sin(rad) * r), c);
    }
  }
  // isometric diamond (top face) centred at cx,cy with half-width hw, half-height hh
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
  // soft drop shadow ellipse
  shadow(cx, cy, rw, rh, c) {
    for (let y = -rh; y <= rh; y++)
      for (let x = -rw; x <= rw; x++)
        if ((x * x) / (rw * rw) + (y * y) / (rh * rh) <= 1) this.px(cx + x, cy + y, c);
  }
  toTexture(scene, key) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, this.cv);
  }
}

const SpriteGen = {
  // ---- ISOMETRIC TILES ----
  floorTile(scene, key, top, side, edge, glow) {
    const w = 64, h = 40;
    const pc = new PixelCanvas(w, h);
    const cx = 32, cy = 14, hw = 31, hh = 15;
    // side / depth (3d block under the diamond)
    for (let d = 0; d < 8; d++) {
      pc.diamondEdge(cx, cy + d, hw, hh, d < 7 ? side : edge);
    }
    // bottom fill between left/right edges for the side faces
    for (let y = -hh; y <= hh; y++) {
      const span = Math.round(hw * (1 - Math.abs(y) / hh));
      // left and right vertical skirts
      for (let d = 1; d < 8; d++) {
        pc.px(cx - span, cy + y + d, side);
        pc.px(cx + span, cy + y + d, side);
      }
    }
    // top face
    pc.diamond(cx, cy, hw, hh, top);
    // subtle inner grid lines
    pc.diamondEdge(cx, cy, hw, hh, edge);
    if (glow) {
      pc.diamond(cx, cy, hw - 6, hh - 3, glow);
      pc.diamondEdge(cx, cy, hw - 6, hh - 3, PAL.white);
    } else {
      // light speckle texture
      pc.px(cx - 8, cy - 2, PAL.floorLt);
      pc.px(cx + 6, cy + 3, PAL.floorLt);
      pc.px(cx + 12, cy - 4, PAL.floorLt);
      pc.px(cx - 14, cy + 4, PAL.floorLt);
    }
    pc.toTexture(scene, key);
  },

  wallCube(scene, key, top, left, right, edge) {
    const w = 64, h = 64;
    const pc = new PixelCanvas(w, h);
    const cx = 32, cy = 22, hw = 31, hh = 15, tall = 22;
    // left & right faces
    for (let y = -hh; y <= hh; y++) {
      const span = Math.round(hw * (1 - Math.abs(y) / hh));
      for (let d = 0; d <= tall; d++) {
        pc.px(cx - span, cy + y + d, left);
        pc.px(cx + span, cy + y + d, right);
      }
    }
    // explicit left/right faces
    for (let y = -hh; y <= hh; y++) {
      const span = Math.round(hw * (1 - Math.abs(y) / hh));
      for (let xx = cx - span; xx <= cx; xx++)
        for (let d = 0; d <= tall; d++) pc.px(xx, cy + y + d, left);
      for (let xx = cx; xx <= cx + span; xx++)
        for (let d = 0; d <= tall; d++) pc.px(xx, cy + y + d, right);
    }
    // top face
    pc.diamond(cx, cy, hw, hh, top);
    pc.diamondEdge(cx, cy, hw, hh, edge);
    // neon strip detail on faces
    pc.hline(cx - 14, cx - 2, cy + 16, PAL.cyan);
    pc.hline(cx + 2, cx + 14, cy + 16, PAL.magenta);
    pc.toTexture(scene, key);
  },

  // ---- PAYLOAD CART ----
  payload(scene, key, teamColor) {
    const w = 56, h = 56;
    const pc = new PixelCanvas(w, h);
    const cx = 28;
    // shadow
    pc.shadow(cx, 46, 22, 7, 'rgba(0,0,0,0.35)');
    // wheels (iso base)
    pc.disc(cx - 13, 42, 4, PAL.ink);
    pc.disc(cx + 13, 42, 4, PAL.ink);
    pc.disc(cx - 13, 42, 2, PAL.steel);
    pc.disc(cx + 13, 42, 2, PAL.steel);
    // chassis
    pc.rect(cx - 18, 30, 36, 12, PAL.iron);
    pc.rect(cx - 18, 30, 36, 2, PAL.steel);
    // glowing core container
    pc.rect(cx - 12, 14, 24, 18, PAL.steelDk);
    pc.rect(cx - 10, 16, 20, 14, PAL.ink);
    pc.rect(cx - 8, 18, 16, 10, teamColor);
    pc.rect(cx - 6, 20, 12, 6, PAL.white);
    // frame edges
    pc.rect(cx - 13, 13, 26, 2, PAL.steel);
    pc.vline(cx - 13, 13, 32, PAL.steel);
    pc.vline(cx + 12, 13, 32, PAL.steel);
    // antenna beacon
    pc.vline(cx, 6, 13, PAL.steel);
    pc.disc(cx, 5, 2, teamColor);
    pc.disc(cx, 5, 1, PAL.white);
    pc.toTexture(scene, key);
  },

  // ---- HUMANOID BUILDER ----
  // opt: { skin, skinDk, suit, suitDk, accent, accentDk, hair, hairDk,
  //        visor, bulk, weapon, hairStyle, extra }
  hero(scene, key, opt, portrait) {
    const w = 26, h = 34;
    const pc = new PixelCanvas(w, h);
    const cx = 13;
    const bulk = opt.bulk || 0; // 0 slim, 1 normal, 2 wide
    const sw = 3 + bulk; // shoulder half-width
    const footY = 30;

    // shadow
    pc.shadow(cx, footY + 1, 8 + bulk, 3, 'rgba(0,0,0,0.30)');

    // legs
    const legColor = opt.suitDk;
    pc.rect(cx - 3, 24, 2 + bulk, 6, legColor);
    pc.rect(cx + 2 - bulk, 24, 2 + bulk, 6, legColor);
    // boots
    pc.rect(cx - 4, 29, 3 + bulk, 2, opt.accent);
    pc.rect(cx + 1 - bulk, 29, 3 + bulk, 2, opt.accent);

    // torso
    pc.rect(cx - sw, 15, sw * 2, 10, opt.suit);
    pc.rect(cx - sw, 15, sw * 2, 2, opt.suitDk); // shoulder shade
    // chest accent
    pc.rect(cx - 1, 16, 2, 7, opt.accent);
    pc.px(cx, 18, opt.accentDk);
    // belt
    pc.hline(cx - sw, cx + sw - 1, 23, opt.accentDk);

    // arms
    pc.rect(cx - sw - 2, 16, 2, 8, opt.suit);
    pc.rect(cx + sw, 16, 2, 8, opt.suit);
    pc.rect(cx - sw - 2, 22, 2, 2, opt.skin); // hands
    pc.rect(cx + sw, 22, 2, 2, opt.skin);

    // neck + head
    pc.rect(cx - 1, 13, 2, 2, opt.skinDk);
    pc.rect(cx - 4, 6, 8, 8, opt.skin);
    pc.rect(cx - 4, 6, 8, 1, opt.skinDk); // brow shade base
    // face shade on one side
    pc.vline(cx + 3, 7, 12, opt.skinDk);
    // eyes (visor or eyes)
    if (opt.visor) {
      pc.rect(cx - 4, 8, 8, 2, PAL.ink);
      pc.rect(cx - 3, 8, 2, 1, opt.visor);
      pc.rect(cx + 1, 8, 2, 1, opt.visor);
    } else {
      pc.px(cx - 2, 9, PAL.ink);
      pc.px(cx + 2, 9, PAL.ink);
      pc.px(cx - 2, 9, opt.eye || PAL.ink);
      pc.px(cx + 2, 9, opt.eye || PAL.ink);
      // mouth
      pc.px(cx, 11, opt.skinDk);
    }

    // hair / helmet
    this._headgear(pc, cx, opt);

    // weapon
    this._weapon(pc, cx, sw, opt);

    // hero-specific extras
    if (opt.extra) opt.extra(pc, cx, opt);

    pc.toTexture(scene, key);

    if (portrait) this.portrait(scene, portrait, opt);
  },

  _headgear(pc, cx, opt) {
    const style = opt.hairStyle;
    if (style === 'spike') {
      // spiky arcade hair
      pc.rect(cx - 4, 4, 8, 3, opt.hair);
      pc.rect(cx - 5, 5, 1, 2, opt.hair);
      pc.rect(cx + 4, 5, 1, 2, opt.hair);
      pc.px(cx - 3, 3, opt.hair); pc.px(cx, 2, opt.hair); pc.px(cx + 3, 3, opt.hair);
      pc.px(cx - 2, 3, opt.hairDk); pc.px(cx + 2, 3, opt.hairDk);
      pc.hline(cx - 4, cx + 3, 6, opt.hairDk);
    } else if (style === 'helmet') {
      // armored helmet
      pc.rect(cx - 5, 3, 10, 5, opt.suit);
      pc.rect(cx - 5, 3, 10, 1, opt.accent);
      pc.rect(cx - 5, 7, 10, 1, opt.suitDk);
      // side fins
      pc.rect(cx - 6, 5, 1, 3, opt.accent);
      pc.rect(cx + 5, 5, 1, 3, opt.accent);
      // crest
      pc.rect(cx - 1, 1, 2, 3, opt.accent);
    } else if (style === 'hood') {
      // petal hood (support)
      pc.rect(cx - 5, 4, 10, 4, opt.suit);
      pc.px(cx - 5, 3, opt.accent); pc.px(cx + 4, 3, opt.accent);
      pc.px(cx - 3, 2, opt.accent); pc.px(cx + 2, 2, opt.accent);
      pc.px(cx, 1, opt.accent);
      pc.rect(cx - 5, 7, 10, 1, opt.suitDk);
      // side bangs
      pc.vline(cx - 5, 7, 11, opt.hair);
      pc.vline(cx + 4, 7, 11, opt.hair);
    }
  },

  _weapon(pc, cx, sw, opt) {
    const wx = cx + sw + 1;
    if (opt.weapon === 'blaster') {
      // twin-barrel neon blaster, held to the right
      pc.rect(wx, 19, 6, 3, PAL.steelDk);
      pc.rect(wx, 19, 6, 1, PAL.steel);
      pc.rect(wx + 5, 19, 2, 1, opt.accent);
      pc.rect(wx + 5, 21, 2, 1, opt.accent);
      pc.px(wx + 7, 19, opt.accent);
      pc.px(wx + 7, 21, opt.accent);
      pc.rect(wx - 1, 22, 2, 2, PAL.iron); // grip
    } else if (opt.weapon === 'gauntlet') {
      // big tank fist/gauntlet
      pc.rect(wx - 1, 18, 5, 6, opt.accentDk);
      pc.rect(wx - 1, 18, 5, 2, opt.accent);
      pc.rect(wx, 20, 3, 1, PAL.white);
      pc.rect(wx + 3, 19, 2, 4, PAL.steel);
    } else if (opt.weapon === 'staff') {
      // healer wand with orb
      pc.vline(wx + 1, 15, 24, PAL.steel);
      pc.disc(wx + 1, 13, 3, opt.accent);
      pc.disc(wx + 1, 13, 1, PAL.white);
      pc.ring(wx + 1, 13, 4, opt.accentDk);
    }
  },

  // ---- PORTRAIT (character select, higher detail) ----
  portrait(scene, key, opt) {
    const w = 48, h = 56;
    const pc = new PixelCanvas(w, h);
    const cx = 24;
    // backdrop glow
    for (let r = 26; r > 8; r--) {
      const a = (26 - r) / 18 * 0.5;
      pc.disc(cx, 26, r, `rgba(${this._rgb(opt.accent)},${a.toFixed(2)})`);
    }
    // shoulders
    pc.rect(cx - 14, 42, 28, 14, opt.suit);
    pc.rect(cx - 14, 42, 28, 2, opt.suitDk);
    pc.rect(cx - 2, 44, 4, 12, opt.accent);
    // neck
    pc.rect(cx - 4, 38, 8, 5, opt.skinDk);
    // head
    pc.rect(cx - 9, 16, 18, 22, opt.skin);
    pc.rect(cx + 6, 16, 3, 22, opt.skinDk); // shade side
    pc.rect(cx - 9, 16, 18, 2, opt.skinDk);
    // cheeks
    pc.px(cx - 7, 30, opt.accent); pc.px(cx + 6, 30, opt.accent);
    // eyes / visor
    if (opt.visor) {
      pc.rect(cx - 9, 24, 18, 5, PAL.ink);
      pc.rect(cx - 7, 25, 5, 2, opt.visor);
      pc.rect(cx + 2, 25, 5, 2, opt.visor);
      pc.rect(cx - 7, 25, 5, 1, PAL.white);
    } else {
      pc.rect(cx - 7, 25, 4, 4, PAL.white);
      pc.rect(cx + 3, 25, 4, 4, PAL.white);
      pc.rect(cx - 6, 26, 2, 2, opt.eye || PAL.ink);
      pc.rect(cx + 4, 26, 2, 2, opt.eye || PAL.ink);
      // mouth / smile
      pc.hline(cx - 3, cx + 2, 34, opt.skinDk);
      pc.px(cx - 4, 33, opt.skinDk); pc.px(cx + 3, 33, opt.skinDk);
    }
    // headgear (scaled-up variants)
    this._portraitHead(pc, cx, opt);
    pc.toTexture(scene, key);
  },

  _portraitHead(pc, cx, opt) {
    if (opt.hairStyle === 'spike') {
      pc.rect(cx - 9, 10, 18, 8, opt.hair);
      pc.rect(cx - 9, 10, 18, 2, opt.hairDk);
      for (let i = -8; i <= 8; i += 4) {
        pc.rect(cx + i, 4, 2, 7, opt.hair);
        pc.px(cx + i, 3, opt.hair);
      }
      pc.rect(cx - 9, 16, 3, 4, opt.hair);
      pc.rect(cx + 6, 16, 3, 4, opt.hair);
    } else if (opt.hairStyle === 'helmet') {
      pc.rect(cx - 11, 8, 22, 10, opt.suit);
      pc.rect(cx - 11, 8, 22, 3, opt.accent);
      pc.rect(cx - 11, 16, 22, 2, opt.suitDk);
      pc.rect(cx - 2, 4, 4, 6, opt.accent); // crest
      pc.rect(cx - 12, 12, 2, 6, opt.accent);
      pc.rect(cx + 10, 12, 2, 6, opt.accent);
    } else if (opt.hairStyle === 'hood') {
      pc.rect(cx - 11, 8, 22, 9, opt.suit);
      // petals
      for (let i = -9; i <= 9; i += 6) {
        pc.disc(cx + i, 8, 3, opt.accent);
        pc.disc(cx + i, 8, 1, PAL.white);
      }
      pc.disc(cx, 4, 3, opt.accent);
      pc.rect(cx - 11, 15, 22, 2, opt.suitDk);
      pc.rect(cx - 11, 16, 3, 8, opt.hair);
      pc.rect(cx + 8, 16, 3, 8, opt.hair);
    }
  },

  // ---- ENEMY BOTS ----
  bot(scene, key, variant) {
    const w = 24, h = 30;
    const pc = new PixelCanvas(w, h);
    const cx = 12;
    const heavy = variant === 'heavy';
    const base = heavy ? PAL.redDk : PAL.iron;
    const trim = heavy ? PAL.orange : PAL.red;
    pc.shadow(cx, 27, heavy ? 9 : 7, 3, 'rgba(0,0,0,0.30)');
    // legs / hover
    if (heavy) {
      pc.rect(cx - 6, 24, 12, 3, PAL.steelDk);
      pc.disc(cx - 5, 26, 2, trim);
      pc.disc(cx + 4, 26, 2, trim);
    } else {
      pc.rect(cx - 3, 22, 2, 5, PAL.steelDk);
      pc.rect(cx + 1, 22, 2, 5, PAL.steelDk);
      pc.rect(cx - 4, 26, 3, 2, PAL.ink);
      pc.rect(cx + 1, 26, 3, 2, PAL.ink);
    }
    // body
    const bw = heavy ? 8 : 5;
    pc.rect(cx - bw, 12, bw * 2, 11, base);
    pc.rect(cx - bw, 12, bw * 2, 2, PAL.steel);
    pc.rect(cx - 1, 14, 2, 7, PAL.ink);
    pc.rect(cx - 1, 15, 2, 2, trim); // core light
    // arms / cannons
    pc.rect(cx - bw - 2, 13, 2, 7, base);
    pc.rect(cx + bw, 13, 2, 7, base);
    pc.rect(cx + bw, 18, 3, 2, trim); // muzzle
    // head
    pc.rect(cx - 4, 5, 8, 7, PAL.steelDk);
    pc.rect(cx - 4, 5, 8, 1, PAL.steel);
    pc.rect(cx - 3, 7, 6, 2, PAL.ink);
    pc.rect(cx - 3, 7, 6, 1, trim); // visor
    pc.px(cx - 2, 8, PAL.white);
    // antenna
    pc.vline(cx, 2, 4, PAL.steel);
    pc.px(cx, 1, trim);
    pc.toTexture(scene, key);
  },

  // ---- PROJECTILES / FX ----
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
    pc.disc(5, 5, 4, color);
    pc.disc(5, 5, 2, PAL.white);
    pc.ring(5, 5, 4, color);
    pc.toTexture(scene, key);
  },
  spark(scene, key, color) {
    const pc = new PixelCanvas(6, 6);
    pc.rect(2, 2, 2, 2, PAL.white);
    pc.px(0, 0, color); pc.px(5, 0, color);
    pc.px(0, 5, color); pc.px(5, 5, color);
    pc.toTexture(scene, key);
  },
  barrier(scene, key, color) {
    const w = 40, h = 48;
    const pc = new PixelCanvas(w, h);
    // hex-energy shield
    for (let y = 4; y < h - 4; y += 1) {
      const t = (y - 4) / (h - 8);
      const span = Math.round(16 * Math.sin(t * Math.PI) + 2);
      pc.px(20 - span, y, color);
      pc.px(20 + span, y, color);
      if (y % 4 === 0) pc.hline(20 - span, 20 + span, y, `rgba(${this._rgb(color)},0.18)`);
    }
    pc.toTexture(scene, key);
  },

  // ---- UI ICONS ----
  icon(scene, key, type, color) {
    const pc = new PixelCanvas(16, 16);
    const c = color, w = PAL.white;
    if (type === 'dash') {
      for (let i = 0; i < 3; i++) {
        pc.rect(2 + i * 4, 6, 2, 4, c);
        pc.px(4 + i * 4, 5, c); pc.px(4 + i * 4, 10, c);
      }
      pc.rect(12, 7, 2, 2, w);
    } else if (type === 'burst') {
      pc.disc(8, 8, 3, c);
      for (let a = 0; a < 360; a += 45) {
        const r = a * Math.PI / 180;
        pc.rect(8 + Math.round(Math.cos(r) * 5) - 1, 8 + Math.round(Math.sin(r) * 5) - 1, 2, 2, c);
      }
      pc.disc(8, 8, 1, w);
    } else if (type === 'shield') {
      for (let y = 2; y < 13; y++) {
        const t = y / 13;
        const span = Math.round(6 * (1 - t * 0.6));
        pc.hline(8 - span, 8 + span, y, y < 4 ? c : (y < 11 ? c : PAL.ink));
      }
      pc.rect(6, 6, 4, 1, w);
    } else if (type === 'slam') {
      pc.rect(5, 2, 6, 6, c);
      pc.rect(6, 8, 4, 2, c);
      pc.hline(2, 13, 12, c);
      pc.px(2, 11, c); pc.px(13, 11, c);
      pc.px(0, 13, w); pc.px(15, 13, w);
    } else if (type === 'heal') {
      pc.rect(6, 2, 4, 12, c);
      pc.rect(2, 6, 12, 4, c);
      pc.rect(7, 3, 2, 10, w);
      pc.rect(3, 7, 10, 2, w);
    } else if (type === 'nova') {
      pc.ring(8, 8, 6, c);
      pc.ring(8, 8, 4, c);
      pc.disc(8, 8, 2, w);
    } else if (type === 'fire') {
      pc.disc(8, 9, 4, c);
      pc.rect(7, 2, 2, 6, c);
      pc.px(6, 4, c); pc.px(9, 4, c);
      pc.disc(8, 9, 1, w);
    } else if (type === 'ult') {
      // star
      for (let a = 0; a < 360; a += 72) {
        const r = a * Math.PI / 180;
        pc.rect(8 + Math.round(Math.cos(r) * 6) - 1, 8 + Math.round(Math.sin(r) * 6) - 1, 2, 2, c);
      }
      pc.disc(8, 8, 3, c);
      pc.disc(8, 8, 1, w);
    }
    pc.toTexture(scene, key);
  },

  roleBadge(scene, key, role, color) {
    const pc = new PixelCanvas(18, 18);
    pc.disc(9, 9, 8, PAL.ink);
    pc.ring(9, 9, 8, color);
    const c = color, w = PAL.white;
    if (role === 'Damage') {
      // crosshair / arrow
      pc.disc(9, 9, 5, 'rgba(0,0,0,0)');
      pc.ring(9, 9, 4, c);
      pc.vline(9, 4, 14, c); pc.hline(4, 14, 9, c);
      pc.disc(9, 9, 1, w);
    } else if (role === 'Tank') {
      for (let y = 4; y < 14; y++) {
        const t = (y - 4) / 10;
        const span = Math.round(5 * (1 - t * 0.7));
        pc.hline(9 - span, 9 + span, y, c);
      }
      pc.rect(6, 7, 6, 2, w);
    } else if (role === 'Support') {
      pc.rect(7, 4, 4, 10, c);
      pc.rect(4, 7, 10, 4, c);
      pc.rect(8, 5, 2, 8, w);
      pc.rect(5, 8, 8, 2, w);
    }
    pc.toTexture(scene, key);
  },

  // helper: hex -> "r,g,b"
  _rgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)].join(',');
  },
};
