// BootScene — generate every texture procedurally, then jump to the menu.
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // ---- Isometric tiles ----
    SpriteGen.floorTile(this, 'tileFloor', PAL.floor, PAL.floorDk, PAL.floorEdge, null);
    SpriteGen.floorTile(this, 'tilePath', PAL.dusk, PAL.night, PAL.floorEdge, null);
    SpriteGen.floorTile(this, 'tileObjective', PAL.floorDk, PAL.floorEdge, PAL.black, PAL.purpleDk);
    SpriteGen.floorTile(this, 'tileAlly', PAL.floorDk, PAL.floorEdge, PAL.black, PAL.cyanDk);
    SpriteGen.floorTile(this, 'tileEnemy', PAL.floorDk, PAL.floorEdge, PAL.black, PAL.redDk);
    SpriteGen.wallCube(this, 'wall', PAL.iron, PAL.ink, PAL.floorDk, PAL.steelDk);

    // ---- Payload ----
    SpriteGen.payload(this, 'payload', PAL.cyan);

    // ---- Heroes + portraits ----
    HEROES.forEach(h => {
      SpriteGen.hero(this, 'hero_' + h.id, h.art, 'portrait_' + h.id);
    });

    // ---- Enemy bots ----
    SpriteGen.bot(this, 'bot_grunt', 'grunt');
    SpriteGen.bot(this, 'bot_heavy', 'heavy');

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
      SpriteGen.icon(this, 'icon_' + h.id + '_ult', 'ult', h.color);
      SpriteGen.roleBadge(this, 'badge_' + h.id, h.role, h.color);
    });

    this.scene.start('Menu');
  }
}
