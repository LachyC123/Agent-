// MenuScene — stylised title screen.
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // animated iso backdrop
    this.bg = UIKit.isoBackdrop(this, W, H);
    this.bgOffset = 0;

    // top vignette glow
    const glow = this.add.graphics();
    glow.fillStyle(Phaser.Display.Color.HexStringToColor(PAL.purpleDk).color, 0.35);
    glow.fillEllipse(W / 2, 200, W * 1.4, 320);

    // floating iso platform with heroes posed on it
    const baseY = 470;
    [['hero_brick', -110, 10], ['hero_zap', 0, -16], ['hero_bloom', 110, 6]].forEach(([k, dx, dy], i) => {
      const tx = this.add.image(W / 2 + dx, baseY + dy + 40, 'tileObjective').setScale(2).setAlpha(0.9);
      const s = this.add.image(W / 2 + dx, baseY + dy, k).setScale(2.4).setOrigin(0.5, 0.85);
      this.tweens.add({ targets: s, y: baseY + dy - 8, duration: 1400 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });

    // TITLE — layered neon
    UIKit.text(this, W / 2 + 3, 150 + 3, 'NEON RIFT', 64, PAL.magDk, { stroke: PAL.black, strokeW: 8 });
    const title = UIKit.text(this, W / 2, 150, 'NEON RIFT', 64, PAL.cyan, { stroke: PAL.ink, strokeW: 8 });
    title.setShadow(0, 0, PAL.cyan, 18, true, true);
    this.tweens.add({ targets: title, scaleX: 1.03, scaleY: 1.03, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    UIKit.text(this, W / 2, 210, '✦ ISOMETRIC HERO BRAWL ✦', 16, PAL.yellow, { stroke: PAL.black, strokeW: 4 });

    // PLAY button
    UIKit.button(this, W / 2, 660, 240, 64, '▶  PLAY', PAL.cyan, () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.time.delayedCall(260, () => this.scene.start('Select'));
    }, { size: 26 });

    // mode label
    UIKit.text(this, W / 2, 720, 'ESCORT THE CORE  ·  VS BOTS', 13, PAL.steel, { stroke: PAL.black, strokeW: 3 });
    UIKit.text(this, W / 2, H - 24, 'tap & drag to move · buttons to fight', 12, PAL.steelDk);

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  update(_, dt) {
    this.bgOffset += dt * 0.02;
    this.bg._redraw(this.bgOffset);
  }
}
