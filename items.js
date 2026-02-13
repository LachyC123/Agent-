// Item Data - Version 2.0 with expanded content
const ITEMS_DATA = {
    // Weapons
    sword: {
        id: 'sword',
        name: 'Iron Sword',
        type: ITEM_TYPES.WEAPON,
        description: 'A sturdy blade forged by Václav. +5 Attack',
        sprite: 'sword',
        stats: { attack: 5 },
        value: 50,
        stackable: false
    },
    
    hammer: {
        id: 'hammer',
        name: 'War Hammer',
        type: ITEM_TYPES.WEAPON,
        description: 'Heavy but devastating. +7 Attack, -1 Speed',
        sprite: 'hammer',
        stats: { attack: 7, speed: -1 },
        value: 65,
        stackable: false
    },
    
    dagger: {
        id: 'dagger',
        name: 'Steel Dagger',
        type: ITEM_TYPES.WEAPON,
        description: 'Quick and deadly. +3 Attack, +2 Speed',
        sprite: 'sword',
        stats: { attack: 3, speed: 2 },
        value: 35,
        stackable: false
    },
    
    hunting_bow: {
        id: 'hunting_bow',
        name: 'Hunting Bow',
        type: ITEM_TYPES.WEAPON,
        description: 'For hunting game. +4 Attack (Ranged)',
        sprite: 'sword',
        stats: { attack: 4, ranged: true },
        value: 45,
        stackable: false
    },
    
    // Armor
    shield: {
        id: 'shield',
        name: 'Wooden Shield',
        type: ITEM_TYPES.ARMOR,
        description: 'Basic protection. +3 Defense',
        sprite: 'shield',
        stats: { defense: 3 },
        value: 30,
        stackable: false
    },
    
    leather_armor: {
        id: 'leather_armor',
        name: 'Leather Armor',
        type: ITEM_TYPES.ARMOR,
        description: 'Light protection. +2 Defense',
        sprite: 'shield',
        stats: { defense: 2 },
        value: 40,
        stackable: false
    },
    
    chainmail: {
        id: 'chainmail',
        name: 'Chainmail',
        type: ITEM_TYPES.ARMOR,
        description: 'Solid protection. +5 Defense',
        sprite: 'shield',
        stats: { defense: 5 },
        value: 80,
        stackable: false
    },
    
    // Consumables
    bread: {
        id: 'bread',
        name: 'Rye Bread',
        type: ITEM_TYPES.CONSUMABLE,
        description: 'Simple but filling. Restores 15 HP',
        sprite: 'bread',
        effect: { hp: 15 },
        value: 3,
        stackable: true
    },
    
    potion: {
        id: 'potion',
        name: 'Healing Draught',
        type: ITEM_TYPES.CONSUMABLE,
        description: "Marta's special remedy. Restores 40 HP",
        sprite: 'potion',
        effect: { hp: 40 },
        value: 25,
        stackable: true
    },
    
    strong_potion: {
        id: 'strong_potion',
        name: 'Potent Elixir',
        type: ITEM_TYPES.CONSUMABLE,
        description: "Zdena's powerful mixture. Restores 70 HP",
        sprite: 'potion',
        effect: { hp: 70 },
        value: 50,
        stackable: true
    },
    
    antidote: {
        id: 'antidote',
        name: 'Antidote',
        type: ITEM_TYPES.CONSUMABLE,
        description: 'Cures poison. Also restores 20 HP',
        sprite: 'potion',
        effect: { hp: 20, curePoison: true },
        value: 35,
        stackable: true
    },
    
    ale: {
        id: 'ale',
        name: 'Strong Ale',
        type: ITEM_TYPES.CONSUMABLE,
        description: 'Liquid courage. +10 HP, +1 temporary Attack',
        sprite: 'potion',
        effect: { hp: 10, tempAttack: 1 },
        value: 5,
        stackable: true
    },
    
    meat: {
        id: 'meat',
        name: 'Roasted Meat',
        type: ITEM_TYPES.CONSUMABLE,
        description: 'Hearty meal. Restores 30 HP',
        sprite: 'bread',
        effect: { hp: 30 },
        value: 8,
        stackable: true
    },
    
    // Currency
    coin: {
        id: 'coin',
        name: 'Groschen',
        type: ITEM_TYPES.MISC,
        description: 'Bohemian silver coin',
        sprite: 'coin',
        value: 1,
        stackable: true
    },
    
    gold_coin: {
        id: 'gold_coin',
        name: 'Golden Ducat',
        type: ITEM_TYPES.MISC,
        description: 'Valuable gold currency',
        sprite: 'coin',
        value: 10,
        stackable: true
    },
    
    // Quest Items
    key: {
        id: 'key',
        name: 'Rusty Key',
        type: ITEM_TYPES.QUEST,
        description: 'An old key. Who knows what it opens?',
        sprite: 'key',
        value: 0,
        stackable: false,
        questItem: true
    },
    
    master_key: {
        id: 'master_key',
        name: 'Master Key',
        type: ITEM_TYPES.QUEST,
        description: 'Opens many locks in the village',
        sprite: 'key',
        value: 100,
        stackable: false,
        questItem: true
    },
    
    scroll: {
        id: 'scroll',
        name: 'Worn Scroll',
        type: ITEM_TYPES.QUEST,
        description: "Ancient writing. Perhaps Father Metoděj can read it.",
        sprite: 'scroll',
        value: 10,
        stackable: false
    },
    
    herbs: {
        id: 'herbs',
        name: 'Medicinal Herbs',
        type: ITEM_TYPES.QUEST,
        description: 'Rare healing plants from the forest',
        sprite: 'potion',
        value: 15,
        stackable: true,
        questItem: true
    },
    
    stolen_tools: {
        id: 'stolen_tools',
        name: 'Blacksmith Tools',
        type: ITEM_TYPES.QUEST,
        description: "Václav's prized forging tools",
        sprite: 'hammer',
        value: 0,
        stackable: false,
        questItem: true
    },
    
    holy_relic: {
        id: 'holy_relic',
        name: "Saint's Relic",
        type: ITEM_TYPES.QUEST,
        description: 'A blessed artifact of great spiritual importance',
        sprite: 'scroll',
        value: 0,
        stackable: false,
        questItem: true
    },
    
    lute: {
        id: 'lute',
        name: "Matěj's Lute",
        type: ITEM_TYPES.QUEST,
        description: 'A beautiful stringed instrument, well-worn with use',
        sprite: 'scroll',
        value: 100,
        stackable: false,
        questItem: true
    },
    
    old_documents: {
        id: 'old_documents',
        name: 'Old Documents',
        type: ITEM_TYPES.QUEST,
        description: 'Yellowed papers revealing past events',
        sprite: 'scroll',
        value: 0,
        stackable: false,
        questItem: true
    },
    
    // Misc Items
    lockpick: {
        id: 'lockpick',
        name: 'Lockpick',
        type: ITEM_TYPES.MISC,
        description: 'For opening locks... quietly',
        sprite: 'key',
        value: 20,
        stackable: true
    },
    
    torch: {
        id: 'torch',
        name: 'Torch',
        type: ITEM_TYPES.MISC,
        description: 'Provides light in dark places',
        sprite: 'sword',
        value: 5,
        stackable: true
    },
    
    rope: {
        id: 'rope',
        name: 'Hemp Rope',
        type: ITEM_TYPES.MISC,
        description: 'Strong rope, useful for climbing',
        sprite: 'scroll',
        value: 10,
        stackable: true
    },
    
    lucky_charm: {
        id: 'lucky_charm',
        name: 'Lucky Charm',
        type: ITEM_TYPES.MISC,
        description: 'A small token that brings good fortune',
        sprite: 'coin',
        value: 15,
        stackable: false
    }
};

