const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 360,
  height: 640,
  backgroundColor: '#050208',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene],
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  }
};

window.game = new Phaser.Game(config);
