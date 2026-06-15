// main.js — Phaser game configuration for NEON RIFT.
// Mobile-first: portrait-friendly canvas that scales to fit any screen,
// crisp pixel-art rendering, and a touch-driven control scheme.

const GAME_W = 480;
const GAME_H = 854; // ~9:16 portrait

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: PAL.void,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, SelectScene, GameScene, UIScene, ResultScene],
};

const game = new Phaser.Game(config);