// Starting inventory
const STARTING_INVENTORY = [
    { itemId: 'bread', quantity: 3 },
    { itemId: 'coin', quantity: 20 }
];

// Shop inventories - Updated with new NPCs
const SHOP_INVENTORIES = {
    vaclav: [
        { itemId: 'sword', quantity: 2, price: 60 },
        { itemId: 'shield', quantity: 3, price: 35 },
        { itemId: 'hammer', quantity: 1, price: 75 },
        { itemId: 'dagger', quantity: 2, price: 40 }
    ],
    marta: [
        { itemId: 'bread', quantity: 10, price: 4 },
        { itemId: 'potion', quantity: 5, price: 30 },
        { itemId: 'ale', quantity: 8, price: 6 },
        { itemId: 'meat', quantity: 5, price: 10 }
    ],
    otto: [
        { itemId: 'potion', quantity: 3, price: 28 },
        { itemId: 'scroll', quantity: 2, price: 15 },
        { itemId: 'key', quantity: 1, price: 50 },
        { itemId: 'lockpick', quantity: 5, price: 25 },
        { itemId: 'leather_armor', quantity: 1, price: 45 },
        { itemId: 'hunting_bow', quantity: 1, price: 50 }
    ],
    baba_zdena: [
        { itemId: 'potion', quantity: 5, price: 25 },
        { itemId: 'strong_potion', quantity: 2, price: 55 },
        { itemId: 'antidote', quantity: 3, price: 40 },
        { itemId: 'herbs', quantity: 5, price: 18 }
    ],
    cizinec: [
        { itemId: 'dagger', quantity: 1, price: 35 },
        { itemId: 'lockpick', quantity: 10, price: 20 },
        { itemId: 'key', quantity: 2, price: 45 },
        { itemId: 'scroll', quantity: 3, price: 12 },
        { itemId: 'rope', quantity: 3, price: 12 }
    ]
};
