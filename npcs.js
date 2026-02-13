// NPC Data - Medieval Bohemian Characters
// Version 2.0 - Expanded with new characters and behaviors
const NPC_DATA = {
    // Blacksmith - Gruff but fair craftsman
    vaclav: {
        id: 'vaclav',
        name: 'Václav the Smith',
        sprite: 'blacksmith',
        position: { x: 520, y: 380 },
        profession: 'Blacksmith',
        personality: 'Gruff but honorable',
        schedule: {
            dawn: { x: 520, y: 380, activity: 'preparing' },
            day: { x: 520, y: 380, activity: 'forging' },
            dusk: { x: 280, y: 300, activity: 'drinking' },
            night: { x: 480, y: 320, activity: 'resting' }
        },
        dialogueKey: 'vaclav',
        quests: ['stolen_tools'],
        canTrade: true,
        tradeItems: ['sword', 'shield', 'hammer'],
        relationships: { borek: 20, otto: 10, karel: -10 }
    },
    
    // Innkeeper - Knows all the gossip
    marta: {
        id: 'marta',
        name: 'Marta of the Golden Tankard',
        sprite: 'innkeeper',
        position: { x: 280, y: 280 },
        profession: 'Innkeeper',
        personality: 'Warm and gossipy',
        schedule: {
            dawn: { x: 320, y: 280, activity: 'cleaning' },
            day: { x: 280, y: 280, activity: 'serving' },
            dusk: { x: 280, y: 280, activity: 'serving' },
            night: { x: 280, y: 280, activity: 'closing' }
        },
        dialogueKey: 'marta',
        quests: ['find_herbs'],
        canTrade: true,
        tradeItems: ['bread', 'potion'],
        relationships: { borek: 15, father_metodej: 25, hana: 20 }
    },
    
    // Miller - Troubled by bandits
    jiri: {
        id: 'jiri',
        name: 'Jiří the Miller',
        sprite: 'miller',
        position: { x: 680, y: 180 },
        profession: 'Miller',
        personality: 'Anxious and hardworking',
        schedule: {
            dawn: { x: 680, y: 180, activity: 'milling' },
            day: { x: 680, y: 180, activity: 'milling' },
            dusk: { x: 640, y: 220, activity: 'resting' },
            night: { x: 640, y: 220, activity: 'sleeping' }
        },
        dialogueKey: 'jiri',
        quests: ['bandit_threat'],
        canTrade: false,
        relationships: { vaclav: 10, hana: 15 }
    },
    
    // Guard Captain - Maintains order
    borek: {
        id: 'borek',
        name: 'Captain Bořek',
        sprite: 'guard',
        position: { x: 400, y: 480 },
        profession: 'Guard Captain',
        personality: 'Stern and duty-bound',
        schedule: {
            dawn: { x: 400, y: 480, activity: 'patrolling' },
            day: { x: 350, y: 400, activity: 'patrolling' },
            dusk: { x: 400, y: 480, activity: 'patrolling' },
            night: { x: 280, y: 320, activity: 'drinking' }
        },
        dialogueKey: 'borek',
        quests: ['stolen_tools', 'bandit_threat'],
        canTrade: false,
        relationships: { karel: 30, vaclav: 15, jiri: 10 }
    },
    
    // Merchant - Traveling trader
    otto: {
        id: 'otto',
        name: 'Otto the Merchant',
        sprite: 'merchant',
        position: { x: 350, y: 380 },
        profession: 'Merchant',
        personality: 'Shrewd but fair',
        schedule: {
            dawn: { x: 350, y: 380, activity: 'setting_up' },
            day: { x: 350, y: 380, activity: 'trading' },
            dusk: { x: 280, y: 280, activity: 'drinking' },
            night: { x: 280, y: 320, activity: 'resting' }
        },
        dialogueKey: 'otto',
        quests: [],
        canTrade: true,
        tradeItems: ['potion', 'scroll', 'key'],
        relationships: { vaclav: 10, marta: 15 }
    },
    
    // Priest - Spiritual guidance
    father_metodej: {
        id: 'father_metodej',
        name: 'Father Metoděj',
        sprite: 'priest',
        position: { x: 160, y: 180 },
        profession: 'Priest',
        personality: 'Wise and compassionate',
        schedule: {
            dawn: { x: 160, y: 180, activity: 'praying' },
            day: { x: 160, y: 220, activity: 'tending' },
            dusk: { x: 160, y: 180, activity: 'praying' },
            night: { x: 160, y: 180, activity: 'sleeping' }
        },
        dialogueKey: 'father_metodej',
        quests: ['lost_relic'],
        canTrade: false,
        relationships: { marta: 20, hana: 25, karel: -5 }
    },
    
    // Noble's son - Arrogant youth
    karel: {
        id: 'karel',
        name: 'Karel of Lipany',
        sprite: 'noble',
        position: { x: 450, y: 150 },
        profession: 'Nobleman',
        personality: 'Arrogant but capable',
        schedule: {
            dawn: { x: 450, y: 200, activity: 'sleeping' },
            day: { x: 400, y: 400, activity: 'wandering' },
            dusk: { x: 280, y: 280, activity: 'drinking' },
            night: { x: 280, y: 320, activity: 'drinking' }
        },
        dialogueKey: 'karel',
        quests: [],
        canTrade: false,
        relationships: { borek: 15, vaclav: -15, hana: -10 }
    },
    
    // Peasant - Common folk
    hana: {
        id: 'hana',
        name: 'Hana',
        sprite: 'peasant',
        position: { x: 580, y: 480 },
        profession: 'Farmwife',
        personality: 'Kind and worried',
        schedule: {
            dawn: { x: 580, y: 480, activity: 'waking' },
            day: { x: 600, y: 450, activity: 'farming' },
            dusk: { x: 580, y: 480, activity: 'cooking' },
            night: { x: 580, y: 480, activity: 'sleeping' }
        },
        dialogueKey: 'hana',
        quests: ['find_herbs'],
        canTrade: false,
        relationships: { marta: 20, father_metodej: 15, jiri: 10 }
    },
    
    // === NEW NPCs ===
    
    // Old healer - Wise woman who knows herbs
    baba_zdena: {
        id: 'baba_zdena',
        name: 'Baba Zdena',
        sprite: 'peasant',
        position: { x: 850, y: 300 },
        profession: 'Healer',
        personality: 'Mysterious and knowledgeable',
        schedule: {
            dawn: { x: 850, y: 300, activity: 'gathering' },
            day: { x: 850, y: 320, activity: 'healing' },
            dusk: { x: 850, y: 300, activity: 'brewing' },
            night: { x: 850, y: 300, activity: 'sleeping' }
        },
        dialogueKey: 'baba_zdena',
        quests: ['witch_hunt', 'plague_prevention'],
        canTrade: true,
        tradeItems: ['potion', 'herbs'],
        relationships: { father_metodej: -10, marta: 10, hana: 25 }
    },
    
    // Young guard - Borek's subordinate
    radek: {
        id: 'radek',
        name: 'Radek the Guard',
        sprite: 'guard',
        position: { x: 500, y: 420 },
        profession: 'Guard',
        personality: 'Eager but inexperienced',
        schedule: {
            dawn: { x: 160, y: 250, activity: 'patrolling' },
            day: { x: 520, y: 400, activity: 'patrolling' },
            dusk: { x: 680, y: 220, activity: 'patrolling' },
            night: { x: 280, y: 280, activity: 'drinking' }
        },
        dialogueKey: 'radek',
        quests: ['guard_training'],
        canTrade: false,
        relationships: { borek: 20, karel: 5 }
    },
    
    // Wandering bard
    matej: {
        id: 'matej',
        name: 'Matěj the Bard',
        sprite: 'peasant',
        position: { x: 300, y: 350 },
        profession: 'Bard',
        personality: 'Charming and musical',
        schedule: {
            dawn: { x: 400, y: 380, activity: 'wandering' },
            day: { x: 350, y: 400, activity: 'performing' },
            dusk: { x: 280, y: 280, activity: 'performing' },
            night: { x: 280, y: 320, activity: 'drinking' }
        },
        dialogueKey: 'matej',
        quests: ['lost_lute', 'compose_song'],
        canTrade: false,
        relationships: { marta: 25, karel: 10, otto: 15 }
    },
    
    // Mysterious stranger
    cizinec: {
        id: 'cizinec',
        name: 'The Stranger',
        sprite: 'merchant',
        position: { x: 1050, y: 350 },
        profession: 'Unknown',
        personality: 'Enigmatic',
        schedule: {
            dawn: { x: 1050, y: 350, activity: 'watching' },
            day: { x: 900, y: 400, activity: 'wandering' },
            dusk: { x: 280, y: 320, activity: 'drinking' },
            night: { x: 1050, y: 350, activity: 'watching' }
        },
        dialogueKey: 'cizinec',
        quests: ['dark_secret'],
        canTrade: true,
        tradeItems: ['key', 'scroll'],
        relationships: { borek: -15, otto: 5 }
    }
};

