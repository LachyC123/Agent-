// GameScene — isometric payload escort vs AI bots.
const GRID_W = 20, GRID_H = 14;

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.heroId = (data && data.heroId) || 'zap'; }

  create() {
    Iso.setOrigin(520, 120);
    this.units = [];
    this.bolts = [];
    this.barriers = [];
    this.fx = [];
    this.firing = false;
    this.moveVec = { x: 0, y: 0 };
    this.gameOver = false;
    this.matchTime = 120000; // 2 minutes to escort

    this.buildMap();
    this.spawnPayload();
    this.spawnTeams();

    // depth-sorted dynamic layer handled per-update
    this.barG = this.add.graphics().setDepth(60000); // health bars overlay
    this.aimLine = this.add.graphics().setDepth(59000);

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.05);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.enemySpawnTimer = 0;

    // launch HUD
    this.scene.launch('UI', { heroId: this.heroId });
    this.uiScene = this.scene.get('UI');
  }

  // ---------- MAP ----------
  buildMap() {
    this.grid = [];
    for (let y = 0; y < GRID_H; y++) {
      this.grid[y] = [];
      for (let x = 0; x < GRID_W; x++) {
        const border = x === 0 || y === 0 || x === GRID_W - 1 || y === GRID_H - 1;
        this.grid[y][x] = border ? 1 : 0;
      }
    }
    // cover blocks
    [[6, 4], [6, 5], [13, 9], [13, 10], [9, 3], [10, 11], [4, 10], [15, 4]].forEach(([x, y]) => this.grid[y][x] = 1);

    // payload path waypoints (grid coords, all on floor)
    this.path = [[2, 7], [6, 7], [10, 5], [14, 9], [17, 7]];

    this.tileLayer = this.add.group();
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const onPath = this.path.some(p => Math.abs(p[0] - x) + Math.abs(p[1] - y) <= 1);
        let key = 'tileFloor';
        if (this.grid[y][x] === 1) key = 'wall';
        else if (onPath) key = 'tilePath';
        const s = this.placeIso(key, x, y, this.grid[y][x] === 1 ? 5 : 0);
        if (this.grid[y][x] === 1) s.setOrigin(0.5, 0.78);
      }
    }
    // spawn pads
    this.placeIso('tileAlly', 2, 7, 1);
    this.placeIso('tileEnemy', 17, 7, 1);

    // objective markers along the path
    this.path.forEach(p => this.placeIso('tileObjective', p[0], p[1], 1).setAlpha(0.6));
  }

  placeIso(key, gx, gy, bias) {
    const p = Iso.toScreen(gx, gy);
    const s = this.add.image(p.x, p.y, key).setOrigin(0.5, 0.5);
    s.setDepth((gx + gy) * 10 + (bias || 0));
    return s;
  }

  isWall(gx, gy) {
    const x = Math.round(gx), y = Math.round(gy);
    if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return true;
    return this.grid[y][x] === 1;
  }

  // ---------- PAYLOAD ----------
  spawnPayload() {
    const sp = this.path[0];
    this.payload = {
      gx: sp[0], gy: sp[1], seg: 0, frac: 0, speed: 1.1,
      sprite: this.add.image(0, 0, 'payload').setOrigin(0.5, 0.78),
      progress: 0,
    };
  }

  pathLength() { return this.path.length - 1; }

  updatePayload(dt) {
    const P = this.payload;
    // count contenders near payload
    let allies = 0, enemies = 0;
    this.units.forEach(u => {
      if (!u.alive) return;
      const d = this.dist(u.gx, u.gy, P.gx, P.gy);
      if (d < 2.4) { if (u.team === 'ally') allies++; else enemies++; }
    });
    let moving = false;
    if (allies > 0 && enemies === 0 && P.seg < this.pathLength()) {
      const a = this.path[P.seg], b = this.path[P.seg + 1];
      const segLen = this.dist(a[0], a[1], b[0], b[1]);
      P.frac += (P.speed * dt / 1000) / segLen;
      moving = true;
      if (P.frac >= 1) { P.frac = 0; P.seg++; }
      const aa = this.path[Math.min(P.seg, this.pathLength())];
      const bb = this.path[Math.min(P.seg + 1, this.pathLength())];
      P.gx = aa[0] + (bb[0] - aa[0]) * P.frac;
      P.gy = aa[1] + (bb[1] - aa[1]) * P.frac;
    }
    P.progress = (P.seg + P.frac) / this.pathLength();
    P.contested = allies > 0 && enemies > 0;
    P.moving = moving;

    const sp = Iso.toScreen(P.gx, P.gy);
    P.sprite.setPosition(sp.x, sp.y - 6);
    P.sprite.setDepth((P.gx + P.gy) * 10 + 6);

    if (P.seg >= this.pathLength() && !this.gameOver) this.endMatch(true);
  }

  // ---------- TEAMS ----------
  spawnTeams() {
    const hero = getHero(this.heroId);
    this.player = this.makeUnit({
      team: 'ally', hero, gx: 2.5, gy: 7, isPlayer: true,
    });

    // pick two AI allies from the other heroes
    const others = HEROES.filter(h => h.id !== this.heroId);
    this.makeUnit({ team: 'ally', hero: others[0], gx: 2.5, gy: 6 });
    this.makeUnit({ team: 'ally', hero: others[1], gx: 2.5, gy: 8 });

    // initial enemies
    for (let i = 0; i < 4; i++) this.spawnEnemy();
  }

  makeUnit(o) {
    const hero = o.hero;
    const isBot = !hero;
    const sprite = this.add.image(0, 0, isBot ? (o.variant === 'heavy' ? 'bot_heavy' : 'bot_grunt') : 'hero_' + hero.id)
      .setOrigin(0.5, 0.85).setScale(1.6);
    const stats = isBot ? o.stats : hero.stats;
    const u = {
      team: o.team, hero, isBot, isPlayer: !!o.isPlayer,
      sprite, gx: o.gx, gy: o.gy, face: o.team === 'ally' ? 1 : -1,
      hp: stats.hp, maxHp: stats.hp, speed: stats.speed,
      weapon: isBot ? o.weapon : hero.weapon,
      fireCd: 0, alive: true, cd: {}, ult: 0,
      buffs: {}, variant: o.variant,
      respawn: o.isPlayer ? { gx: 2.5, gy: 7 } : { gx: o.gx, gy: o.gy },
    };
    this.units.push(u);
    return u;
  }

  spawnEnemy() {
    const heavy = Math.random() < 0.35;
    const slot = Math.random() < 0.5 ? 5 : 9;
    this.makeUnit({
      team: 'enemy', hero: null, gx: 17, gy: slot, variant: heavy ? 'heavy' : 'grunt',
      stats: heavy ? { hp: 220, speed: 1.9 } : { hp: 110, speed: 2.6 },
      weapon: heavy
        ? { dmg: 11, rate: 320, range: 5.5, spread: 0.06, proj: 'boltRed', auto: true }
        : { dmg: 7, rate: 240, range: 6, spread: 0.05, proj: 'boltRed', auto: true },
    });
  }

  // ---------- MAIN LOOP ----------
  update(time, dt) {
    if (this.gameOver) return;
    this.matchTime -= dt;
    if (this.matchTime <= 0) { this.endMatch(false); return; }

    this.updatePlayer(dt);
    this.units.forEach(u => { if (!u.isPlayer) this.updateAI(u, dt); });
    this.units.forEach(u => this.updateUnitCommon(u, dt));
    this.updatePayload(dt);
    this.updateBolts(dt);
    this.updateBarriers(dt);

    // keep enemy pressure up
    this.enemySpawnTimer -= dt;
    const aliveEnemies = this.units.filter(u => u.team === 'enemy' && u.alive).length;
    if (this.enemySpawnTimer <= 0 && aliveEnemies < 5) {
      this.spawnEnemy();
      this.enemySpawnTimer = 4000;
    }

    this.drawBars();
  }

  updateUnitCommon(u, dt) {
    // expire buffs
    for (const k in u.buffs) if (u.buffs[k] <= time_now()) delete u.buffs[k];
    // position + depth + facing
    const sp = Iso.toScreen(u.gx, u.gy);
    u.sprite.setPosition(sp.x, sp.y);
    u.sprite.setDepth((u.gx + u.gy) * 10 + 6);
    u.sprite.setFlipX(u.face < 0);
    u.sprite.setVisible(u.alive);
    // ult tint for player rampage / invuln
    if (u.buffs.rampage) u.sprite.setTint(0xff66ff);
    else if (u.buffs.invuln) u.sprite.setTint(0xffe066);
    else u.sprite.clearTint();
  }

  effSpeed(u) {
    let s = u.speed;
    if (u.buffs.haste) s *= 1.5;
    return s;
  }

  // ---------- PLAYER ----------
  updatePlayer(dt) {
    const u = this.player;
    if (!u.alive) return;
    const mv = this.moveVec;
    const mag = Math.hypot(mv.x, mv.y);
    if (mag > 0.12) {
      const nx = mv.x / mag, ny = mv.y / mag;
      this.moveUnit(u, nx, ny, dt);
      u.face = nx < -0.05 ? -1 : (nx > 0.05 ? 1 : u.face);
      u.moveDir = { x: nx, y: ny };
    }
    // firing
    u.fireCd -= dt;
    if (this.firing && u.fireCd <= 0) this.fireWeapon(u);
  }

  // ---------- AI ----------
  updateAI(u, dt) {
    if (!u.alive) return;
    u.fireCd -= dt;
    const target = this.nearestEnemy(u);
    let goalX, goalY;

    if (u.team === 'ally') {
      // escort: head to the payload, fight along the way
      goalX = this.payload.gx; goalY = this.payload.gy;
    } else {
      // enemies: contest payload, prefer attacking a nearby ally
      goalX = this.payload.gx; goalY = this.payload.gy;
      if (target && this.dist(u.gx, u.gy, target.gx, target.gy) < 4) { goalX = target.gx; goalY = target.gy; }
    }

    const distGoal = this.dist(u.gx, u.gy, goalX, goalY);
    const desired = u.team === 'ally' ? 1.6 : 1.4;
    if (distGoal > desired) {
      let dx = goalX - u.gx, dy = goalY - u.gy;
      const m = Math.hypot(dx, dy) || 1;
      dx /= m; dy /= m;
      this.moveUnit(u, dx, dy, dt);
      u.face = dx < 0 ? -1 : 1;
    }

    // fire at target in range
    if (target) {
      const d = this.dist(u.gx, u.gy, target.gx, target.gy);
      if (d <= u.weapon.range && u.fireCd <= 0) {
        u.face = target.gx < u.gx ? -1 : 1;
        this.fireWeapon(u, target);
      }
    }
    // support bot allies: handled via fireWeapon heal logic
  }

  moveUnit(u, nx, ny, dt) {
    const step = this.effSpeed(u) * dt / 1000;
    const tx = u.gx + nx * step;
    const ty = u.gy + ny * step;
    if (!this.isWall(tx, u.gy)) u.gx = tx;
    if (!this.isWall(u.gx, ty)) u.gy = ty;
    u.gx = Phaser.Math.Clamp(u.gx, 0.6, GRID_W - 1.6);
    u.gy = Phaser.Math.Clamp(u.gy, 0.6, GRID_H - 1.6);
  }

  // ---------- COMBAT ----------
  nearestEnemy(u) {
    let best = null, bd = 1e9;
    this.units.forEach(o => {
      if (!o.alive || o.team === u.team) return;
      const d = this.dist(u.gx, u.gy, o.gx, o.gy);
      if (d < bd) { bd = d; best = o; }
    });
    return best;
  }
  nearestHurtAlly(u, range) {
    let best = null, bd = 1e9;
    this.units.forEach(o => {
      if (!o.alive || o.team !== u.team || o === u) return;
      if (o.hp >= o.maxHp) return;
      const d = this.dist(u.gx, u.gy, o.gx, o.gy);
      if (d < bd && d <= range) { bd = d; best = o; }
    });
    return best;
  }

  fireWeapon(u, forcedTarget) {
    const w = u.weapon;
    // BLOOM-style support: heal a hurt ally if one is in range, else shoot enemy
    if (w.heal) {
      const ally = this.nearestHurtAlly(u, w.range);
      if (ally) {
        this.spawnBolt(u, ally, { heal: w.heal, proj: 'orbHeal', team: u.team });
        u.fireCd = w.rate;
        if (u.isPlayer) this.gainUlt(u, 6);
        return;
      }
    }
    let target = forcedTarget;
    if (!target) target = this.nearestEnemyInRange(u, w.range);
    let aim;
    if (target) aim = this.aimAt(u, target);
    else if (u.isPlayer && u.moveDir) aim = u.moveDir;
    else aim = { x: u.face, y: 0 };

    const pellets = w.pellets || 1;
    const dmgMul = u.buffs.rampage ? 3 : 1;
    for (let i = 0; i < pellets; i++) {
      const spread = (Math.random() - 0.5) * 2 * (w.spread || 0) + (pellets > 1 ? (i - (pellets - 1) / 2) * 0.12 : 0);
      const a = Math.atan2(aim.y, aim.x) + spread;
      this.spawnBolt(u, null, {
        dmg: w.dmg * dmgMul, proj: w.proj, team: u.team,
        vx: Math.cos(a), vy: Math.sin(a), range: w.range,
      });
    }
    u.fireCd = w.rate * (u.buffs.rampage ? 0.5 : 1);
    this.muzzle(u, aim);
  }

  nearestEnemyInRange(u, range) {
    let best = null, bd = range;
    this.units.forEach(o => {
      if (!o.alive || o.team === u.team) return;
      const d = this.dist(u.gx, u.gy, o.gx, o.gy);
      if (d <= bd) { bd = d; best = o; }
    });
    return best;
  }

  aimAt(u, t) {
    let dx = t.gx - u.gx, dy = t.gy - u.gy;
    const m = Math.hypot(dx, dy) || 1;
    return { x: dx / m, y: dy / m };
  }

  spawnBolt(u, lockTarget, o) {
    const sp = Iso.toScreen(u.gx, u.gy);
    const img = this.add.image(sp.x, sp.y - 16, o.proj).setScale(1.5).setDepth(58000);
    const b = {
      sprite: img, gx: u.gx, gy: u.gy, team: o.team,
      dmg: o.dmg || 0, heal: o.heal || 0, range: o.range || 7,
      traveled: 0, owner: u, lockTarget,
      vx: o.vx || 0, vy: o.vy || 0, speed: o.heal ? 9 : 13,
    };
    if (o.vx !== undefined) img.setRotation(Math.atan2(o.vy, o.vx));
    this.bolts.push(b);
  }

  updateBolts(dt) {
    const t = dt / 1000;
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      let nx, ny;
      if (b.lockTarget) {
        if (!b.lockTarget.alive) { this.killBolt(i); continue; }
        const aim = this.aimAt(b, b.lockTarget);
        nx = aim.x; ny = aim.y;
      } else { nx = b.vx; ny = b.vy; }
      const step = b.speed * t;
      b.gx += nx * step; b.gy += ny * step; b.traveled += step;

      // wall / out of range
      if (this.isWall(b.gx, b.gy) || b.traveled > b.range + 1) { this.killBolt(i); continue; }

      // barrier block (enemy bolts only)
      if (b.team === 'enemy' && this.blockedByBarrier(b)) { this.hitSpark(b.gx, b.gy, 'sparkOrange'); this.killBolt(i); continue; }

      // collisions
      let hit = false;
      for (const o of this.units) {
        if (!o.alive) continue;
        if (b.heal) {
          if (o === b.lockTarget) {
            this.heal(o, b.heal); this.hitSpark(b.gx, b.gy, 'sparkLime');
            if (b.owner.isPlayer) this.gainUlt(b.owner, 4);
            hit = true; break;
          }
        } else if (o.team !== b.team) {
          if (this.dist(b.gx, b.gy, o.gx, o.gy) < 0.7) {
            this.damage(o, b.dmg, b.owner);
            this.hitSpark(b.gx, b.gy, o.team === 'enemy' ? 'sparkRed' : 'sparkCyan');
            hit = true; break;
          }
        }
      }
      if (hit) { this.killBolt(i); continue; }

      const sp = Iso.toScreen(b.gx, b.gy);
      b.sprite.setPosition(sp.x, sp.y - 16);
    }
  }

  killBolt(i) { this.bolts[i].sprite.destroy(); this.bolts.splice(i, 1); }

  damage(u, amount, from) {
    if (u.buffs.invuln) return;
    u.hp -= amount;
    if (from && from.isPlayer) this.gainUlt(from, amount * 0.5);
    if (u.hp <= 0) this.kill(u, from);
  }

  heal(u, amount) { u.hp = Math.min(u.maxHp, u.hp + amount); }

  kill(u, from) {
    u.hp = 0; u.alive = false;
    this.boom(u.gx, u.gy, u.team === 'enemy' ? 'sparkRed' : 'sparkCyan');
    if (from && from.isPlayer) this.gainUlt(from, 18);

    if (u.team === 'enemy') {
      // remove after delay; new enemies spawn from the spawn timer
      this.time.delayedCall(400, () => {
        const idx = this.units.indexOf(u);
        if (idx >= 0) { u.sprite.destroy(); this.units.splice(idx, 1); }
      });
    } else {
      // ally / player respawn
      const delay = u.isPlayer ? 3000 : 4500;
      this.time.delayedCall(delay, () => {
        u.hp = u.maxHp; u.alive = true;
        u.gx = u.respawn.gx; u.gy = u.respawn.gy;
        for (const k in u.buffs) delete u.buffs[k];
      });
    }
  }

  gainUlt(u, amount) {
    if (!u.isPlayer) return;
    u.ult = Math.min(100, u.ult + amount * 0.6);
  }

  // ---------- ABILITIES ----------
  useAbility(index) {
    const u = this.player;
    if (!u.alive) return;
    const ab = u.hero.abilities[index];
    if (!ab) return;
    const now = time_now();
    if ((u.cd[ab.key] || 0) > now) return; // on cooldown
    u.cd[ab.key] = now + ab.cd;
    this.castAbility(u, ab.key);
  }

  cooldownFrac(index) {
    const u = this.player;
    const ab = u.hero.abilities[index];
    const left = (u.cd[ab.key] || 0) - time_now();
    return Phaser.Math.Clamp(left / ab.cd, 0, 1);
  }

  useUlt() {
    const u = this.player;
    if (!u.alive || u.ult < 100) return;
    u.ult = 0;
    this.castUlt(u);
  }

  castAbility(u, key) {
    const dir = u.moveDir || { x: u.face, y: 0 };
    switch (key) {
      case 'dash': {
        const d = 3.2;
        let tx = u.gx + dir.x * d, ty = u.gy + dir.y * d;
        if (this.isWall(tx, ty)) { tx = u.gx + dir.x * 1.5; ty = u.gy + dir.y * 1.5; }
        if (!this.isWall(tx, ty)) { u.gx = Phaser.Math.Clamp(tx, 0.6, GRID_W - 1.6); u.gy = Phaser.Math.Clamp(ty, 0.6, GRID_H - 1.6); }
        this.ringFx(u.gx, u.gy, PAL.cyan);
        break;
      }
      case 'burst': {
        this.ringFx(u.gx, u.gy, PAL.cyan, 3);
        this.units.forEach(o => {
          if (o.team !== u.team && o.alive && this.dist(u.gx, u.gy, o.gx, o.gy) < 3) {
            this.damage(o, 55, u);
            this.knockback(o, u, 1.5);
          }
        });
        break;
      }
      case 'shield': {
        const p = Iso.toScreen(u.gx + dir.x, u.gy + dir.y);
        const spr = this.add.image(p.x, p.y - 10, 'barrierOrange').setScale(1.8).setDepth(57000);
        this.barriers.push({ gx: u.gx + dir.x * 1.2, gy: u.gy + dir.y * 1.2, life: 5000, sprite: spr });
        break;
      }
      case 'slam': {
        this.ringFx(u.gx, u.gy, PAL.orange, 2.6);
        this.cameras.main.shake(150, 0.006);
        this.units.forEach(o => {
          if (o.team !== u.team && o.alive && this.dist(u.gx, u.gy, o.gx, o.gy) < 2.6) {
            this.damage(o, 30, u);
            this.knockback(o, u, 2.2);
          }
        });
        break;
      }
      case 'heal': {
        const ally = this.nearestHurtAlly(u, 8) || this.lowestAlly(u);
        if (ally) {
          u.buffs.mend = time_now() + 2500;
          u.mendTarget = ally;
          this.channelHeal(u, ally, 2500, 18);
        }
        break;
      }
      case 'nova': {
        this.ringFx(u.gx, u.gy, PAL.lime, 3);
        this.units.forEach(o => {
          if (o.team === u.team && o.alive && this.dist(u.gx, u.gy, o.gx, o.gy) < 3) {
            this.heal(o, 70);
            o.buffs.haste = time_now() + 3000;
          }
        });
        break;
      }
    }
  }

  castUlt(u) {
    const id = u.hero.id;
    this.bigText(u.hero.ult.name + '!', u.hero.color);
    if (id === 'zap') {
      u.buffs.rampage = time_now() + 5000;
    } else if (id === 'brick') {
      u.buffs.invuln = time_now() + 4000;
      // pull enemy attention: nearby enemies briefly knocked
      this.ringFx(u.gx, u.gy, PAL.orange, 3.5);
    } else if (id === 'bloom') {
      // area heal over time
      this.ultHeal = { gx: u.gx, gy: u.gy, life: 5000, owner: u };
      const tick = this.time.addEvent({
        delay: 250, repeat: 19, callback: () => {
          this.units.forEach(o => {
            if (o.team === u.team && o.alive && this.dist(u.gx, u.gy, o.gx, o.gy) < 4) this.heal(o, 14);
          });
          this.ringFx(u.gx, u.gy, PAL.lime, 4);
        },
      });
    }
  }

  channelHeal(u, ally, dur, perTick) {
    const ev = this.time.addEvent({
      delay: 250, repeat: Math.floor(dur / 250) - 1, callback: () => {
        if (!ally.alive || !u.alive) { ev.remove(); return; }
        this.heal(ally, perTick);
        this.hitSpark(ally.gx, ally.gy - 0.2, 'sparkLime');
        this.gainUlt(u, 3);
      },
    });
  }

  lowestAlly(u) {
    let best = null, bf = 1.01;
    this.units.forEach(o => {
      if (o.team === u.team && o.alive) { const f = o.hp / o.maxHp; if (f < bf) { bf = f; best = o; } }
    });
    return best;
  }

  knockback(o, from, force) {
    let dx = o.gx - from.gx, dy = o.gy - from.gy;
    const m = Math.hypot(dx, dy) || 1;
    const tx = o.gx + dx / m * force, ty = o.gy + dy / m * force;
    if (!this.isWall(tx, ty)) { o.gx = Phaser.Math.Clamp(tx, 0.6, GRID_W - 1.6); o.gy = Phaser.Math.Clamp(ty, 0.6, GRID_H - 1.6); }
  }

  // ---------- BARRIERS ----------
  updateBarriers(dt) {
    for (let i = this.barriers.length - 1; i >= 0; i--) {
      const b = this.barriers[i];
      b.life -= dt;
      b.sprite.setAlpha(0.5 + 0.3 * Math.sin(time_now() / 100));
      if (b.life <= 0) { b.sprite.destroy(); this.barriers.splice(i, 1); }
    }
  }
  blockedByBarrier(bolt) {
    return this.barriers.some(b => this.dist(bolt.gx, bolt.gy, b.gx, b.gy) < 1.4);
  }

  // ---------- FX ----------
  muzzle(u, aim) {
    const sp = Iso.toScreen(u.gx, u.gy);
    const f = this.add.image(sp.x + aim.x * 14, sp.y - 14 + aim.y * 8, 'sparkWhite').setScale(2).setDepth(58500);
    this.tweens.add({ targets: f, alpha: 0, scale: 0.5, duration: 120, onComplete: () => f.destroy() });
  }
  hitSpark(gx, gy, key) {
    const sp = Iso.toScreen(gx, gy);
    const s = this.add.image(sp.x, sp.y - 14, key).setScale(2.2).setDepth(58800);
    this.tweens.add({ targets: s, alpha: 0, scale: 0.6, angle: 90, duration: 220, onComplete: () => s.destroy() });
  }
  boom(gx, gy, key) {
    const sp = Iso.toScreen(gx, gy);
    for (let i = 0; i < 8; i++) {
      const s = this.add.image(sp.x, sp.y - 14, key).setScale(2.5).setDepth(58900);
      const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 24;
      this.tweens.add({ targets: s, x: sp.x + Math.cos(a) * d, y: sp.y - 14 + Math.sin(a) * d, alpha: 0, scale: 0.4, duration: 400, onComplete: () => s.destroy() });
    }
  }
  ringFx(gx, gy, color, radius = 1.5) {
    const sp = Iso.toScreen(gx, gy);
    const g = this.add.graphics().setDepth(58950);
    const col = Phaser.Display.Color.HexStringToColor(color).color;
    let r = 4;
    const max = radius * 40;
    const ev = this.time.addEvent({
      delay: 16, repeat: 18, callback: () => {
        g.clear();
        g.lineStyle(3, col, 1 - r / max);
        g.strokeEllipse(sp.x, sp.y - 10, r * 2, r);
        r += (max - 4) / 18;
        if (r >= max) { g.destroy(); }
      },
    });
  }
  bigText(str, color) {
    const t = UIKit.text(this, this.cameras.main.centerX, 220, str, 40, color, { stroke: PAL.ink, strokeW: 8 });
    t.setScrollFactor(0).setDepth(70000).setScale(0.5);
    this.tweens.add({ targets: t, scale: 1.1, duration: 250, yoyo: true, hold: 600, onComplete: () => t.destroy() });
  }

  // ---------- HEALTH BARS ----------
  drawBars() {
    const g = this.barG;
    g.clear();
    this.units.forEach(u => {
      if (!u.alive) return;
      const sp = Iso.toScreen(u.gx, u.gy);
      const w = 28, x = sp.x - w / 2, y = sp.y - (u.isPlayer ? 56 : 48);
      g.fillStyle(0x000000, 0.7); g.fillRect(x - 1, y - 1, w + 2, 6);
      const frac = Phaser.Math.Clamp(u.hp / u.maxHp, 0, 1);
      let col = u.team === 'ally' ? 0x3df2ff : 0xff3d5e;
      if (u.isPlayer) col = 0x7dff5c;
      g.fillStyle(col, 1); g.fillRect(x, y, w * frac, 4);
      if (u.buffs.invuln) { g.lineStyle(1, 0xffd23d, 1); g.strokeRect(x - 1, y - 1, w + 2, 6); }
    });
    // payload progress marker handled by UI scene
  }

  dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

  endMatch(win) {
    this.gameOver = true;
    this.scene.stop('UI');
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => {
      this.scene.stop('Game');
      this.scene.start('Result', { win, heroId: this.heroId, progress: this.payload.progress });
    });
  }
}

// global "now" helper (Phaser time)
function time_now() { return performance.now(); }
