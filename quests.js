// Quest Data - Meaningful choices with consequences
// Version 2.0 - Expanded with new quests
const QUEST_DATA = {
    // Quest 1: The Blacksmith's Stolen Tools
    stolen_tools: {
        id: 'stolen_tools',
        title: "The Smith's Burden",
        description: "Václav's prized tools have been stolen. He suspects someone in the village.",
        giver: 'vaclav',
        stages: [
            {
                id: 'start',
                description: 'Speak with Václav about the stolen tools',
                objectives: [
                    { type: 'talk', target: 'vaclav', dialogueKey: 'quest_stolen_start' }
                ],
                nextStage: 'investigate'
            },
            {
                id: 'investigate',
                description: 'Investigate the theft - talk to witnesses',
                objectives: [
                    { type: 'talk', target: 'marta', dialogueKey: 'quest_stolen_witness', optional: true },
                    { type: 'talk', target: 'hana', dialogueKey: 'quest_stolen_witness2', optional: true },
                    { type: 'talk', target: 'borek', dialogueKey: 'quest_stolen_guard' }
                ],
                nextStage: 'choice'
            },
            {
                id: 'choice',
                description: 'Decide how to handle the thief',
                branches: {
                    merciful: {
                        description: 'Convince Václav to show mercy - the thief was desperate',
                        nextStage: 'merciful_end',
                        requirements: { reputation: { hana: 10 } }
                    },
                    justice: {
                        description: 'Turn the thief over to Captain Bořek',
                        nextStage: 'justice_end'
                    },
                    blackmail: {
                        description: 'Keep the secret for a price',
                        nextStage: 'blackmail_end',
                        requirements: { charisma: 3 }
                    }
                }
            },
            {
                id: 'merciful_end',
                description: 'Quest completed with mercy',
                rewards: {
                    reputation: { vaclav: 5, hana: 25, father_metodej: 15, borek: -10 },
                    items: [],
                    gold: 10
                },
                consequences: ['peasant_grateful', 'guard_disappointed']
            },
            {
                id: 'justice_end',
                description: 'Quest completed with justice',
                rewards: {
                    reputation: { vaclav: 15, borek: 20, hana: -20, karel: 10 },
                    items: ['sword'],
                    gold: 25
                },
                consequences: ['peasant_imprisoned', 'law_respected']
            },
            {
                id: 'blackmail_end',
                description: 'Quest completed through manipulation',
                rewards: {
                    reputation: { vaclav: -15, hana: -30 },
                    items: [],
                    gold: 50
                },
                consequences: ['corrupt_reputation', 'thief_resentful']
            }
        ],
        prerequisites: [],
        available: true
    },
    
    // Quest 2: Herbal Medicine
    find_herbs: {
        id: 'find_herbs',
        title: 'The Healing Herbs',
        description: "Hana's child is sick. Marta knows a remedy but needs rare herbs from the forest.",
        giver: 'marta',
        stages: [
            {
                id: 'start',
                description: 'Speak with Marta about the sick child',
                objectives: [
                    { type: 'talk', target: 'marta', dialogueKey: 'quest_herbs_start' }
                ],
                nextStage: 'gather'
            },
            {
                id: 'gather',
                description: 'Find medicinal herbs in the forest (3 needed)',
                objectives: [
                    { type: 'collect', item: 'herbs', count: 3, location: 'forest' }
                ],
                nextStage: 'return_or_sell'
            },
            {
                id: 'return_or_sell',
                description: 'Decide what to do with the herbs',
                branches: {
                    help: {
                        description: 'Give the herbs to Marta for the remedy',
                        nextStage: 'help_end'
                    },
                    sell: {
                        description: 'Sell the rare herbs to Otto for profit',
                        nextStage: 'sell_end'
                    },
                    priest: {
                        description: 'Ask Father Metoděj to pray for the child instead',
                        nextStage: 'priest_end'
                    }
                }
            },
            {
                id: 'help_end',
                description: 'The child is saved!',
                rewards: {
                    reputation: { marta: 25, hana: 30, father_metodej: 10 },
                    items: ['potion', 'potion'],
                    gold: 5
                },
                consequences: ['child_saved', 'healer_reputation']
            },
            {
                id: 'sell_end',
                description: 'You sold the herbs...',
                rewards: {
                    reputation: { marta: -30, hana: -40, otto: 15 },
                    items: [],
                    gold: 40
                },
                consequences: ['child_dies', 'greedy_reputation']
            },
            {
                id: 'priest_end',
                description: 'Faith provides comfort',
                rewards: {
                    reputation: { father_metodej: 20, hana: 10, marta: -5 },
                    items: ['scroll'],
                    gold: 0
                },
                consequences: ['child_recovers_slowly', 'pious_reputation']
            }
        ],
        prerequisites: [],
        available: true
    },
    
    // Quest 3: Bandit Threat
    bandit_threat: {
        id: 'bandit_threat',
        title: 'Wolves at the Gate',
        description: 'Bandits have been threatening travelers on the road. The mill is their next target.',
        giver: 'jiri',
        stages: [
            {
                id: 'start',
                description: 'Learn about the bandit threat from Jiří',
                objectives: [
                    { type: 'talk', target: 'jiri', dialogueKey: 'quest_bandit_start' }
                ],
                nextStage: 'prepare'
            },
            {
                id: 'prepare',
                description: 'Prepare for the confrontation',
                objectives: [
                    { type: 'talk', target: 'borek', dialogueKey: 'quest_bandit_guard', optional: true },
                    { type: 'talk', target: 'vaclav', dialogueKey: 'quest_bandit_weapon', optional: true },
                    { type: 'goto', location: 'bandit_camp', name: 'Find the bandit camp' }
                ],
                nextStage: 'confront'
            },
            {
                id: 'confront',
                description: 'Deal with the bandits',
                branches: {
                    fight: {
                        description: 'Fight the bandits head-on',
                        nextStage: 'fight_end',
                        requirements: { combat: 3 }
                    },
                    negotiate: {
                        description: 'Try to negotiate with their leader',
                        nextStage: 'negotiate_end',
                        requirements: { charisma: 4 }
                    },
                    guards: {
                        description: 'Lead Captain Bořek and his men to the camp',
                        nextStage: 'guards_end',
                        requirements: { reputation: { borek: 15 } }
                    },
                    pay: {
                        description: 'Pay them off with village funds',
                        nextStage: 'pay_end',
                        requirements: { gold: 100 }
                    }
                }
            },
            {
                id: 'fight_end',
                description: 'Victory through combat!',
                rewards: {
                    reputation: { jiri: 30, borek: 15, vaclav: 20, karel: 25 },
                    items: ['sword', 'shield'],
                    gold: 75
                },
                consequences: ['hero_reputation', 'bandits_defeated']
            },
            {
                id: 'negotiate_end',
                description: 'A deal is struck',
                rewards: {
                    reputation: { jiri: 10, borek: -10, otto: 20 },
                    items: [],
                    gold: 30
                },
                consequences: ['bandits_leave', 'compromise_reputation']
            },
            {
                id: 'guards_end',
                description: 'The law prevails!',
                rewards: {
                    reputation: { borek: 35, jiri: 20, karel: 20, radek: 15 },
                    items: ['coin', 'coin', 'coin'],
                    gold: 50
                },
                consequences: ['bandits_captured', 'lawful_reputation']
            },
            {
                id: 'pay_end',
                description: 'Peace through gold',
                rewards: {
                    reputation: { jiri: 5, borek: -25, marta: -15 },
                    items: [],
                    gold: -100
                },
                consequences: ['bandits_return_later', 'coward_reputation']
            }
        ],
        prerequisites: [],
        available: true
    },
    
    // Quest 4: The Lost Relic
    lost_relic: {
        id: 'lost_relic',
        title: "The Saint's Blessing",
        description: 'A holy relic has gone missing from the church. Father Metoděj fears dark forces.',
        giver: 'father_metodej',
        stages: [
            {
                id: 'start',
                description: 'Speak with Father Metoděj about the missing relic',
                objectives: [
                    { type: 'talk', target: 'father_metodej', dialogueKey: 'quest_relic_start' }
                ],
                nextStage: 'search'
            },
            {
                id: 'search',
                description: 'Search for clues about the relic',
                objectives: [
                    { type: 'talk', target: 'karel', dialogueKey: 'quest_relic_noble' },
                    { type: 'goto', location: 'church_cellar', name: 'Search the church cellar' }
                ],
                nextStage: 'discovery'
            },
            {
                id: 'discovery',
                description: 'You discover Karel took it for his collection',
                branches: {
                    confront: {
                        description: 'Confront Karel publicly',
                        nextStage: 'public_end'
                    },
                    private: {
                        description: 'Handle this privately',
                        nextStage: 'private_end'
                    },
                    steal: {
                        description: 'Steal it back secretly',
                        nextStage: 'steal_end'
                    }
                }
            },
            {
                id: 'public_end',
                description: 'Karel is publicly shamed',
                rewards: {
                    reputation: { father_metodej: 35, karel: -50, borek: 10 },
                    items: ['scroll'],
                    gold: 20
                },
                consequences: ['noble_enemy', 'church_grateful']
            },
            {
                id: 'private_end',
                description: 'A quiet resolution',
                rewards: {
                    reputation: { father_metodej: 20, karel: 10 },
                    items: ['potion'],
                    gold: 50
                },
                consequences: ['noble_debt', 'diplomatic_reputation']
            },
            {
                id: 'steal_end',
                description: 'The relic returns mysteriously',
                rewards: {
                    reputation: { father_metodej: 15 },
                    items: ['key'],
                    gold: 0
                },
                consequences: ['mysterious_reputation', 'stealth_skill']
            }
        ],
        prerequisites: [{ type: 'reputation', target: 'father_metodej', value: 10 }],
        available: false
    },
    
    // === NEW QUESTS ===
    
    // Quest 5: The Witch Hunt
    witch_hunt: {
        id: 'witch_hunt',
        title: 'The Witch of Skalice',
        description: 'Some villagers suspect Baba Zdena of witchcraft. Father Metoděj seeks the truth.',
        giver: 'baba_zdena',
        stages: [
            {
                id: 'start',
                description: 'Speak with Baba Zdena about the accusations',
                objectives: [
                    { type: 'talk', target: 'baba_zdena', dialogueKey: 'quest_witch_start' }
                ],
                nextStage: 'investigate'
            },
            {
                id: 'investigate',
                description: 'Investigate the witchcraft claims',
                objectives: [
                    { type: 'talk', target: 'father_metodej', dialogueKey: 'quest_witch_priest' },
                    { type: 'talk', target: 'hana', dialogueKey: 'quest_witch_hana' },
                    { type: 'talk', target: 'marta', dialogueKey: 'quest_witch_marta' }
                ],
                nextStage: 'decision'
            },
            {
                id: 'decision',
                description: 'Decide Zdena\'s fate',
                branches: {
                    defend: {
                        description: 'Defend Zdena - she is just a healer',
                        nextStage: 'defend_end'
                    },
                    accuse: {
                        description: 'Support the accusations against her',
                        nextStage: 'accuse_end'
                    },
                    relocate: {
                        description: 'Help her leave the village quietly',
                        nextStage: 'relocate_end'
                    }
                }
            },
            {
                id: 'defend_end',
                description: 'Zdena stays as the village healer',
                rewards: {
                    reputation: { baba_zdena: 40, hana: 20, father_metodej: -10 },
                    items: ['potion', 'potion', 'herbs'],
                    gold: 15
                },
                consequences: ['healer_saved', 'church_tension']
            },
            {
                id: 'accuse_end',
                description: 'Zdena is driven from the village',
                rewards: {
                    reputation: { father_metodej: 25, baba_zdena: -50, hana: -30 },
                    items: ['scroll'],
                    gold: 30
                },
                consequences: ['healer_gone', 'village_fear']
            },
            {
                id: 'relocate_end',
                description: 'Zdena leaves peacefully',
                rewards: {
                    reputation: { baba_zdena: 20, father_metodej: 5 },
                    items: ['key'],
                    gold: 0
                },
                consequences: ['compromise_made']
            }
        ],
        prerequisites: [],
        available: true
    },
    
    // Quest 6: Guard Training
    guard_training: {
        id: 'guard_training',
        title: "A Guard's Duty",
        description: 'Young Radek wants to prove himself as a capable guard.',
        giver: 'radek',
        stages: [
            {
                id: 'start',
                description: 'Speak with Radek about his training',
                objectives: [
                    { type: 'talk', target: 'radek', dialogueKey: 'quest_guard_start' }
                ],
                nextStage: 'train'
            },
            {
                id: 'train',
                description: 'Help Radek with his training',
                objectives: [
                    { type: 'talk', target: 'vaclav', dialogueKey: 'quest_guard_smith' },
                    { type: 'talk', target: 'borek', dialogueKey: 'quest_guard_captain' }
                ],
                nextStage: 'test'
            },
            {
                id: 'test',
                description: 'Help Radek prove himself',
                branches: {
                    combat: {
                        description: 'Train him in combat',
                        nextStage: 'combat_end'
                    },
                    wisdom: {
                        description: 'Teach him wisdom over strength',
                        nextStage: 'wisdom_end'
                    },
                    cheat: {
                        description: 'Help him cheat his test',
                        nextStage: 'cheat_end'
                    }
                }
            },
            {
                id: 'combat_end',
                description: 'Radek becomes a skilled fighter',
                rewards: {
                    reputation: { radek: 30, borek: 20, vaclav: 15 },
                    items: ['shield'],
                    gold: 20
                },
                consequences: ['warrior_trained']
            },
            {
                id: 'wisdom_end',
                description: 'Radek learns to think before acting',
                rewards: {
                    reputation: { radek: 25, borek: 15, father_metodej: 10 },
                    items: ['scroll'],
                    gold: 15
                },
                consequences: ['wise_guard']
            },
            {
                id: 'cheat_end',
                description: 'Radek passes but learns nothing',
                rewards: {
                    reputation: { radek: 10, borek: -20 },
                    items: [],
                    gold: 40
                },
                consequences: ['false_success']
            }
        ],
        prerequisites: [],
        available: true
    },
    
    // Quest 7: The Lost Lute
    lost_lute: {
        id: 'lost_lute',
        title: "The Bard's Sorrow",
        description: "Matěj's beloved lute has gone missing. Without it, he cannot earn his living.",
        giver: 'matej',
        stages: [
            {
                id: 'start',
                description: 'Speak with Matěj about his missing lute',
                objectives: [
                    { type: 'talk', target: 'matej', dialogueKey: 'quest_lute_start' }
                ],
                nextStage: 'search'
            },
            {
                id: 'search',
                description: 'Search for the missing lute',
                objectives: [
                    { type: 'talk', target: 'marta', dialogueKey: 'quest_lute_marta' },
                    { type: 'talk', target: 'otto', dialogueKey: 'quest_lute_otto' }
                ],
                nextStage: 'found'
            },
            {
                id: 'found',
                description: 'The lute was pawned by a desperate thief',
                branches: {
                    buy: {
                        description: 'Buy back the lute',
                        nextStage: 'buy_end',
                        requirements: { gold: 30 }
                    },
                    negotiate: {
                        description: 'Negotiate with Otto for it',
                        nextStage: 'negotiate_end'
                    },
                    steal: {
                        description: 'Steal it back from Otto',
                        nextStage: 'steal_end'
                    }
                }
            },
            {
                id: 'buy_end',
                description: 'You buy back the lute',
                rewards: {
                    reputation: { matej: 35, otto: 10 },
                    items: [],
                    gold: -30
                },
                consequences: ['bard_grateful']
            },
            {
                id: 'negotiate_end',
                description: 'Otto agrees to return it for a favor',
                rewards: {
                    reputation: { matej: 25, otto: 15 },
                    items: ['scroll'],
                    gold: 0
                },
                consequences: ['merchant_favor']
            },
            {
                id: 'steal_end',
                description: 'You steal the lute back',
                rewards: {
                    reputation: { matej: 30, otto: -25 },
                    items: [],
                    gold: 0
                },
                consequences: ['thief_reputation']
            }
        ],
        prerequisites: [],
        available: true
    },
    
    // Quest 8: The Dark Secret
    dark_secret: {
        id: 'dark_secret',
        title: 'Shadows of the Past',
        description: 'The mysterious stranger knows something about a dark event in Skalice\'s history.',
        giver: 'cizinec',
        stages: [
            {
                id: 'start',
                description: 'Speak with the mysterious stranger',
                objectives: [
                    { type: 'talk', target: 'cizinec', dialogueKey: 'quest_secret_start' }
                ],
                nextStage: 'investigate'
            },
            {
                id: 'investigate',
                description: 'Uncover the village\'s dark past',
                objectives: [
                    { type: 'talk', target: 'father_metodej', dialogueKey: 'quest_secret_priest' },
                    { type: 'talk', target: 'baba_zdena', dialogueKey: 'quest_secret_healer' },
                    { type: 'goto', location: 'church_cellar', name: 'Search for old records' }
                ],
                nextStage: 'revelation'
            },
            {
                id: 'revelation',
                description: 'The stranger seeks revenge for his family',
                branches: {
                    expose: {
                        description: 'Help expose the guilty parties',
                        nextStage: 'expose_end'
                    },
                    protect: {
                        description: 'Protect the village from this truth',
                        nextStage: 'protect_end'
                    },
                    negotiate_peace: {
                        description: 'Broker peace between past and present',
                        nextStage: 'peace_end'
                    }
                }
            },
            {
                id: 'expose_end',
                description: 'Old sins come to light',
                rewards: {
                    reputation: { cizinec: 40, father_metodej: -20, karel: -30 },
                    items: ['sword', 'key'],
                    gold: 50
                },
                consequences: ['truth_revealed', 'village_shaken']
            },
            {
                id: 'protect_end',
                description: 'The past stays buried',
                rewards: {
                    reputation: { father_metodej: 20, karel: 15, cizinec: -40 },
                    items: ['scroll'],
                    gold: 40
                },
                consequences: ['secrets_kept', 'enemy_made']
            },
            {
                id: 'peace_end',
                description: 'Reconciliation achieved',
                rewards: {
                    reputation: { cizinec: 25, father_metodej: 15, marta: 10 },
                    items: ['potion', 'potion'],
                    gold: 25
                },
                consequences: ['peace_made', 'wisdom_shown']
            }
        ],
        prerequisites: [{ type: 'quest', questId: 'lost_relic', state: 'completed' }],
        available: false
    }
};

