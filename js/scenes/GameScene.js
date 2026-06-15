// GameScene — isometric payload escort, Overwatch-style enemy team with respawn,
// directional sprites, and fluid walk-cycle animation.
const GRID_W = 20, GRID_H = 14;

// Fixed enemy team composition (respawn instead of waves)
const ENEMY_TEAM_DEF = [
  { id: 'e0', name: 'RAIDER', variant: 'grunt', gx: 17, gy: 5, role: 'contester',
    stats: { hp: 150, speed: 2.6 },
    weapon: { dmg: 9, rate: 220, range: 6, spread: 0.05, proj: 'boltRed', auto: true } },
  { id: 'e1', name: 'BRUTE', variant: 'heavy', gx: 17, gy: 7, role: 'hunter',
    stats: { hp: 350, speed: 1.9 },
    weapon: { dmg: 14, rate: 340, range: 5.5, spread: 0.06, proj: 'boltRed', auto: true } },
  { id: 'e2', name: 'STALKER', variant: 'grunt', gx: 17, gy: 9, role: 'flanker',
    stats: { hp: 130, speed: 2.9 },
    weapon: { dmg: 8, rate: 200, range: 6.5, spread: 0.04, proj: 'boltRed', auto: true } },
];

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.heroId = (data && data.heroId) || 'zap'; }

  create() {
    Iso.setOrigin(520, 120);
    this.units = [];
    this.bolts = [];
    this.barriers = [];
    this.gameOver = false;
    this.matchTime = 120000;
    this.firing = false;
    this.moveVec = { x: 0, y: 0 };

    this.freezeT = 0; // hit-stop timer (ms)

    this.buildMap();
    this.setupParticles();
    this.spawnPayload();
    this.spawnTeams();

    this.barG = this.add.graphics().setDepth(60000);

    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.05);
    this.cameras.main.fadeIn(300, 0, 0, 0);

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
    [[6,4],[6,5],[13,9],[13,10],[9,3],[10,11],[4,10],[15,4],[8,6],[11,7]].forEach(([x,y]) => this.grid[y][x] = 1);

    this.path = [[2,7],[6,7],[10,5],[14,9],[17,7]];

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const onPath = this.path.some(p => Math.abs(p[0]-x)+Math.abs(p[1]-y) <= 1);
        const isWall = this.grid[y][x] === 1;
        let key = isWall ? 'wall' : onPath ? 'tilePath' : 'tileFloor';
        const s = this.placeIso(key, x, y, isWall ? 5 : 0);
        if (isWall) s.setOrigin(0.5, 0.78);
      }
    }
    this.placeIso('tileAlly',  2,  7, 1);
    this.placeIso('tileEnemy', 17, 7, 1);
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

  // ---------- PARTICLES ----------
  setupParticles() {
    this.emit = {};
    [['cyan', 'sparkCyan'], ['red', 'sparkRed'], ['lime', 'sparkLime'],
     ['orange', 'sparkOrange'], ['white', 'sparkWhite']].forEach(([name, key]) => {
      this.emit[name] = this.add.particles(0, 0, key, {
        speed: { min: 40, max: 150 },
        lifespan: { min: 200, max: 480 },
        scale: { start: 2.2, end: 0 },
        alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 360 },
        blendMode: 'ADD',
        emitting: false,
      }).setDepth(58850);
    });
  }

  burst(name, gx, gy, count = 6) {
    const e = this.emit[name];
    if (!e) return;
    const sp = Iso.toScreen(gx, gy);
    e.explode(count, sp.x, sp.y - 14);
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

  updatePayload(dt) {
    const P = this.payload;
    let allies = 0, enemies = 0;
    this.units.forEach(u => {
      if (!u.alive) return;
      if (this.dist(u.gx, u.gy, P.gx, P.gy) < 2.4) {
        if (u.team === 'ally') allies++; else enemies++;
      }
    });

    P.contested = allies > 0 && enemies > 0;
    P.moving = allies > 0 && enemies === 0 && P.seg < this.pathLength();

    if (P.moving) {
      const a = this.path[P.seg], b = this.path[P.seg + 1];
      const segLen = this.dist(a[0], a[1], b[0], b[1]);
      P.frac += (P.speed * dt / 1000) / segLen;
      if (P.frac >= 1) { P.frac = 0; P.seg++; }
      const aa = this.path[Math.min(P.seg, this.pathLength())];
      const bb = this.path[Math.min(P.seg + 1, this.pathLength())];
      P.gx = aa[0] + (bb[0] - aa[0]) * P.frac;
      P.gy = aa[1] + (bb[1] - aa[1]) * P.frac;
    }

    P.progress = (P.seg + P.frac) / this.pathLength();
    const sp = Iso.toScreen(P.gx, P.gy);
    P.sprite.setPosition(sp.x, sp.y - 6);
    P.sprite.setDepth((P.gx + P.gy) * 10 + 6);

    if (P.seg >= this.pathLength() && !this.gameOver) this.endMatch(true);
  }

  pathLength() { return this.path.length - 1; }

  // ---------- TEAMS ----------
  spawnTeams() {
    const hero = getHero(this.heroId);
    this.player = this.spawnHero(hero, 2.5, 7, true);

    const others = HEROES.filter(h => h.id !== this.heroId);
    this.spawnHero(others[0], 2.5, 6, false);
    this.spawnHero(others[1], 2.5, 8, false);

    // Overwatch-style enemy team — fixed roster, each will respawn
    ENEMY_TEAM_DEF.forEach(def => this.spawnEnemyBot(def));
  }

  spawnHero(hero, gx, gy, isPlayer) {
    const spr = this.add.sprite(0, 0, 'hero_' + hero.id + '_side', 4)
      .setOrigin(0.5, 0.85).setScale(1.6);
    const u = {
      team: 'ally', hero, isPlayer, isBot: false,
      sprite: spr, gx, gy, vel: { x: 0, y: 0 },
      animDir: 'side', flip: false,
      hp: hero.stats.hp, maxHp: hero.stats.hp,
      speed: hero.stats.speed, weapon: hero.weapon,
      fireCd: 0, alive: true, cd: {}, ult: 0, buffs: {},
      respawn: { gx, gy },
    };
    u.sprite.play(hero.id + '_side_idle');
    this.units.push(u);
    return u;
  }

  spawnEnemyBot(def) {
    const heavy = def.variant === 'heavy';
    const spr = this.add.sprite(0, 0, (heavy ? 'bot_heavy' : 'bot_grunt') + '_side', 4)
      .setOrigin(0.5, 0.85).setScale(1.6);
    const u = {
      team: 'enemy', hero: null, isPlayer: false, isBot: true,
      sprite: spr, gx: def.gx, gy: def.gy, vel: { x: 0, y: 0 },
      animDir: 'side', flip: false,
      hp: def.stats.hp, maxHp: def.stats.hp,
      speed: def.stats.speed, weapon: def.weapon,
      fireCd: 0, alive: true, cd: {}, ult: 0, buffs: {},
      respawn: { gx: def.gx, gy: def.gy },
      variant: def.variant, botKey: heavy ? 'bot_heavy' : 'bot_grunt',
      aiRole: def.role, dispName: def.name,
    };
    u.sprite.play((heavy ? 'bot_heavy' : 'bot_grunt') + '_side_idle');
    this.units.push(u);
    return u;
  }

  // ---------- MAIN LOOP ----------
  update(time, dt) {
    if (this.gameOver) return;
    // Hit-stop: hold the simulation for a few frames on heavy impacts for punch.
    if (this.freezeT > 0) { this.freezeT -= dt; this.drawBars(); return; }
    this.matchTime -= dt;
    if (this.matchTime <= 0) { this.endMatch(false); return; }

    this.units.forEach(u => { u.vel = { x: 0, y: 0 }; });

    this.updatePlayer(dt);
    this.units.forEach(u => { if (!u.isPlayer) this.updateAI(u, dt); });
    this.units.forEach(u => this.updateUnitCommon(u));
    this.updatePayload(dt);
    this.updateBolts(dt);
    this.updateBarriers(dt);
    this.drawBars();
  }

  // ---------- DIRECTIONAL ANIMATION ----------
  // Convert grid-space velocity to screen-space to determine direction.
  // Back view when moving mostly up on screen (away from camera).
  _animForUnit(u) {
    const { x: vx, y: vy } = u.vel;
    const moving = Math.hypot(vx, vy) > 0.0008;
    let dir = u.animDir, flip = u.flip;

    if (moving) {
      const sdx = vx - vy; // screen-space x component
      const sdy = vx + vy; // screen-space y component
      if (Math.abs(sdy) > Math.abs(sdx) * 1.2 && sdy < 0) {
        // Moving away from camera → back sprite
        dir = 'back'; flip = false;
      } else {
        dir = 'side'; flip = sdx < 0;
      }
    }

    const prefix = u.isBot ? u.botKey : 'hero_' + u.hero.id;
    const state = moving ? 'walk' : 'idle';
    return { animKey: `${prefix}_${dir}_${state}`, dir, flip, moving };
  }

  updateUnitCommon(u) {
    if (!u.alive) { u.sprite.setVisible(false); return; }
    u.sprite.setVisible(true);

    const { animKey, dir, flip } = this._animForUnit(u);
    u.animDir = dir; u.flip = flip;

    if (!u.sprite.anims.isPlaying || u.sprite.anims.currentAnim?.key !== animKey) {
      u.sprite.play(animKey, true);
    }
    u.sprite.setFlipX(flip);

    const sp = Iso.toScreen(u.gx, u.gy);
    u.sprite.setPosition(sp.x, sp.y);
    u.sprite.setDepth((u.gx + u.gy) * 10 + 6);

    // Buff tints
    if (u.buffs.rampage) u.sprite.setTint(0xff66ff);
    else if (u.buffs.invuln) u.sprite.setTint(0xffe066);
    else u.sprite.clearTint();

    // Expire buffs
    const now = performance.now();
    for (const k in u.buffs) if (u.buffs[k] <= now) delete u.buffs[k];
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
    }
    u.fireCd -= dt;
    if (this.firing && u.fireCd <= 0) this.fireWeapon(u);
  }

  // ---------- AI ----------
  updateAI(u, dt) {
    if (!u.alive) return;
    u.fireCd -= dt;

    let goalX, goalY;
    const target = this.nearestEnemy(u);

    if (u.team === 'ally') {
      goalX = this.payload.gx; goalY = this.payload.gy;
    } else {
      // Enemy team AI based on role
      switch (u.aiRole) {
        case 'contester':
          // Always contest payload
          goalX = this.payload.gx; goalY = this.payload.gy;
          break;
        case 'hunter':
          // Chase the player specifically
          const player = this.player;
          if (player.alive) { goalX = player.gx; goalY = player.gy; }
          else { goalX = this.payload.gx; goalY = this.payload.gy; }
          break;
        case 'flanker':
          // Hunt the weakest ally
          const weak = this.weakestAlly();
          if (weak) { goalX = weak.gx; goalY = weak.gy; }
          else { goalX = this.payload.gx; goalY = this.payload.gy; }
          break;
        default:
          goalX = this.payload.gx; goalY = this.payload.gy;
      }
    }

    const distGoal = this.dist(u.gx, u.gy, goalX, goalY);
    // Close enough to engage? Stop and fight; otherwise move
    const engageRange = u.team === 'ally' ? 2.0 : (u.weapon.range * 0.6);
    if (distGoal > engageRange) {
      let dx = goalX - u.gx, dy = goalY - u.gy;
      const m = Math.hypot(dx, dy) || 1;
      this.moveUnit(u, dx / m, dy / m, dt);
    }

    if (target && this.dist(u.gx, u.gy, target.gx, target.gy) <= u.weapon.range && u.fireCd <= 0) {
      this.fireWeapon(u, target);
    }
  }

  moveUnit(u, nx, ny, dt) {
    const step = this.effSpeed(u) * dt / 1000;
    const prevGx = u.gx, prevGy = u.gy;
    const tx = u.gx + nx * step, ty = u.gy + ny * step;
    if (!this.isWall(tx, u.gy)) u.gx = tx;
    if (!this.isWall(u.gx, ty)) u.gy = ty;
    u.gx = Phaser.Math.Clamp(u.gx, 0.6, GRID_W - 1.6);
    u.gy = Phaser.Math.Clamp(u.gy, 0.6, GRID_H - 1.6);
    // Actual displacement becomes velocity for directional sprite logic
    u.vel = { x: u.gx - prevGx, y: u.gy - prevGy };
  }

  effSpeed(u) {
    return u.speed * (u.buffs.haste ? 1.5 : 1);
  }

  weakestAlly() {
    let best = null, bf = 1.1;
    this.units.forEach(o => {
      if (o.team === 'ally' && o.alive) {
        const f = o.hp / o.maxHp;
        if (f < bf) { bf = f; best = o; }
      }
    });
    return best;
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

  nearestEnemyInRange(u, range) {
    let best = null, bd = range;
    this.units.forEach(o => {
      if (!o.alive || o.team === u.team) return;
      const d = this.dist(u.gx, u.gy, o.gx, o.gy);
      if (d <= bd) { bd = d; best = o; }
    });
    return best;
  }

  nearestHurtAlly(u, range) {
    let best = null, bd = 1e9;
    this.units.forEach(o => {
      if (!o.alive || o.team !== u.team || o === u || o.hp >= o.maxHp) return;
      const d = this.dist(u.gx, u.gy, o.gx, o.gy);
      if (d < bd && d <= range) { bd = d; best = o; }
    });
    return best;
  }

  aimAt(u, t) {
    const dx = t.gx - u.gx, dy = t.gy - u.gy;
    const m = Math.hypot(dx, dy) || 1;
    return { x: dx / m, y: dy / m };
  }

  fireWeapon(u, forcedTarget) {
    const w = u.weapon;
    if (w.heal) {
      const ally = this.nearestHurtAlly(u, w.range);
      if (ally) {
        this.spawnBolt(u, ally, { heal: w.heal, proj: 'orbHeal', team: u.team });
        u.fireCd = w.rate;
        if (u.isPlayer) { this.gainUlt(u, 6); Sfx.heal(); }
        return;
      }
    }
    let target = forcedTarget || this.nearestEnemyInRange(u, w.weapon ? w.weapon.range : w.range);
    if (!target) target = this.nearestEnemy(u);
    let aim;
    if (target) aim = this.aimAt(u, target);
    else aim = { x: u.flip || u.vel.x < 0 ? -1 : 1, y: 0 };

    const pellets = w.pellets || 1;
    const dmgMul = u.buffs.rampage ? 3 : 1;
    for (let i = 0; i < pellets; i++) {
      const spread = (Math.random() - 0.5) * 2 * (w.spread || 0) +
        (pellets > 1 ? (i - (pellets - 1) / 2) * 0.12 : 0);
      const a = Math.atan2(aim.y, aim.x) + spread;
      this.spawnBolt(u, null, {
        dmg: w.dmg * dmgMul, proj: w.proj, team: u.team,
        vx: Math.cos(a), vy: Math.sin(a), range: w.range,
      });
    }
    u.fireCd = w.rate * (u.buffs.rampage ? 0.5 : 1);
    this.muzzle(u, aim);
    if (u.isPlayer) {
      const pitch = u.hero.id === 'brick' ? 0.6 : (u.hero.id === 'bloom' ? 1.2 : 1);
      Sfx.shot(pitch);
    }
  }

  spawnBolt(u, lockTarget, o) {
    const sp = Iso.toScreen(u.gx, u.gy);
    const img = this.add.image(sp.x, sp.y - 16, o.proj).setScale(1.5).setDepth(58000);
    if (o.vx !== undefined) img.setRotation(Math.atan2(o.vy, o.vx));
    this.bolts.push({
      sprite: img, gx: u.gx, gy: u.gy, team: o.team,
      dmg: o.dmg || 0, heal: o.heal || 0, range: o.range || 7,
      traveled: 0, owner: u, lockTarget,
      vx: o.vx || 0, vy: o.vy || 0, speed: o.heal ? 9 : 13,
    });
  }

  updateBolts(dt) {
    const t = dt / 1000;
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      let nx = b.vx, ny = b.vy;
      if (b.lockTarget) {
        if (!b.lockTarget.alive) { this._killBolt(i); continue; }
        const a = this.aimAt(b, b.lockTarget); nx = a.x; ny = a.y;
      }
      const step = b.speed * t;
      b.gx += nx * step; b.gy += ny * step; b.traveled += step;

      if (this.isWall(b.gx, b.gy) || b.traveled > b.range + 1) { this._killBolt(i); continue; }
      if (b.team === 'enemy' && this._blockedByBarrier(b)) { this.hitSpark(b.gx, b.gy, 'sparkOrange'); this._killBolt(i); continue; }

      let hit = false;
      for (const o of this.units) {
        if (!o.alive) continue;
        if (b.heal) {
          if (o === b.lockTarget) {
            this.heal(o, b.heal); this.hitSpark(b.gx, b.gy, 'sparkLime');
            if (b.owner.isPlayer) this.gainUlt(b.owner, 4);
            hit = true; break;
          }
        } else if (o.team !== b.team && this.dist(b.gx, b.gy, o.gx, o.gy) < 0.7) {
          this.damage(o, b.dmg, b.owner);
          this.hitSpark(b.gx, b.gy, o.team === 'enemy' ? 'sparkRed' : 'sparkCyan');
          hit = true; break;
        }
      }
      if (hit) { this._killBolt(i); continue; }

      const sp = Iso.toScreen(b.gx, b.gy);
      b.sprite.setPosition(sp.x, sp.y - 16);
    }
  }

  _killBolt(i) { this.bolts[i].sprite.destroy(); this.bolts.splice(i, 1); }

  damage(u, amount, from) {
    if (u.buffs.invuln) return;
    u.hp -= amount;
    // Hit flash — brief white tint then clear
    u.sprite.setTint(0xffffff);
    this.time.delayedCall(80, () => { if (u.sprite?.active) u.sprite.clearTint(); });

    const heavy = amount >= 28;
    const byPlayer = !!from?.isPlayer;
    // Particles coloured by attacker side; player hits read as cyan
    this.burst(from?.team === 'ally' ? 'cyan' : 'red', u.gx, u.gy, heavy ? 9 : 5);
    // Floating damage number (only the player's own contributions, to avoid clutter)
    if (byPlayer) this.damageNumber(u.gx, u.gy, amount, heavy ? 'crit' : 'dmg');
    // Audio + punch
    if (byPlayer || u.isPlayer) Sfx.hit();
    if (heavy && byPlayer) { this.hitStop(55); this.cameras.main.shake(80, 0.004); }

    if (from?.isPlayer) this.gainUlt(from, amount * 0.5);
    if (u.hp <= 0) this.kill(u, from);
  }

  heal(u, amount) {
    const before = u.hp;
    u.hp = Math.min(u.maxHp, u.hp + amount);
    const gained = u.hp - before;
    if (gained > 0 && (amount >= 20 || u.isPlayer)) {
      this.burst('lime', u.gx, u.gy, 3);
      this.damageNumber(u.gx, u.gy, gained, 'heal');
    }
  }

  kill(u, from) {
    u.hp = 0; u.alive = false;
    this.burst(u.team === 'enemy' ? 'red' : 'cyan', u.gx, u.gy, 14);
    this.burst('white', u.gx, u.gy, 6);
    Sfx.kill();
    // Kill feed + extra punch when the player gets the elimination
    this.events.emit('kill', {
      a: from ? this.unitName(from) : '',
      b: this.unitName(u),
      color: from && from.team === 'ally' ? TEAM.ally : TEAM.enemy,
    });
    if (from?.isPlayer) { this.gainUlt(from, 18); this.hitStop(60); this.cameras.main.shake(120, 0.005); }
    if (u.isPlayer) { this.flashScreen(PAL.red, 0.4); }

    // Both teams respawn — Overwatch style
    const delay = u.isPlayer ? 3000 : (u.team === 'enemy' ? 6000 : 5000);
    this.time.delayedCall(delay, () => {
      if (!u.sprite?.active) return;
      u.hp = u.maxHp; u.alive = true;
      u.gx = u.respawn.gx; u.gy = u.respawn.gy;
      u.vel = { x: 0, y: 0 };
      for (const k in u.buffs) delete u.buffs[k];
      this.respawnFlash(u);
    });
  }

  respawnFlash(u) {
    const sp = Iso.toScreen(u.gx, u.gy);
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 80, () => {
        if (!u.sprite?.active) return;
        u.sprite.setAlpha(i % 2 === 0 ? 0.3 : 1);
      });
    }
    this.time.delayedCall(400, () => { if (u.sprite?.active) u.sprite.setAlpha(1); });
    this.ringFx(u.gx, u.gy, u.team === 'enemy' ? PAL.red : PAL.cyan, 2);
    if (u.isPlayer) Sfx.respawn();
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
    const now = performance.now();
    if ((u.cd[ab.key] || 0) > now) return;
    u.cd[ab.key] = now + ab.cd;
    Sfx.ability();
    this.castAbility(u, ab.key);
  }

  cooldownFrac(index) {
    const u = this.player;
    const ab = u.hero.abilities[index];
    const left = (u.cd[ab.key] || 0) - performance.now();
    return Phaser.Math.Clamp(left / ab.cd, 0, 1);
  }

  useUlt() {
    const u = this.player;
    if (!u.alive || u.ult < 100) return;
    u.ult = 0;
    this.castUlt(u);
  }

  castAbility(u, key) {
    const dir = u.vel.x !== 0 || u.vel.y !== 0
      ? { x: Math.sign(u.vel.x) || 1, y: u.vel.y }
      : { x: u.flip ? -1 : 1, y: 0 };

    switch (key) {
      case 'dash': {
        const d = 3.2;
        let tx = u.gx + dir.x * d, ty = u.gy + dir.y * d;
        if (this.isWall(tx, ty)) { tx = u.gx + dir.x * 1.5; ty = u.gy + dir.y * 1.5; }
        if (!this.isWall(tx, ty)) { u.gx = Phaser.Math.Clamp(tx, 0.6, GRID_W-1.6); u.gy = Phaser.Math.Clamp(ty, 0.6, GRID_H-1.6); }
        this.ringFx(u.gx, u.gy, PAL.cyan);
        break;
      }
      case 'burst':
        this.ringFx(u.gx, u.gy, PAL.cyan, 3);
        this.units.forEach(o => {
          if (o.team !== u.team && o.alive && this.dist(u.gx, u.gy, o.gx, o.gy) < 3) {
            this.damage(o, 55, u); this.knockback(o, u, 1.5);
          }
        });
        break;
      case 'shield': {
        const p = Iso.toScreen(u.gx + dir.x * 1.2, u.gy + dir.y * 1.2);
        const spr = this.add.image(p.x, p.y - 10, 'barrierOrange').setScale(1.8).setDepth(57000);
        this.barriers.push({ gx: u.gx + dir.x * 1.2, gy: u.gy + dir.y * 1.2, life: 5000, sprite: spr });
        break;
      }
      case 'slam':
        this.ringFx(u.gx, u.gy, PAL.orange, 2.6);
        this.cameras.main.shake(150, 0.006);
        this.units.forEach(o => {
          if (o.team !== u.team && o.alive && this.dist(u.gx, u.gy, o.gx, o.gy) < 2.6) {
            this.damage(o, 30, u); this.knockback(o, u, 2.2);
          }
        });
        break;
      case 'heal': {
        const ally = this.nearestHurtAlly(u, 8) || this.weakestAlly();
        if (ally) this.channelHeal(u, ally, 2500, 18);
        break;
      }
      case 'nova':
        this.ringFx(u.gx, u.gy, PAL.lime, 3);
        this.units.forEach(o => {
          if (o.team === u.team && o.alive && this.dist(u.gx, u.gy, o.gx, o.gy) < 3) {
            this.heal(o, 70);
            o.buffs.haste = performance.now() + 3000;
          }
        });
        break;
    }
  }

  castUlt(u) {
    const id = u.hero.id;
    this.bigText(u.hero.ult.name + '!', u.hero.color);
    // Cinematic punch for the ultimate
    Sfx.ult();
    this.flashScreen(u.hero.color, 0.45);
    this.cameraPunch(0.12);
    this.cameras.main.shake(260, 0.009);
    this.hitStop(70);
    if (id === 'zap') {
      u.buffs.rampage = performance.now() + 5000;
    } else if (id === 'brick') {
      u.buffs.invuln = performance.now() + 4000;
      this.ringFx(u.gx, u.gy, PAL.orange, 3.5);
    } else if (id === 'bloom') {
      this.time.addEvent({
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

  knockback(o, from, force) {
    let dx = o.gx - from.gx, dy = o.gy - from.gy;
    const m = Math.hypot(dx, dy) || 1;
    const tx = o.gx + dx/m*force, ty = o.gy + dy/m*force;
    if (!this.isWall(tx, ty)) { o.gx = Phaser.Math.Clamp(tx, 0.6, GRID_W-1.6); o.gy = Phaser.Math.Clamp(ty, 0.6, GRID_H-1.6); }
  }

  // ---------- BARRIERS ----------
  updateBarriers(dt) {
    for (let i = this.barriers.length - 1; i >= 0; i--) {
      const b = this.barriers[i];
      b.life -= dt;
      b.sprite.setAlpha(0.5 + 0.3 * Math.sin(performance.now() / 100));
      if (b.life <= 0) { b.sprite.destroy(); this.barriers.splice(i, 1); }
    }
  }

  _blockedByBarrier(bolt) {
    return this.barriers.some(b => this.dist(bolt.gx, bolt.gy, b.gx, b.gy) < 1.4);
  }

  // ---------- FX ----------
  unitName(u) {
    if (!u) return '';
    return u.hero ? u.hero.name : (u.dispName || 'BOT');
  }

  hitStop(ms) { this.freezeT = Math.max(this.freezeT, ms); }

  flashScreen(color, alpha = 0.4) {
    const cam = this.cameras.main;
    const r = this.add.rectangle(cam.midPoint.x, cam.midPoint.y, this.scale.width * 2, this.scale.height * 2,
      Phaser.Display.Color.HexStringToColor(color).color)
      .setScrollFactor(0).setDepth(69000).setAlpha(alpha);
    this.tweens.add({ targets: r, alpha: 0, duration: 350, onComplete: () => r.destroy() });
  }

  cameraPunch(amount = 0.1) {
    const cam = this.cameras.main;
    this.tweens.add({ targets: cam, zoom: 1.05 + amount, duration: 90, yoyo: true, ease: 'Quad.out' });
  }

  damageNumber(gx, gy, amount, kind) {
    const sp = Iso.toScreen(gx, gy);
    const color = kind === 'heal' ? PAL.lime : (kind === 'crit' ? PAL.yellow : PAL.white);
    const size = kind === 'crit' ? 22 : 15;
    const t = this.add.text(sp.x + (Math.random() * 12 - 6), sp.y - 32,
      (kind === 'heal' ? '+' : '') + Math.round(amount), {
        fontFamily: 'monospace', fontSize: size + 'px', color, fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(61000);
    t.setStroke(PAL.black, 4);
    this.tweens.add({
      targets: t, y: t.y - 28, alpha: 0, duration: 700, ease: 'Quad.out',
      onComplete: () => t.destroy(),
    });
  }

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

  ringFx(gx, gy, color, radius = 1.5) {
    const sp = Iso.toScreen(gx, gy);
    const g = this.add.graphics().setDepth(58950);
    const col = Phaser.Display.Color.HexStringToColor(color).color;
    let r = 4;
    const max = radius * 40;
    this.time.addEvent({
      delay: 16, repeat: 18, callback: () => {
        g.clear();
        g.lineStyle(3, col, 1 - r / max);
        g.strokeEllipse(sp.x, sp.y - 10, r * 2, r);
        r += (max - 4) / 18;
        if (r >= max) g.destroy();
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
      const w = 28, x = sp.x - w / 2, y = sp.y - (u.isPlayer ? 56 : 50);
      g.fillStyle(0x000000, 0.7); g.fillRect(x - 1, y - 1, w + 2, 6);
      const frac = Phaser.Math.Clamp(u.hp / u.maxHp, 0, 1);
      let col = u.team === 'ally' ? 0x3df2ff : 0xff3d5e;
      if (u.isPlayer) col = 0x7dff5c;
      g.fillStyle(col, 1); g.fillRect(x, y, w * frac, 4);
      if (u.buffs.invuln) { g.lineStyle(1, 0xffd23d, 1); g.strokeRect(x-1, y-1, w+2, 6); }
    });
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
