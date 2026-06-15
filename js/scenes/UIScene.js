class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  init(data) {
    this.gameScene = data.gameScene;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const panelY = H - 160;

    // Panel background + top border
    this.add.rectangle(W / 2, panelY + 80, W, 160, 0x07000d, 1);
    this.add.rectangle(W / 2, panelY,      W, 2,   0x880088);
    // Second accent line
    this.add.rectangle(W / 2, panelY + 1, W, 1, 0x440044, 0.5);

    // ── Left column: HP / XP / stats ────────────────────────────────

    // HP bar track + fill
    const barW = 160;
    this.add.rectangle(8 + barW / 2, panelY + 14, barW, 10, 0x2a0011).setOrigin(0.5, 0.5);
    this.hpBar = this.add.rectangle(8, panelY + 14, 0, 8, 0xcc0000).setOrigin(0, 0.5);

    this.hpLabel = this.add.text(8, panelY + 23, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#ff8888',
    });

    // XP bar track + fill
    this.add.rectangle(8 + barW / 2, panelY + 33, barW, 5, 0x110022).setOrigin(0.5, 0.5);
    this.xpBar = this.add.rectangle(8, panelY + 33, 0, 3, 0x8844ff).setOrigin(0, 0.5);

    this.xpLabel = this.add.text(8, panelY + 38, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#8844ff',
    });

    // Equip row
    this.weaponLabel = this.add.text(8, panelY + 48, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#ff9955',
    });
    this.armorLabel = this.add.text(8, panelY + 59, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#55aaff',
    });

    // ── Right column: ATK / DEF / LVL / Kills ───────────────────────

    this.statsText = this.add.text(W - 8, panelY + 6, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#bb99dd',
      align: 'right', lineSpacing: 3,
    }).setOrigin(1, 0);

    // Floor + turn (center-ish)
    this.floorLabel = this.add.text(8, panelY + 70, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#776688',
    });

    // ── Message log (3 lines) ────────────────────────────────────────

    this.msgTexts = [];
    const msgColors = ['#e0d0ff', '#998899', '#554455'];
    for (let i = 0; i < 3; i++) {
      const t = this.add.text(8, panelY + 83 + i * 15, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: msgColors[i],
        wordWrap: { width: W - 130 },
      });
      this.msgTexts.push(t);
    }

    // ── D-Pad (right side) ───────────────────────────────────────────

    const dpadX = W - 94;
    const dpadY = panelY + 75;
    this.add.image(dpadX, dpadY, 'dpad').setOrigin(0.5).setScale(0.82);

    const bs = 60 * 0.82;
    const zones = [
      { name: 'up',    x: dpadX,      y: dpadY - bs  },
      { name: 'down',  x: dpadX,      y: dpadY + bs  },
      { name: 'left',  x: dpadX - bs, y: dpadY       },
      { name: 'right', x: dpadX + bs, y: dpadY       },
      { name: 'wait',  x: dpadX,      y: dpadY       },
    ];
    zones.forEach(z => {
      const zone = this.add.rectangle(z.x, z.y, bs * 0.88, bs * 0.88, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.gameScene.onDPad(z.name);
        zone.setFillStyle(0xffffff, 0.12);
        this.time.delayedCall(110, () => zone.setFillStyle(0x000000, 0));
      });
    });

    // ── INV button ───────────────────────────────────────────────────

    this.invBtn = this.add.text(8, panelY + 145, '[I] BAG', {
      fontFamily: 'monospace', fontSize: '11px', color: '#664488',
    }).setInteractive({ useHandCursor: true });
    this.invBtn.on('pointerover',  () => this.invBtn.setStyle({ color: '#cc88ff' }));
    this.invBtn.on('pointerout',   () => this.invBtn.setStyle({ color: '#664488' }));
    this.invBtn.on('pointerdown',  () => this.gameScene._openInventory());

    this.goldLabel = this.add.text(68, panelY + 145, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ddcc22',
    });

    this.refresh();
  }

  refresh() {
    if (!this.hpBar) return;
    const p  = this.gameScene?.player;
    const gs = this.gameScene;
    if (!p || !gs) return;

    const W      = this.scale.width;
    const panelY = this.scale.height - 160;
    const barW   = 160;

    // HP bar
    const hpRatio = Math.max(0, p.hp / p.maxHp);
    this.hpBar.width = barW * hpRatio;
    const hpCol = hpRatio > 0.5 ? 0x33cc33 : hpRatio > 0.25 ? 0xff9900 : 0xff2222;
    this.hpBar.setFillStyle(hpCol);
    this.hpLabel.setText(`HP  ${p.hp} / ${p.maxHp}`);

    // XP bar
    const xpNeeded = p.level * 30;
    this.xpBar.width = barW * Math.min(1, p.xp / xpNeeded);
    this.xpLabel.setText(`XP  ${p.xp} / ${xpNeeded}`);

    // Equip
    this.weaponLabel.setText(p.weapon ? `⚔ ${ITEM_DATA[p.weapon].name}` : '⚔ Bare fists');
    this.armorLabel.setText( p.armor  ? `🛡 ${ITEM_DATA[p.armor].name}`  : '🛡 Tattered motley');

    // Stats block (right)
    this.statsText.setText([
      `ATK  ${p.atk}`,
      `DEF  ${p.def}`,
      `LVL  ${p.level}`,
      `KIL  ${p.kills || 0}`,
    ].join('\n'));

    // Floor / turn
    this.floorLabel.setText(`Floor ${gs.floorNum}   Turn ${gs.turnCount}`);

    // Inventory count on bag button
    const inv = p.inventory || [];
    const bagCol = inv.length > 0 ? '#cc88ff' : '#443355';
    this.invBtn.setText(`[I] BAG (${inv.length}/8)`);
    this.invBtn.setStyle({ color: bagCol });

    // Gold
    this.goldLabel.setText(`${p.gold}g`);

    this.refreshMessages();
  }

  refreshMessages() {
    if (!this.msgTexts) return;
    const msgs = this.gameScene?.messages || [];
    this.msgTexts.forEach((t, i) => t.setText(msgs[i] || ''));
  }
}
