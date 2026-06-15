# NEON RIFT

A stylised **isometric pixel-art hero brawler**, Overwatch-inspired, built from
scratch with hand-crafted (code-generated) pixel art. Mobile-first, touch
controlled, single-player vs AI bots.

Open `index.html` in a browser (or serve the folder) and play.

## Game mode — Escort the Core
Pick a hero and push the **payload** along the path against waves of enemy bots.
The cart advances only while an ally is nearby and no enemy is contesting it.
Deliver it to the end before the **2:00** timer runs out to win.

## Heroes (original designs, one per role)
| Hero | Role | Kit |
|------|------|-----|
| **ZAP** | Damage | Twin pulse blaster · *Blink* dash · *Overload* nova · **Pulse Storm** (triple damage) |
| **BRICK** | Tank | Scatter gauntlet · *Bulwark* barrier · *Quake* slam · **Last Stand** (invulnerable) |
| **BLOOM** | Support | Heal/attack staff · *Mend* heal beam · *Spore Field* heal+haste · **Full Bloom** (area heal) |

## Controls (touch / mouse)
- **Left half:** floating joystick to move.
- **Right cluster:** large **FIRE** button, two **ability** buttons (with cooldown rings),
  and the **ULTIMATE** button (glows gold when charged).

## Tech
- [Phaser 3](https://phaser.io/) (vendored in `js/vendor/` so it runs offline).
- **Zero external art assets** — every sprite, tile, portrait, HUD icon and button
  is drawn pixel-by-pixel at runtime by `js/SpriteGen.js` for a consistent
  retro-arcade look.

### Project layout
```
index.html            scene/script load order
style.css             full-bleed pixel-perfect canvas
js/Palette.js         shared retro-arcade colour palette
js/SpriteGen.js       procedural pixel-art generator (all textures)
js/UIKit.js           neon buttons / panels / text widgets
js/Iso.js             isometric grid <-> screen projection + depth
js/Heroes.js          hero roster: art params, stats, abilities
js/main.js            Phaser config (portrait, FIT scaling, pixelArt)
js/scenes/
  BootScene.js        generates every texture, then -> Menu
  MenuScene.js        animated title screen
  SelectScene.js      character select (portraits, stats, abilities)
  GameScene.js        isometric map, payload, combat, AI, abilities
  UIScene.js          HUD + touch controls overlay
  ResultScene.js      victory / defeat summary
```
