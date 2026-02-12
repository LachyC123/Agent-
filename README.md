# ⚔️ Bohemian Tales - A Medieval RPG
## Version 2.0 - Living World Update

A fully playable 2D top-down browser-based RPG game inspired by Kingdom Come: Deliverance 2. Experience medieval Bohemian life in the village of Skalice, where your choices matter, NPCs live their own lives, and consequences are real.

![Medieval RPG](https://img.shields.io/badge/Genre-Medieval%20RPG-brown)
![Phaser 3](https://img.shields.io/badge/Engine-Phaser%203-blue)
![HTML5](https://img.shields.io/badge/Platform-HTML5-orange)
![Version](https://img.shields.io/badge/Version-2.0-green)

---

## 🆕 What's New in Version 2.0

### 🤖 Dynamic NPC AI System
- **NPCs move around the village naturally** - No more static characters standing in one place!
- **Daily routines** - Each NPC follows their own schedule based on profession and time of day
- **Multiple movement patterns**: Wandering, patrolling, working, socializing, resting
- **Intelligent pathfinding** - NPCs navigate around obstacles and each other
- **Time-based behaviors** - Different activities during dawn, day, dusk, and night

### 💬 NPC-to-NPC Interactions
- **NPCs talk to each other** - Watch villagers have conversations with visible speech bubbles
- **Dynamic conversations** based on NPC relationships
- **Social gathering spots** - NPCs gather at the inn, well, church, and market
- **Relationship system** - NPCs have friends, rivals, and family connections

### 🌍 Living, Breathing World
- **Animals** - Chickens, pigs, dogs, and cats roam the village
- **Ambient effects** - Chimney smoke, flying birds, dust particles
- **Random events** - Hear church bells, merchant calls, children playing
- **Weather of activity** - The village feels alive at all hours
- **Interactive elements** - Training dummies, fishing spots, and more

### 📜 Major Content Update
- **4 New NPCs**:
  - **Baba Zdena** - Village healer with mysterious knowledge
  - **Radek** - Eager young guard seeking to prove himself
  - **Matěj** - Wandering bard with tales and gossip
  - **The Stranger** - Enigmatic figure with a dark past

- **4 New Quests**:
  - **"The Witch of Skalice"** - Defend or condemn the healer
  - **"A Guard's Duty"** - Help Radek become a true guardian
  - **"The Bard's Sorrow"** - Find Matěj's stolen lute
  - **"Shadows of the Past"** - Uncover the village's dark secret

- **New Items**: Daggers, hunting bows, chainmail, potent elixirs, lockpicks, and more
- **Expanded shop inventories** for all merchants

---

## 🎮 Features

### Core Gameplay
- **Top-down exploration** of a medieval Bohemian village
- **12 unique NPCs** with distinct personalities, schedules, and dialogue
- **8 branching quests** with meaningful choices and consequences
- **Reputation system** that affects NPC reactions and quest options
- **Day/night cycle** with dynamic lighting
- **Save/Load functionality** using localStorage

### Game Systems
- **Inventory system** with equipment and consumables
- **Combat system** with weapons and armor
- **Dialogue system** with branching conversations
- **Quest tracking** with multiple outcomes
- **Shop system** for trading with merchants
- **NPC AI system** with schedules and social behaviors

### Characters

#### Original NPCs
| Character | Role | Personality |
|-----------|------|-------------|
| Václav the Smith | Blacksmith | Gruff but honorable |
| Marta | Innkeeper | Warm and gossipy |
| Jiří the Miller | Miller | Anxious and hardworking |
| Captain Bořek | Guard Captain | Stern and duty-bound |
| Father Metoděj | Priest | Wise and compassionate |
| Karel of Lipany | Nobleman | Arrogant but capable |
| Otto the Merchant | Merchant | Shrewd but fair |
| Hana | Farmwife | Kind and worried |

#### New NPCs (v2.0)
| Character | Role | Personality |
|-----------|------|-------------|
| Baba Zdena | Healer | Mysterious and knowledgeable |
| Radek | Guard | Eager but inexperienced |
| Matěj | Bard | Charming and musical |
| The Stranger | Unknown | Enigmatic |

### Quests

#### Original Quests
1. **The Smith's Burden** - Investigate stolen tools, choose mercy or justice
2. **The Healing Herbs** - Save a sick child or profit from misfortune
3. **Wolves at the Gate** - Deal with bandits through combat, diplomacy, or cunning
4. **The Saint's Blessing** - Recover a stolen church relic

#### New Quests (v2.0)
5. **The Witch of Skalice** - Decide the fate of the village healer
6. **A Guard's Duty** - Train young Radek in combat or wisdom
7. **The Bard's Sorrow** - Recover Matěj's stolen lute
8. **Shadows of the Past** - Uncover a dark village secret

---

## 🎯 Controls

### Desktop
| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move |
| E / Space | Interact |
| I | Inventory |
| Q | Quest Log |
| ESC | Pause Menu |
| F | Attack |
| F5 | Quick Save |

### Mobile
- **D-Pad** on left side for movement
- **⚔️ button** for attack
- **💬 button** for interact

---

## 🚀 Deployment

### Option 1: Local Play
Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge).

```bash
# If you have Python installed
cd kcd_inspired_game
python -m http.server 8000
# Then open http://localhost:8000
```

### Option 2: GitHub Pages
1. Create a new GitHub repository
2. Upload all files maintaining the folder structure
3. Go to Settings > Pages
4. Select "main" branch and "/" (root) folder
5. Your game will be live at `https://username.github.io/repo-name`

### Option 3: Replit
1. Create a new HTML/CSS/JS Repl
2. Upload all files
3. Click "Run" - the game will be hosted automatically

### Option 4: Netlify
1. Drag and drop the `kcd_inspired_game` folder to netlify.com/drop
2. Your game is instantly deployed!

---

## 📁 Project Structure

```
kcd_inspired_game/
├── index.html              # Entry point
├── README.md               # This file
├── css/
│   └── style.css          # Styling and mobile controls
├── js/
│   ├── main.js            # Game initialization
│   ├── constants.js       # Game configuration
│   ├── assets.js          # Procedural asset generation
│   ├── data/
│   │   ├── npcs.js        # NPC definitions (12 characters)
│   │   ├── quests.js      # Quest data (8 quests)
│   │   ├── items.js       # Item definitions (25+ items)
│   │   └── dialogue.js    # All dialogue trees
│   ├── systems/
│   │   ├── inventory.js   # Inventory management
│   │   ├── quest.js       # Quest system
│   │   ├── reputation.js  # Reputation tracking
│   │   ├── combat.js      # Combat mechanics
│   │   ├── save.js        # Save/Load system
│   │   └── npcAI.js       # NPC AI and movement (NEW)
│   └── scenes/
│       ├── BootScene.js   # Asset loading
│       ├── MenuScene.js   # Main menu
│       ├── GameScene.js   # Main gameplay (enhanced)
│       └── UIScene.js     # UI elements
└── assets/                 # (Generated procedurally)
```

---

## 🎨 Art Style

All graphics are procedurally generated pixel art using HTML5 Canvas:
- Medieval color palette (earthy browns, muted greens)
- Character sprites with 4-direction animations
- Building sprites (church, inn, smithy, mill, houses)
- Environmental tiles (grass, dirt, water, forest)
- Animals (chickens, pigs, dogs, cats)
- UI elements styled after medieval manuscripts

---

## 🔧 Technical Details

- **Engine**: Phaser 3.60
- **Graphics**: Procedural pixel art (Canvas API)
- **Storage**: localStorage for saves
- **Responsive**: Scales to fit screen, mobile touch controls
- **No external assets**: Everything generated at runtime
- **Performance optimized**: Efficient NPC AI with spatial awareness

---

## 🎭 Gameplay Tips

1. **Watch the NPCs** - They follow daily routines and talk to each other
2. **Visit at different times** - NPCs do different things throughout the day
3. **Check the inn** - Many NPCs gather there in the evening
4. **Talk to everyone** - New NPCs have new quests and information
5. **Save often** - Use F5 for quick saves before important decisions
6. **Explore the edges** - The healer lives near the edge of town
7. **Look for the stranger** - He lurks near the eastern forest

---

## 📜 Quest Walkthrough (Spoiler-Free Hints)

### Original Quests

#### The Smith's Burden
- Talk to Marta and Hana for witness accounts
- Consider both sides before making your decision

#### The Healing Herbs
- Herbs grow in the forested edges of the map
- You need 3 herbs total

#### Wolves at the Gate
- Otto knows about the bandit leader
- Multiple approaches work: combat, diplomacy, or guards

#### The Saint's Blessing
- Marta's gossip about Karel is relevant
- The church cellar holds clues

### New Quests (v2.0)

#### The Witch of Skalice
- Speak to those Zdena has healed
- Father Metoděj and Hana have different opinions

#### A Guard's Duty
- Consult both the Captain and the smith
- Choose between combat skill and wisdom

#### The Bard's Sorrow
- Marta knows who visits the inn
- Otto may have "acquired" the item

#### Shadows of the Past
- Requires completing "The Saint's Blessing" first
- The stranger, priest, and healer each hold pieces of the truth

---

## 🏆 Credits

Created as a demo inspired by **Kingdom Come: Deliverance** by Warhorse Studios.

This is a fan project demonstrating medieval RPG mechanics in a browser-based format.

### Version History
- **v1.0** - Initial release with core gameplay
- **v2.0** - Living World Update with NPC AI, new content, and ambient life

---

## 📄 License

This project is open source and available for educational purposes.

---

*"In times of strife, a single choice can change everything."*

⚔️ **Enjoy your journey through medieval Bohemia!** ⚔️
