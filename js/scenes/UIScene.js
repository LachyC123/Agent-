// UIScene — stylised pixel HUD + touch controls, runs on top of GameScene.
class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  init(data) { this.heroId = (data && data.heroId) || 'zap'; }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    this.game_ = this.scene.get('Game');
    this.hero = getHero(this.heroId);
    this.input.addPointer(3); // allow multitouch

    // ---- TOP: timer + payload progress ----
    UIKit.panel(this, W / 2 - 70, 8, 140, 34, this.hero.color, 0.8);
    this.timerText = UIKit.text(this, W / 2, 25, '2:00', 22, PAL.white, { stroke: PAL.black, strokeW: 4, depth: 10 });

    // payload bar
    this.payX = 40; this.payW = W - 80; this.payY = 56;
    UIKit.text(this, this.payX, this.payY - 12, 'ESCORT', 11, PAL.steel, { originX: 0 });
    this.payBarBg = this.add.graphics();
    this.payBarFg = this.add.graphics();
    this.payIcon = this.add.image(this.payX, this.payY + 8, 'payload').setScale(0.5).setDepth(11);

    // ---- BOTTOM-LEFT: player status ----
    this.portrait = this.add.image(54, H - 60, 'portrait_' + this.heroId).setScale(1.1).setDepth(10);
    UIKit.panel(this, 16, H - 96, 76, 76, this.hero.color, 0.5);
    // hp + ult bars
    this.hpBar = this.add.graphics().setDepth(12);
    this.ultBar = this.add.graphics().setDepth(12);
    UIKit.text(this, 104, H - 86, 'HP', 10, PAL.steel, { originX: 0 });
    UIKit.text(this, 104, H - 60, 'ULT', 10, PAL.yellow, { originX: 0 });

    // ---- JOYSTICK (left, floating) ----
    this.joy = { active: false, id: -1, bx: 0, by: 0, tx: 0, ty: 0, r: 58 };
    this.joyBase = this.add.graphics().setDepth(20).setVisible(false);
    this.joyThumb = this.add.graphics().setDepth(21).setVisible(false);
    UIKit.text(this, 90, H - 150, 'MOVE', 11, PAL.steelDk, { depth: 5 });

    // ---- ACTION BUTTONS (right) ----
    this.fireBtn = this.roundBtn(W - 74, H - 96, 46, 'icon_' + this.heroId + '_fire', this.hero.color, true);
    this.ab0 = this.roundBtn(W - 150, H - 70, 32, 'icon_' + this.heroId + '_' + this.hero.abilities[0].key, this.hero.color, false, 0);
    this.ab1 = this.roundBtn(W - 124, H - 150, 32, 'icon_' + this.heroId + '_' + this.hero.abilities[1].key, this.hero.color, false, 1);
    this.ultBtn = this.roundBtn(W - 52, H - 184, 34, 'icon_' + this.heroId + '_ult', PAL.yellow, false, 'ult');

    // cooldown overlays
    this.cdG = this.add.graphics().setDepth(30);

    // ---- pointer handling for joystick ----
    this.input.on('pointerdown', (p) => this.onDown(p));
    this.input.on('pointermove', (p) => this.onMove(p));
    this.input.on('pointerup', (p) => this.onUp(p));

    this.killFeed = UIKit.text(this, W / 2, 90, '', 14, PAL.yellow, { stroke: PAL.black, strokeW: 4, depth: 10 });

    // ---- KILL FEED (event-driven) ----
    this.kills = [];
    this._killHandler = (d) => this.addKill(d);
    this.game_.events.on('kill', this._killHandler);
    this.events.once('shutdown', () => this.game_.events.off('kill', this._killHandler));
  }

  addKill(d) {
    const line = (d.a ? d.a + '  ✕  ' : '') + d.b;
    const txt = UIKit.text(this, this.W - 14, 0, line, 12, d.color, {
      originX: 1, stroke: PAL.black, strokeW: 3, depth: 45,
    });
    const entry = { txt };
    this.kills.unshift(entry);
    while (this.kills.length > 4) { const e = this.kills.pop(); e.txt.destroy(); }
    this.layoutKills();
    this.time.delayedCall(3500, () => {
      const i = this.kills.indexOf(entry);
      if (i >= 0) {
        this.tweens.add({
          targets: entry.txt, alpha: 0, duration: 400,
          onComplete: () => { entry.txt.destroy(); const j = this.kills.indexOf(entry); if (j >= 0) this.kills.splice(j, 1); },
        });
      }
    });
  }

  layoutKills() {
    this.kills.forEach((e, i) => { e.txt.y = 110 + i * 20; });
  }

  roundBtn(x, y, r, iconKey, color, isFire, abilityIdx) {
    const g = this.add.graphics().setDepth(20);
    const col = Phaser.Display.Color.HexStringToColor(color).color;
    const draw = (pressed) => {
      g.clear();
      g.fillStyle(0x000000, 0.45); g.fillCircle(x + 3, y + 4, r);
      g.fillStyle(Phaser.Display.Color.HexStringToColor(PAL.ink).color, 0.92); g.fillCircle(x, y, r);
      g.lineStyle(pressed ? 4 : 3, col, 1); g.strokeCircle(x, y, r);
      g.lineStyle(1, 0xffffff, 0.35); g.strokeCircle(x, y, r - 5);
    };
    draw(false);
    const icon = this.add.image(x, y, iconKey).setScale(r / 11).setDepth(22);
    const zone = this.add.zone(x, y, r * 2, r * 2);
    zone.setInteractive(new Phaser.Geom.Circle(r, r, r), Phaser.Geom.Circle.Contains);
    const obj = { g, icon, x, y, r, draw, abilityIdx, ready: true };
    zone.on('pointerdown', () => {
      if (typeof Sfx !== 'undefined') Sfx.resume();
      draw(true); icon.setScale(r / 11 * 0.85);
      if (isFire) { this.game_.firing = true; }
      else if (abilityIdx === 'ult') { this.game_.useUlt(); }
      else { this.game_.useAbility(abilityIdx); }
    });
    const release = () => { draw(false); icon.setScale(r / 11); if (isFire) this.game_.firing = false; };
    zone.on('pointerup', release);
    zone.on('pointerout', release);
    return obj;
  }

  // ---- joystick pointer logic ----
  onDown(p) {
    if (this.joy.active) return;
    if (p.x > this.W * 0.5) return; // right half = action buttons
    this.joy.active = true; this.joy.id = p.id;
    this.joy.bx = p.x; this.joy.by = p.y; this.joy.tx = p.x; this.joy.ty = p.y;
    this.drawJoy();
  }
  onMove(p) {
    if (!this.joy.active || p.id !== this.joy.id) return;
    let dx = p.x - this.joy.bx, dy = p.y - this.joy.by;
    const m = Math.hypot(dx, dy);
    if (m > this.joy.r) { dx = dx / m * this.joy.r; dy = dy / m * this.joy.r; }
    this.joy.tx = this.joy.bx + dx; this.joy.ty = this.joy.by + dy;
    this.setMove(dx / this.joy.r, dy / this.joy.r);
    this.drawJoy();
  }
  onUp(p) {
    if (p.id !== this.joy.id) return;
    this.joy.active = false; this.joy.id = -1;
    this.game_.moveVec = { x: 0, y: 0 };
    this.joyBase.setVisible(false); this.joyThumb.setVisible(false);
  }

  // convert screen-space stick to grid-space movement so "up" = up on screen
  setMove(sx, sy) {
    const gx = (sx / 1 + sy / 0.5) / 2;
    const gy = (sy / 0.5 - sx / 1) / 2;
    this.game_.moveVec = { x: gx, y: gy };
  }

  drawJoy() {
    const j = this.joy;
    const col = Phaser.Display.Color.HexStringToColor(this.hero.color).color;
    this.joyBase.clear().setVisible(true);
    this.joyBase.fillStyle(0x000000, 0.4); this.joyBase.fillCircle(j.bx, j.by, j.r);
    this.joyBase.lineStyle(3, col, 0.8); this.joyBase.strokeCircle(j.bx, j.by, j.r);
    this.joyThumb.clear().setVisible(true);
    this.joyThumb.fillStyle(col, 0.9); this.joyThumb.fillCircle(j.tx, j.ty, 22);
    this.joyThumb.fillStyle(0xffffff, 0.6); this.joyThumb.fillCircle(j.tx, j.ty, 10);
  }

  update() {
    const g = this.game_;
    if (!g || !g.player) return;
    const p = g.player;

    // timer
    const t = Math.max(0, g.matchTime) / 1000;
    const mm = Math.floor(t / 60), ss = Math.floor(t % 60);
    this.timerText.setText(mm + ':' + (ss < 10 ? '0' : '') + ss);
    if (t < 20) this.timerText.setColor(PAL.red);

    // payload progress
    this.payBarBg.clear();
    this.payBarBg.fillStyle(0x000000, 0.6); this.payBarBg.fillRect(this.payX, this.payY, this.payW, 12);
    this.payBarBg.lineStyle(2, Phaser.Display.Color.HexStringToColor(PAL.cyan).color, 1);
    this.payBarBg.strokeRect(this.payX, this.payY, this.payW, 12);
    this.payBarFg.clear();
    const pf = Phaser.Math.Clamp(g.payload.progress, 0, 1);
    const col = g.payload.contested ? 0xffd23d : (g.payload.moving ? 0x7dff5c : 0x3df2ff);
    this.payBarFg.fillStyle(col, 1); this.payBarFg.fillRect(this.payX, this.payY, this.payW * pf, 12);
    this.payIcon.x = this.payX + this.payW * pf;
    if (g.payload.contested) this.killFeed.setText('● PAYLOAD CONTESTED');
    else if (g.payload.moving) this.killFeed.setText('▲ ESCORTING');
    else this.killFeed.setText('');

    // hp + ult bars
    this.hpBar.clear();
    this.hpBar.fillStyle(0x000000, 0.7); this.hpBar.fillRect(104, H_(this, 80), 110, 12);
    const hpf = Phaser.Math.Clamp(p.hp / p.maxHp, 0, 1);
    this.hpBar.fillStyle(p.alive ? 0x7dff5c : 0x555555, 1); this.hpBar.fillRect(104, H_(this, 80), 110 * hpf, 12);
    this.hpBar.lineStyle(1, 0xffffff, 0.3); this.hpBar.strokeRect(104, H_(this, 80), 110, 12);

    this.ultBar.clear();
    this.ultBar.fillStyle(0x000000, 0.7); this.ultBar.fillRect(104, H_(this, 54), 110, 12);
    const uf = p.ult / 100;
    this.ultBar.fillStyle(uf >= 1 ? 0xffd23d : 0xc79212, 1); this.ultBar.fillRect(104, H_(this, 54), 110 * uf, 12);
    this.ultBar.lineStyle(1, 0xffffff, 0.3); this.ultBar.strokeRect(104, H_(this, 54), 110, 12);

    // cooldown overlays
    this.cdG.clear();
    this.drawCd(this.ab0, g.cooldownFrac(0));
    this.drawCd(this.ab1, g.cooldownFrac(1));
    // ult button glow when ready
    const ultReady = p.ult >= 100;
    this.ultBtn.icon.setAlpha(ultReady ? 1 : 0.4);
    if (ultReady) {
      this.cdG.lineStyle(3, 0xffd23d, 0.6 + 0.4 * Math.sin(performance.now() / 150));
      this.cdG.strokeCircle(this.ultBtn.x, this.ultBtn.y, this.ultBtn.r + 3);
    }

    // dim action buttons when dead
    [this.fireBtn, this.ab0, this.ab1, this.ultBtn].forEach(b => b.icon.setAlpha(p.alive ? b.icon.alpha : 0.3));
  }

  drawCd(btn, frac) {
    if (frac <= 0) return;
    this.cdG.fillStyle(0x000000, 0.6);
    // pie wedge from top
    this.cdG.slice(btn.x, btn.y, btn.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, false);
    this.cdG.fillPath();
  }
}

// helper: y measured from bottom of UI canvas
function H_(scene, fromBottom) { return scene.H - fromBottom; }
