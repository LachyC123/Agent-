class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  init(data) {
    this.gameScene = data.gameScene;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const pY = H - 160;

    // Panel
    this.add.rectangle(W/2, pY + 80, W, 160, 0x060410, 1);
    this.add.rectangle(W/2, pY,     W, 2, 0x886633);
    this.add.rectangle(W/2, pY + 1, W, 1, 0x443311, 0.6);

    const barW = 150;

    // HP bar
    this.add.rectangle(8 + barW/2, pY + 13, barW, 10, 0x1a0008).setOrigin(0.5);
    this.hpBar = this.add.rectangle(8, pY + 13, 0, 8, 0xcc3322).setOrigin(0, 0.5);
    this.hpLabel = this.add.text(8, pY + 22, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#ff8866',
    });

    // XP bar
    this.add.rectangle(8 + barW/2, pY + 32, barW, 5, 0x0e0a1e).setOrigin(0.5);
    this.xpBar = this.add.rectangle(8, pY + 32, 0, 3, 0x8844ff).setOrigin(0, 0.5);
    this.xpLabel = this.add.text(8, pY + 37, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#8844ff',
    });

    // Equip labels
    this.weaponLabel = this.add.text(8, pY + 47, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#cc9944',
    });
    this.armorLabel = this.add.text(8, pY + 57, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#4488cc',
    });

    // Stats (right column)
    this.statsText = this.add.text(W - 8, pY + 6, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#aa8855',
      align: 'right', lineSpacing: 3,
    }).setOrigin(1, 0);

    // Floor / turn
    this.floorLabel = this.add.text(8, pY + 68, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#665544',
    });

    // Message log
    this.msgTexts = [];
    const msgColors = ['#ddcc99', '#997755', '#554433'];
    for (let i = 0; i < 3; i++) {
      this.msgTexts.push(this.add.text(8, pY + 82 + i * 14, '', {
        fontFamily: 'monospace', fontSize: '10px', color: msgColors[i],
        wordWrap: { width: W - 130 },
      }));
    }

    // D-pad (right side)
    const dX = W - 90, dY = pY + 80;
    const bs = 44;
    const dpadBg = this.add.rectangle(dX, dY, bs*3 + 6, bs*3 + 6, 0x1a1008, 0.7)
      .setStrokeStyle(1, 0x665533, 0.4);

    const dirs = [
      { name:'up',    x: dX,      y: dY - bs, label: '▲' },
      { name:'down',  x: dX,      y: dY + bs, label: '▼' },
      { name:'left',  x: dX - bs, y: dY,      label: '◀' },
      { name:'right', x: dX + bs, y: dY,      label: '▶' },
      { name:'wait',  x: dX,      y: dY,      label: '·' },
    ];
    dirs.forEach(d => {
      const btn = this.add.rectangle(d.x, d.y, bs - 4, bs - 4, 0x332211, 0.6)
        .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x664422, 0.5);
      const lbl = this.add.text(d.x, d.y, d.label, {
        fontFamily: 'monospace', fontSize: '16px', color: '#886644',
      }).setOrigin(0.5);
      btn.on('pointerdown', () => {
        this.gameScene.onDPad(d.name);
        btn.setFillStyle(0x664422, 0.8);
        lbl.setStyle({ color: '#ffcc88' });
        this.time.delayedCall(120, () => {
          btn.setFillStyle(0x332211, 0.6);
          lbl.setStyle({ color: '#886644' });
        });
      });
    });

    // Inventory button
    this.invBtn = this.add.text(8, pY + 143, '[I] BAG', {
      fontFamily: 'monospace', fontSize: '11px', color: '#664422',
    }).setInteractive({ useHandCursor: true });
    this.invBtn.on('pointerover', () => this.invBtn.setStyle({ color: '#cc8844' }));
    this.invBtn.on('pointerout',  () => this.invBtn.setStyle({ color: '#664422' }));
    this.invBtn.on('pointerdown', () => this.gameScene._openInventory());

    this.goldLabel = this.add.text(80, pY + 143, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ddbb22',
    });

    this.refresh();
  }

  refresh() {
    if (!this.hpBar) return;
    const p  = this.gameScene?.player;
    const gs = this.gameScene;
    if (!p || !gs) return;

    const W = this.scale.width;
    const pY = this.scale.height - 160;
    const barW = 150;

    const hpRatio = Math.max(0, p.hp / p.maxHp);
    this.hpBar.width = barW * hpRatio;
    this.hpBar.setFillStyle(hpRatio > 0.5 ? 0x33cc33 : hpRatio > 0.25 ? 0xff9900 : 0xff2222);
    this.hpLabel.setText(`HP ${p.hp}/${p.maxHp}`);

    const xpNeeded = p.level * 30;
    this.xpBar.width = barW * Math.min(1, p.xp / xpNeeded);
    this.xpLabel.setText(`XP ${p.xp}/${xpNeeded}`);

    this.weaponLabel.setText(p.weapon ? `⚔ ${ITEM_DATA[p.weapon].name}` : '⚔ Bare hands');
    this.armorLabel.setText( p.armor  ? `\u{1F6E1} ${ITEM_DATA[p.armor].name}` : '\u{1F6E1} No armor');

    this.statsText.setText([
      `ATK ${p.atk}`,
      `DEF ${p.def}`,
      `LVL ${p.level}`,
      `KIL ${p.kills || 0}`,
    ].join('\n'));

    this.floorLabel.setText(`Floor ${gs.floorNum}   Turn ${gs.turnCount}`);

    const inv = p.inventory || [];
    this.invBtn.setText(`[I] BAG (${inv.length}/8)`);
    this.invBtn.setStyle({ color: inv.length > 0 ? '#cc8844' : '#664422' });
    this.goldLabel.setText(`${p.gold}g`);

    this.refreshMessages();
  }

  refreshMessages() {
    if (!this.msgTexts) return;
    const msgs = this.gameScene?.messages || [];
    this.msgTexts.forEach((t, i) => t.setText(msgs[i] || ''));
  }
}
