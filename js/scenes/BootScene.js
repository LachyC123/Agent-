class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    const W = this.scale.width, H = this.scale.height;
    // Loading screen
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0006);
    const title = this.add.text(W / 2, H / 2 - 60, 'CIRCUS\nINFERNO', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#cc1111',
      align: 'center',
      stroke: '#ff0000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const sub = this.add.text(W / 2, H / 2 + 20, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aa44aa',
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(W / 2, H / 2 + 70, 260, 14, 0x221133);
    const bar   = this.add.rectangle(W / 2 - 128, H / 2 + 70, 4, 10, 0xff3333).setOrigin(0, 0.5);

    // Flicker title
    this.tweens.add({ targets: title, alpha: 0.6, duration: 800, yoyo: true, repeat: -1 });

    this.load.on('progress', v => {
      bar.width = 4 + (256 - 4) * v;
    });
  }

  create() {
    // Generate all sprite sheets
    SpriteGen.init(this);
    this.time.delayedCall(200, () => this.scene.start('MenuScene'));
  }
}
