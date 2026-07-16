class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.won   = data.won   || false;
    this.floor = data.floor || 1;
    this.level = data.level || 1;
    this.gold  = data.gold  || 0;
    this.kills = data.kills || 0;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(W/2, H/2, W, H, 0x050208);
    this.won ? this._showVictory(W, H) : this._showDeath(W, H);
  }

  _showDeath(W, H) {
    // Dripping blood effect
    for (let i = 0; i < 8; i++) {
      const drip = this.add.rectangle(
        Phaser.Math.Between(0, W), -20,
        Phaser.Math.Between(3, 7), Phaser.Math.Between(40, 100),
        0x880000, 0.7
      );
      this.tweens.add({
        targets: drip, y: drip.y + H + 150,
        duration: 1600 + i * 300, delay: i * 120, ease: 'Quad.easeIn',
      });
    }

    // Dead player sprite
    const spr = this.add.sprite(W/2, H/2 - 80, 'player', 21).setScale(4).setAlpha(0);
    this.tweens.add({ targets: spr, alpha: 1, duration: 700, ease: 'Power2' });
    this.tweens.add({ targets: spr, angle: 8, duration: 1300, yoyo: true, repeat: -1 });

    this.time.delayedCall(350, () => {
      const shadow = this.add.text(W/2 + 3, H/2 + 7, 'YOU DIED', {
        fontFamily: 'monospace', fontSize: '42px', color: '#330000',
      }).setOrigin(0.5);
      const title = this.add.text(W/2, H/2, 'YOU DIED', {
        fontFamily: 'monospace', fontSize: '42px', color: '#cc2222',
        stroke: '#880000', strokeThickness: 3,
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: title, alpha: 1, duration: 500 });
      this.tweens.add({ targets: title, scaleX: 1.04, scaleY: 1.04, duration: 1100, yoyo: true, repeat: -1 });
    });

    const quips = [
      '"The dungeon swallows another soul."',
      '"Darkness claims what it is owed."',
      '"You were not ready."',
      '"The bones of heroes litter these halls."',
      '"The torches burn on without you."',
    ];
    this.time.delayedCall(1100, () => {
      this.add.text(W/2, H/2 + 55, quips[Math.floor(Math.random() * quips.length)], {
        fontFamily: 'monospace', fontSize: '12px', color: '#773333',
        align: 'center', fontStyle: 'italic', wordWrap: { width: W - 40 },
      }).setOrigin(0.5);
    });

    this._showStats(W, H/2 + 105);
    this._showButtons(W, H);
  }

  _showVictory(W, H) {
    // Golden particles
    for (let i = 0; i < 25; i++) {
      const colors = [0xffee44, 0xffcc22, 0xff9900, 0xffff88, 0xaa6600];
      const conf = this.add.rectangle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(-20, -200),
        Phaser.Math.Between(4, 8), Phaser.Math.Between(4, 8),
        Phaser.Utils.Array.GetRandom(colors)
      );
      this.tweens.add({
        targets: conf, y: H + 20,
        x: conf.x + Phaser.Math.Between(-50, 50),
        angle: Phaser.Math.Between(-360, 360),
        duration: 1500 + Math.random() * 2000,
        delay: Math.random() * 1000,
        ease: 'Quad.easeIn', repeat: -1,
        repeatDelay: Math.random() * 500,
      });
    }

    const spr = this.add.sprite(W/2, H/2 - 90, 'player', 0).setScale(4);
    this.tweens.add({ targets: spr, y: spr.y - 12, duration: 700, yoyo: true, repeat: -1 });

    const title = this.add.text(W/2, H/2 - 10, 'ESCAPED!', {
      fontFamily: 'monospace', fontSize: '40px', color: '#ffdd22',
      stroke: '#aa6600', strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, scaleX: 1.05, scaleY: 1.05, duration: 900, yoyo: true, repeat: -1 });

    this.add.text(W/2, H/2 + 45, 'You conquered the Dungeon Depths!', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ddaa44', align: 'center',
    }).setOrigin(0.5);

    this._showStats(W, H/2 + 80);
    this._showButtons(W, H);
  }

  _showStats(W, y) {
    const lines = [
      `Floor reached:  ${this.floor}`,
      `Level attained: ${this.level}`,
      `Enemies slain:  ${this.kills}`,
      `Gold collected: ${this.gold}g`,
    ];
    lines.forEach((line, i) => {
      this.time.delayedCall(1300 + i * 200, () => {
        const t = this.add.text(W/2, y + i * 22, line, {
          fontFamily: 'monospace', fontSize: '13px', color: '#997755', align: 'center',
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: t, alpha: 1, duration: 400 });
      });
    });
  }

  _showButtons(W, H) {
    this.time.delayedCall(2000, () => {
      this._btn(W/2, H - 128, 'PLAY AGAIN', 0xaa4422, () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () =>
          this.scene.start('GameScene', { floor: 1, seed: Math.floor(Math.random() * 99999) })
        );
      });
      this._btn(W/2, H - 76, 'MAIN MENU', 0x334455, () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () =>
          this.scene.start('MenuScene')
        );
      });
    });
  }

  _btn(x, y, label, color, cb) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const bg = this.add.rectangle(x, y, 220, 42, color, 0.15)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(1, color, 0.8);
    const txt = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '17px', color: hex,
    }).setOrigin(0.5);
    bg.on('pointerover',  () => { bg.setFillStyle(color, 0.3); txt.setStyle({ color: '#ffffff' }); });
    bg.on('pointerout',   () => { bg.setFillStyle(color, 0.15); txt.setStyle({ color: hex }); });
    bg.on('pointerdown',  () => bg.setScale(0.96));
    bg.on('pointerup',    () => { bg.setScale(1); cb(); });
  }
}
