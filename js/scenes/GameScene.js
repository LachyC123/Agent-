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

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.floorNum  = data.floor  || 1;
    this.seed      = data.seed   || 1337;
    this.playerData = data.playerData || null;
  }

  create() {
    this.TS = SpriteGen.TS; // tile size
    this.MAP_W = 48;
    this.MAP_H = 48;

    // State
    this.turnCount  = 0;
    this.gameOver   = false;
    this.animating  = false;
    this.messages   = [];

    // Fog of war — 0=unseen, 1=seen(dark), 2=visible
    this.fog = Array.from({ length: this.MAP_H }, () => Array(this.MAP_W).fill(0));

    this._buildDungeon();
    this._buildPlayer();
    this._buildTilemap();
    this._buildEntities();
    this._setupCamera();
    this._setupInput();

    // Start UI overlay
    this.scene.launch('UIScene', { gameScene: this });
    this.uiScene = this.scene.get('UIScene');

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Compute initial FOV
    this._computeFOV();
    this._refreshTiles();
    this._addMessage(this._floorMessage());
  }

  _floorMessage() {
    const msgs = [
      `Floor ${this.floorNum} — the laughter echoes...`,
      `Floor ${this.floorNum} — something giggles in the dark.`,
      `Floor ${this.floorNum} — the circus goes deeper.`,
      `Floor ${this.floorNum} — you smell greasepaint and blood.`,
      `Floor ${this.floorNum} — the clowns are watching.`,
    ];
    if (this.floorNum % 5 === 0) return `⚠ Floor ${this.floorNum} — THE RINGMASTER AWAITS.`;
    return msgs[(this.floorNum - 1) % msgs.length];
  }

  // ── BUILD ────────────────────────────────────────────────────────────

  _buildDungeon() {
    const gen = new DungeonGenerator(this.MAP_W, this.MAP_H);
    this.dungeon = gen.generate(this.floorNum, this.seed);
  }

  _buildPlayer() {
    const { x, y } = this.dungeon.playerStart;
    const base = this.playerData
      ? { ...this.playerData }
      : { hp: 30, maxHp: 30, baseAtk: 3, baseDef: 1, weapon: null, armor: null, inventory: [], xp: 0, level: 1, gold: 0 };
    this.player = Object.assign(base, {
      x, y,
      get atk() { return this.baseAtk + (this.weapon ? (ITEM_DATA[this.weapon]?.atk || 0) : 0); },
      get def() { return this.baseDef + (this.armor  ? (ITEM_DATA[this.armor ]?.def || 0) : 0); },
    });
  }

  _buildTilemap() {
    const TS = this.TS;
    const { tiles, width, height } = this.dungeon;

    // Ground layer — one image per tile (pooled via containers)
    this.tileLayer = this.add.container(0, 0);
    this.tileSprites = [];

    for (let ty = 0; ty < height; ty++) {
      this.tileSprites[ty] = [];
      for (let tx = 0; tx < width; tx++) {
        const img = this.add.image(tx * TS + TS / 2, ty * TS + TS / 2, 'tiles', 'void');
        img.setDepth(0);
        this.tileLayer.add(img);
        this.tileSprites[ty][tx] = img;
      }
    }

    // Fog overlay layer
    this.fogSprites = [];
    this.fogLayer = this.add.container(0, 0);
    for (let ty = 0; ty < height; ty++) {
      this.fogSprites[ty] = [];
      for (let tx = 0; tx < width; tx++) {
        const fog = this.add.rectangle(tx * TS + TS / 2, ty * TS + TS / 2, TS, TS, 0x000000, 1);
        fog.setDepth(5);
        this.fogLayer.add(fog);
        this.fogSprites[ty][tx] = fog;
      }
    }
  }

  _tileFrame(t) {
    return ['void', 'floor', 'wall', 'door', 'stairs', 'torch', 'blood', 'barrel', 'floor2'][t] || 'void';
  }

  _buildEntities() {
    const TS = this.TS;
    this.entities = []; // enemies + items
    this.entitySprites = new Map(); // entity -> sprite

    this.dungeon.entities.forEach(ent => {
      const e = { ...ent };
      this.entities.push(e);

      if (e.kind === 'enemy') {
        const spr = this.add.sprite(e.x * TS + TS / 2, e.y * TS + TS / 2, 'enemies', `${e.type}_0`);
        spr.setDepth(3);
        spr.setScale(1);
        spr.play(`${e.type}-walk`);
        this.entitySprites.set(e, spr);
      } else {
        const frame = e.type === 'gold' ? 'gold' : e.type;
        const spr = this.add.image(e.x * TS + TS / 2, e.y * TS + TS / 2, 'items', frame);
        spr.setDepth(2);
        this.entitySprites.set(e, spr);
        this.tweens.add({ targets: spr, y: spr.y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    });

    // Player sprite
    this.playerSprite = this.add.sprite(
      this.player.x * TS + TS / 2,
      this.player.y * TS + TS / 2,
      'player', 'idle'
    ).setDepth(4).setScale(1);
    this.playerSprite.play('player-idle');
  }

  _setupCamera() {
    const TS = this.TS;
    const W = this.MAP_W * TS, H = this.MAP_H * TS;
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height - 160);
    this.cameras.main.startFollow(this.playerSprite, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);
  }

  _setupInput() {
    // Keyboard
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D', wait: 'SPACE' });

    this.input.keyboard.on('keydown', e => {
      if (this.animating || this.gameOver) return;
      const key = e.key;
      if (key === 'ArrowUp'    || key === 'w' || key === 'W') this._tryMove(0, -1);
      if (key === 'ArrowDown'  || key === 's' || key === 'S') this._tryMove(0,  1);
      if (key === 'ArrowLeft'  || key === 'a' || key === 'A') this._tryMove(-1, 0);
      if (key === 'ArrowRight' || key === 'd' || key === 'D') this._tryMove( 1, 0);
      if (key === ' ' || key === '.') this._wait();
      if (key === 'i' || key === 'I') this._openInventory();
    });

    // Swipe / touch on game area
    this.input.on('pointerdown', p => { this._touchStart = { x: p.x, y: p.y }; });
    this.input.on('pointerup', p => {
      if (!this._touchStart || this.animating || this.gameOver) return;
      const dx = p.x - this._touchStart.x;
      const dy = p.y - this._touchStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 15) { this._wait(); return; }
      if (Math.abs(dx) > Math.abs(dy)) {
        this._tryMove(dx > 0 ? 1 : -1, 0);
      } else {
        this._tryMove(0, dy > 0 ? 1 : -1);
      }
    });
  }

  // ── MOVEMENT / TURN ──────────────────────────────────────────────────

  _tryMove(dx, dy) {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    const tile = this.dungeon.tiles[ny]?.[nx];

    if (tile === undefined || tile === TILE.VOID || tile === TILE.WALL || tile === TILE.BARREL) return;

    // Check for enemy at target
    const enemy = this._enemyAt(nx, ny);
    if (enemy) {
      this._playerAttack(enemy);
      return;
    }

    // Check for item at target
    const item = this._itemAt(nx, ny);

    // Open door
    if (tile === TILE.DOOR) {
      this.dungeon.tiles[ny][nx] = TILE.FLOOR;
      this.tileSprites[ny][nx].setTexture('tiles', 'floor');
      this._addMessage('You kick open the door. *HONK*');
      this._endTurn();
      return;
    }

    // Stairs
    if (tile === TILE.STAIRS) {
      this._descend();
      return;
    }

    // Move player
    this.player.x = nx;
    this.player.y = ny;
    this._animatePlayerMove();

    // Pick up item
    if (item) this._pickupItem(item);

    this._endTurn();
  }

  _wait() {
    this._addMessage('You wait... *squeak*');
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

  // ── PLAYER MOVEMENT ANIMATION ────────────────────────────────────────

  _animatePlayerMove() {
    const TS = this.TS;
    const tx = this.player.x * TS + TS / 2;
    const ty = this.player.y * TS + TS / 2;
    this.animating = true;
    this.playerSprite.play('player-walk');
    this.tweens.add({
      targets: this.playerSprite,
      x: tx, y: ty,
      duration: 100,
      ease: 'Linear',
      onComplete: () => {
        this.animating = false;
        this.playerSprite.play('player-idle');
      }
    });
  }

  // ── COMBAT ───────────────────────────────────────────────────────────

  _playerAttack(enemy) {
    const dmg = Math.max(1, this.player.atk - enemy.def + Math.floor(Math.random() * 3) - 1);
    const crit = Math.random() < 0.1;
    const finalDmg = crit ? dmg * 2 : dmg;
    enemy.hp -= finalDmg;

    const spr = this.entitySprites.get(enemy);
    const TS = this.TS;

    // Attack animation — lunge
    const origX = this.playerSprite.x;
    const origY = this.playerSprite.y;
    const tx = enemy.x * TS + TS / 2;
    const ty = enemy.y * TS + TS / 2;
    const midX = origX + (tx - origX) * 0.5;
    const midY = origY + (ty - origY) * 0.5;

    this.animating = true;
    this.playerSprite.play('player-attack', true);
    this.tweens.add({
      targets: this.playerSprite,
      x: midX, y: midY,
      duration: 60,
      yoyo: true,
      onComplete: () => {
        this.animating = false;
        this.playerSprite.play('player-idle');
      }
    });

    // Hit effect
    if (spr) {
      const fx = this.add.image(tx, ty, 'effects', 'hit').setDepth(10).setAlpha(0.8);
      this.tweens.add({ targets: fx, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 300, onComplete: () => fx.destroy() });
      spr.play(`${enemy.type}-hurt`, true);
      this.time.delayedCall(400, () => {
        if (enemy.hp > 0) spr.play(`${enemy.type}-walk`);
      });
      // Flash red
      this.tweens.add({ targets: spr, tint: 0xff4444, duration: 80, yoyo: true, onComplete: () => spr.clearTint() });
    }

    const critStr = crit ? ' CRITICAL!' : '';
    this._addMessage(`You hit ${enemy.type} for ${finalDmg} dmg!${critStr}`);

    if (enemy.hp <= 0) {
      this._killEnemy(enemy);
    } else {
      this._endTurn();
    }
  }

  _killEnemy(enemy) {
    const spr = this.entitySprites.get(enemy);
    const TS = this.TS;

    // Death effect
    const fx = this.add.image(enemy.x * TS + TS / 2, enemy.y * TS + TS / 2, 'effects', 'death').setDepth(10);
    this.tweens.add({ targets: fx, alpha: 0, scaleX: 2, scaleY: 2, duration: 400, onComplete: () => fx.destroy() });

    if (spr) {
      this.tweens.add({ targets: spr, alpha: 0, y: spr.y + 8, duration: 300, onComplete: () => spr.destroy() });
    }

    this._addMessage(`${enemy.type} is dead! +${enemy.xp} XP`);
    this.entities = this.entities.filter(e => e !== enemy);
    this.entitySprites.delete(enemy);

    // XP + leveling
    this.player.xp += enemy.xp;
    const xpNeeded = this.player.level * 30;
    if (this.player.xp >= xpNeeded) {
      this.player.xp -= xpNeeded;
      this.player.level++;
      this.player.maxHp += 5;
      this.player.hp = Math.min(this.player.hp + 5, this.player.maxHp);
      this.player.baseAtk++;
      const lvFx = this.add.image(this.playerSprite.x, this.playerSprite.y - 12, 'effects', 'levelup').setDepth(12);
      this.tweens.add({ targets: lvFx, y: lvFx.y - 20, alpha: 0, duration: 800, onComplete: () => lvFx.destroy() });
      this._addMessage(`LEVEL UP! Now level ${this.player.level}!`);
    }

    this._endTurn();
  }

  _enemyAttack(enemy) {
    const dmg = Math.max(1, enemy.atk - this.player.def + Math.floor(Math.random() * 3) - 1);
    this.player.hp -= dmg;
    this._addMessage(`${enemy.type} hits you for ${dmg}!`);

    // Player hurt flash
    this.tweens.add({ targets: this.playerSprite, tint: 0xff0000, duration: 100, yoyo: true, onComplete: () => this.playerSprite.clearTint() });
    this.cameras.main.shake(120, 0.006);
  }

  // ── ENEMY TURNS ───────────────────────────────────────────────────────

  _enemyTurns() {
    const visEnemies = this.entities.filter(e => e.kind === 'enemy' && this.fog[e.y]?.[e.x] === 2);
    visEnemies.forEach(enemy => {
      if (enemy.stunned > 0) { enemy.stunned--; return; }
      enemy.ticksSinceMove++;
      if (enemy.ticksSinceMove < enemy.speed) return;
      enemy.ticksSinceMove = 0;

      const dist = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);

      if (dist === 1) {
        this._enemyAttack(enemy);
      } else if (enemy.ranged && dist <= 5) {
        // Ranged attack
        const dmg = Math.max(1, Math.floor(enemy.atk * 0.7) - this.player.def);
        this.player.hp -= dmg;
        this._addMessage(`${enemy.type} throws something! ${dmg} dmg!`);
        this.cameras.main.shake(80, 0.004);
        // Projectile visual
        const TS = this.TS;
        const proj = this.add.circle(enemy.x * TS + TS / 2, enemy.y * TS + TS / 2, 4, 0xff6600).setDepth(8);
        this.tweens.add({
          targets: proj,
          x: this.player.x * TS + TS / 2, y: this.player.y * TS + TS / 2,
          duration: 250,
          onComplete: () => proj.destroy()
        });
      } else {
        this._moveEnemyToward(enemy);
      }

      // Update sprite position
      const spr = this.entitySprites.get(enemy);
      if (spr) {
        const TS = this.TS;
        this.tweens.add({
          targets: spr,
          x: enemy.x * TS + TS / 2, y: enemy.y * TS + TS / 2,
          duration: 120,
          ease: 'Linear'
        });
        spr.setFlipX(enemy.x < this.player.x ? false : (enemy.x > this.player.x ? true : spr.flipX));
      }
    });
  }

  _moveEnemyToward(enemy) {
    // Simple pathfinding: prefer the direction that reduces manhattan distance
    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    const moves = [];
    if (dx !== 0) moves.push({ x: Math.sign(dx), y: 0 });
    if (dy !== 0) moves.push({ x: 0, y: Math.sign(dy) });
    // Try perpendicular if stuck
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
      this._addMessage(`Picked up ${v} gold coins!`);
      return;
    }

    if (data.subtype === 'weapon') {
      const old = this.player.weapon;
      this.player.weapon = item.type;
      this._addMessage(`Equipped ${data.name}! (${data.desc})${old ? ` (replaced ${old})` : ''}`);
    } else if (data.subtype === 'armor') {
      const old = this.player.armor;
      this.player.armor = item.type;
      this._addMessage(`Equipped ${data.name}! (${data.desc})${old ? ` (replaced ${old})` : ''}`);
    } else {
      this.player.inventory.push(item.type);
      this._addMessage(`Picked up ${data.name}.`);
      if (this.player.inventory.length > 8) this.player.inventory.shift(); // cap
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
      this.tweens.add({ targets: fx, y: fx.y - 20, alpha: 0, duration: 600, onComplete: () => fx.destroy() });
      this._addMessage(`Drank Seltzer! Healed ${healed} HP.`);
    } else if (type === 'cream_pie') {
      // Stun nearest visible enemy
      const nearby = this.entities
        .filter(e => e.kind === 'enemy' && this.fog[e.y]?.[e.x] === 2)
        .sort((a, b) => {
          const da = Math.abs(a.x - this.player.x) + Math.abs(a.y - this.player.y);
          const db = Math.abs(b.x - this.player.x) + Math.abs(b.y - this.player.y);
          return da - db;
        });
      if (nearby.length > 0) {
        nearby[0].stunned = 3;
        this._addMessage(`SPLAT! ${nearby[0].type} is stunned for 3 turns!`);
      } else {
        this._addMessage(`No nearby enemy — wasted pie...`);
      }
    } else if (type === 'mystery_box') {
      this._mysteryEffect();
    }

    this._endTurn();
    if (this.uiScene) this.uiScene.refresh();
  }

  _mysteryEffect() {
    const effects = [
      () => { const h = 10 + Math.floor(Math.random() * 15); this.player.hp = Math.min(this.player.maxHp, this.player.hp + h); this._addMessage(`Mystery: Restored ${h} HP!`); },
      () => { this.player.baseAtk += 2; this._addMessage('Mystery: ATK +2 permanently!'); },
      () => { this.player.baseDef += 2; this._addMessage('Mystery: DEF +2 permanently!'); },
      () => { const dmg = 5 + Math.floor(Math.random() * 10); this.player.hp -= dmg; this._addMessage(`Mystery: You take ${dmg} damage from a rogue confetti cannon!`); },
      () => { this.player.gold += 20; this._addMessage('Mystery: 20 gold rains from the ceiling!'); },
      () => { this.entities.filter(e=>e.kind==='enemy').forEach(e => e.stunned = 2); this._addMessage('Mystery: All enemies stunned!'); },
    ];
    effects[Math.floor(Math.random() * effects.length)]();
  }

  // ── FOG OF WAR ───────────────────────────────────────────────────────

  _computeFOV() {
    const px = this.player.x, py = this.player.y;
    const radius = 5;
    const fog = this.fog;

    // Mark previously visible as just-seen (dim)
    for (let y = 0; y < this.MAP_H; y++) {
      for (let x = 0; x < this.MAP_W; x++) {
        if (fog[y][x] === 2) fog[y][x] = 1;
      }
    }

    // Raycast in 360°
    for (let angle = 0; angle < 360; angle += 2) {
      const rad = angle * Math.PI / 180;
      let rx = px + 0.5, ry = py + 0.5;
      const rdx = Math.cos(rad), rdy = Math.sin(rad);
      for (let step = 0; step < radius; step++) {
        const cx = Math.floor(rx), cy = Math.floor(ry);
        if (cx < 0 || cx >= this.MAP_W || cy < 0 || cy >= this.MAP_H) break;
        fog[cy][cx] = 2;
        const t = this.dungeon.tiles[cy][cx];
        if (t === TILE.WALL || t === TILE.DOOR) break;
        rx += rdx * 0.8;
        ry += rdy * 0.8;
      }
    }
    fog[py][px] = 2;
  }

  _refreshTiles() {
    const fog = this.fog;
    const tiles = this.dungeon.tiles;
    for (let ty = 0; ty < this.MAP_H; ty++) {
      for (let tx = 0; tx < this.MAP_W; tx++) {
        const v = fog[ty][tx];
        const tSpr = this.tileSprites[ty][tx];
        const fSpr = this.fogSprites[ty][tx];

        if (v === 0) {
          tSpr.setTexture('tiles', 'void');
          fSpr.setAlpha(1);
        } else {
          tSpr.setTexture('tiles', this._tileFrame(tiles[ty][tx]));
          if (v === 1) {
            fSpr.setAlpha(0.65); // seen-but-dark
          } else {
            fSpr.setAlpha(0);    // fully visible
          }
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
      spr.setAlpha(v === 2 ? 1 : 0.4);
    });
  }

  // ── DESCENT ───────────────────────────────────────────────────────────

  _descend() {
    if (this.floorNum >= 10) {
      this._victory();
      return;
    }
    this._addMessage(`Descending to floor ${this.floorNum + 1}...`);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.restart({
        floor: this.floorNum + 1,
        seed: this.seed + 1337,
        playerData: {
          hp: this.player.hp,
          maxHp: this.player.maxHp,
          baseAtk: this.player.baseAtk,
          baseDef: this.player.baseDef,
          weapon: this.player.weapon,
          armor: this.player.armor,
          inventory: [...this.player.inventory],
          xp: this.player.xp,
          level: this.player.level,
          gold: this.player.gold,
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
        won: true,
        floor: this.floorNum,
        level: this.player.level,
        gold: this.player.gold,
      });
    });
  }

  _checkDeath() {
    if (this.player.hp <= 0 && !this.gameOver) {
      this.player.hp = 0;
      this.gameOver = true;
      this._addMessage('YOU HAVE DIED... *honk*');
      this.playerSprite.setTexture('player', 'dead');
      this.cameras.main.shake(300, 0.02);
      this.time.delayedCall(1200, () => {
        this.scene.stop('UIScene');
        this.cameras.main.fadeOut(600, 80, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameOverScene', {
            won: false,
            floor: this.floorNum,
            level: this.player.level,
            gold: this.player.gold,
          });
        });
      });
    }
  }

  // ── INVENTORY UI (in-game) ────────────────────────────────────────────

  _openInventory() {
    if (this.invOpen) return;
    if (this.player.inventory.length === 0) { this._addMessage('Inventory empty!'); return; }
    this.invOpen = true;
    const W = this.scale.width;

    const overlay = this.add.rectangle(W / 2, 240, W - 40, 300, 0x0d0020, 0.95)
      .setDepth(20).setStrokeStyle(2, 0x880088);
    const title   = this.add.text(W / 2, 105, '— INVENTORY —', {
      fontFamily: 'monospace', fontSize: '15px', color: '#cc88ff',
    }).setOrigin(0.5).setDepth(21);

    const items = [];
    this.player.inventory.forEach((type, i) => {
      const data = ITEM_DATA[type];
      const y = 135 + i * 34;
      const bg = this.add.rectangle(W / 2, y, W - 60, 28, 0x220033, 0.8)
        .setDepth(21).setInteractive({ useHandCursor: true })
        .setStrokeStyle(1, 0x660066);
      const icon = this.add.image(48, y, 'items', type).setDepth(22);
      const lbl  = this.add.text(70, y, `${data.name}  ${data.desc}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#ddaaff',
      }).setOrigin(0, 0.5).setDepth(22);
      const use  = this.add.text(W - 30, y, 'USE', {
        fontFamily: 'monospace', fontSize: '12px', color: '#ff88ff',
      }).setOrigin(1, 0.5).setDepth(22);

      bg.on('pointerdown', () => {
        closeAll(); this._useItem(type);
      });
      bg.on('pointerover',  () => bg.setFillStyle(0x440055, 0.9));
      bg.on('pointerout',   () => bg.setFillStyle(0x220033, 0.8));
      items.push(bg, icon, lbl, use);
    });

    const closeAll = () => {
      this.invOpen = false;
      overlay.destroy(); title.destroy(); closeBtn.destroy();
      items.forEach(i => i.destroy());
    };

    const closeBtn = this.add.text(W / 2, 130 + this.player.inventory.length * 34 + 20, '[ CLOSE ]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#886688',
    }).setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', closeAll);
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
    if (this.messages.length > 5) this.messages.pop();
    if (this.uiScene) this.uiScene.refreshMessages();
  }

  // Called by UIScene D-pad
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
