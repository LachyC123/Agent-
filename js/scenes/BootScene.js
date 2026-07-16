class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(W/2, H/2, W, H, 0x050208);
    const title = this.add.text(W/2, H/2 - 60, 'DUNGEON\nDEPTHS', {
      fontFamily: 'monospace', fontSize: '34px', color: '#aa7733',
      align: 'center', stroke: '#ffaa44', strokeThickness: 2,
    }).setOrigin(0.5);
    this.add.text(W/2, H/2 + 20, 'Loading...', {
      fontFamily: 'monospace', fontSize: '13px', color: '#664422',
    }).setOrigin(0.5);
    const barBg = this.add.rectangle(W/2, H/2 + 60, 240, 10, 0x221100);
    const bar = this.add.rectangle(W/2 - 118, H/2 + 60, 4, 6, 0xaa6633).setOrigin(0, 0.5);
    this.tweens.add({ targets: title, alpha: 0.6, duration: 900, yoyo: true, repeat: -1 });
    this.load.on('progress', v => { bar.width = 4 + (236 - 4) * v; });

    // Tileset and item sheet
    this.load.spritesheet('tileset',  'assets/tileset.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('items_sheet', 'assets/items.png', { frameWidth: 16, frameHeight: 16 });

    // Player
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });

    // Enemies — all 32×32 per frame
    const eTypes = ['skeleton1', 'skeleton2', 'vampire'];
    const eAnims = ['idle', 'attack', 'death', 'walk', 'hurt'];
    eTypes.forEach(t => eAnims.forEach(a =>
      this.load.spritesheet(`${t}_${a}`, `assets/enemies/${t}_${a}.png`, { frameWidth: 32, frameHeight: 32 })
    ));

    // Animated items
    this.load.spritesheet('coin_anim',  'assets/coin.png',  { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('chest_anim', 'assets/chest.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('keys_anim',  'assets/keys.png',  { frameWidth: 16, frameHeight: 16 });
  }

  create() {
    this._registerAnims();
    this.time.delayedCall(200, () => this.scene.start('MenuScene'));
  }

  _registerAnims() {
    const A = this.anims;

    // Player (7x4 spritesheet = 28 frames, using first row for idle/walk)
    A.create({ key: 'player-idle',   frames: A.generateFrameNumbers('player', { frames: [0] }),            frameRate: 1,  repeat: -1 });
    A.create({ key: 'player-walk',   frames: A.generateFrameNumbers('player', { start: 0, end: 3 }),        frameRate: 8,  repeat: -1 });
    A.create({ key: 'player-attack', frames: A.generateFrameNumbers('player', { start: 14, end: 17 }),      frameRate: 12, repeat: 0  });
    A.create({ key: 'player-hurt',   frames: A.generateFrameNumbers('player', { frames: [21, 0, 21, 0] }), frameRate: 10, repeat: 0  });
    A.create({ key: 'player-dead',   frames: A.generateFrameNumbers('player', { start: 21, end: 24 }),      frameRate: 8,  repeat: 0  });

    // Skeleton1
    A.create({ key: 'skeleton1-idle',   frames: A.generateFrameNumbers('skeleton1_idle',   { start: 0, end: 5  }), frameRate: 6,  repeat: -1 });
    A.create({ key: 'skeleton1-attack', frames: A.generateFrameNumbers('skeleton1_attack', { start: 0, end: 8  }), frameRate: 12, repeat: 0  });
    A.create({ key: 'skeleton1-death',  frames: A.generateFrameNumbers('skeleton1_death',  { start: 0, end: 16 }), frameRate: 12, repeat: 0  });
    A.create({ key: 'skeleton1-walk',   frames: A.generateFrameNumbers('skeleton1_walk',   { start: 0, end: 9  }), frameRate: 10, repeat: -1 });
    A.create({ key: 'skeleton1-hurt',   frames: A.generateFrameNumbers('skeleton1_hurt',   { start: 0, end: 4  }), frameRate: 10, repeat: 0  });

    // Skeleton2
    A.create({ key: 'skeleton2-idle',   frames: A.generateFrameNumbers('skeleton2_idle',   { start: 0, end: 5  }), frameRate: 6,  repeat: -1 });
    A.create({ key: 'skeleton2-attack', frames: A.generateFrameNumbers('skeleton2_attack', { start: 0, end: 14 }), frameRate: 12, repeat: 0  });
    A.create({ key: 'skeleton2-death',  frames: A.generateFrameNumbers('skeleton2_death',  { start: 0, end: 14 }), frameRate: 12, repeat: 0  });
    A.create({ key: 'skeleton2-walk',   frames: A.generateFrameNumbers('skeleton2_walk',   { start: 0, end: 9  }), frameRate: 10, repeat: -1 });
    A.create({ key: 'skeleton2-hurt',   frames: A.generateFrameNumbers('skeleton2_hurt',   { start: 0, end: 4  }), frameRate: 10, repeat: 0  });

    // Vampire
    A.create({ key: 'vampire-idle',   frames: A.generateFrameNumbers('vampire_idle',   { start: 0, end: 5  }), frameRate: 6,  repeat: -1 });
    A.create({ key: 'vampire-attack', frames: A.generateFrameNumbers('vampire_attack', { start: 0, end: 15 }), frameRate: 12, repeat: 0  });
    A.create({ key: 'vampire-death',  frames: A.generateFrameNumbers('vampire_death',  { start: 0, end: 13 }), frameRate: 12, repeat: 0  });
    A.create({ key: 'vampire-walk',   frames: A.generateFrameNumbers('vampire_walk',   { start: 0, end: 7  }), frameRate: 10, repeat: -1 });
    A.create({ key: 'vampire-hurt',   frames: A.generateFrameNumbers('vampire_hurt',   { start: 0, end: 4  }), frameRate: 10, repeat: 0  });

    // Items
    A.create({ key: 'coin-spin',  frames: A.generateFrameNumbers('coin_anim',  { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
    A.create({ key: 'chest-idle', frames: A.generateFrameNumbers('chest_anim', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });
    A.create({ key: 'keys-spin',  frames: A.generateFrameNumbers('keys_anim',  { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
  }
}
