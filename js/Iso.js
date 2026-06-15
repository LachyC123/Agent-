// Iso.js — isometric coordinate helpers.
// World is a grid of tiles. We project grid (gx, gy) -> screen (sx, sy) using a
// 2:1 diamond projection. Entities live in continuous grid space (floats) and
// depth-sort by (gx + gy) so closer tiles draw on top.

const Iso = {
  TILE_W: 64,   // full diamond width
  TILE_H: 32,   // full diamond height (2:1)
  originX: 0,
  originY: 0,

  setOrigin(x, y) { this.originX = x; this.originY = y; },

  // grid -> screen (centre of tile top face)
  toScreen(gx, gy) {
    return {
      x: this.originX + (gx - gy) * (this.TILE_W / 2),
      y: this.originY + (gx + gy) * (this.TILE_H / 2),
    };
  },

  // screen -> grid (for touch targeting if needed)
  toGrid(sx, sy) {
    const x = sx - this.originX;
    const y = sy - this.originY;
    return {
      gx: (x / (this.TILE_W / 2) + y / (this.TILE_H / 2)) / 2,
      gy: (y / (this.TILE_H / 2) - x / (this.TILE_W / 2)) / 2,
    };
  },

  // depth value for sorting sprites
  depth(gx, gy) {
    return (gx + gy) * 16;
  },
};
