const TS = 32;
const MAP_W = 30;
const MAP_H = 30;
const FOV_R = 7;
const ENEMY_SCALE  = 1.5;  // pack2 sprites have ~20px of art in 32px frame
const PLAYER_TINT  = 0xffffcc; // warm yellow tint to distinguish player from enemies

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.floorNum   = data.floor      || 1;
    this.seed       = data.seed       || 42;
    this.playerData = data.playerData || null;
    this.messages   = [];
    this.turnCount  = 0;
    this.playerBusy = false;
    this.invOpen    = false;
    this._visited   = new Set();
    this._inFov     = new Set();
  }

  create() {
    const gen = new DungeonGenerator();
    this.dungeon = gen.generate(this.floorNum, this.seed);

    this._buildTileMap();
    this._buildPlayer();
    this._buildPlayerSprite();
    this._buildEntities();
    this._buildItems();
    this._setupCamera();
    this._setupInput();

    this.scene.launch('UIScene', { gameScene: this });
    this.uiScene = this.scene.get('UIScene');

    this.time.delayedCall(100, () => {
      this._computeFOV();
      this._addMessage(`Floor ${this.floorNum}: Darkness surrounds you.`);
      this._refreshUI();
    });
  }

  update() {
    // Sync player indicator with sprite
    if (this.playerMarker) {
      this.playerMarker.x = this.playerSpr.x;
      this.playerMarker.y = this.playerSpr.y;
    }

    // Sync enemy HP bars with sprite position during tweens
    const bw = TS - 4;
    const barOffset = -Math.round(TS * ENEMY_SCALE * 0.55); // above sprite top
    for (const e of this.enemies) {
      if (!e.alive || !e.hpBg) continue;
      e.hpBg.x = e.spr.x;
      e.hpBg.y = e.spr.y + barOffset;
      e.hpFg.x = e.spr.x - bw / 2;
      e.hpFg.y = e.spr.y + barOffset;
    }
  }

  // ─── TILE MAP ────────────────────────────────────────────────────────────────

  _buildTileMap() {
    this.tileSprites = {};
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tile = this.dungeon.tiles[y][x];
        if (tile === TILE.VOID) continue;

        const frame = this._tileFrame(tile, x, y);
        const spr = this.add.image(x * TS + TS/2, y * TS + TS/2, 'tileset', frame)
          .setScale(2).setAlpha(0).setDepth(0);

        if (tile === TILE.STAIRS) spr.setTint(0xffdd44);
        else if (tile === TILE.TORCH) spr.setTint(0xff8822);

        this.tileSprites[`${x},${y}`] = spr;
      }
    }
  }

  _tileFrame(tile, x, y) {
    const wallFrames  = [1, 2, 3];
    const floorFrames = [11, 12, 13];
    switch (tile) {
      case TILE.WALL:
      case TILE.TORCH:   return wallFrames[(x * 3 + y * 7) % 3];
      case TILE.FLOOR:
      case TILE.DOOR:    return floorFrames[(x * 7 + y * 3) % 3];
      case TILE.STAIRS:  return 80;
      default:           return 11;
    }
  }

  // ─── PLAYER ─────────────────────────────────────────────────────────────────

  _buildPlayer() {
    const { x, y } = this.dungeon.playerStart;
    const p = this.playerData
      ? { ...this.playerData }
      : { hp:30, maxHp:30, baseAtk:4, baseDef:1,
          weapon:null, armor:null, inventory:[], xp:0, level:1, gold:0, kills:0 };
    p.x = x; p.y = y;
    if (p.kills === undefined) p.kills = 0;
    Object.defineProperty(p, 'atk', {
      get() { return this.baseAtk + (this.weapon ? (ITEM_DATA[this.weapon]?.atk || 0) : 0); },
      enumerable: true, configurable: true,
    });
    Object.defineProperty(p, 'def', {
      get() { return this.baseDef + (this.armor ? (ITEM_DATA[this.armor]?.def || 0) : 0); },
      enumerable: true, configurable: true,
    });
    this.player = p;
  }

  _buildPlayerSprite() {
    const p = this.player;
    // Gold tile-border under player so they stand out from enemies
    this.playerMarker = this.add.rectangle(p.x * TS + TS/2, p.y * TS + TS/2, TS - 2, TS - 2, 0x000000, 0)
      .setStrokeStyle(2, 0xffcc22, 0.85).setDepth(3);
    this.playerSpr = this.add.sprite(p.x * TS + TS/2, p.y * TS + TS/2, 'player', 0)
      .setScale(2).setDepth(5).setTint(PLAYER_TINT);
    this.playerSpr.play('player-idle');
  }

  // ─── ENTITIES ────────────────────────────────────────────────────────────────

  _buildEntities() {
    const bw = TS - 4;
    this.enemies = this.dungeon.entities.map(e => {
      const sx = e.x * TS + TS/2;
      const sy = e.y * TS + TS/2;

      const spr = this.add.sprite(sx, sy, `${e.spriteKey}_idle`, 0)
        .setScale(ENEMY_SCALE).setDepth(4).setAlpha(0);
      spr.play(`${e.spriteKey}-idle`);

      // HP bars — position managed by update()
      const hpBg = this.add.rectangle(sx, sy - 20, bw, 4, 0x330000)
        .setDepth(6).setAlpha(0).setOrigin(0.5, 0.5);
      const hpFg = this.add.rectangle(sx - bw/2, sy - 20, bw, 4, 0x22dd22)
        .setDepth(7).setAlpha(0).setOrigin(0, 0.5);

      return { ...e, spr, hpBg, hpFg };
    });
  }

  _buildItems() {
    this.floorItems = this.dungeon.items.map(item => {
      const ix = item.x * TS + TS/2;
      const iy = item.y * TS + TS/2;
      let spr;
      if (item.type === 'potion' || item.type === 'elixir') {
        spr = this.add.sprite(ix, iy, 'coin_anim', 0).setScale(2).setDepth(2).setAlpha(0);
        spr.play('coin-spin');
        spr.setTint(item.type === 'elixir' ? 0xff44aa : 0x44ffaa);
      } else if (item.type === 'scroll') {
        spr = this.add.sprite(ix, iy, 'keys_anim', 0).setScale(2).setDepth(2).setAlpha(0);
        spr.play('keys-spin');
        spr.setTint(0xaaddff);
      } else {
        const frame = ITEM_DATA[item.type]?.frame ?? 0;
        spr = this.add.image(ix, iy, 'items_sheet', frame).setScale(2).setDepth(2).setAlpha(0);
        this.tweens.add({ targets: spr, y: iy - 4, duration: 1000, yoyo: true, repeat: -1 });
      }
      return { ...item, spr };
    });
  }

  // ─── CAMERA ──────────────────────────────────────────────────────────────────

  _setupCamera() {
    const uiH = 160;
    this.cameras.main.setBounds(0, 0, MAP_W * TS, MAP_H * TS);
    this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height - uiH);
    this.cameras.main.startFollow(this.playerSpr, true, 0.12, 0.12);
  }

  // ─── INPUT ───────────────────────────────────────────────────────────────────

  _setupInput() {
    const keys = this.input.keyboard.addKeys({
      up:     Phaser.Input.Keyboard.KeyCodes.UP,
      down:   Phaser.Input.Keyboard.KeyCodes.DOWN,
      left:   Phaser.Input.Keyboard.KeyCodes.LEFT,
      right:  Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w:      Phaser.Input.Keyboard.KeyCodes.W,
      a:      Phaser.Input.Keyboard.KeyCodes.A,
      s:      Phaser.Input.Keyboard.KeyCodes.S,
      d:      Phaser.Input.Keyboard.KeyCodes.D,
      z:      Phaser.Input.Keyboard.KeyCodes.Z,
      i:      Phaser.Input.Keyboard.KeyCodes.I,
      period: Phaser.Input.Keyboard.KeyCodes.PERIOD,
    });

    this.input.keyboard.on('keydown', e => {
      if (this.playerBusy) return;
      const code = e.keyCode;
      // Toggle inventory with I regardless of invOpen state
      if (code === keys.i.keyCode) {
        if (this.invOpen) { this._closeInventory?.(); }
        else              { this._openInventory(); }
        return;
      }
      if (this.invOpen) return;
      if (code === keys.up.keyCode    || code === keys.w.keyCode)    this._tryMove(0, -1);
      if (code === keys.down.keyCode  || code === keys.s.keyCode)    this._tryMove(0,  1);
      if (code === keys.left.keyCode  || code === keys.a.keyCode)    this._tryMove(-1, 0);
      if (code === keys.right.keyCode || code === keys.d.keyCode)    this._tryMove( 1, 0);
      if (code === keys.z.keyCode || code === keys.period.keyCode)   this._wait();
    });

    this.input.on('pointerdown', p => {
      const inDpad = p.x > this.scale.width * 0.5 && p.y > this.scale.height - 200;
      this._touchStart = inDpad ? null : { x: p.x, y: p.y };
    });
    this.input.on('pointerup', p => {
      if (!this._touchStart || this.playerBusy || this.invOpen) return;
      const dx = p.x - this._touchStart.x;
      const dy = p.y - this._touchStart.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 16) { this._wait(); return; }
      if (dist < 28) return;
      Math.abs(dx) > Math.abs(dy) ? this._tryMove(dx > 0 ? 1 : -1, 0) : this._tryMove(0, dy > 0 ? 1 : -1);
    });
  }

  onDPad(dir) {
    if (this.playerBusy || this.invOpen) return;
    const map = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0], wait:[0,0] };
    const [dx, dy] = map[dir] || [0,0];
    if (dx === 0 && dy === 0) this._wait();
    else this._tryMove(dx, dy);
  }

  // ─── MOVEMENT ────────────────────────────────────────────────────────────────

  _tryMove(dx, dy) {
    const p = this.player;
    const nx = p.x + dx, ny = p.y + dy;
    if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) return;

    const tile = this.dungeon.tiles[ny]?.[nx];
    if (!tile || tile === TILE.VOID || tile === TILE.WALL || tile === TILE.TORCH) return;

    const enemy = this.enemies.find(e => e.alive && e.x === nx && e.y === ny);
    if (enemy) { this._attackEnemy(enemy, dx); return; }

    p.x = nx; p.y = ny;
    if (dx !== 0) this.playerSpr.setFlipX(dx < 0);
    this.tweens.add({
      targets: this.playerSpr,
      x: nx * TS + TS/2, y: ny * TS + TS/2,
      duration: 90, ease: 'Power1',
    });

    const itemIdx = this.floorItems.findIndex(i => i.x === nx && i.y === ny);
    if (itemIdx !== -1) {
      const item = this.floorItems.splice(itemIdx, 1)[0];
      this._pickupItem(item);
    }

    if (tile === TILE.STAIRS) {
      this.playerBusy = true;
      this._addMessage('You descend the stairs...');
      this.time.delayedCall(300, () => {
        if (this.floorNum >= 10) this._victory();
        else this._goNextFloor();
      });
      return;
    }

    this._computeFOV();
    this._endTurn();
  }

  _wait() {
    const p = this.player;
    const healed = p.hp < p.maxHp;
    if (healed) {
      p.hp = Math.min(p.maxHp, p.hp + 1);
      this._floatText(this.playerSpr.x, this.playerSpr.y - 12, '+1', '#44ff88');
    }
    this._addMessage(healed ? 'You rest. (+1 HP)' : 'You wait in the dark...');
    this._endTurn();
  }

  // ─── COMBAT ─────────────────────────────────────────────────────────────────

  _attackEnemy(enemy, dx = 1) {
    this.playerBusy = true;
    this.playerSpr.setFlipX(dx < 0);
    this.playerSpr.play('player-attack');
    this.playerSpr.once('animationcomplete', () => this.playerSpr.play('player-idle'));

    const dmg = Math.max(1, this.player.atk - enemy.def);
    enemy.hp -= dmg;
    this._floatText(enemy.spr.x, enemy.spr.y - Math.round(TS * ENEMY_SCALE * 0.6), `-${dmg}`, '#ff4444', true);

    if (enemy.hp <= 0) {
      enemy.alive = false;
      enemy.spr.play(`${enemy.spriteKey}-death`);
      enemy.hpBg.setAlpha(0);
      enemy.hpFg.setAlpha(0);

      const goldGain = enemy.goldMin + Math.floor(Math.random() * (enemy.goldMax - enemy.goldMin + 1));
      this.player.xp    += enemy.xp;
      this.player.gold  += goldGain;
      this.player.kills  = (this.player.kills || 0) + 1;
      this._addMessage(`${enemy.name} slain! +${enemy.xp}xp, +${goldGain}g`);
      this._checkLevelUp();

      enemy.spr.once('animationcomplete', () => {
        this.tweens.add({
          targets: enemy.spr, alpha: 0, duration: 300,
          onComplete: () => {
            enemy.spr.destroy();
            enemy.hpBg.destroy();
            enemy.hpFg.destroy();
          },
        });
      });
      this.enemies = this.enemies.filter(e => e !== enemy);

      this.time.delayedCall(550, () => {
        this.playerBusy = false;
        this._computeFOV();
        this._endTurn();
      });
    } else {
      this._updateEnemyHpBar(enemy);
      enemy.spr.play(`${enemy.spriteKey}-hurt`);
      enemy.spr.once('animationcomplete', () => {
        if (enemy.alive) enemy.spr.play(`${enemy.spriteKey}-idle`);
      });
      this.time.delayedCall(330, () => {
        this.playerBusy = false;
        this._computeFOV();
        this._endTurn();
      });
    }
  }

  _updateEnemyHpBar(enemy) {
    const bw = TS - 4;
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    enemy.hpFg.width = bw * ratio;
    enemy.hpFg.setFillStyle(ratio > 0.5 ? 0x22dd22 : ratio > 0.25 ? 0xffaa00 : 0xff2222);
  }

  _enemyAttackPlayer(enemy) {
    const dmg = Math.max(1, enemy.atk - this.player.def);
    this.player.hp -= dmg;
    this._floatText(this.playerSpr.x, this.playerSpr.y - 22, `-${dmg}`, '#ff8844', true);
    this._flashSprite(this.playerSpr, 0xff0000);
    this.cameras.main.shake(80, 0.006);
    this.playerSpr.play('player-hurt');
    this.playerSpr.once('animationcomplete', () => {
      if (this.player.hp > 0) this.playerSpr.play('player-idle');
    });
    this._addMessage(`${enemy.name} hits you for ${dmg}!`);
    this._refreshUI();
    if (this.player.hp <= 0) this._die();
  }

  // ─── ENEMY AI ────────────────────────────────────────────────────────────────

  _endTurn() {
    this.turnCount++;
    this._moveEnemies();
    this._updateEnemyVisibility();
    this._updateItemVisibility();
    this._refreshUI();
  }

  _moveEnemies() {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive) continue;

      const visible = this._inFov.has(`${e.x},${e.y}`);
      const dx = p.x - e.x, dy = p.y - e.y;
      const dist = Math.abs(dx) + Math.abs(dy);

      if (!visible && dist > 3) continue; // Dormant unless close

      if (dist === 1) {
        this._enemyAttackPlayer(e);
        if (this.player.hp <= 0) return;
      } else if (dist <= FOV_R + 1) {
        // Pathfind toward player (simple greedy)
        const options = [];
        if (dx !== 0) options.push([Math.sign(dx), 0]);
        if (dy !== 0) options.push([0, Math.sign(dy)]);
        if (Math.random() > 0.65) options.reverse(); // Occasional shuffle

        for (const [mx, my] of options) {
          const nx = e.x + mx, ny = e.y + my;
          if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
          const t = this.dungeon.tiles[ny][nx];
          if (t === TILE.VOID || t === TILE.WALL || t === TILE.TORCH) continue;
          if (this.enemies.some(o => o !== e && o.alive && o.x === nx && o.y === ny)) continue;
          if (nx === p.x && ny === p.y) break;

          e.x = nx; e.y = ny;
          e.spr.setFlipX(mx < 0);
          this.tweens.add({
            targets: e.spr,
            x: nx * TS + TS/2, y: ny * TS + TS/2,
            duration: 100, ease: 'Power1',
          });
          break;
        }
      }
    }
  }

  // ─── ITEMS ───────────────────────────────────────────────────────────────────

  _pickupItem(item) {
    item.spr.destroy();
    const p = this.player;
    const data = ITEM_DATA[item.type];
    if (!data) return;

    if (data.type === 'potion' || data.type === 'elixir') {
      const healed = Math.min(p.maxHp - p.hp, data.heal);
      p.hp = Math.min(p.maxHp, p.hp + data.heal);
      this._floatText(this.playerSpr.x, this.playerSpr.y - 14, `+${healed} HP`, '#44ff88', true);
      this._addMessage(`Drank ${data.name}. Restored ${healed} HP.`);
    } else if (data.type === 'scroll') {
      this._revealAll();
      this._addMessage('Magic scroll! The dungeon layout is revealed.');
    } else if (data.type === 'weapon') {
      const current = p.weapon ? (ITEM_DATA[p.weapon]?.atk || 0) : -1;
      if (current < data.atk) {
        if (p.weapon) {
          if (p.inventory.length < 8) p.inventory.push(p.weapon);
        }
        p.weapon = item.type;
        this._addMessage(`Equipped: ${data.name} (ATK +${data.atk})`);
      } else if (p.inventory.length < 8) {
        p.inventory.push(item.type);
        this._addMessage(`Picked up: ${data.name} → BAG`);
      } else {
        this._addMessage(`Bag full! Left ${data.name} behind.`);
      }
    } else if (data.type === 'armor') {
      const current = p.armor ? (ITEM_DATA[p.armor]?.def || 0) : -1;
      if (current < data.def) {
        if (p.armor) {
          if (p.inventory.length < 8) p.inventory.push(p.armor);
        }
        p.armor = item.type;
        this._addMessage(`Equipped: ${data.name} (DEF +${data.def})`);
      } else if (p.inventory.length < 8) {
        p.inventory.push(item.type);
        this._addMessage(`Picked up: ${data.name} → BAG`);
      } else {
        this._addMessage(`Bag full! Left ${data.name} behind.`);
      }
    }
    this._refreshUI();
  }

  _useItem(itemType) {
    const p = this.player;
    const idx = p.inventory.indexOf(itemType);
    if (idx === -1) return;
    p.inventory.splice(idx, 1);
    const data = ITEM_DATA[itemType];
    if (!data) return;

    if (data.type === 'potion' || data.type === 'elixir') {
      const healed = Math.min(p.maxHp - p.hp, data.heal);
      p.hp = Math.min(p.maxHp, p.hp + data.heal);
      this._floatText(this.playerSpr.x, this.playerSpr.y - 14, `+${healed} HP`, '#44ff88', true);
      this._addMessage(`Used ${data.name}. +${healed} HP.`);
    } else if (data.type === 'weapon') {
      if (p.weapon) p.inventory.push(p.weapon);
      p.weapon = itemType;
      this._addMessage(`Equipped: ${data.name} (ATK +${data.atk})`);
    } else if (data.type === 'armor') {
      if (p.armor) p.inventory.push(p.armor);
      p.armor = itemType;
      this._addMessage(`Equipped: ${data.name} (DEF +${data.def})`);
    } else if (data.type === 'scroll') {
      this._revealAll();
      this._addMessage('Magic scroll! Floor revealed.');
    }
    this._endTurn();
    this._refreshUI();
  }

  _openInventory() {
    if (this.invOpen) return;
    this.invOpen = true;
    const W = this.scale.width, H = this.scale.height;
    const p = this.player;

    const all = [];

    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.82).setDepth(30).setInteractive();
    const box     = this.add.rectangle(W/2, H/2 - 15, 300, 390, 0x08060e, 1)
      .setDepth(31).setStrokeStyle(1, 0x886633, 0.8);
    const titleT  = this.add.text(W/2, H/2 - 195, 'INVENTORY', {
      fontFamily: 'monospace', fontSize: '15px', color: '#cc8833',
    }).setDepth(32).setOrigin(0.5);

    all.push(overlay, box, titleT);

    // Equipped row
    const wepT = this.add.text(W/2, H/2 - 172, `⚔ ${p.weapon ? ITEM_DATA[p.weapon]?.name : 'Bare hands'}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#cc9944',
    }).setDepth(32).setOrigin(0.5);
    const armT = this.add.text(W/2, H/2 - 157, `\u{1F6E1} ${p.armor ? ITEM_DATA[p.armor]?.name : 'No armor'}`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#4488cc',
    }).setDepth(32).setOrigin(0.5);
    all.push(wepT, armT);

    const divider = this.add.rectangle(W/2, H/2 - 146, 260, 1, 0x443322).setDepth(32);
    all.push(divider);

    const closeAll = () => {
      this.invOpen = false;
      this._closeInventory = null;
      all.forEach(o => o.destroy());
    };
    this._closeInventory = closeAll;

    const inv = p.inventory || [];
    if (inv.length === 0) {
      const empty = this.add.text(W/2, H/2 - 20, 'Empty bag', {
        fontFamily: 'monospace', fontSize: '13px', color: '#554433', fontStyle: 'italic',
      }).setDepth(32).setOrigin(0.5);
      all.push(empty);
    } else {
      inv.forEach((type, i) => {
        const data = ITEM_DATA[type];
        if (!data) return;
        const iy = H/2 - 130 + i * 36;

        const bg = this.add.rectangle(W/2, iy, 260, 30, 0x1a1008, 0.9)
          .setDepth(32).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x443322, 0.5);
        const icon = this.add.image(W/2 - 108, iy, 'items_sheet', data.frame)
          .setScale(1.6).setDepth(33);
        const nameT = this.add.text(W/2 - 88, iy, data.name, {
          fontFamily: 'monospace', fontSize: '12px', color: '#ddbb88',
        }).setDepth(33).setOrigin(0, 0.5);
        const statStr = data.atk ? `+${data.atk} ATK` : data.def ? `+${data.def} DEF` : data.heal ? `+${data.heal} HP` : '';
        const statT = this.add.text(W/2 + 100, iy, statStr, {
          fontFamily: 'monospace', fontSize: '10px', color: '#887755',
        }).setDepth(33).setOrigin(1, 0.5);
        const useHint = this.add.text(W/2 + 118, iy, '▶', {
          fontFamily: 'monospace', fontSize: '12px', color: '#664422',
        }).setDepth(33).setOrigin(1, 0.5);

        all.push(bg, icon, nameT, statT, useHint);

        bg.on('pointerover', () => { bg.setFillStyle(0x3a2810, 0.9); useHint.setStyle({ color: '#cc8844' }); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x1a1008, 0.9); useHint.setStyle({ color: '#664422' }); });
        bg.on('pointerdown', () => { closeAll(); this._useItem(type); });
      });
    }

    const closeBtn = this.add.rectangle(W/2, H/2 + 175, 130, 34, 0x2a1a08, 0.9)
      .setDepth(32).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x886633, 0.5);
    const closeTxt = this.add.text(W/2, H/2 + 175, 'CLOSE [I]', {
      fontFamily: 'monospace', fontSize: '12px', color: '#cc8833',
    }).setDepth(33).setOrigin(0.5);
    all.push(closeBtn, closeTxt);

    overlay.on('pointerdown', closeAll);
    closeBtn.on('pointerdown', closeAll);
  }

  // ─── LEVEL UP ────────────────────────────────────────────────────────────────

  _checkLevelUp() {
    const p = this.player;
    const needed = p.level * 30;
    if (p.xp >= needed) {
      p.xp -= needed;
      p.level++;
      p.maxHp   += 8;
      p.hp       = Math.min(p.maxHp, p.hp + 12);
      p.baseAtk += 2;
      p.baseDef += 1;
      this._floatText(this.playerSpr.x, this.playerSpr.y - 22, 'LEVEL UP!', '#ffff44', true);
      this._addMessage(`Level ${p.level}! Max HP +8, ATK +2, DEF +1`);
    }
  }

  // ─── FLOOR & VICTORY ─────────────────────────────────────────────────────────

  _goNextFloor() {
    const p = this.player;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start('GameScene', {
        floor: this.floorNum + 1,
        seed:  Math.floor(Math.random() * 99999),
        playerData: {
          hp: p.hp, maxHp: p.maxHp,
          baseAtk: p.baseAtk, baseDef: p.baseDef,
          weapon: p.weapon, armor: p.armor,
          inventory: [...(p.inventory || [])],
          xp: p.xp, level: p.level,
          gold: p.gold, kills: p.kills,
        },
      });
    });
  }

  _victory() {
    const p = this.player;
    this.cameras.main.fadeOut(600, 255, 220, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        won: true, floor: this.floorNum, level: p.level, gold: p.gold, kills: p.kills || 0,
      });
    });
  }

  _die() {
    const p = this.player;
    this.playerBusy = true;
    this.playerSpr.play('player-dead');
    this.cameras.main.fadeOut(900, 80, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        won: false, floor: this.floorNum, level: p.level, gold: p.gold, kills: p.kills || 0,
      });
    });
  }

  // ─── FOV ─────────────────────────────────────────────────────────────────────

  _computeFOV() {
    const p = this.player;
    const newFov = new Set();
    newFov.add(`${p.x},${p.y}`);
    this._visited.add(`${p.x},${p.y}`);

    for (let deg = 0; deg < 360; deg += 3) {
      const rad = deg * Math.PI / 180;
      let fx = p.x + 0.5, fy = p.y + 0.5;
      const cos = Math.cos(rad) * 0.55, sin = Math.sin(rad) * 0.55;
      for (let r = 0; r <= FOV_R; r++) {
        const tx = Math.floor(fx), ty = Math.floor(fy);
        if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) break;
        const key = `${tx},${ty}`;
        newFov.add(key);
        this._visited.add(key);
        const t = this.dungeon.tiles[ty][tx];
        if (t === TILE.WALL || t === TILE.TORCH) break;
        fx += cos; fy += sin;
      }
    }

    this._inFov = newFov;

    for (const [key, spr] of Object.entries(this.tileSprites)) {
      if (newFov.has(key)) {
        spr.setAlpha(1);
        const [x, y] = key.split(',').map(Number);
        const t = this.dungeon.tiles[y][x];
        if (t === TILE.STAIRS)     spr.setTint(0xffdd44);
        else if (t === TILE.TORCH) spr.setTint(0xff8822);
        else                       spr.clearTint();
      } else if (this._visited.has(key)) {
        spr.setAlpha(0.3);
        spr.clearTint();
        const [x, y] = key.split(',').map(Number);
        const t = this.dungeon.tiles[y][x];
        if (t === TILE.STAIRS)     spr.setTint(0x886600);
        else if (t === TILE.TORCH) spr.setTint(0x552200);
      } else {
        spr.setAlpha(0);
      }
    }
  }

  _updateEnemyVisibility() {
    for (const e of this.enemies) {
      const vis = e.alive && this._inFov.has(`${e.x},${e.y}`);
      e.spr.setAlpha(vis ? 1 : 0);
      e.hpBg.setAlpha(vis && e.hp < e.maxHp ? 1 : 0);
      e.hpFg.setAlpha(vis && e.hp < e.maxHp ? 1 : 0);
    }
  }

  _updateItemVisibility() {
    for (const item of this.floorItems) {
      item.spr.setAlpha(this._inFov.has(`${item.x},${item.y}`) ? 1 : 0);
    }
  }

  _revealAll() {
    for (const key of Object.keys(this.tileSprites)) {
      this._visited.add(key);
      if (!this._inFov.has(key)) this.tileSprites[key].setAlpha(0.3);
    }
  }

  // ─── EFFECTS ─────────────────────────────────────────────────────────────────

  _floatText(wx, wy, text, color = '#ffffff', big = false) {
    const t = this.add.text(wx, wy, text, {
      fontFamily: 'monospace', fontSize: big ? '16px' : '12px',
      color, stroke: '#000000', strokeThickness: 3,
    }).setDepth(20).setOrigin(0.5, 1);
    this.tweens.add({
      targets: t, y: wy - 44, alpha: 0, duration: 900,
      ease: 'Power2.easeOut', onComplete: () => t.destroy(),
    });
  }

  _flashSprite(spr, color) {
    spr.setTint(color);
    this.time.delayedCall(160, () => {
      if (spr === this.playerSpr) spr.setTint(PLAYER_TINT);
      else spr.clearTint();
    });
  }

  // ─── UI BRIDGE ───────────────────────────────────────────────────────────────

  _addMessage(msg) {
    this.messages.unshift(msg);
    if (this.messages.length > 4) this.messages.length = 4;
    this.uiScene?.refreshMessages?.();
  }

  _refreshUI() {
    this.uiScene?.refresh?.();
  }
}
