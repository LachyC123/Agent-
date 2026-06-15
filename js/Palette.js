// NEON RIFT — shared retro-arcade palette.
// Chunky, saturated 16-bit colours. Every sprite + UI element pulls from here
// so the whole game feels hand-crafted by one artist.
const PAL = {
  // Backgrounds / world
  void:    '#10071d',
  voidLt:  '#1d0f33',
  night:   '#2a1850',
  dusk:    '#3d2474',

  // Neon accents
  cyan:    '#3df2ff',
  cyanDk:  '#1a8fad',
  magenta: '#ff43c4',
  magDk:   '#a8246f',
  yellow:  '#ffd23d',
  yellowDk:'#c79212',
  lime:    '#7dff5c',
  limeDk:  '#3fa82f',
  orange:  '#ff7a3d',
  orangeDk:'#c44a17',
  red:     '#ff3d5e',
  redDk:   '#a81f3a',
  purple:  '#b15cff',
  purpleDk:'#6f2eb0',
  blue:    '#4d7bff',
  blueDk:  '#283fa8',

  // Neutrals
  white:   '#fdf6ff',
  bone:    '#e0d4f0',
  steel:   '#8a86b8',
  steelDk: '#4a4670',
  iron:    '#322d52',
  ink:     '#160d28',
  black:   '#0a0411',

  // Skin tones (original characters)
  skinA:   '#ffc999',
  skinADk: '#cc8f63',
  skinB:   '#9d6b4f',
  skinBDk: '#6e4530',
  skinC:   '#d99a7a',

  // Tile / floor
  floor:   '#3a2c63',
  floorLt: '#4a3a7a',
  floorDk: '#281d47',
  floorEdge:'#1a1230',
  grid:    '#5a4a94',
};

// Team colours
const TEAM = {
  ally:  PAL.cyan,
  enemy: PAL.red,
};
