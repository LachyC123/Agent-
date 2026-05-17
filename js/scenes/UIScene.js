class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  init(data) {
    this.gameScene = data.gameScene;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const panelY = H - 160;

    // Dark panel background
    const panel = this.add.rectangle(W / 2, panelY + 80, W, 160, 0x08000f, 1);
    const border = this.add.rectangle(W / 2, panelY, W, 2, 0x660066);

    // ── Stats row ────────────────────────────────────────────────────
    // HP bar background
    this.add.rectangle(6 + 90, panelY + 14, 180, 12, 0x220011).setOrigin(0, 0.5);
    this.hpBar   = this.add.rectangle(6, panelY + 14, 0, 10, 0xcc0000).setOrigin(0, 0.5);
    this.hpLabel = this.add.text(6, panelY + 14, '', { fontFamily: 'monospace', fontSize: '10px', color: '#ff8888' }).setOrigin(0, 0.5);

    // XP bar
    this.add.rectangle(6 + 90, panelY + 28, 180, 6, 0x110022).setOrigin(0, 0.5);
    this.xpBar   = this.add.rectangle(6, panelY + 28, 0, 4, 0x8844ff).setOrigin(0, 0.5);

    // Stats text (right side)
    this.statsText = this.add.text(W - 6, panelY + 6, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#aa88cc',
      align: 'right', lineSpacing: 2,
    }).setOrigin(1, 0);

    // Floor / level label
    this.floorLabel = this.add.text(6, panelY + 38, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#886699',
    });

    // ── Message log ──────────────────────────────────────────────────
    this.msgTexts = [];
    for (let i = 0; i < 2; i++) {
      const t = this.add.text(6, panelY + 56 + i * 16, '', {
        fontFamily: 'monospace', fontSize: '11px', color: i === 0 ? '#ddccff' : '#776688',
        wordWrap: { width: W - 12 },
      });
      this.msgTexts.push(t);
    }

    // ── D-Pad ─────────────────────────────────────────────────────────
    const dpadX = W - 100;
    const dpadY = panelY + 25;
    const dpadImg = this.add.image(dpadX, dpadY, 'dpad').setOrigin(0.5).setScale(0.85);

    const bs = 60 * 0.85;
    const half = bs / 2;
    const zones = [
      { name: 'up',    x: dpadX,          y: dpadY - bs    },
      { name: 'down',  x: dpadX,          y: dpadY + bs    },
      { name: 'left',  x: dpadX - bs,     y: dpadY         },
      { name: 'right', x: dpadX + bs,     y: dpadY         },
      { name: 'wait',  x: dpadX,          y: dpadY         },
    ];

    zones.forEach(z => {
      const zone = this.add.rectangle(z.x, z.y, bs * 0.9, bs * 0.9, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.gameScene.onDPad(z.name);
        // brief press highlight
        zone.setFillStyle(0xffffff, 0.15);
        this.time.delayedCall(120, () => zone.setFillStyle(0x000000, 0));
      });
    });

    // ── Inventory shortcut ────────────────────────────────────────────
    const invBtn = this.add.text(6, panelY + 90, '[INV]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#664488',
    }).setInteractive({ useHandCursor: true });
    invBtn.on('pointerover',  () => invBtn.setStyle({ color: '#cc88ff' }));
    invBtn.on('pointerout',   () => invBtn.setStyle({ color: '#664488' }));
    invBtn.on('pointerdown',  () => this.gameScene._openInventory());

    // Equip labels
    this.weaponLabel = this.add.text(6, panelY + 108, '', { fontFamily: 'monospace', fontSize: '10px', color: '#ff8844' });
    this.armorLabel  = this.add.text(6, panelY + 122, '', { fontFamily: 'monospace', fontSize: '10px', color: '#4488ff' });

    // Gold
    this.goldLabel = this.add.text(80, panelY + 90, '', { fontFamily: 'monospace', fontSize: '10px', color: '#ffee44' });

    this.refresh();
  }

  refresh() {
    if (!this.hpBar) return; // create() not yet run
    const p   = this.gameScene?.player;
    const gs  = this.gameScene;
    if (!p || !gs) return;

    const W      = this.scale.width;
    const panelY = this.scale.height - 160;

    // HP bar
    const hpRatio = Math.max(0, p.hp / p.maxHp);
    this.hpBar.width = 180 * hpRatio;
    const hpCol = hpRatio > 0.5 ? 0x44cc44 : hpRatio > 0.25 ? 0xffaa00 : 0xff2222;
    this.hpBar.setFillStyle(hpCol);
    this.hpLabel.setText(`HP ${p.hp}/${p.maxHp}`);

    // XP bar
    const xpNeeded = p.level * 30;
    this.xpBar.width = 180 * Math.min(1, p.xp / xpNeeded);

    // Stats
    this.statsText.setText([
      `ATK ${p.atk}`,
      `DEF ${p.def}`,
      `LVL ${p.level}`,
    ].join('\n'));

    // Floor
    this.floorLabel.setText(`Floor ${gs.floorNum}  Turn ${gs.turnCount}`);

    // Equip
    this.weaponLabel.setText(p.weapon ? `⚔ ${ITEM_DATA[p.weapon].name}` : '⚔ Bare fists');
    this.armorLabel.setText( p.armor  ? `🛡 ${ITEM_DATA[p.armor].name}`  : '🛡 Tattered motley');

    // Gold
    this.goldLabel.setText(`💰 ${p.gold}g`);

    this.refreshMessages();
  }

  refreshMessages() {
    if (!this.msgTexts) return; // create() not yet run
    const msgs = this.gameScene?.messages || [];
    this.msgTexts.forEach((t, i) => {
      t.setText(msgs[i] || '');
    });
  }
}
