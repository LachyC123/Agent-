class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // Background — dark with subtle texture
    this.add.rectangle(W / 2, H / 2, W, H, 0x050008);

    // Animated curtain stripes
    for (let i = 0; i < 6; i++) {
      const stripe = this.add.rectangle(i * 70 - 10, H / 2, 30, H, 0x110022, 0.3);
      this.tweens.add({ targets: stripe, x: stripe.x + 420, duration: 8000 + i * 1200, repeat: -1, ease: 'Linear' });
    }

    // Blood drip decorations
    for (let i = 0; i < 8; i++) {
      const drip = this.add.rectangle(40 + i * 46, 20, 4, 20 + Math.random() * 40, 0x880000, 0.7);
    }

    // Title
    this.add.text(W / 2, 90, '🎪', { fontSize: '48px' }).setOrigin(0.5);
    const titleShadow = this.add.text(W / 2 + 3, 153, 'CIRCUS\nINFERNO', {
      fontFamily: 'monospace', fontSize: '40px', color: '#440000', align: 'center',
    }).setOrigin(0.5);
    const title = this.add.text(W / 2, 150, 'CIRCUS\nINFERNO', {
      fontFamily: 'monospace', fontSize: '40px', color: '#ff1111', align: 'center',
      stroke: '#ff0000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scaleX: 1.04, scaleY: 1.04, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Tagline
    this.add.text(W / 2, 235, '"The show must go on."', {
      fontFamily: 'monospace', fontSize: '13px', color: '#886688', align: 'center',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Enemy preview sprites
    const enemyNames = ['jester', 'mime', 'juggler', 'balloondog', 'ringmaster'];
    enemyNames.forEach((name, i) => {
      const ex = 36 + i * 70;
      const ey = 300;
      const img = this.add.image(ex, ey, 'enemies', `${name}_0`).setScale(2);
      this.tweens.add({ targets: img, y: ey - 6, duration: 600 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    // Player preview
    const player = this.add.image(W / 2, 365, 'player', 'idle').setScale(3);
    this.tweens.add({ targets: player, y: 362, scaleX: 3.1, duration: 900, yoyo: true, repeat: -1 });

    // --- Buttons ---
    this._makeButton(W / 2, 430, 'NEW GAME', 0xcc1111, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { floor: 1, seed: Math.floor(Math.random() * 99999) });
      });
    });

    this._makeButton(W / 2, 500, 'HOW TO PLAY', 0x441166, () => this._showHelp());

    // Version
    this.add.text(W - 8, H - 8, 'v1.0', {
      fontFamily: 'monospace', fontSize: '10px', color: '#443344',
    }).setOrigin(1, 1);
  }

  _makeButton(x, y, label, color, cb) {
    const bg = this.add.rectangle(x, y, 220, 44, color, 0.15)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, color, 0.8);

    const txt = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '18px', color: '#' + color.toString(16).padStart(6, '0'),
      align: 'center',
    }).setOrigin(0.5);

    bg.on('pointerover',  () => { bg.setFillStyle(color, 0.35); txt.setStyle({ color: '#ffffff' }); });
    bg.on('pointerout',   () => { bg.setFillStyle(color, 0.15); txt.setStyle({ color: '#' + color.toString(16).padStart(6, '0') }); });
    bg.on('pointerdown',  () => { bg.setScale(0.95); });
    bg.on('pointerup',    () => { bg.setScale(1); cb(); });
  }

  _showHelp() {
    const W = this.scale.width, H = this.scale.height;
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(10).setInteractive();
    const txt = [
      'HOW TO PLAY',
      '',
      'Use the D-PAD to move.',
      'Walk into enemies to attack.',
      'Walk into items to pick them up.',
      '',
      'ITEMS',
      '  Weapons  → equip for more ATK',
      '  Armor    → equip for more DEF',
      '  Seltzer  → restore 15 HP',
      '  Cream Pie→ stun enemies',
      '  Mystery  → random effect',
      '',
      'Reach the STAIRS (◎) to',
      'descend deeper into the circus.',
      '',
      'BOSS every 5th floor.',
      'Reach floor 10 and escape!',
      '',
      '[ TAP TO CLOSE ]',
    ].join('\n');

    const panel = this.add.text(W / 2, H / 2, txt, {
      fontFamily: 'monospace', fontSize: '13px', color: '#ddaadd',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setDepth(11);

    overlay.once('pointerdown', () => { overlay.destroy(); panel.destroy(); });
  }
}
