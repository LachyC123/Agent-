class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // Background
    this.add.rectangle(W/2, H/2, W, H, 0x050208);

    // Animated tiles strip at bottom
    for (let x = 0; x < W; x += 32) {
      this.add.image(x + 16, H - 16, 'tileset', 11).setScale(2).setAlpha(0.5);
      this.add.image(x + 16, H - 48, 'tileset', 2).setScale(2).setAlpha(0.5);
    }

    // Title glow
    const glow = this.add.rectangle(W/2, H/2 - 120, 280, 90, 0xaa6600, 0.08);
    this.tweens.add({ targets: glow, alpha: 0.18, duration: 1400, yoyo: true, repeat: -1 });

    // Title text
    const shadow = this.add.text(W/2 + 3, H/2 - 117, 'DUNGEON\nDEPTHS', {
      fontFamily: 'monospace', fontSize: '38px', color: '#331100', align: 'center',
    }).setOrigin(0.5);
    const title = this.add.text(W/2, H/2 - 120, 'DUNGEON\nDEPTHS', {
      fontFamily: 'monospace', fontSize: '38px', color: '#cc8833',
      stroke: '#ffcc44', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scaleX: 1.03, scaleY: 1.03, duration: 1200, yoyo: true, repeat: -1 });

    // Subtitle
    this.add.text(W/2, H/2, 'A Dungeon Roguelike', {
      fontFamily: 'monospace', fontSize: '13px', color: '#886633', fontStyle: 'italic',
    }).setOrigin(0.5);

    // Enemy showcase — animated sprites
    const enemies = [
      { key: 'skeleton1_idle', anim: 'skeleton1-idle', x: W/2 - 80, y: H/2 + 60 },
      { key: 'skeleton2_idle', anim: 'skeleton2-idle', x: W/2,       y: H/2 + 60 },
      { key: 'vampire_idle',   anim: 'vampire-idle',   x: W/2 + 80, y: H/2 + 60 },
    ];
    enemies.forEach(e => {
      const spr = this.add.sprite(e.x, e.y, e.key).setScale(1.4).play(e.anim);
      this.tweens.add({ targets: spr, y: e.y - 6, duration: 800 + Math.random()*400, yoyo: true, repeat: -1 });
    });

    // Buttons
    this._btn(W/2, H/2 + 155, 'BEGIN DESCENT', 0xaa6633, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('GameScene', { floor: 1, seed: Math.floor(Math.random() * 99999) })
      );
    });
    this._btn(W/2, H/2 + 210, 'HOW TO PLAY', 0x445566, () => this._showHelp(W, H));

    // Flavour text
    const quips = [
      'The dungeon remembers those who fell.',
      'Darkness is patient. Are you?',
      'Every corridor holds a new death.',
      'Steel your nerves. Check your gold.',
    ];
    this.add.text(W/2, H - 20, quips[Math.floor(Math.random() * quips.length)], {
      fontFamily: 'monospace', fontSize: '10px', color: '#443322', fontStyle: 'italic',
    }).setOrigin(0.5);
  }

  _btn(x, y, label, color, cb) {
    const bg = this.add.rectangle(x, y, 220, 42, color, 0.15)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(1, color, 0.7);
    const txt = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '16px',
      color: '#' + color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);
    bg.on('pointerover',  () => { bg.setFillStyle(color, 0.3); txt.setStyle({ color: '#ffffff' }); });
    bg.on('pointerout',   () => { bg.setFillStyle(color, 0.15); txt.setStyle({ color: '#' + color.toString(16).padStart(6, '0') }); });
    bg.on('pointerdown',  () => bg.setScale(0.96));
    bg.on('pointerup',    () => { bg.setScale(1); cb(); });
  }

  _showHelp(W, H) {
    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.88).setInteractive();
    const box = this.add.rectangle(W/2, H/2, 300, 360, 0x0d0810).setStrokeStyle(1, 0x886633, 0.8);
    const title = this.add.text(W/2, H/2 - 155, 'HOW TO PLAY', {
      fontFamily: 'monospace', fontSize: '16px', color: '#cc8833',
    }).setOrigin(0.5);
    const lines = [
      'MOVE: Arrow keys / WASD',
      'or swipe the screen',
      '',
      'BUMP enemies to attack',
      '',
      'WAIT: Z or tap center',
      '(heals 1 HP per turn)',
      '',
      '[I] / BAG: open inventory',
      '',
      'Find STAIRS to descend',
      'to the next floor',
      '',
      'Collect GOLD and ITEMS',
      'to grow stronger',
    ];
    const textObj = this.add.text(W/2, H/2 - 120, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '12px', color: '#aa9988',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 0);
    const closeBtn = this.add.rectangle(W/2, H/2 + 170, 140, 36, 0x664422, 0.8)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xcc8833, 0.6);
    const closeTxt = this.add.text(W/2, H/2 + 170, 'CLOSE', {
      fontFamily: 'monospace', fontSize: '14px', color: '#cc8833',
    }).setOrigin(0.5);

    const all = [overlay, box, title, textObj, closeBtn, closeTxt];
    const close = () => all.forEach(o => o.destroy());
    overlay.on('pointerdown', close);
    closeBtn.on('pointerdown', close);
  }
}
