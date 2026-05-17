class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.won   = data.won   || false;
    this.floor = data.floor || 1;
    this.level = data.level || 1;
    this.gold  = data.gold  || 0;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000);

    if (this.won) {
      this._showVictory(W, H);
    } else {
      this._showDeath(W, H);
    }
  }

  _showDeath(W, H) {
    // Blood drips
    for (let i = 0; i < 10; i++) {
      const drip = this.add.rectangle(
        Phaser.Math.Between(0, W), -20,
        Phaser.Math.Between(3, 8),
        Phaser.Math.Between(40, 120),
        0x880000, 0.8
      );
      this.tweens.add({ targets: drip, y: drip.y + H + 150, duration: 1500 + i * 300, delay: i * 100, ease: 'Quad.easeIn' });
    }

    // Dead player sprite center
    const spr = this.add.image(W / 2, H / 2 - 80, 'player', 'dead').setScale(4).setAlpha(0);
    this.tweens.add({ targets: spr, alpha: 1, duration: 800, ease: 'Power2' });
    this.tweens.add({ targets: spr, angle: 5, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Title
    this.time.delayedCall(400, () => {
      const shadow = this.add.text(W / 2 + 4, H / 2 + 4, 'YOU DIED', {
        fontFamily: 'monospace', fontSize: '44px', color: '#440000',
      }).setOrigin(0.5);
      const title  = this.add.text(W / 2, H / 2, 'YOU DIED', {
        fontFamily: 'monospace', fontSize: '44px', color: '#ff1111',
        stroke: '#cc0000', strokeThickness: 3,
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: title, alpha: 1, duration: 600 });
      this.tweens.add({ targets: title, scaleX: 1.05, scaleY: 1.05, duration: 1000, yoyo: true, repeat: -1 });
    });

    // Flavour
    const quips = [
      '"The audience is... disappointed."',
      '"The show must go on. You will not."',
      '"*maniacal laughter fades*"',
      '"They found your body next to a cream pie."',
      '"The clowns will eat well tonight."',
    ];
    const quip = quips[Math.floor(Math.random() * quips.length)];
    this.time.delayedCall(1200, () => {
      this.add.text(W / 2, H / 2 + 60, quip, {
        fontFamily: 'monospace', fontSize: '13px', color: '#884444',
        align: 'center', fontStyle: 'italic', wordWrap: { width: W - 40 },
      }).setOrigin(0.5);
    });

    this._showStats(W, H / 2 + 110);
    this._showButtons(W, H);
  }

  _showVictory(W, H) {
    // Confetti
    for (let i = 0; i < 30; i++) {
      const colors = [0xff4444, 0xffee44, 0x44ff88, 0x4488ff, 0xff44ff];
      const conf = this.add.rectangle(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(-20, -200),
        6, 10, Phaser.Utils.Array.GetRandom(colors)
      );
      this.tweens.add({
        targets: conf,
        y: H + 20,
        x: conf.x + Phaser.Math.Between(-60, 60),
        angle: Phaser.Math.Between(-360, 360),
        duration: 1500 + Math.random() * 2000,
        delay: Math.random() * 1000,
        ease: 'Quad.easeIn',
        repeat: -1,
        repeatDelay: Math.random() * 500,
      });
    }

    const playerSpr = this.add.image(W / 2, H / 2 - 90, 'player', 'idle').setScale(4);
    this.tweens.add({ targets: playerSpr, y: playerSpr.y - 10, duration: 700, yoyo: true, repeat: -1 });

    const title = this.add.text(W / 2, H / 2, 'ESCAPED!', {
      fontFamily: 'monospace', fontSize: '42px', color: '#ffee00',
      stroke: '#ff8800', strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scaleX: 1.06, scaleY: 1.06, duration: 900, yoyo: true, repeat: -1 });

    this.add.text(W / 2, H / 2 + 55, 'You escaped the Circus Inferno!', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffcc44', align: 'center',
    }).setOrigin(0.5);

    this._showStats(W, H / 2 + 90);
    this._showButtons(W, H);
  }

  _showStats(W, y) {
    const lines = [
      `Floor reached:  ${this.floor}`,
      `Level attained: ${this.level}`,
      `Gold collected: ${this.gold}g`,
    ];
    lines.forEach((line, i) => {
      this.time.delayedCall(1400 + i * 200, () => {
        this.add.text(W / 2, y + i * 22, line, {
          fontFamily: 'monospace', fontSize: '14px', color: '#ccaacc', align: 'center',
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: this.children.list[this.children.list.length - 1], alpha: 1, duration: 400 });
      });
    });
  }

  _showButtons(W, H) {
    this.time.delayedCall(2000, () => {
      this._btn(W / 2, H - 130, 'PLAY AGAIN', 0xcc1111, () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { floor: 1, seed: Math.floor(Math.random() * 99999) });
        });
      });
      this._btn(W / 2, H - 75, 'MAIN MENU', 0x441166, () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MenuScene');
        });
      });
    });
  }

  _btn(x, y, label, color, cb) {
    const bg = this.add.rectangle(x, y, 220, 44, color, 0.15)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, color, 0.8);
    const txt = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '18px', color: '#' + color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);

    bg.on('pointerover',  () => { bg.setFillStyle(color, 0.35); txt.setStyle({ color: '#ffffff' }); });
    bg.on('pointerout',   () => { bg.setFillStyle(color, 0.15); txt.setStyle({ color: '#' + color.toString(16).padStart(6, '0') }); });
    bg.on('pointerdown',  () => bg.setScale(0.95));
    bg.on('pointerup',    () => { bg.setScale(1); cb(); });
  }
}
