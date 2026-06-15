// UIKit.js — shared stylised pixel-art UI widgets (buttons, panels, text).
const UIKit = {
  FONT: 'monospace',

  // Pixel-styled neon text with a hard drop shadow + glow tint.
  text(scene, x, y, str, size, color, opt = {}) {
    const t = scene.add.text(x, y, str, {
      fontFamily: this.FONT,
      fontSize: size + 'px',
      color: color,
      fontStyle: opt.bold === false ? 'normal' : 'bold',
      align: opt.align || 'center',
      letterSpacing: opt.spacing != null ? opt.spacing : 1,
    }).setOrigin(opt.originX != null ? opt.originX : 0.5, opt.originY != null ? opt.originY : 0.5);
    t.setShadow(0, opt.shadowY != null ? opt.shadowY : 3, opt.shadowColor || 'rgba(0,0,0,0.6)', 0, false, true);
    if (opt.stroke) t.setStroke(opt.stroke, opt.strokeW || 4);
    if (opt.depth != null) t.setDepth(opt.depth);
    return t;
  },

  // A chunky neon button. Returns a container; calls onClick on tap.
  button(scene, x, y, w, h, label, color, onClick, opt = {}) {
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    const draw = (pressed) => {
      g.clear();
      const oy = pressed ? 3 : 0;
      // hard shadow
      g.fillStyle(0x000000, 0.5);
      g.fillRect(-w / 2 + 4, -h / 2 + 6, w, h);
      // body
      g.fillStyle(Phaser.Display.Color.HexStringToColor(PAL.ink).color, 1);
      g.fillRect(-w / 2, -h / 2 + oy, w, h);
      // neon border (double)
      const col = Phaser.Display.Color.HexStringToColor(color).color;
      g.lineStyle(3, col, 1);
      g.strokeRect(-w / 2, -h / 2 + oy, w, h);
      g.lineStyle(1, 0xffffff, 0.5);
      g.strokeRect(-w / 2 + 4, -h / 2 + 4 + oy, w - 8, h - 8);
      // top highlight bar
      g.fillStyle(col, 0.25);
      g.fillRect(-w / 2 + 4, -h / 2 + 4 + oy, w - 8, 4);
    };
    draw(false);
    const txt = this.text(scene, 0, 0, label, opt.size || 20, opt.textColor || PAL.white, { stroke: PAL.black, strokeW: 4 });
    c.add([g, txt]);
    c.setSize(w, h);
    c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', () => { draw(true); txt.y = 3; });
    c.on('pointerup', () => { draw(false); txt.y = 0; if (typeof Sfx !== 'undefined') Sfx.click(); onClick && onClick(); });
    c.on('pointerout', () => { draw(false); txt.y = 0; });
    if (opt.depth != null) c.setDepth(opt.depth);
    c._redraw = draw;
    c._label = txt;
    return c;
  },

  // A bordered neon panel (graphics object).
  panel(scene, x, y, w, h, color, fillAlpha = 0.85) {
    const g = scene.add.graphics();
    const col = Phaser.Display.Color.HexStringToColor(color).color;
    g.fillStyle(Phaser.Display.Color.HexStringToColor(PAL.ink).color, fillAlpha);
    g.fillRect(x, y, w, h);
    g.lineStyle(3, col, 1);
    g.strokeRect(x, y, w, h);
    g.lineStyle(1, 0xffffff, 0.25);
    g.strokeRect(x + 4, y + 4, w - 8, h - 8);
    return g;
  },

  // Scrolling isometric grid backdrop (returns a TileSprite-like graphics).
  isoBackdrop(scene, w, h) {
    const g = scene.add.graphics();
    g.setDepth(-100);
    const redraw = (offset) => {
      g.clear();
      g.fillStyle(Phaser.Display.Color.HexStringToColor(PAL.void).color, 1);
      g.fillRect(0, 0, w, h);
      g.lineStyle(1, Phaser.Display.Color.HexStringToColor(PAL.voidLt).color, 1);
      const step = 48;
      for (let i = -h; i < w + h; i += step) {
        g.lineBetween(i + (offset % step), 0, i + (offset % step) - h, h);
        g.lineBetween(i - (offset % step), 0, i - (offset % step) + h, h);
      }
    };
    redraw(0);
    g._redraw = redraw;
    return g;
  },
};
