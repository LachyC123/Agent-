// BootScene — generate every texture/animation, then jump to Menu.
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // ---- Isometric tiles ----
    SpriteGen.floorTile(this, 'tileFloor',     PAL.floor,   PAL.floorDk,  PAL.floorEdge, null);
    SpriteGen.floorTile(this, 'tilePath',      PAL.dusk,    PAL.night,    PAL.floorEdge, null);
    SpriteGen.floorTile(this, 'tileObjective', PAL.floorDk, PAL.floorEdge, PAL.black,   PAL.purpleDk);
    SpriteGen.floorTile(this, 'tileAlly',      PAL.floorDk, PAL.floorEdge, PAL.black,   PAL.cyanDk);
    SpriteGen.floorTile(this, 'tileEnemy',     PAL.floorDk, PAL.floorEdge, PAL.black,   PAL.redDk);
    SpriteGen.wallCube(this, 'wall', PAL.iron, PAL.ink, PAL.floorDk, PAL.steelDk);

    // ---- Payload ----
    SpriteGen.payload(this, 'payload', PAL.cyan);

    // ---- Heroes: spritesheets + portraits ----
    HEROES.forEach(h => {
      SpriteGen.heroSheet(this, h.id, h.art);
      SpriteGen.portrait(this, 'portrait_' + h.id, h.art);
    });

    // ---- Enemy bots ----
    SpriteGen.botSheet(this, 'bot_grunt', 'grunt');
    SpriteGen.botSheet(this, 'bot_heavy', 'heavy');

    // ---- Projectiles / FX ----
    SpriteGen.bolt(this, 'boltCyan', PAL.cyan);
    SpriteGen.bolt(this, 'boltOrange', PAL.orange);
    SpriteGen.bolt(this, 'boltLime', PAL.lime);
    SpriteGen.bolt(this, 'boltRed', PAL.red);
    SpriteGen.orb(this, 'orbLime', PAL.lime);
    SpriteGen.orb(this, 'orbHeal', PAL.lime);
    SpriteGen.spark(this, 'sparkCyan', PAL.cyan);
    SpriteGen.spark(this, 'sparkOrange', PAL.orange);
    SpriteGen.spark(this, 'sparkLime', PAL.lime);
    SpriteGen.spark(this, 'sparkRed', PAL.red);
    SpriteGen.spark(this, 'sparkWhite', PAL.white);
    SpriteGen.barrier(this, 'barrierOrange', PAL.orange);

    // ---- Ability + role icons ----
    HEROES.forEach(h => {
      h.abilities.forEach(a => SpriteGen.icon(this, 'icon_' + h.id + '_' + a.key, a.icon, h.color));
      SpriteGen.icon(this, 'icon_' + h.id + '_fire', 'fire', h.color);
      SpriteGen.icon(this, 'icon_' + h.id + '_ult',  'ult',  h.color);
      SpriteGen.roleBadge(this, 'badge_' + h.id, h.role, h.color);
    });

    // ---- Phaser animations ----------------------------------------
    // Hero walk + idle in each direction
    HEROES.forEach(h => {
      ['side', 'back'].forEach(dir => {
        const key = 'hero_' + h.id + '_' + dir;
        this.anims.create({
          key: h.id + '_' + dir + '_walk',
          frames: [
            { key, frame: 0 }, { key, frame: 1 },
            { key, frame: 2 }, { key, frame: 3 },
          ],
          frameRate: 8, repeat: -1,
        });
        this.anims.create({
          key: h.id + '_' + dir + '_idle',
          frames: [{ key, frame: 4 }, { key, frame: 5 }],
          frameRate: 2, repeat: -1,
        });
      });
    });

    // Bot walk + idle
    ['bot_grunt', 'bot_heavy'].forEach(bk => {
      ['side', 'back'].forEach(dir => {
        const key = bk + '_' + dir;
        this.anims.create({
          key: bk + '_' + dir + '_walk',
          frames: [
            { key, frame: 0 }, { key, frame: 1 },
            { key, frame: 2 }, { key, frame: 3 },
          ],
          frameRate: 10, repeat: -1,
        });
        this.anims.create({
          key: bk + '_' + dir + '_idle',
          frames: [{ key, frame: 4 }, { key, frame: 5 }],
          frameRate: 1, repeat: -1,
        });
      });
    });

    this.scene.start('Menu');
  }
}