// Quest consequence descriptions
const CONSEQUENCE_DESCRIPTIONS = {
    peasant_grateful: 'The peasant family remembers your kindness.',
    guard_disappointed: 'Captain Bořek questions your respect for the law.',
    peasant_imprisoned: 'A harsh but lawful outcome.',
    law_respected: 'Your dedication to justice is noted.',
    corrupt_reputation: 'Whispers of your dishonesty spread.',
    thief_resentful: 'You\'ve made an enemy.',
    child_saved: 'A young life preserved.',
    child_dies: 'The village mourns.',
    child_recovers_slowly: 'Faith provides healing, in time.',
    healer_reputation: 'People seek your aid.',
    greedy_reputation: 'Gold over lives? The village remembers.',
    pious_reputation: 'Your faith is admired.',
    hero_reputation: 'Songs will be sung of your bravery!',
    bandits_defeated: 'The roads are safe again.',
    bandits_leave: 'For now, at least...',
    compromise_reputation: 'Some call it wisdom, others weakness.',
    bandits_captured: 'Justice is served.',
    lawful_reputation: 'A pillar of order.',
    bandits_return_later: 'Gold only delays the inevitable.',
    coward_reputation: 'They laugh behind your back.',
    noble_enemy: 'The nobility has a long memory.',
    church_grateful: 'Blessings upon you.',
    noble_debt: 'Karel owes you a favor.',
    diplomatic_reputation: 'You navigate troubled waters well.',
    mysterious_reputation: 'None know what you\'re truly capable of.',
    stealth_skill: 'Your talents are... varied.',
    healer_saved: 'Zdena continues her work in the village.',
    church_tension: 'There is friction with the church.',
    healer_gone: 'The village loses its healer.',
    village_fear: 'Superstition grips the village.',
    compromise_made: 'A peaceful resolution, though not perfect.',
    warrior_trained: 'Radek becomes a formidable fighter.',
    wise_guard: 'Radek learns to lead with wisdom.',
    false_success: 'Success built on sand.',
    bard_grateful: 'Matěj will sing your praises!',
    merchant_favor: 'Otto owes you a debt.',
    thief_reputation: 'Some methods work, but at what cost?',
    truth_revealed: 'The past cannot hide forever.',
    village_shaken: 'Old wounds are reopened.',
    secrets_kept: 'Some things are better left buried.',
    enemy_made: 'The stranger will not forget.',
    peace_made: 'Old grudges are laid to rest.',
    wisdom_shown: 'Your diplomacy is admired.'
};
