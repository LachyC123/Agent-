const ITEM_DATA = {
  hammer:       { subtype: 'weapon',    atk: 4,  name: 'Squeaky Hammer',   desc: 'ATK +4'  },
  balloon_sword:{ subtype: 'weapon',    atk: 7,  name: 'Balloon Sword',    desc: 'ATK +7'  },
  big_shoes:    { subtype: 'armor',     def: 3,  name: 'Big Shoes',        desc: 'DEF +3'  },
  motley_armor: { subtype: 'armor',     def: 6,  name: 'Motley Armor',     desc: 'DEF +6'  },
  cream_pie:    { subtype: 'consumable',heal: 0, name: 'Cream Pie',        desc: 'Stun foe'},
  seltzer:      { subtype: 'consumable',heal: 15,name: 'Seltzer Bottle',   desc: 'Heal 15' },
  mystery_box:  { subtype: 'consumable',heal: 0, name: 'Mystery Box',      desc: '???'     },
  gold:         { subtype: 'gold',                name: 'Gold Coins',       desc: ''        },
};

const ENEMY_NAMES = {
  jester:     'Jester',
  mime:       'Mime',
  juggler:    'Juggler',
  balloondog: 'Balloon Dog',
  ringmaster: 'Ringmaster',
};

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.floorNum   = data.floor  || 1;
    this.seed       = data.seed   || 1337;
    this.playerData = data.playerData || null;
  }

  create() {
    this.TS      = SpriteGen.TS;
    this.MAP_W   = 48;
    this.MAP_H   = 48;
    this.turnCount  = 0;
    this.gameOver   = false;
    this.animating  = false;
    this.messages   = [];

    this.fog = Array.from({ length: this.MAP_H }, () => Array(this.MAP_W).fill(0));

    this._buildDungeon();
    this._buildPlayer();
    this._buildTilemap();
    this._buildEntities();
    this._setupCamera();
    this._setupInput();

    this.scene.launch('UIScene', { gameScene: this });
    this.uiScene = this.scene.get('UIScene');

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this._computeFOV();
    this._refreshTiles();
    this._addMessage(this._floorMessage());
  }

  _floorMessage() {
    if (this.floorNum % 5 === 0) return `⚠ Floor ${this.floorNum} — THE RINGMASTER AWAITS.`;
    const msgs = [
      `Floor ${this.floorNum} — the laughter echoes...`,
      `Floor ${this.floorNum} — something giggles in the dark.`,
      `Floor ${this.floorNum} — the circus goes deeper.`,
      `Floor ${this.floorNum} — you smell greasepaint and blood.`,
      `Floor ${this.floorNum} — the clowns are watching.`,
    ];
    return msgs[(this.floorNum - 1) % msgs.length];
  }

  // ── BUILD ────────────────────────────────────────────────────────────

  _buildDungeon() {
    const gen = new DungeonGenerator(this.MAP_W, this.MAP_H);
    this.dungeon = gen.generate(this.floorNum, this.seed);
  }

  _buildPlayer() {
    const { x, y } = this.dungeon.playerStart;
    const p = this.playerData
      ? { ...this.playerData }
      : { hp: 30, maxHp: 30, baseAtk: 3, baseDef: 1,
          weapon: null, armor: null, inventory: [],
          xp: 0, level: 1, gold: 0, kills: 0 };
    p.x = x;
    p.y = y;
    if (p.kills === undefined) p.kills = 0;

    // Use Object.defineProperty so 'this' inside the getter refers to the player object,
    // not a temporary source object (which would make baseAtk undefined → NaN).
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

  _buildTilemap() {
    const TS = this.TS;
    const { width, height } = this.dungeon;

    this.tileLayer = this.add.container(0, 0);
    this.tileSprites = [];
    for (let ty = 0; ty < height; ty++) {
      this.tileSprites[ty] = [];
      for (let tx = 0; tx < width; tx++) {
        const img = this.add.image(tx * TS + TS / 2, ty * TS + TS / 2, 'tiles', 'void').setDepth(0);
        this.tileLayer.add(img);
        this.tileSprites[ty][tx] = img;
      }
    }

    this.fogLayer = this.add.container(0, 0);
    this.fogSprites = [];
    for (let ty = 0; ty < height; ty++) {
      this.fogSprites[ty] = [];
      for (let tx = 0; tx < width; tx++) {
        const fog = this.add.rectangle(tx * TS + TS / 2, ty * TS + TS / 2, TS, TS, 0x000000, 1).setDepth(5);
        this.fogLayer.add(fog);
        this.fogSprites[ty][tx] = fog;
      }
    }
  }

  _tileFrame(t) {
    return ['void','floor','wall','door','stairs','torch','blood','barrel','floor2'][t] || 'void';
  }

  _buildEntities() {
    const TS = this.TS;
    this.entities = [];
    this.entitySprites = new Map();

    this.dungeon.entities.forEach(ent => {
      const e = { ...ent };
      this.entities.push(e);

      if (e.kind === 'enemy') {
        const sx = e.x * TS + TS / 2;
        const sy = e.y * TS + TS / 2;
        const spr = this.add.sprite(sx, sy, 'enemies', `${e.type}_0`).setDepth(3);
        spr.play(`${e.type}-walk`);

        // Small HP bar above sprite
        const bw = TS - 4;
        e._hpBg = this.add.rectangle(sx, sy - TS / 2 - 3, bw, 3, 0x330000).setDepth(4);
        e._hpFg = this.add.rectangle(sx - bw / 2, sy - TS / 2 - 3, bw, 3, 0x22dd22)
                    .setDepth(4).setOrigin(0, 0.5);

        this.entitySprites.set(e, spr);
      } else {
        const frame = e.type === 'gold' ? 'gold' : e.type;
        const spr = this.add.image(e.x * TS + TS / 2, e.y * TS + TS / 2, 'items', frame).setDepth(2);
        this.entitySprites.set(e, spr);
        this.tweens.add({ targets: spr, y: spr.y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    });

    this.playerSprite = this.add.sprite(
      this.player.x * TS + TS / 2,
      this.player.y * TS + TS / 2,
      'player', 'idle'
    ).setDepth(4);
    this.playerSprite.play('player-idle');
  }

  _setupCamera() {
    const TS = this.TS;
    this.cameras.main.setBounds(0, 0, this.MAP_W * TS, this.MAP_H * TS);
    this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height - 160);
    this.cameras.main.startFollow(this.playerSprite, true, 0.12, 0.12);
  }

  _setupInput() {
    this.input.keyboard.on('keydown', e => {
      if (this.animating || this.gameOver) return;
      const k = e.key;
      if (k === 'ArrowUp'    || k === 'w' || k === 'W') this._tryMove( 0, -1);
      if (k === 'ArrowDown'  || k === 's' || k === 'S') this._tryMove( 0,  1);
      if (k === 'ArrowLeft'  || k === 'a' || k === 'A') this._tryMove(-1,  0);
      if (k === 'ArrowRight' || k === 'd' || k === 'D') this._tryMove( 1,  0);
      if (k === ' ' || k === '.') this._wait();
      if (k === 'i' || k === 'I') this._openInventory();
    });

    // Swipe — ignore touches that start in the right-half bottom area (D-pad zone)
    this.input.on('pointerdown', p => {
      const inDpad = p.x > this.scale.width * 0.5 && p.y > this.scale.height - 200;
      this._touchStart = inDpad ? null : { x: p.x, y: p.y };
    });
    this.input.on('pointerup', p => {
      if (!this._touchStart || this.animating || this.gameOver) return;
      const dx = p.x - this._touchStart.x;
      const dy = p.y - this._touchStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this._touchStart = null;
      if (dist < 18) { this._wait(); return; }
      if (Math.abs(dx) > Math.abs(dy)) this._tryMove(dx > 0 ? 1 : -1, 0);
      else                             this._tryMove(0, dy > 0 ? 1 : -1);
    });
  }

  // ── MOVEMENT / TURN ──────────────────────────────────────────────────

  _tryMove(dx, dy) {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    const tile = this.dungeon.tiles[ny]?.[nx];

    if (tile === undefined || tile === TILE.VOID || tile === TILE.WALL || tile === TILE.BARREL) return;

    // Face direction
    if (dx < 0) this.playerSprite.setFlipX(true);
    else if (dx > 0) this.playerSprite.setFlipX(false);

    const enemy = this._enemyAt(nx, ny);
    if (enemy) { this._playerAttack(enemy); return; }

    const item = this._itemAt(nx, ny);

    if (tile === TILE.DOOR) {
      this.dungeon.tiles[ny][nx] = TILE.FLOOR;
      this.tileSprites[ny][nx].setTexture('tiles', 'floor');
      this._addMessage('You kick open the door. *HONK*');
      this._endTurn();
      return;
    }

    if (tile === TILE.STAIRS) {
      this._descend();
      return;
    }

    this.player.x = nx;
    this.player.y = ny;
    this._animatePlayerMove();

    // Hint when adjacent to stairs
    const adj = [[-1,0],[1,0],[0,-1],[0,1]];
    const nearStairs = adj.some(([ax, ay]) => this.dungeon.tiles[ny + ay]?.[nx + ax] === TILE.STAIRS);
    if (nearStairs) this._addMessage('You sense stairs nearby...');

    if (item) this._pickupItem(item);

    this._endTurn();
  }

  _wait() {
    // Regen 1 HP when resting (max once per 2 turns to not trivialise combat)
    const canRegen = this.player.hp < this.player.maxHp;
    if (canRegen) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
      this._floatText(this.playerSprite.x, this.playerSprite.y, '+1', '#44ff88');
      this._addMessage('You rest quietly. (+1 HP)');
    } else {
      this._addMessage('You wait... *squeak*');
    }
    this._endTurn();
  }

  _endTurn() {
    this.turnCount++;
    this._computeFOV();
    this._refreshTiles();
    this._refreshEntityVisibility();
    this._enemyTurns();
    this._checkDeath();
    if (this.uiScene) this.uiScene.refresh();
  }

  // ── ANIMATIONS ───────────────────────────────────────────────────────

  _animatePlayerMove() {
    const TS = this.TS;
    const tx = this.player.x * TS + TS / 2;
    const ty = this.player.y * TS + TS / 2;
    this.animating = true;
    this.playerSprite.play('player-walk');
    this.tweens.add({
      targets: this.playerSprite,
      x: tx, y: ty,
      duration: 90,
      ease: 'Linear',
      onComplete: () => {
        this.animating = false;
        this.playerSprite.play('player-idle');
      }
    });
  }

  // Floating combat text anchored to world space
  _floatText(wx, wy, text, color = '#ffffff', big = false) {
    const t = this.add.text(wx, wy - 6, text, {
      fontFamily: 'monospace',
      fontSize: big ? '18px' : '13px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(20).setOrigin(0.5, 1);
    this.tweens.add({
      targets: t,
      y: wy - 36,
      alpha: 0,
      duration: 900,
      ease: 'Power2.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  // ── COMBAT ───────────────────────────────────────────────────────────

  _playerAttack(enemy) {
    // atk/def are now proper getter functions — no NaN possible
    const base = this.player.atk - enemy.def + Math.floor(Math.random() * 3) - 1;
    const dmg  = Math.max(1, base);
    const crit = Math.random() < 0.12;
    const finalDmg = crit ? dmg * 2 : dmg;
    enemy.hp -= finalDmg;

    const TS  = this.TS;
    const tx  = enemy.x * TS + TS / 2;
    const ty  = enemy.y * TS + TS / 2;
    const spr = this.entitySprites.get(enemy);

    // Floating number
    this._floatText(tx, ty, crit ? `${finalDmg}!!` : `-${finalDmg}`, crit ? '#ffee00' : '#ff5555', crit);

    // Update HP bar immediately
    this._updateHPBar(enemy);

    // Lunge animation
    const origX = this.playerSprite.x, origY = this.playerSprite.y;
    const midX  = origX + (tx - origX) * 0.45;
    const midY  = origY + (ty - origY) * 0.45;
    this.animating = true;
    this.playerSprite.play('player-attack', true);
    this.tweens.add({
      targets: this.playerSprite,
      x: midX, y: midY,
      duration: 55, yoyo: true,
      onComplete: () => { this.animating = false; this.playerSprite.play('player-idle'); }
    });

    if (spr) {
      const fx = this.add.image(tx, ty, 'effects', 'hit').setDepth(10).setAlpha(0.85);
      this.tweens.add({ targets: fx, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 280, onComplete: () => fx.destroy() });
      spr.play(`${enemy.type}-hurt`, true);
      this.tweens.add({ targets: spr, tint: 0xff3333, duration: 70, yoyo: true, onComplete: () => spr.clearTint() });
      this.time.delayedCall(380, () => { if (enemy.hp > 0) spr.play(`${enemy.type}-walk`); });
    }

    const name = ENEMY_NAMES[enemy.type] || enemy.type;
    const critStr = crit ? ' CRITICAL!' : '';
    this._addMessage(`Hit the ${name} for ${finalDmg} dmg!${critStr}`);

    if (enemy.hp <= 0) this._killEnemy(enemy);
    else               this._endTurn();
  }

  _killEnemy(enemy) {
    // Destroy HP bars
    if (enemy._hpBg) { enemy._hpBg.destroy(); enemy._hpBg = null; }
    if (enemy._hpFg) { enemy._hpFg.destroy(); enemy._hpFg = null; }

    const spr = this.entitySprites.get(enemy);
    const TS  = this.TS;
    const wx  = enemy.x * TS + TS / 2;
    const wy  = enemy.y * TS + TS / 2;

    const fx = this.add.image(wx, wy, 'effects', 'death').setDepth(10);
    this.tweens.add({ targets: fx, alpha: 0, scaleX: 2.2, scaleY: 2.2, duration: 420, onComplete: () => fx.destroy() });

    if (spr) {
      this.tweens.add({ targets: spr, alpha: 0, y: spr.y + 10, duration: 280, onComplete: () => spr.destroy() });
    }

    this.entities = this.entities.filter(e => e !== enemy);
    this.entitySprites.delete(enemy);

    // XP
    this.player.xp    += enemy.xp;
    this.player.kills  = (this.player.kills || 0) + 1;
    const name = ENEMY_NAMES[enemy.type] || enemy.type;
    this._addMessage(`${name} is slain! +${enemy.xp} XP`);

    const xpNeeded = this.player.level * 30;
    if (this.player.xp >= xpNeeded) {
      this.player.xp -= xpNeeded;
      this.player.level++;
      this.player.maxHp  += 5;
      this.player.hp      = Math.min(this.player.hp + 8, this.player.maxHp);
      this.player.baseAtk += 1;
      this._floatText(this.playerSprite.x, this.playerSprite.y, 'LEVEL UP!', '#ffee00', true);
      this._addMessage(`LEVEL UP! Lv ${this.player.level}  +5 MaxHP  +1 ATK`);
    }

    this._endTurn();
  }

  _enemyAttack(enemy) {
    const base = enemy.atk - this.player.def + Math.floor(Math.random() * 3) - 1;
    const dmg  = Math.max(1, base);
    this.player.hp -= dmg;

    this._floatText(this.playerSprite.x, this.playerSprite.y, `-${dmg}`, '#ff8888');

    const name = ENEMY_NAMES[enemy.type] || enemy.type;
    this._addMessage(`${name} hits you for ${dmg}!`);
    this.tweens.add({ targets: this.playerSprite, tint: 0xff0000, duration: 90, yoyo: true, onComplete: () => this.playerSprite.clearTint() });
    this.cameras.main.shake(110, 0.006);
  }

  // ── ENEMY TURNS ───────────────────────────────────────────────────────

  _enemyTurns() {
    const visEnemies = this.entities.filter(e => e.kind === 'enemy' && this.fog[e.y]?.[e.x] === 2);
    visEnemies.forEach(enemy => {
      if (enemy.stunned > 0) {
        enemy.stunned--;
        // Show stun stars above sprite
        const spr = this.entitySprites.get(enemy);
        if (spr) this._floatText(spr.x, spr.y, '***', '#ffee00');
        return;
      }

      enemy.ticksSinceMove++;
      if (enemy.ticksSinceMove < enemy.speed) return;
      enemy.ticksSinceMove = 0;

      const dist = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);

      if (dist === 1) {
        this._enemyAttack(enemy);
      } else if (enemy.ranged && dist <= 5) {
        const dmg = Math.max(1, Math.floor(enemy.atk * 0.7) - this.player.def);
        this.player.hp -= dmg;
        this._floatText(this.playerSprite.x, this.playerSprite.y, `-${dmg}`, '#ff8888');
        this._addMessage(`${ENEMY_NAMES[enemy.type] || enemy.type} throws at you! ${dmg} dmg!`);
        this.cameras.main.shake(70, 0.004);
        // Projectile
        const TS = this.TS;
        const proj = this.add.circle(enemy.x * TS + TS / 2, enemy.y * TS + TS / 2, 4, 0xff6600).setDepth(8);
        this.tweens.add({
          targets: proj,
          x: this.player.x * TS + TS / 2, y: this.player.y * TS + TS / 2,
          duration: 220,
          onComplete: () => proj.destroy(),
        });
      } else {
        this._moveEnemyToward(enemy);
      }

      // Animate sprite and HP bar to new position
      const spr = this.entitySprites.get(enemy);
      if (spr) {
        const TS = this.TS;
        const nx = enemy.x * TS + TS / 2;
        const ny = enemy.y * TS + TS / 2;
        this.tweens.add({ targets: spr, x: nx, y: ny, duration: 110, ease: 'Linear' });
        spr.setFlipX(enemy.x < this.player.x ? false : (enemy.x > this.player.x));
        // Move HP bars immediately (no tween needed — they're tiny)
        this._moveHPBar(enemy);
      }
    });
  }

  _moveEnemyToward(enemy) {
    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    const moves = [];
    if (dx !== 0) moves.push({ x: Math.sign(dx), y: 0 });
    if (dy !== 0) moves.push({ x: 0, y: Math.sign(dy) });
    moves.push({ x: Math.sign(dx) || 1, y: 0 }, { x: 0, y: Math.sign(dy) || 1 });
    moves.push({ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 });

    for (const m of moves) {
      const nx = enemy.x + m.x;
      const ny = enemy.y + m.y;
      if (this._isWalkable(nx, ny) && !this._enemyAt(nx, ny)) {
        enemy.x = nx;
        enemy.y = ny;
        return;
      }
    }
  }

  // ── HP BARS ───────────────────────────────────────────────────────────

  _updateHPBar(enemy) {
    if (!enemy._hpFg || !enemy._hpBg) return;
    const bw    = this.TS - 4;
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    enemy._hpFg.width = Math.max(0, bw * ratio);
    const col = ratio > 0.5 ? 0x22dd22 : ratio > 0.25 ? 0xffaa00 : 0xff2222;
    enemy._hpFg.setFillStyle(col);
  }

  _moveHPBar(enemy) {
    if (!enemy._hpBg || !enemy._hpFg) return;
    const TS  = this.TS;
    const bw  = TS - 4;
    const sx  = enemy.x * TS + TS / 2;
    const sy  = enemy.y * TS + TS / 2 - TS / 2 - 3;
    enemy._hpBg.x = sx;
    enemy._hpBg.y = sy;
    enemy._hpFg.x = sx - bw / 2;
    enemy._hpFg.y = sy;
  }

  // ── ITEMS ─────────────────────────────────────────────────────────────

  _pickupItem(item) {
    const data = ITEM_DATA[item.type];
    const spr  = this.entitySprites.get(item);
    if (spr) { this.tweens.killTweensOf(spr); spr.destroy(); }
    this.entities = this.entities.filter(e => e !== item);
    this.entitySprites.delete(item);

    if (item.type === 'gold') {
      const v = item.value || 10;
      this.player.gold += v;
      this._floatText(this.playerSprite.x, this.playerSprite.y, `+${v}g`, '#ffee44');
      this._addMessage(`Picked up ${v} gold!`);
      return;
    }

    if (data.subtype === 'weapon') {
      const old = this.player.weapon;
      const oldAtk = old ? (ITEM_DATA[old]?.atk || 0) : 0;
      const diff = data.atk - oldAtk;
      this.player.weapon = item.type;
      const sign = diff >= 0 ? '+' : '';
      this._addMessage(`Equipped ${data.name}! (ATK ${sign}${diff} vs old)`);
      this._floatText(this.playerSprite.x, this.playerSprite.y, `ATK ${sign}${diff}`, diff >= 0 ? '#ffee44' : '#ff8888');
    } else if (data.subtype === 'armor') {
      const old = this.player.armor;
      const oldDef = old ? (ITEM_DATA[old]?.def || 0) : 0;
      const diff = data.def - oldDef;
      this.player.armor = item.type;
      const sign = diff >= 0 ? '+' : '';
      this._addMessage(`Equipped ${data.name}! (DEF ${sign}${diff} vs old)`);
      this._floatText(this.playerSprite.x, this.playerSprite.y, `DEF ${sign}${diff}`, diff >= 0 ? '#44aaff' : '#ff8888');
    } else {
      this.player.inventory.push(item.type);
      this._addMessage(`Picked up ${data.name}. (${data.desc})`);
      if (this.player.inventory.length > 8) this.player.inventory.shift();
    }
  }

  _useItem(type) {
    const data = ITEM_DATA[type];
    if (!data) return;
    const idx = this.player.inventory.indexOf(type);
    if (idx < 0) return;
    this.player.inventory.splice(idx, 1);

    if (type === 'seltzer') {
      const healed = Math.min(data.heal, this.player.maxHp - this.player.hp);
      this.player.hp += healed;
      const fx = this.add.image(this.playerSprite.x, this.playerSprite.y, 'effects', 'heal').setDepth(12);
      this.tweens.add({ targets: fx, y: fx.y - 24, alpha: 0, duration: 600, onComplete: () => fx.destroy() });
      this._floatText(this.playerSprite.x, this.playerSprite.y, `+${healed} HP`, '#44ff88', true);
      this._addMessage(`Drank Seltzer! Healed ${healed} HP.`);
    } else if (type === 'cream_pie') {
      const nearby = this.entities
        .filter(e => e.kind === 'enemy' && this.fog[e.y]?.[e.x] === 2)
        .sort((a, b) =>
          (Math.abs(a.x - this.player.x) + Math.abs(a.y - this.player.y)) -
          (Math.abs(b.x - this.player.x) + Math.abs(b.y - this.player.y))
        );
      if (nearby.length > 0) {
        nearby[0].stunned = 3;
        const spr = this.entitySprites.get(nearby[0]);
        if (spr) this._floatText(spr.x, spr.y, 'SPLAT!', '#ffffaa', true);
        this._addMessage(`SPLAT! ${ENEMY_NAMES[nearby[0].type] || nearby[0].type} stunned 3 turns!`);
      } else {
        this._addMessage('No visible enemy nearby — wasted!');
      }
    } else if (type === 'mystery_box') {
      this._mysteryEffect();
    }

    this._endTurn();
    if (this.uiScene) this.uiScene.refresh();
  }

  _mysteryEffect() {
    const px = this.playerSprite.x, py = this.playerSprite.y;
    const effects = [
      () => { const h = 10 + Math.floor(Math.random() * 15); this.player.hp = Math.min(this.player.maxHp, this.player.hp + h); this._floatText(px, py, `+${h} HP`, '#44ff88', true); this._addMessage(`Mystery: Restored ${h} HP!`); },
      () => { this.player.baseAtk += 2; this._floatText(px, py, 'ATK +2!', '#ffee44', true); this._addMessage('Mystery: ATK +2 permanently!'); },
      () => { this.player.baseDef += 2; this._floatText(px, py, 'DEF +2!', '#44aaff', true); this._addMessage('Mystery: DEF +2 permanently!'); },
      () => { const d = 5 + Math.floor(Math.random() * 10); this.player.hp -= d; this._floatText(px, py, `-${d}`, '#ff4444', true); this._addMessage(`Mystery: Confetti cannon! ${d} dmg!`); },
      () => { this.player.gold += 25; this._floatText(px, py, '+25g', '#ffee44'); this._addMessage('Mystery: Gold rains from above!'); },
      () => { this.entities.filter(e => e.kind === 'enemy').forEach(e => { e.stunned = 2; }); this._floatText(px, py, 'ALL STUNNED', '#ffffaa', true); this._addMessage('Mystery: All enemies stunned for 2 turns!'); },
    ];
    effects[Math.floor(Math.random() * effects.length)]();
  }

  // ── FOG OF WAR ───────────────────────────────────────────────────────

  _computeFOV() {
    const px = this.player.x, py = this.player.y;
    const radius = 7;
    const fog = this.fog;

    for (let y = 0; y < this.MAP_H; y++)
      for (let x = 0; x < this.MAP_W; x++)
        if (fog[y][x] === 2) fog[y][x] = 1;

    for (let angle = 0; angle < 360; angle += 2) {
      const rad = angle * Math.PI / 180;
      let rx = px + 0.5, ry = py + 0.5;
      const rdx = Math.cos(rad), rdy = Math.sin(rad);
      for (let step = 0; step <= radius; step++) {
        const cx = Math.floor(rx), cy = Math.floor(ry);
        if (cx < 0 || cx >= this.MAP_W || cy < 0 || cy >= this.MAP_H) break;
        fog[cy][cx] = 2;
        const t = this.dungeon.tiles[cy][cx];
        if (t === TILE.WALL || t === TILE.DOOR) break;
        rx += rdx * 0.75;
        ry += rdy * 0.75;
      }
    }
    fog[py][px] = 2;
  }

  _refreshTiles() {
    const fog = this.fog;
    const tiles = this.dungeon.tiles;
    for (let ty = 0; ty < this.MAP_H; ty++) {
      for (let tx = 0; tx < this.MAP_W; tx++) {
        const v    = fog[ty][tx];
        const tSpr = this.tileSprites[ty][tx];
        const fSpr = this.fogSprites[ty][tx];
        if (v === 0) {
          tSpr.setTexture('tiles', 'void');
          fSpr.setAlpha(1);
        } else {
          tSpr.setTexture('tiles', this._tileFrame(tiles[ty][tx]));
          fSpr.setAlpha(v === 1 ? 0.65 : 0);
        }
      }
    }
  }

  _refreshEntityVisibility() {
    this.entities.forEach(ent => {
      const spr = this.entitySprites.get(ent);
      if (!spr) return;
      const v = this.fog[ent.y]?.[ent.x] || 0;
      spr.setVisible(v > 0);
      spr.setAlpha(v === 2 ? 1 : 0.35);
      // HP bars
      if (ent.kind === 'enemy') {
        const show = v === 2 && ent.hp < ent.maxHp;
        if (ent._hpBg) ent._hpBg.setVisible(show);
        if (ent._hpFg) ent._hpFg.setVisible(show);
      }
    });
  }

  // ── DESCENT ───────────────────────────────────────────────────────────

  _descend() {
    if (this.floorNum >= 10) { this._victory(); return; }
    this._addMessage(`Descending to floor ${this.floorNum + 1}...`);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.restart({
        floor: this.floorNum + 1,
        seed:  this.seed + 1337,
        playerData: {
          hp:      this.player.hp,
          maxHp:   this.player.maxHp,
          baseAtk: this.player.baseAtk,
          baseDef: this.player.baseDef,
          weapon:  this.player.weapon,
          armor:   this.player.armor,
          inventory: [...this.player.inventory],
          xp:    this.player.xp,
          level: this.player.level,
          gold:  this.player.gold,
          kills: this.player.kills,
        }
      });
    });
  }

  _victory() {
    this.gameOver = true;
    this.scene.stop('UIScene');
    this.cameras.main.fadeOut(600, 255, 220, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameOverScene', {
        won: true, floor: this.floorNum, level: this.player.level,
        gold: this.player.gold, kills: this.player.kills,
      });
    });
  }

  _checkDeath() {
    if (this.player.hp <= 0 && !this.gameOver) {
      this.player.hp = 0;
      this.gameOver  = true;
      this._addMessage('YOU HAVE DIED... *honk*');
      this.playerSprite.setTexture('player', 'dead');
      this.cameras.main.shake(320, 0.022);
      this.time.delayedCall(1400, () => {
        this.scene.stop('UIScene');
        this.cameras.main.fadeOut(600, 80, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameOverScene', {
            won: false, floor: this.floorNum, level: this.player.level,
            gold: this.player.gold, kills: this.player.kills,
          });
        });
      });
    }
  }

  // ── INVENTORY UI ─────────────────────────────────────────────────────

  _openInventory() {
    if (this.invOpen) return;
    if (this.player.inventory.length === 0) { this._addMessage('Your pockets are empty.'); return; }
    this.invOpen = true;
    const W    = this.scale.width;
    const rowH = 38;

    const overlay = this.add.rectangle(W / 2, 200, W - 32, 60 + this.player.inventory.length * rowH + 30, 0x08000f, 0.97)
      .setDepth(20).setStrokeStyle(2, 0x880088);
    const title = this.add.text(W / 2, 92, '— INVENTORY —', {
      fontFamily: 'monospace', fontSize: '15px', color: '#cc88ff',
    }).setOrigin(0.5).setDepth(21);

    const allObjects = [overlay, title];
    const rowBgs     = []; // { bg, type }

    this.player.inventory.forEach((type, i) => {
      const data = ITEM_DATA[type];
      const iy   = 120 + i * rowH;
      const bg   = this.add.rectangle(W / 2, iy, W - 52, rowH - 6, 0x1a0028, 0.9)
        .setDepth(21).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x550055);
      const icon = this.add.image(38, iy, 'items', type).setDepth(22).setScale(0.9);
      const lbl  = this.add.text(62, iy - 7, data.name, {
        fontFamily: 'monospace', fontSize: '13px', color: '#ddaaff',
      }).setOrigin(0, 0).setDepth(22);
      const desc = this.add.text(62, iy + 7, data.desc, {
        fontFamily: 'monospace', fontSize: '10px', color: '#886688',
      }).setOrigin(0, 0).setDepth(22);
      const useBtn = this.add.text(W - 22, iy, 'USE', {
        fontFamily: 'monospace', fontSize: '12px', color: '#ff88ff',
      }).setOrigin(1, 0.5).setDepth(22);

      bg.on('pointerover', () => bg.setFillStyle(0x330044, 0.95));
      bg.on('pointerout',  () => bg.setFillStyle(0x1a0028, 0.9));
      allObjects.push(bg, icon, lbl, desc, useBtn);
      rowBgs.push({ bg, type });
    });

    const closeY   = 120 + this.player.inventory.length * rowH + 14;
    const closeBtn = this.add.text(W / 2, closeY, '[ CLOSE ]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#664466',
    }).setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: '#cc88cc' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ color: '#664466' }));
    allObjects.push(closeBtn);

    // Arrow function: captures this + allObjects from closure, safe to use anywhere
    const closeAll = () => {
      this.invOpen = false;
      allObjects.forEach(o => o.destroy());
    };

    closeBtn.on('pointerdown', closeAll);
    rowBgs.forEach(({ bg, type }) => {
      bg.on('pointerdown', () => { closeAll(); this._useItem(type); });
    });
  }

  // ── HELPERS ───────────────────────────────────────────────────────────

  _enemyAt(x, y) {
    return this.entities.find(e => e.kind === 'enemy' && e.x === x && e.y === y) || null;
  }

  _itemAt(x, y) {
    return this.entities.find(e => e.kind === 'item' && e.x === x && e.y === y) || null;
  }

  _isWalkable(x, y) {
    const t = this.dungeon.tiles[y]?.[x];
    return t === TILE.FLOOR || t === TILE.FLOOR2 || t === TILE.BLOOD ||
           t === TILE.DOOR  || t === TILE.STAIRS  || t === TILE.TORCH;
  }

  _addMessage(msg) {
    this.messages.unshift(msg);
    if (this.messages.length > 6) this.messages.pop();
    if (this.uiScene) this.uiScene.refreshMessages();
  }

  onDPad(dir) {
    if (this.animating || this.gameOver) return;
    switch (dir) {
      case 'up':    this._tryMove( 0, -1); break;
      case 'down':  this._tryMove( 0,  1); break;
      case 'left':  this._tryMove(-1,  0); break;
      case 'right': this._tryMove( 1,  0); break;
      case 'wait':  this._wait();          break;
    }
  }
}
