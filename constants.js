// Game Constants
const GAME_CONFIG = {
    WIDTH: 800,
    HEIGHT: 600,
    TILE_SIZE: 32,
    PLAYER_SPEED: 150,
    
    // Colors - Medieval Bohemian palette
    COLORS: {
        GRASS_LIGHT: 0x4a7023,
        GRASS_DARK: 0x3d5c1a,
        DIRT: 0x8b7355,
        DIRT_DARK: 0x6b5344,
        STONE: 0x808080,
        STONE_DARK: 0x5a5a5a,
        WOOD: 0x8b4513,
        WOOD_DARK: 0x5c3310,
        THATCH: 0xc4a35a,
        WATER: 0x4a7090,
        FOREST: 0x2d4a1c,
        
        // UI Colors
        UI_BG: 0x2c1810,
        UI_BORDER: 0xd4af37,
        UI_TEXT: 0xf5deb3,
        UI_HIGHLIGHT: 0xffd700,
        
        // Character colors
        SKIN: 0xdeb887,
        PEASANT_CLOTH: 0x8b7355,
        NOBLE_CLOTH: 0x4a0000,
        GUARD_ARMOR: 0x696969
    },
    
    // Day/Night cycle (in game minutes)
    DAY_LENGTH: 24000, // 24 seconds real time = 1 game day
    DAWN: 6,
    DUSK: 18,
    
    // Reputation thresholds
    REPUTATION: {
        HATED: -50,
        DISLIKED: -20,
        NEUTRAL: 0,
        LIKED: 20,
        LOVED: 50
    }
};

// Directions
const DIRECTIONS = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
};

// Item types
const ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    CONSUMABLE: 'consumable',
    QUEST: 'quest',
    MISC: 'misc'
};

// Quest states
const QUEST_STATES = {
    AVAILABLE: 'available',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    FAILED: 'failed'
};
