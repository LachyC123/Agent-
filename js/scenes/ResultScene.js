// ResultScene — win / defeat summary.
class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  init(data) {
    this.win = data && data.win;
    this.heroId = (data && data.heroId) || 'zap';
    this.progress = (data && data.progress) || 0;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const hero = getHero(this.heroId);

    this.bg = UIKit.isoBackdrop(this, W, H);
    this.bgOffset = 0;

    const color = this.win ? PAL.lime : PAL.red;
    const label = this.win ? 'VICTORY' : 'DEFEAT';

    if (typeof Sfx !== 'undefined') { this.win ? Sfx.victory() : Sfx.defeat(); }

    // banner glow
    const glow = this.add.graphics();
    glow.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.18);
    glow.fillRect(0, 200, W, 160);

    UIKit.text(this, W / 2 + 3, 270 + 3, label, 66, PAL.black, { stroke: PAL.black, strokeW: 8 });
    const big = UIKit.text(this, W / 2, 270, label, 66, color, { stroke: PAL.ink, strokeW: 8 });
    big.setScale(0.3);
    this.tweens.add({ targets: big, scale: 1, duration: 400, ease: 'Back.out' });

    UIKit.text(this, W / 2, 330, this.win ? 'CORE DELIVERED!' : 'THE CORE WAS LOST', 16, PAL.bone, { stroke: PAL.black, strokeW: 4 });

    // hero + stat
    this.add.image(W / 2, 460, 'portrait_' + this.heroId).setScale(2.6);
    UIKit.text(this, W / 2, 540, hero.name, 26, hero.color, { stroke: PAL.ink, strokeW: 5 });

    // progress bar
    const px = 70, pw = W - 140, py = 590;
    const g = this.add.graphics();
    g.fillStyle(Phaser.Display.Color.HexStringToColor(PAL.black).color, 1); g.fillRect(px, py, pw, 16);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1); g.fillRect(px, py, pw * Phaser.Math.Clamp(this.progress, 0, 1), 16);
    g.lineStyle(2, 0xffffff, 0.4); g.strokeRect(px, py, pw, 16);
    UIKit.text(this, W / 2, py + 34, 'ESCORT PROGRESS  ' + Math.round(this.progress * 100) + '%', 13, PAL.steel);

    // buttons
    UIKit.button(this, W / 2, 690, 240, 60, 'PLAY AGAIN', PAL.cyan, () => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.time.delayedCall(230, () => this.scene.start('Select'));
    }, { size: 22 });
    UIKit.button(this, W / 2, 762, 240, 54, 'MAIN MENU', PAL.steel, () => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.time.delayedCall(230, () => this.scene.start('Menu'));
    }, { size: 18 });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  update(_, dt) {
    this.bgOffset += dt * 0.015;
    this.bg._redraw(this.bgOffset);
  }
}
