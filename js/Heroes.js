// Heroes.js — original character roster for NEON RIFT.
// One hero per Overwatch-style role. Each entry holds:
//  - art options (fed to SpriteGen.hero / .portrait)
//  - combat stats
//  - two abilities + an ultimate
//
// All designs are original. Names are arcade-flavoured.

const HEROES = [
  {
    id: 'zap',
    name: 'ZAP',
    role: 'Damage',
    color: PAL.cyan,
    tagline: 'Glitch-kid with a twin pulse blaster. Hit fast, blink away.',
    art: {
      skin: PAL.skinA, skinDk: PAL.skinADk,
      suit: PAL.cyanDk, suitDk: '#125f73',
      accent: PAL.cyan, accentDk: PAL.cyanDk,
      hair: PAL.yellow, hairDk: PAL.yellowDk,
      eye: PAL.magenta, hairStyle: 'spike', weapon: 'blaster', bulk: 0,
    },
    stats: { hp: 200, speed: 3.4, role: 'Damage' },
    weapon: { dmg: 14, rate: 130, range: 7.5, spread: 0.05, proj: 'boltCyan', auto: true },
    abilities: [
      { key: 'dash', name: 'Blink', icon: 'dash', cd: 3500, desc: 'Dash a short distance instantly.' },
      { key: 'burst', name: 'Overload', icon: 'burst', cd: 7000, desc: 'Pulse nova that damages nearby foes.' },
    ],
    ult: { key: 'rampage', name: 'Pulse Storm', icon: 'ult', desc: 'Fire-rate surge: triple damage for 5s.', cost: 100 },
  },
  {
    id: 'brick',
    name: 'BRICK',
    role: 'Tank',
    color: PAL.orange,
    tagline: 'Walking fortress. Soaks damage, drops barriers, hits the ground hard.',
    art: {
      skin: PAL.skinB, skinDk: PAL.skinBDk,
      suit: PAL.steelDk, suitDk: PAL.iron,
      accent: PAL.orange, accentDk: PAL.orangeDk,
      hair: PAL.steel, hairDk: PAL.steelDk,
      visor: PAL.orange, hairStyle: 'helmet', weapon: 'gauntlet', bulk: 2,
    },
    stats: { hp: 500, speed: 2.3, role: 'Tank' },
    weapon: { dmg: 9, rate: 110, range: 4.5, spread: 0.18, proj: 'boltOrange', pellets: 3, auto: true },
    abilities: [
      { key: 'shield', name: 'Bulwark', icon: 'shield', cd: 9000, desc: 'Deploy a barrier that blocks shots.' },
      { key: 'slam', name: 'Quake', icon: 'slam', cd: 6000, desc: 'Slam the ground, knocking back foes.' },
    ],
    ult: { key: 'fortress', name: 'Last Stand', icon: 'ult', desc: 'Become invulnerable and taunt for 4s.', cost: 100 },
  },
  {
    id: 'bloom',
    name: 'BLOOM',
    role: 'Support',
    color: PAL.lime,
    tagline: 'Bio-tech medic. Mends allies, blooms speed fields, revives the team.',
    art: {
      skin: PAL.skinC, skinDk: PAL.skinADk,
      suit: '#2f8f3a', suitDk: PAL.limeDk,
      accent: PAL.lime, accentDk: PAL.limeDk,
      hair: PAL.magenta, hairDk: PAL.magDk,
      eye: PAL.lime, hairStyle: 'hood', weapon: 'staff', bulk: 0,
    },
    stats: { hp: 250, speed: 3.0, role: 'Support' },
    weapon: { dmg: 8, rate: 160, range: 6.5, spread: 0.04, proj: 'boltLime', auto: true, heal: 16 },
    abilities: [
      { key: 'heal', name: 'Mend', icon: 'heal', cd: 1000, desc: 'Lock a heal beam onto the nearest ally.' },
      { key: 'nova', name: 'Spore Field', icon: 'nova', cd: 8000, desc: 'Burst that heals allies and speeds them up.' },
    ],
    ult: { key: 'rebirth', name: 'Full Bloom', icon: 'ult', desc: 'Massive area heal-over-time for 5s.', cost: 100 },
  },
];

function getHero(id) { return HEROES.find(h => h.id === id) || HEROES[0]; }
