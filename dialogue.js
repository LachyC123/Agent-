// Dialogue System - Branching conversations
const DIALOGUE_DATA = {
    // ==================== VÁCLAV THE BLACKSMITH ====================
    vaclav: {
        greeting: {
            text: "Hm? What do you want? Can't you see I'm working?",
            speaker: 'Václav',
            responses: [
                { text: "I seek work, master smith.", next: 'work_inquiry', reputation: 0 },
                { text: "I've heard you have troubles.", next: 'quest_stolen_start', condition: { quest: 'stolen_tools', state: 'available' } },
                { text: "I'd like to trade.", next: 'trade', action: 'openTrade' },
                { text: "Farewell.", next: null }
            ]
        },
        work_inquiry: {
            text: "Work? Ha! In these times? The roads aren't safe, trade is slow... but if you prove yourself useful, perhaps we can talk.",
            speaker: 'Václav',
            responses: [
                { text: "What kind of troubles?", next: 'quest_stolen_start' },
                { text: "I understand. Good day.", next: null }
            ]
        },
        quest_stolen_start: {
            text: "My tools! Someone stole my finest tools last night. Without them, I cannot work the best steel. I suspect that no-good layabout who lurks by the inn...",
            speaker: 'Václav',
            responses: [
                { text: "I'll help you find them.", next: 'quest_accept', action: 'startQuest', questId: 'stolen_tools' },
                { text: "Why should I care?", next: 'quest_refuse', reputation: -5 },
                { text: "What will you pay?", next: 'quest_payment' }
            ]
        },
        quest_accept: {
            text: "Good. Talk to people, someone must have seen something. Captain Bořek might help too, though he's been useless so far.",
            speaker: 'Václav',
            responses: [
                { text: "I'll begin at once.", next: null },
                { text: "Any suspects?", next: 'quest_suspects' }
            ]
        },
        quest_suspects: {
            text: "There's a peasant family... times are hard for them. But theft is theft. The law must be upheld, or we're no better than the bandits on the roads.",
            speaker: 'Václav',
            responses: [
                { text: "I understand.", next: null },
                { text: "Perhaps they had reason...", next: 'quest_sympathy', reputation: -2 }
            ]
        },
        quest_sympathy: {
            text: "Reason? BAH! My livelihood is at stake! Just find my tools.",
            speaker: 'Václav',
            responses: [
                { text: "As you wish.", next: null }
            ]
        },
        quest_refuse: {
            text: "Typical. No one cares about honest craftsmen anymore.",
            speaker: 'Václav',
            responses: [
                { text: "[Leave]", next: null }
            ]
        },
        quest_payment: {
            text: "Payment? I'll forge you a blade worth ten times what any merchant would charge. That's my word as a smith.",
            speaker: 'Václav',
            responses: [
                { text: "That's fair. I'll help.", next: 'quest_accept', action: 'startQuest', questId: 'stolen_tools' },
                { text: "I need coin, not steel.", next: 'quest_refuse', reputation: -3 }
            ]
        },
        quest_complete_merciful: {
            text: "You... let them go? I... suppose the tools are returned. Perhaps I was too harsh. Times are difficult for everyone.",
            speaker: 'Václav',
            reputation: 5,
            responses: [
                { text: "Mercy costs nothing.", next: null }
            ]
        },
        quest_complete_justice: {
            text: "Justice is served! Here, as promised - my finest blade. You've earned it.",
            speaker: 'Václav',
            reputation: 15,
            responses: [
                { text: "Thank you, master smith.", next: null, action: 'giveReward' }
            ]
        },
        trade: {
            text: "Looking for quality steel? You've come to the right place.",
            speaker: 'Václav',
            responses: [
                { text: "[View wares]", next: null, action: 'openShop' },
                { text: "Perhaps later.", next: null }
            ]
        }
    },

    // ==================== MARTA THE INNKEEPER ====================
    marta: {
        greeting: {
            text: "Welcome to the Golden Tankard! Rest your feet, warm your belly. What brings you here, traveler?",
            speaker: 'Marta',
            responses: [
                { text: "Just passing through.", next: 'passing_through' },
                { text: "What news of the village?", next: 'village_news' },
                { text: "I heard someone's child is sick?", next: 'quest_herbs_start', condition: { quest: 'find_herbs', state: 'available' } },
                { text: "I'd like to buy something.", next: 'trade', action: 'openTrade' },
                { text: "Farewell.", next: null }
            ]
        },
        passing_through: {
            text: "Aren't we all, dear? But Skalice is a good place to linger. If you need coin, there's always work for capable folk.",
            speaker: 'Marta',
            responses: [
                { text: "What kind of work?", next: 'work_hints' },
                { text: "I'll keep that in mind.", next: null }
            ]
        },
        work_hints: {
            text: "The smith's been grumbling about missing tools. The miller fears bandits. Father Metoděj seems troubled. And poor Hana's child... well, that's a sad tale.",
            speaker: 'Marta',
            responses: [
                { text: "Tell me about Hana's child.", next: 'quest_herbs_start' },
                { text: "Bandits, you say?", next: 'bandit_info' },
                { text: "Thank you for the information.", next: null }
            ]
        },
        village_news: {
            text: "Oh, where to begin! Young Karel's been making a nuisance of himself, the roads aren't safe, and there's been theft! Imagine, in our peaceful village!",
            speaker: 'Marta',
            responses: [
                { text: "Tell me about Karel.", next: 'karel_gossip' },
                { text: "Theft? What happened?", next: 'theft_gossip' },
                { text: "Interesting. I may look into this.", next: null }
            ]
        },
        karel_gossip: {
            text: "The young lord thinks he's above us common folk. Always collecting things, hoarding trinkets. Between you and me, he's got sticky fingers for anything that catches his eye.",
            speaker: 'Marta',
            responses: [
                { text: "Interesting...", next: null, flag: 'karel_collector' }
            ]
        },
        theft_gossip: {
            text: "Václav's tools went missing. He blames everyone and no one. But I saw someone skulking about that night... looked like one of the peasants from the outlying farms.",
            speaker: 'Marta',
            responses: [
                { text: "Which peasant?", next: 'theft_witness' },
                { text: "Thank you for telling me.", next: null }
            ]
        },
        theft_witness: {
            text: "I couldn't see clearly in the dark, but... the silhouette reminded me of Hana's husband. Don't tell anyone I said this - they're good people, just desperate.",
            speaker: 'Marta',
            responses: [
                { text: "Your secret is safe.", next: null, flag: 'knows_thief' },
                { text: "The law is the law.", next: null, flag: 'knows_thief', reputation: -5 }
            ]
        },
        quest_herbs_start: {
            text: "Oh, it breaks my heart! Little Tomáš has the fever. I know a remedy, but it needs rare herbs from deep in the forest. I'm too old for such journeys...",
            speaker: 'Marta',
            responses: [
                { text: "I'll find these herbs.", next: 'quest_herbs_accept', action: 'startQuest', questId: 'find_herbs' },
                { text: "What herbs exactly?", next: 'quest_herbs_details' },
                { text: "I'm sorry, I can't help.", next: null }
            ]
        },
        quest_herbs_details: {
            text: "Valerian root, yarrow, and elderflower. They grow near the old ruins in the forest, where few dare to tread. You'll know them by their distinct scent.",
            speaker: 'Marta',
            responses: [
                { text: "I'll find them.", next: 'quest_herbs_accept', action: 'startQuest', questId: 'find_herbs' },
                { text: "That sounds dangerous...", next: 'quest_herbs_danger' }
            ]
        },
        quest_herbs_danger: {
            text: "A child's life hangs in the balance. Is any danger too great?",
            speaker: 'Marta',
            responses: [
                { text: "You're right. I'll go.", next: 'quest_herbs_accept', action: 'startQuest', questId: 'find_herbs' },
                { text: "I'm sorry, I cannot.", next: null, reputation: -10 }
            ]
        },
        quest_herbs_accept: {
            text: "Bless you, truly! Hurry - time is not on our side. Look near the forest ruins.",
            speaker: 'Marta',
            responses: [
                { text: "I'll return as quickly as I can.", next: null }
            ]
        },
        bandit_info: {
            text: "Aye, there's a band of them in the forest. They've been demanding 'protection' money from travelers. The miller's next on their list, poor soul.",
            speaker: 'Marta',
            responses: [
                { text: "Someone should do something.", next: null },
                { text: "Where exactly are they?", next: 'bandit_location' }
            ]
        },
        bandit_location: {
            text: "They have a camp by the old watchtower ruins, northeast of the mill. Be careful if you go there - they're desperate men.",
            speaker: 'Marta',
            responses: [
                { text: "Thank you for the warning.", next: null, flag: 'knows_bandit_camp' }
            ]
        },
        trade: {
            text: "Of course, dear! Fresh bread, good ale, and my special healing draughts.",
            speaker: 'Marta',
            responses: [
                { text: "[View wares]", next: null, action: 'openShop' },
                { text: "Perhaps later.", next: null }
            ]
        }
    },

    // ==================== JIŘÍ THE MILLER ====================
    jiri: {
        greeting: {
            text: "Oh! A visitor! Please, you must help me! The bandits... they're coming!",
            speaker: 'Jiří',
            responses: [
                { text: "Calm yourself. What bandits?", next: 'quest_bandit_start' },
                { text: "Not my problem.", next: 'refuse', reputation: -5 },
                { text: "I've already heard. I'm looking into it.", next: 'already_know', condition: { flag: 'knows_bandit_camp' } }
            ]
        },
        quest_bandit_start: {
            text: "A band of cutthroats! They've been extorting everyone on the roads. Now they say they'll burn my mill if I don't pay! I can't afford it!",
            speaker: 'Jiří',
            responses: [
                { text: "I'll deal with them.", next: 'quest_accept', action: 'startQuest', questId: 'bandit_threat' },
                { text: "Have you told Captain Bořek?", next: 'told_guard' },
                { text: "How much do they want?", next: 'bandit_demand' }
            ]
        },
        told_guard: {
            text: "The Captain says he doesn't have enough men to hunt bandits! He's more concerned with protecting the noble's manor than honest workers like me!",
            speaker: 'Jiří',
            responses: [
                { text: "I'll help where the guards won't.", next: 'quest_accept', action: 'startQuest', questId: 'bandit_threat' },
                { text: "Perhaps I can convince him.", next: null, flag: 'will_talk_borek' }
            ]
        },
        bandit_demand: {
            text: "One hundred groschen! That's half a year's earnings! If I pay, I'll starve. If I don't, I'll burn. Either way, I'm ruined!",
            speaker: 'Jiří',
            responses: [
                { text: "There must be another way. I'll help.", next: 'quest_accept', action: 'startQuest', questId: 'bandit_threat' },
                { text: "A difficult position indeed.", next: null }
            ]
        },
        quest_accept: {
            text: "You will? God bless you! Their camp is in the forest, near the old watchtower. Be careful - their leader is a big man with a scarred face.",
            speaker: 'Jiří',
            responses: [
                { text: "I'll handle it.", next: null },
                { text: "Any weaknesses I should know about?", next: 'bandit_weakness' }
            ]
        },
        bandit_weakness: {
            text: "I've heard they drink heavily at night. And there's discord among them - the leader is cruel even to his own men. Perhaps that could be exploited...",
            speaker: 'Jiří',
            responses: [
                { text: "Useful information. Thank you.", next: null, flag: 'bandit_weakness_known' }
            ]
        },
        already_know: {
            text: "You do? Oh, praise be! Please, deal with them before they return!",
            speaker: 'Jiří',
            responses: [
                { text: "I'll see what I can do.", next: null }
            ]
        },
        refuse: {
            text: "Please! I have a family! Won't anyone help us?!",
            speaker: 'Jiří',
            responses: [
                { text: "[Leave]", next: null }
            ]
        }
    },

    // ==================== CAPTAIN BOŘEK ====================
    borek: {
        greeting: {
            text: "State your business. I have little time for idle chat.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "I'm investigating the tool theft.", next: 'quest_stolen_guard', condition: { quest: 'stolen_tools', state: 'active' } },
                { text: "I need help with the bandits.", next: 'quest_bandit_guard', condition: { quest: 'bandit_threat', state: 'active' } },
                { text: "Just observing the peace.", next: 'observing' },
                { text: "Farewell, Captain.", next: null }
            ]
        },
        observing: {
            text: "Hmph. See that you don't disturb it.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "[Leave]", next: null }
            ]
        },
        quest_stolen_guard: {
            text: "The smith's tools? Yes, I'm aware. Petty theft is beneath my attention when bandits threaten the roads. But if you've found something...",
            speaker: 'Captain Bořek',
            responses: [
                { text: "I know who did it.", next: 'thief_reveal', condition: { flag: 'knows_thief' } },
                { text: "I'm still investigating.", next: 'still_investigating' },
                { text: "Perhaps you could help search.", next: 'help_search' }
            ]
        },
        thief_reveal: {
            text: "You do? Well then, justice must be served. Give me the name and I'll make an arrest.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "It was one of the peasant families. Desperate times.", next: 'arrest_peasant' },
                { text: "I'd rather handle this another way.", next: 'another_way' },
                { text: "I need more proof first.", next: 'need_proof' }
            ]
        },
        arrest_peasant: {
            text: "Desperation is no excuse for theft. The law must be upheld, or chaos follows. I'll send men to make the arrest. You've done well.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "Justice is served.", next: null, action: 'questChoice', choice: 'justice' },
                { text: "Wait - perhaps there's another way.", next: 'another_way' }
            ]
        },
        another_way: {
            text: "Another way? The law is the law. But... if the tools are returned and compensation made, perhaps we could overlook this. Once.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "That's fair. I'll arrange it.", next: null, action: 'questChoice', choice: 'merciful' },
                { text: "No, arrest them.", next: null, action: 'questChoice', choice: 'justice' }
            ]
        },
        need_proof: {
            text: "Then get it. Don't waste my time with suspicions.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "[Leave]", next: null }
            ]
        },
        still_investigating: {
            text: "Then why are you bothering me? Come back with results.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "[Leave]", next: null }
            ]
        },
        help_search: {
            text: "I have three men for an entire region. If you want this solved, you'll have to do the legwork. Report what you find.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "Understood.", next: null }
            ]
        },
        quest_bandit_guard: {
            text: "The bandits? I know of them. My hands are tied - Lord Karel demands I protect his estate, not chase outlaws through the forest.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "What if I found their camp?", next: 'found_camp' },
                { text: "The people need protection too.", next: 'people_need' },
                { text: "I'll handle it myself then.", next: 'handle_self' }
            ]
        },
        found_camp: {
            text: "You know where they hide? That changes things. If we can strike fast and hard, before they scatter... I could spare two men for a night raid.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "Let's do it. I'll lead you there.", next: null, action: 'questChoice', choice: 'guards', requirement: { reputation: { borek: 15 } } },
                { text: "Good to know. I'll consider it.", next: null }
            ]
        },
        people_need: {
            text: "You think I don't know that? I'm one man, with orders from above. If you want to help, find their camp and bring me something I can act on.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "I'll find it.", next: null },
                { text: "Politics over people. Typical.", next: null, reputation: -10 }
            ]
        },
        handle_self: {
            text: "Brave or foolish, I can't tell which. Don't get yourself killed - I've enough paperwork as it is.",
            speaker: 'Captain Bořek',
            responses: [
                { text: "I'll manage.", next: null }
            ]
        }
    },

    // ==================== FATHER METODĚJ ====================
    father_metodej: {
        greeting: {
            text: "Peace be upon you, my child. What brings you to this house of God?",
            speaker: 'Father Metoděj',
            responses: [
                { text: "I seek guidance, Father.", next: 'guidance' },
                { text: "Something troubles you. I can see it.", next: 'quest_relic_start', condition: { quest: 'lost_relic', state: 'available' } },
                { text: "Just paying respects.", next: 'respects' },
                { text: "Farewell, Father.", next: null }
            ]
        },
        guidance: {
            text: "Guidance... yes. In these troubled times, we all seek the light. What weighs upon your soul?",
            speaker: 'Father Metoděj',
            responses: [
                { text: "I must make difficult choices.", next: 'difficult_choices' },
                { text: "The village has many troubles.", next: 'village_troubles' },
                { text: "Nothing specific. Just seeking wisdom.", next: 'general_wisdom' }
            ]
        },
        difficult_choices: {
            text: "Choices reveal who we truly are. Remember - mercy and justice are not enemies. The wisest path often lies between extremes.",
            speaker: 'Father Metoděj',
            responses: [
                { text: "Thank you, Father.", next: null, reputation: 5 }
            ]
        },
        village_troubles: {
            text: "Indeed. Bandits on the roads, theft in the village, a sick child... and my own burden as well. These are dark days.",
            speaker: 'Father Metoděj',
            responses: [
                { text: "What burden do you carry?", next: 'quest_relic_start' },
                { text: "I'm trying to help where I can.", next: 'trying_help' }
            ]
        },
        trying_help: {
            text: "Then you are blessed. Go with God's grace, and may your deeds bring light to this darkness.",
            speaker: 'Father Metoděj',
            responses: [
                { text: "Thank you, Father.", next: null, reputation: 5 }
            ]
        },
        general_wisdom: {
            text: "Then hear this: every soul has worth, every deed has consequence. Judge not by appearances, for even the lowliest peasant may have noble heart.",
            speaker: 'Father Metoděj',
            responses: [
                { text: "Wise words indeed.", next: null, reputation: 3 }
            ]
        },
        respects: {
            text: "The Lord welcomes all who come with humble heart. May He guide your path.",
            speaker: 'Father Metoděj',
            responses: [
                { text: "And yours, Father.", next: null }
            ]
        },
        quest_relic_start: {
            text: "You are perceptive... Yes, a great misfortune has befallen us. The Relic of Saint Adalbert - a blessed bone fragment - has vanished from our altar. I fear... dark forces.",
            speaker: 'Father Metoděj',
            responses: [
                { text: "I'll help you find it.", next: 'quest_relic_accept', action: 'startQuest', questId: 'lost_relic' },
                { text: "Could it simply have been stolen?", next: 'relic_stolen' },
                { text: "That sounds serious. I'm sorry.", next: null }
            ]
        },
        relic_stolen: {
            text: "Stolen? Who would dare steal from God's house? Yet... perhaps you are right. There are those who covet sacred things for worldly reasons.",
            speaker: 'Father Metoděj',
            responses: [
                { text: "Let me investigate.", next: 'quest_relic_accept', action: 'startQuest', questId: 'lost_relic' },
                { text: "I'll keep my eyes open.", next: null }
            ]
        },
        quest_relic_accept: {
            text: "Bless you, child. The relic was kept in the chapel cellar. Perhaps there are clues there. And... speak to young Karel. He has an unhealthy interest in relics and antiquities.",
            speaker: 'Father Metoděj',
            responses: [
                { text: "I'll begin my search.", next: null }
            ]
        }
    },

    // ==================== KAREL OF LIPANY (NOBLE) ====================
    karel: {
        greeting: {
            text: "Ah, a commoner approaches. Make it quick - my time is valuable.",
            speaker: 'Karel',
            responses: [
                { text: "My lord, I seek information.", next: 'seek_info' },
                { text: "I've heard you collect antiquities.", next: 'quest_relic_noble', condition: { quest: 'lost_relic', state: 'active' } },
                { text: "Your arrogance is tiresome.", next: 'arrogance', reputation: -10 },
                { text: "[Leave without a word]", next: null }
            ]
        },
        seek_info: {
            text: "Information? I'm not some peasant gossip. Though I suppose even commoners occasionally prove useful. What do you want to know?",
            speaker: 'Karel',
            responses: [
                { text: "Tell me about the village.", next: 'about_village' },
                { text: "What do you know of the bandits?", next: 'about_bandits' },
                { text: "Never mind.", next: null }
            ]
        },
        about_village: {
            text: "Skalice? A backwater. My father holds these lands, but there's little of worth here. The peasants are poor, the smith is competent, and the inn serves acceptable ale. That's all you need to know.",
            speaker: 'Karel',
            responses: [
                { text: "You have a low opinion of your subjects.", next: 'low_opinion' },
                { text: "I see. Thank you.", next: null }
            ]
        },
        low_opinion: {
            text: "They're not MY subjects - not yet. When I inherit, things will be different. More order, more productivity, less... sentiment.",
            speaker: 'Karel',
            responses: [
                { text: "I'm sure they can't wait.", next: null, reputation: -5 }
            ]
        },
        about_bandits: {
            text: "Bandits are a peasant problem. Let the guards handle it. I've instructed Captain Bořek to prioritize the manor's security. Can't have riffraff threatening proper folk.",
            speaker: 'Karel',
            responses: [
                { text: "The villagers need protection too.", next: 'villagers_need' },
                { text: "Of course, my lord.", next: null }
            ]
        },
        villagers_need: {
            text: "They have their hovels and their pitchforks. If they can't protect themselves, perhaps they don't deserve protecting. Natural selection, as it were.",
            speaker: 'Karel',
            responses: [
                { text: "That's cold.", next: null, reputation: -3 },
                { text: "[Bite your tongue and leave]", next: null }
            ]
        },
        arrogance: {
            text: "Tiresome? TIRESOME? Do you know who I am?! Guards! ...oh, they're not here. Well. Remember your place, peasant.",
            speaker: 'Karel',
            responses: [
                { text: "[Leave before he causes more trouble]", next: null }
            ]
        },
        quest_relic_noble: {
            text: "Antiquities? I have a modest collection, yes. Coins, old weapons, artifacts of historical significance. Why do you ask?",
            speaker: 'Karel',
            responses: [
                { text: "The church is missing a relic.", next: 'relic_accusation' },
                { text: "Just curious about local history.", next: 'just_curious' }
            ]
        },
        relic_accusation: {
            text: "And you think I... How DARE you! I am a man of noble blood! I don't STEAL, I... acquire. Through proper channels. Mostly.",
            speaker: 'Karel',
            responses: [
                { text: "Return it. No one needs to know.", next: 'return_private', flag: 'relic_found' },
                { text: "Father Metoděj will hear of this.", next: 'public_shame', flag: 'relic_found' },
                { text: "I could retrieve it myself... quietly.", next: 'steal_back', flag: 'relic_found' }
            ]
        },
        return_private: {
            text: "You... you would keep this quiet? Perhaps I misjudged you. Very well. I'll return the trinket. And perhaps... I owe you a favor.",
            speaker: 'Karel',
            responses: [
                { text: "Wise choice.", next: null, action: 'questChoice', choice: 'private', reputation: 10 }
            ]
        },
        public_shame: {
            text: "You wouldn't! My father... the scandal... Fine! Take it! But you've made an enemy today, commoner. Remember that.",
            speaker: 'Karel',
            responses: [
                { text: "The church will be pleased.", next: null, action: 'questChoice', choice: 'confront', reputation: -50 }
            ]
        },
        steal_back: {
            text: "Steal from ME? You're mad. But... you're also the only one who knows. Fine. It's in my room at the manor. Do what you will.",
            speaker: 'Karel',
            responses: [
                { text: "This never happened.", next: null, action: 'questChoice', choice: 'steal' }
            ]
        },
        just_curious: {
            text: "Curiosity is a dangerous thing. But if you're genuinely interested in Bohemian history, perhaps we could have an... intellectual exchange sometime.",
            speaker: 'Karel',
            responses: [
                { text: "I'd like that.", next: null, reputation: 5 },
                { text: "Perhaps.", next: null }
            ]
        }
    },

    // ==================== HANA (PEASANT) ====================
    hana: {
        greeting: {
            text: "Oh! Hello... I'm sorry, I'm so worried, I didn't see you there...",
            speaker: 'Hana',
            responses: [
                { text: "What troubles you?", next: 'troubles' },
                { text: "Is your child any better?", next: 'child_status', condition: { quest: 'find_herbs', state: 'active' } },
                { text: "I know about the tools.", next: 'tools_confrontation', condition: { flag: 'knows_thief' } },
                { text: "Take care.", next: null }
            ]
        },
        troubles: {
            text: "My little Tomáš is sick with fever. And we... we've fallen on hard times. My husband... he did something foolish. I'm so afraid.",
            speaker: 'Hana',
            responses: [
                { text: "I'm looking for herbs to help your son.", next: 'herbs_hope', condition: { quest: 'find_herbs', state: 'active' } },
                { text: "What did your husband do?", next: 'husband_confession' },
                { text: "I'm sorry for your troubles.", next: null }
            ]
        },
        herbs_hope: {
            text: "You are? Oh, bless you! Bless you! Please hurry - he grows weaker by the day...",
            speaker: 'Hana',
            responses: [
                { text: "I'll do everything I can.", next: null }
            ]
        },
        husband_confession: {
            text: "He... he took tools from the blacksmith. To sell, for medicine money. It was wrong, I know, but we were desperate! Please, don't tell the guards!",
            speaker: 'Hana',
            responses: [
                { text: "Where are the tools now?", next: 'tools_location', flag: 'tools_found' },
                { text: "I understand desperation.", next: 'understand', reputation: 10 },
                { text: "Theft is theft.", next: 'theft_harsh', reputation: -15 }
            ]
        },
        tools_location: {
            text: "Hidden in our cellar. We couldn't sell them - everyone would know. Now we have neither money nor peace. Take them, please. Just... help my son.",
            speaker: 'Hana',
            responses: [
                { text: "I'll return them and plead your case.", next: null, action: 'questChoice', choice: 'merciful' },
                { text: "The smith deserves his property back.", next: null }
            ]
        },
        understand: {
            text: "You... you do? Most would see us hanged. Thank you for your kindness, stranger. It means more than you know.",
            speaker: 'Hana',
            responses: [
                { text: "We'll find a way through this.", next: null }
            ]
        },
        theft_harsh: {
            text: "*breaks down crying* I know! I know it was wrong! But what would you do for your child?!",
            speaker: 'Hana',
            responses: [
                { text: "...Perhaps I was too harsh.", next: 'understand', reputation: 5 },
                { text: "[Leave her to her grief]", next: null }
            ]
        },
        tools_confrontation: {
            text: "You... you know? Please, I beg you, we were desperate! My son needs medicine!",
            speaker: 'Hana',
            responses: [
                { text: "Tell me the whole story.", next: 'husband_confession' },
                { text: "Return the tools. I'll help with your son.", next: null, action: 'questChoice', choice: 'merciful' }
            ]
        },
        child_status: {
            text: "The fever persists... he's so weak. Did you find the herbs? Please tell me you found them!",
            speaker: 'Hana',
            responses: [
                { text: "I'm still searching. Hold on.", next: null },
                { text: "I have them! The remedy will be ready soon.", next: 'herbs_found', condition: { item: 'herbs', count: 3 } }
            ]
        },
        herbs_found: {
            text: "Oh thank the Lord! Thank you! Take them to Marta quickly - she'll know what to do!",
            speaker: 'Hana',
            responses: [
                { text: "I'll go at once.", next: null }
            ]
        }
    },

    // ==================== OTTO THE MERCHANT ====================
    otto: {
        greeting: {
            text: "Greetings, friend! Otto of Prague, at your service. Looking to buy? Sell? I deal fairly with all.",
            speaker: 'Otto',
            responses: [
                { text: "What do you have for sale?", next: 'trade', action: 'openTrade' },
                { text: "You travel the roads often?", next: 'roads' },
                { text: "Any news from your travels?", next: 'news' },
                { text: "Just looking. Farewell.", next: null }
            ]
        },
        roads: {
            text: "Indeed, though lately I stick to guarded routes. These bandits have made independent trading... risky. I've had to pay 'tolls' twice now.",
            speaker: 'Otto',
            responses: [
                { text: "I'm trying to deal with the bandits.", next: 'bandit_help' },
                { text: "That sounds expensive.", next: 'expensive' },
                { text: "Stay safe.", next: null }
            ]
        },
        bandit_help: {
            text: "Are you now? Brave soul. Their leader is called Zbyněk - former soldier gone bad. If you can negotiate, mention my name. I have an... understanding with some of them.",
            speaker: 'Otto',
            responses: [
                { text: "An understanding?", next: 'understanding' },
                { text: "That's useful. Thank you.", next: null, flag: 'bandit_leader_name' }
            ]
        },
        understanding: {
            text: "Business is business. I pay, they let me pass. It's not noble, but I'm a merchant, not a hero. Though if someone were to remove them permanently, I'd be... grateful.",
            speaker: 'Otto',
            responses: [
                { text: "How grateful?", next: 'reward_promise' },
                { text: "I see.", next: null }
            ]
        },
        reward_promise: {
            text: "Grateful enough to share my best wares at cost. And perhaps some information about... opportunities. I know many things from my travels.",
            speaker: 'Otto',
            responses: [
                { text: "A fair offer.", next: null }
            ]
        },
        expensive: {
            text: "Very. Which is why I raise my prices. Supply and demand, friend. If the roads were safe, everything would be cheaper.",
            speaker: 'Otto',
            responses: [
                { text: "I understand.", next: null }
            ]
        },
        news: {
            text: "News? The King is raising taxes - again. There's plague in the south - avoid Brno. And a new lord is coming to inspect these lands next month. Prepare for... scrutiny.",
            speaker: 'Otto',
            responses: [
                { text: "A new lord?", next: 'new_lord' },
                { text: "Plague? That's troubling.", next: 'plague' },
                { text: "Thank you for the news.", next: null }
            ]
        },
        new_lord: {
            text: "An inspector from Prague. Checking that taxes are properly collected, disputes are settled, the peace is kept. Villages like this one will be examined closely.",
            speaker: 'Otto',
            responses: [
                { text: "Good to know.", next: null }
            ]
        },
        plague: {
            text: "Far from here, thankfully. But stock up on healing herbs while you can. Prices will rise if it spreads.",
            speaker: 'Otto',
            responses: [
                { text: "Sound advice.", next: null }
            ]
        },
        trade: {
            text: "Excellent! I have potions, scrolls, and curiosities from across Bohemia.",
            speaker: 'Otto',
            responses: [
                { text: "[View wares]", next: null, action: 'openShop' },
                { text: "Perhaps later.", next: null }
            ]
        }
    },

    // ==================== BABA ZDENA (HEALER) ====================
    baba_zdena: {
        greeting: {
            text: "Ah, a visitor... Most avoid my cottage. What brings you to old Zdena?",
            speaker: 'Baba Zdena',
            responses: [
                { text: "I need healing supplies.", next: 'trade', action: 'openTrade' },
                { text: "People speak ill of you.", next: 'accusations' },
                { text: "Tell me about your work.", next: 'work' },
                { text: "Farewell.", next: null }
            ]
        },
        accusations: {
            text: "Speak ill? Ha! They call me witch, yet come begging when their children are sick. Ignorance breeds fear, child.",
            speaker: 'Baba Zdena',
            responses: [
                { text: "Are the accusations false?", next: 'quest_witch_start', action: 'startQuest', questId: 'witch_hunt' },
                { text: "I meant no offense.", next: 'no_offense' }
            ]
        },
        quest_witch_start: {
            text: "I am a healer, nothing more. But Father Metoděj fears what he doesn't understand. If you seek truth, speak to those I've helped. Hana knows my worth.",
            speaker: 'Baba Zdena',
            responses: [
                { text: "I'll look into this.", next: null },
                { text: "Perhaps you should leave the village.", next: 'leave_suggestion' }
            ]
        },
        leave_suggestion: {
            text: "Leave? This has been my home for forty years. But perhaps... if it would bring peace...",
            speaker: 'Baba Zdena',
            responses: [
                { text: "Let me try to help first.", next: null },
                { text: "[Leave]", next: null }
            ]
        },
        no_offense: {
            text: "None taken. I've heard worse. Is there something you need?",
            speaker: 'Baba Zdena',
            responses: [
                { text: "Tell me about your remedies.", next: 'remedies' },
                { text: "Farewell.", next: null }
            ]
        },
        work: {
            text: "I gather herbs, make poultices and draughts. The old ways, passed down through generations. The church calls it superstition, but my cures work.",
            speaker: 'Baba Zdena',
            responses: [
                { text: "Can you teach me?", next: 'teach' },
                { text: "Interesting.", next: null }
            ]
        },
        teach: {
            text: "Perhaps... if you prove yourself trustworthy. Bring me rare herbs, and I shall share some knowledge.",
            speaker: 'Baba Zdena',
            responses: [
                { text: "I'll remember that.", next: null }
            ]
        },
        remedies: {
            text: "For fever - willow bark tea. For wounds - yarrow and honey. For the spirit - valerian and chamomile. Simple, yet effective.",
            speaker: 'Baba Zdena',
            responses: [
                { text: "Wise knowledge.", next: null }
            ]
        },
        trade: {
            text: "I have potions and herbs. Not cheap, but they work.",
            speaker: 'Baba Zdena',
            responses: [
                { text: "[View wares]", next: null, action: 'openShop' },
                { text: "Perhaps later.", next: null }
            ]
        }
    },

    // ==================== RADEK THE GUARD ====================
    radek: {
        greeting: {
            text: "Halt! State your business! ...Oh, you're that traveler. Sorry, trying to be more official.",
            speaker: 'Radek',
            responses: [
                { text: "You seem eager to prove yourself.", next: 'prove_self' },
                { text: "How goes guard duty?", next: 'guard_duty' },
                { text: "Carry on, guard.", next: null }
            ]
        },
        prove_self: {
            text: "Is it that obvious? Captain Bořek says I'm too green. But I'll show him! If only someone would give me a chance...",
            speaker: 'Radek',
            responses: [
                { text: "I could help you train.", next: 'quest_guard_start', action: 'startQuest', questId: 'guard_training' },
                { text: "Experience comes with time.", next: 'experience' },
                { text: "Good luck.", next: null }
            ]
        },
        quest_guard_start: {
            text: "You would? That's... that's great! The Captain says I need to master both sword and strategy. Maybe you could help with both?",
            speaker: 'Radek',
            responses: [
                { text: "I'll speak with Bořek and the smith.", next: null },
                { text: "One step at a time.", next: null }
            ]
        },
        experience: {
            text: "Easy for you to say. You're not the one getting mocked by the older guards.",
            speaker: 'Radek',
            responses: [
                { text: "They mock you?", next: 'mocked' },
                { text: "[Leave]", next: null }
            ]
        },
        mocked: {
            text: "Constantly. 'Radek the Rusty,' they call me. Because I dropped my sword in the mud. Once!",
            speaker: 'Radek',
            responses: [
                { text: "I'll help you prove them wrong.", next: 'quest_guard_start', action: 'startQuest', questId: 'guard_training' },
                { text: "That's rough.", next: null }
            ]
        },
        guard_duty: {
            text: "Quiet, mostly. I patrol the village, check on the merchants, watch for bandits. Nothing exciting ever happens when I'm around.",
            speaker: 'Radek',
            responses: [
                { text: "Excitement isn't always good.", next: 'excitement' },
                { text: "Stay vigilant.", next: null }
            ]
        },
        excitement: {
            text: "I know, I know. But I want to DO something, you know? Make a difference. Not just stand around.",
            speaker: 'Radek',
            responses: [
                { text: "Your time will come.", next: null }
            ]
        }
    },

    // ==================== MATĚJ THE BARD ====================
    matej: {
        greeting: {
            text: "*strums an imaginary lute* Ah, a new face! Care for a tale, a song, or perhaps some gossip?",
            speaker: 'Matěj',
            responses: [
                { text: "Why are you miming?", next: 'missing_lute' },
                { text: "Tell me a tale.", next: 'tale' },
                { text: "What gossip do you have?", next: 'gossip' },
                { text: "No thanks.", next: null }
            ]
        },
        missing_lute: {
            text: "*sighs* My beloved lute... someone stole it. Without my instrument, I'm just a man with a nice voice and empty pockets.",
            speaker: 'Matěj',
            responses: [
                { text: "I'll help you find it.", next: 'quest_lute_start', action: 'startQuest', questId: 'lost_lute' },
                { text: "That's unfortunate.", next: 'unfortunate' },
                { text: "Maybe you should find other work.", next: 'other_work' }
            ]
        },
        quest_lute_start: {
            text: "You will? Bless you! I last had it at the inn. Someone must have seen something. Marta knows everything that happens there.",
            speaker: 'Matěj',
            responses: [
                { text: "I'll ask around.", next: null }
            ]
        },
        unfortunate: {
            text: "Unfortunate? It's a tragedy! That lute was my grandmother's. It had... sentimental value.",
            speaker: 'Matěj',
            responses: [
                { text: "I'll help you find it.", next: 'quest_lute_start', action: 'startQuest', questId: 'lost_lute' },
                { text: "I'm sorry.", next: null }
            ]
        },
        other_work: {
            text: "Other work?! I am an ARTIST! Would you tell a fish to walk? ...Though I suppose some extra coin wouldn't hurt right now.",
            speaker: 'Matěj',
            responses: [
                { text: "Let me help find your lute.", next: 'quest_lute_start', action: 'startQuest', questId: 'lost_lute' },
                { text: "[Leave]", next: null }
            ]
        },
        tale: {
            text: "Ah! Let me tell you of the time King Charles himself visited a village much like this one... though perhaps my tale would be better with music.",
            speaker: 'Matěj',
            responses: [
                { text: "What happened to your lute?", next: 'missing_lute' },
                { text: "Continue the tale.", next: 'tale_continue' }
            ]
        },
        tale_continue: {
            text: "The king, disguised as a peasant, wanted to see how his people truly lived. He found both kindness and cruelty in equal measure.",
            speaker: 'Matěj',
            responses: [
                { text: "A wise king.", next: null },
                { text: "Interesting. Farewell.", next: null }
            ]
        },
        gossip: {
            text: "Gossip? Oh, I hear things... The noble Karel has sticky fingers. The healer woman is feared by the superstitious. And a mysterious stranger has been lurking about.",
            speaker: 'Matěj',
            responses: [
                { text: "Tell me about the stranger.", next: 'stranger_gossip' },
                { text: "Interesting.", next: null }
            ]
        },
        stranger_gossip: {
            text: "A dark figure, keeps to himself. I saw him at the inn, asking questions about old families. Something haunts that man.",
            speaker: 'Matěj',
            responses: [
                { text: "I should speak with him.", next: null },
                { text: "Thanks for the information.", next: null, flag: 'knows_stranger' }
            ]
        }
    },

    // ==================== THE STRANGER (CIZINEC) ====================
    cizinec: {
        greeting: {
            text: "...You approach me willingly. Most avoid my presence. What do you want?",
            speaker: 'The Stranger',
            responses: [
                { text: "Who are you?", next: 'identity' },
                { text: "What brings you to Skalice?", next: 'purpose' },
                { text: "I'd like to trade.", next: 'trade', action: 'openTrade' },
                { text: "Nothing. Farewell.", next: null }
            ]
        },
        identity: {
            text: "Who am I? A ghost of the past. A seeker of truth. A man robbed of everything he held dear. Names are meaningless.",
            speaker: 'The Stranger',
            responses: [
                { text: "That's cryptic.", next: 'cryptic' },
                { text: "What truth do you seek?", next: 'quest_secret_start', action: 'startQuest', questId: 'dark_secret' },
                { text: "[Leave]", next: null }
            ]
        },
        cryptic: {
            text: "Clarity is earned, not given. Help me, and perhaps you'll understand. Or walk away - I care not.",
            speaker: 'The Stranger',
            responses: [
                { text: "What do you need?", next: 'quest_secret_start', action: 'startQuest', questId: 'dark_secret' },
                { text: "[Leave]", next: null }
            ]
        },
        purpose: {
            text: "This village... holds secrets. Old sins, buried but not forgotten. There are those here who owe a debt. A debt of blood.",
            speaker: 'The Stranger',
            responses: [
                { text: "That sounds like a threat.", next: 'threat' },
                { text: "Tell me more.", next: 'quest_secret_start', action: 'startQuest', questId: 'dark_secret' },
                { text: "I want no part of this.", next: null }
            ]
        },
        quest_secret_start: {
            text: "Years ago, a family was destroyed. Falsely accused, driven out, left to die in the cold. I am what remains. And I will have answers.",
            speaker: 'The Stranger',
            responses: [
                { text: "Who accused them?", next: 'accusers' },
                { text: "I'll help you find the truth.", next: null },
                { text: "Revenge solves nothing.", next: 'revenge' }
            ]
        },
        accusers: {
            text: "The priest knows. Perhaps the old healer too. And the noble family... they benefited most from our downfall.",
            speaker: 'The Stranger',
            responses: [
                { text: "I'll investigate.", next: null },
                { text: "What will you do with this truth?", next: 'what_then' }
            ]
        },
        threat: {
            text: "A threat? No. A promise. But I seek justice, not mindless revenge. Help me, or stand aside.",
            speaker: 'The Stranger',
            responses: [
                { text: "I'll help you find justice.", next: null },
                { text: "[Leave]", next: null }
            ]
        },
        revenge: {
            text: "Does it not? When the innocent suffer and the guilty prosper, what other recourse remains?",
            speaker: 'The Stranger',
            responses: [
                { text: "Let me help you find another way.", next: null },
                { text: "Some wounds never heal.", next: null }
            ]
        },
        what_then: {
            text: "That... I have not decided. Perhaps truth alone will be enough. Perhaps not.",
            speaker: 'The Stranger',
            responses: [
                { text: "Let's find the truth first.", next: null }
            ]
        },
        trade: {
            text: "I have... items of interest. Acquired through various means.",
            speaker: 'The Stranger',
            responses: [
                { text: "[View wares]", next: null, action: 'openShop' },
                { text: "Perhaps later.", next: null }
            ]
        }
    }
};