// NPC relationship modifiers
const NPC_RELATIONSHIPS = {
    vaclav: { borek: 20, otto: 10, karel: -10 },
    marta: { borek: 15, father_metodej: 25, hana: 20, matej: 25 },
    borek: { karel: 30, vaclav: 15, jiri: 10, radek: 20 },
    father_metodej: { marta: 20, hana: 25, baba_zdena: -10 },
    hana: { marta: 20, father_metodej: 15, baba_zdena: 25 },
    baba_zdena: { hana: 25, marta: 10, father_metodej: -10 },
    radek: { borek: 20, vaclav: 10 },
    matej: { marta: 25, karel: 10, otto: 15 },
    cizinec: { borek: -15, otto: 5 }
};

// Activity descriptions for UI
const ACTIVITY_DESCRIPTIONS = {
    forging: 'hammering at the forge',
    serving: 'tending the bar',
    milling: 'grinding grain',
    patrolling: 'keeping watch',
    trading: 'hawking wares',
    praying: 'in silent prayer',
    farming: 'working the fields',
    drinking: 'enjoying an ale',
    resting: 'taking a break',
    sleeping: 'asleep',
    wandering: 'strolling about',
    performing: 'playing music',
    healing: 'preparing remedies',
    watching: 'observing',
    brewing: 'mixing potions',
    gathering: 'collecting herbs'
};
