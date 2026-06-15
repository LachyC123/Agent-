// SelectScene — stylised hero select with portraits, stats and abilities.
class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.selected = 0;

    this.bg = UIKit.isoBackdrop(this, W, H);
    this.bgOffset = 0;

    UIKit.text(this, W / 2 + 2, 44 + 2, 'CHOOSE YOUR HERO', 26, PAL.magDk, { stroke: PAL.black, strokeW: 6 });
    UIKit.text(this, W / 2, 44, 'CHOOSE YOUR HERO', 26, PAL.cyan, { stroke: PAL.ink, strokeW: 6 });

    // featured panel
    UIKit.panel(this, 30, 80, W - 60, 360, PAL.cyan, 0.8);
    this.featured = this.add.container(0, 0);

    // selection cards along the bottom
    this.cards = [];
    const cardW = 124, gap = 14;
    const totalW = HEROES.length * cardW + (HEROES.length - 1) * gap;
    let cx = W / 2 - totalW / 2 + cardW / 2;
    HEROES.forEach((h, i) => {
      const card = this.makeCard(cx, 560, cardW, h, i);
      this.cards.push(card);
      cx += cardW + gap;
    });

    // LOCK IN
    this.lockBtn = UIKit.button(this, W / 2, 760, 260, 64, 'LOCK IN  ▶', PAL.lime, () => {
      const hero = HEROES[this.selected];
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.time.delayedCall(260, () => this.scene.start('Game', { heroId: hero.id }));
    }, { size: 24 });

    UIKit.button(this, 70, 760, 90, 50, '‹ BACK', PAL.steel, () => {
      this.scene.start('Menu');
    }, { size: 16 });

    this.renderFeatured();
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  makeCard(x, y, w, hero, idx) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    c.add(g);
    const portrait = this.add.image(0, -10, 'portrait_' + hero.id).setScale(1.3);
    const badge = this.add.image(-w / 2 + 18, -h2(64), 'badge_' + hero.id).setScale(1.1);
    const name = UIKit.text(this, 0, 50, hero.name, 16, hero.color, { stroke: PAL.black, strokeW: 4 });
    c.add([portrait, badge, name]);
    c.setSize(w, 130);
    c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -65, w, 130), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', () => { this.selected = idx; this.renderFeatured(); });
    c._g = g; c._w = w; c._hero = hero;
    return c;
  }

  redrawCards() {
    this.cards.forEach((c, i) => {
      const w = c._w, sel = i === this.selected;
      const col = Phaser.Display.Color.HexStringToColor(c._hero.color).color;
      c._g.clear();
      c._g.fillStyle(Phaser.Display.Color.HexStringToColor(PAL.ink).color, sel ? 0.95 : 0.7);
      c._g.fillRect(-w / 2, -65, w, 130);
      c._g.lineStyle(sel ? 4 : 2, col, sel ? 1 : 0.5);
      c._g.strokeRect(-w / 2, -65, w, 130);
      c.setScale(sel ? 1.06 : 1.0);
      c.setAlpha(sel ? 1 : 0.82);
    });
  }

  renderFeatured() {
    this.redrawCards();
    this.featured.removeAll(true);
    const W = this.scale.width;
    const h = HEROES[this.selected];

    // big portrait
    const port = this.add.image(120, 200, 'portrait_' + h.id).setScale(3.0);
    // role badge + name
    const badge = this.add.image(70, 110, 'badge_' + h.id).setScale(1.6);
    const name = UIKit.text(this, 230, 110, h.name, 40, h.color, { stroke: PAL.ink, strokeW: 6, originX: 0.5 });
    const role = UIKit.text(this, 230, 150, h.role.toUpperCase(), 18, PAL.white, { stroke: PAL.black, strokeW: 4, originX: 0.5 });
    this.featured.add([port, badge, name, role]);

    // tagline
    const tag = this.add.text(210, 180, h.tagline, {
      fontFamily: 'monospace', fontSize: '13px', color: PAL.bone, align: 'left',
      wordWrap: { width: 240 },
    }).setOrigin(0, 0);
    this.featured.add(tag);

    // stat bars
    const sy = 250;
    this.statBar(210, sy, 'HEALTH', h.stats.hp / 500, h.color, h.stats.hp);
    this.statBar(210, sy + 26, 'SPEED', h.stats.speed / 3.6, h.color, h.stats.speed.toFixed(1));

    // abilities row
    const ay = 388, ax0 = 60;
    const abils = h.abilities.concat([{ key: 'ult', name: h.ult.name, icon: 'ult' }]);
    abils.forEach((a, i) => {
      const ax = ax0 + i * 130;
      const icon = this.add.image(ax, ay, 'icon_' + h.id + '_' + a.key).setScale(2.0);
      const fr = this.add.graphics();
      const col = Phaser.Display.Color.HexStringToColor(h.color).color;
      fr.lineStyle(2, col, 0.9);
      fr.strokeRect(ax - 18, ay - 18, 36, 36);
      const lbl = UIKit.text(this, ax, ay + 28, a.name, 11, PAL.bone, { stroke: PAL.black, strokeW: 3 });
      const tag2 = i === 2 ? UIKit.text(this, ax, ay - 30, 'ULTIMATE', 9, PAL.yellow) : null;
      this.featured.add([fr, icon, lbl]);
      if (tag2) this.featured.add(tag2);
    });
  }

  statBar(x, y, label, frac, color, valueText) {
    frac = Phaser.Math.Clamp(frac, 0.05, 1);
    const w = 170;
    const lbl = UIKit.text(this, x, y, label, 11, PAL.steel, { originX: 0, originY: 0.5 });
    const g = this.add.graphics();
    g.fillStyle(Phaser.Display.Color.HexStringToColor(PAL.black).color, 1);
    g.fillRect(x + 60, y - 5, w, 10);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
    g.fillRect(x + 60, y - 5, w * frac, 10);
    g.lineStyle(1, 0xffffff, 0.3);
    g.strokeRect(x + 60, y - 5, w, 10);
    const val = UIKit.text(this, x + 60 + w + 6, y, '' + valueText, 11, PAL.white, { originX: 0, originY: 0.5 });
    this.featured.add([lbl, g, val]);
  }

  update(_, dt) {
    this.bgOffset += dt * 0.015;
    this.bg._redraw(this.bgOffset);
  }
}

function h2(n) { return n / 2; }
