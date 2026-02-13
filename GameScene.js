// Main Game Scene - The village of Skalice
// Version 2.0 - Living World Update
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.npcCreated = false; // Flag to prevent duplicate NPCs
    }
    
    init(data) {
        this.loadedSave = data.loadedSave;
        this.isNewGame = data.newGame;
        this.npcCreated = false; // Reset on init
    }
    
    create() {
        // Game state
        this.gameTime = 0;
        this.dayCount = 1;
        this.isPaused = false;
        this.inDialogue = false;
        this.nearbyNPC = null;
        this.nearbyInteractable = null;
        
        // Clear any existing NPCs from previous game sessions
        this.npcs = {};
        this.animals = [];
        this.ambientEffects = [];
        this.speechBubbles = {};
        this.activeConversations = [];
        
        // Create the world
        this.createWorld();
        
        // Create player
        this.createPlayer();
        
        // Create NPCs (with duplicate prevention)
        if (!this.npcCreated) {
            this.createNPCs();
            this.npcCreated = true;
        }
        
        // Create animals and ambient life
        this.createAnimals();
        this.createAmbientLife();
        
        // Create interactables
        this.createInteractables();
        
        // Setup camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setBounds(0, 0, 1200, 800);
        
        // Setup controls
        this.setupControls();
        this.setupMobileControls();
        
        // Start UI scene
        this.scene.launch('UIScene');
        this.uiScene = this.scene.get('UIScene');
        
        // Load save data if continuing
        if (this.loadedSave) {
            this.player.setPosition(this.loadedSave.player.x, this.loadedSave.player.y);
            this.gameTime = this.loadedSave.gameTime || 480;
        } else {
            this.gameTime = 480; // 8 AM
        }
        
        // Day/night cycle timer
        this.time.addEvent({
            delay: 100,
            callback: this.updateGameTime,
            callbackScope: this,
            loop: true
        });
        
        // Stamina recovery timer
        this.time.addEvent({
            delay: 500,
            callback: () => GameCombat.recoverStamina(2),
            loop: true
        });
        
        // NPC AI update timer
        this.time.addEvent({
            delay: 100,
            callback: this.updateNPCAI,
            callbackScope: this,
            loop: true
        });
        
        // Animal behavior timer
        this.time.addEvent({
            delay: 200,
            callback: this.updateAnimals,
            callbackScope: this,
            loop: true
        });
        
        // Random events timer
        this.time.addEvent({
            delay: 30000,
            callback: this.triggerRandomEvent,
            callbackScope: this,
            loop: true
        });
        
        // Show intro message for new game
        if (this.isNewGame) {
            this.time.delayedCall(500, () => {
                this.uiScene.showNotification(
                    'Welcome to Skalice, traveler.\nExplore the living village and speak with its people.',
                    5000
                );
            });
        }
    }
    
    createWorld() {
        // World bounds
        this.physics.world.setBounds(0, 0, 1200, 800);
        
        // Ground layer
        this.groundGroup = this.add.group();
        
        // Draw grass background with variation
        for (let x = 0; x < 1200; x += 32) {
            for (let y = 0; y < 800; y += 32) {
                const grassTile = this.add.image(x + 16, y + 16, 'grass');
                // Add slight tint variation for natural look
                if (Math.random() < 0.1) {
                    grassTile.setTint(0x5a8030);
                }
            }
        }
        
        // Dirt paths
        const pathTiles = [
            ...this.generatePath(0, 400, 1200, 400, 64),
            ...this.generatePath(160, 200, 160, 400, 48),
            ...this.generatePath(520, 350, 520, 400, 48),
            ...this.generatePath(280, 280, 280, 400, 48),
            ...this.generatePath(680, 180, 680, 400, 48),
            ...this.generatePath(300, 350, 500, 350, 100),
            // New paths for expanded village
            ...this.generatePath(850, 300, 850, 400, 48),
            ...this.generatePath(400, 180, 400, 350, 40)
        ];
        
        pathTiles.forEach(tile => {
            this.add.image(tile.x, tile.y, 'dirt');
        });
        
        // Water (pond) - now with animated effect
        this.waterTiles = [];
        for (let x = 900; x < 1000; x += 32) {
            for (let y = 450; y < 530; y += 32) {
                const waterTile = this.add.image(x + 16, y + 16, 'water');
                this.waterTiles.push(waterTile);
            }
        }
        
        // Add water shimmer animation
        this.tweens.add({
            targets: this.waterTiles,
            alpha: { from: 0.8, to: 1 },
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
        
        // Forest areas (collision)
        this.obstacles = this.physics.add.staticGroup();
        
        // Northern forest
        for (let x = 0; x < 1200; x += 48) {
            const tree = this.add.image(x + 24, 50, 'tree');
            const collision = this.obstacles.create(x + 24, 60, null);
            collision.body.setSize(30, 20);
            collision.setVisible(false);
        }
        
        // Eastern forest
        for (let y = 0; y < 350; y += 48) {
            const tree = this.add.image(1150, y + 24, 'tree');
            const collision = this.obstacles.create(1150, y + 40, null);
            collision.body.setSize(30, 20);
            collision.setVisible(false);
        }
        
        // Scattered trees
        const treePositions = [
            { x: 50, y: 500 }, { x: 100, y: 550 }, { x: 750, y: 150 },
            { x: 800, y: 550 }, { x: 850, y: 500 }, { x: 1050, y: 300 },
            { x: 50, y: 200 }, { x: 950, y: 200 }, { x: 750, y: 600 }
        ];
        
        treePositions.forEach(pos => {
            this.add.image(pos.x, pos.y, 'tree');
            const collision = this.obstacles.create(pos.x, pos.y + 20, null);
            collision.body.setSize(20, 15);
            collision.setVisible(false);
        });
        
        // Buildings
        this.buildings = [];
        
        // Church
        const church = this.add.image(160, 160, 'church');
        this.buildings.push({ sprite: church, name: 'Church', x: 160, y: 160 });
        const churchCol = this.obstacles.create(160, 180, null);
        churchCol.body.setSize(80, 80);
        churchCol.setVisible(false);
        
        // Inn
        const inn = this.add.image(280, 260, 'inn');
        this.buildings.push({ sprite: inn, name: 'The Golden Tankard', x: 280, y: 260 });
        const innCol = this.obstacles.create(280, 290, null);
        innCol.body.setSize(100, 60);
        innCol.setVisible(false);
        
        // Blacksmith
        const smithy = this.add.image(520, 340, 'smithy');
        this.buildings.push({ sprite: smithy, name: 'Smithy', x: 520, y: 340 });
        const smithCol = this.obstacles.create(520, 360, null);
        smithCol.body.setSize(80, 40);
        smithCol.setVisible(false);
        
        // Mill
        const mill = this.add.image(680, 140, 'mill');
        this.buildings.push({ sprite: mill, name: 'Mill', x: 680, y: 140 });
        const millCol = this.obstacles.create(680, 170, null);
        millCol.body.setSize(60, 70);
        millCol.setVisible(false);
        
        // Houses
        const housePositions = [
            { x: 400, y: 180 }, // Noble house
            { x: 580, y: 520 }, // Hana's house
            { x: 100, y: 450 }, // House 3
            { x: 850, y: 280 }  // New house - Healer's cottage
        ];
        
        housePositions.forEach((pos, i) => {
            const house = this.add.image(pos.x, pos.y, 'house');
            this.buildings.push({ sprite: house, name: `House`, x: pos.x, y: pos.y });
            const houseCol = this.obstacles.create(pos.x, pos.y + 20, null);
            houseCol.body.setSize(70, 50);
            houseCol.setVisible(false);
        });
        
        // Well in village center
        const well = this.add.image(400, 380, 'well');
        const wellCol = this.obstacles.create(400, 390, null);
        wellCol.body.setSize(35, 30);
        wellCol.setVisible(false);
        
        // Fences and fields
        this.createFarming();
        
        // Water collision
        const waterCol = this.obstacles.create(950, 490, null);
        waterCol.body.setSize(100, 80);
        waterCol.setVisible(false);
        
        // Create flower patches
        this.createFlowers();
    }
    
    createFarming() {
        // Fences
        const fencePositions = [
            { x: 550, y: 480, type: 'h' },
            { x: 582, y: 480, type: 'h' },
            { x: 614, y: 480, type: 'h' },
            { x: 630, y: 500, type: 'v' },
            { x: 630, y: 532, type: 'v' },
            // New fences for farm area
            { x: 550, y: 550, type: 'h' },
            { x: 582, y: 550, type: 'h' },
            { x: 614, y: 550, type: 'h' }
        ];
        
        fencePositions.forEach(pos => {
            const fence = this.add.image(pos.x, pos.y, pos.type === 'h' ? 'fenceH' : 'fenceV');
            const fenceCol = this.obstacles.create(pos.x, pos.y, null);
            fenceCol.body.setSize(pos.type === 'h' ? 32 : 10, pos.type === 'h' ? 10 : 32);
            fenceCol.setVisible(false);
        });
        
        // Crop rows (visual only)
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                const crop = this.add.circle(560 + j * 20, 500 + i * 12, 4, 0x8b7355, 0.6);
                crop.setDepth(3);
            }
        }
    }
    
    createFlowers() {
        const flowerSpots = [
            { x: 200, y: 350 }, { x: 330, y: 450 }, { x: 450, y: 500 },
            { x: 750, y: 350 }, { x: 100, y: 350 }, { x: 820, y: 450 }
        ];
        
        flowerSpots.forEach(spot => {
            for (let i = 0; i < 5; i++) {
                const fx = spot.x + (Math.random() - 0.5) * 30;
                const fy = spot.y + (Math.random() - 0.5) * 30;
                const colors = [0xFFFF00, 0xFF69B4, 0x87CEEB, 0xFFFFFF, 0xFF4500];
                const flower = this.add.circle(fx, fy, 3, colors[Math.floor(Math.random() * colors.length)], 0.8);
                flower.setDepth(4);
            }
        });
    }
    
    generatePath(x1, y1, x2, y2, width) {
        const tiles = [];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(length / 32);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x1 + dx * t;
            const y = y1 + dy * t;
            
            const perpX = -dy / length;
            const perpY = dx / length;
            
            for (let w = -width/2; w <= width/2; w += 32) {
                tiles.push({
                    x: Math.round((x + perpX * w) / 32) * 32 + 16,
                    y: Math.round((y + perpY * w) / 32) * 32 + 16
                });
            }
        }
        
        return tiles;
    }
    
    createPlayer() {
        const startX = this.loadedSave ? this.loadedSave.player.x : 400;
        const startY = this.loadedSave ? this.loadedSave.player.y : 450;
        
        // Create player with frame 0 (down-facing idle)
        this.player = this.physics.add.sprite(startX, startY, 'player', 0);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(16, 12);
        this.player.body.setOffset(8, 18);
        this.player.setDepth(10);
        this.player.direction = 'down';
        
        this.physics.add.collider(this.player, this.obstacles);
        
        this.playerShadow = this.add.ellipse(startX, startY + 14, 16, 6, 0x000000, 0.3);
        this.playerShadow.setDepth(9);
    }
    
    createNPCs() {
        // Clear existing NPCs first to prevent duplicates
        if (this.npcs && Object.keys(this.npcs).length > 0) {
            Object.values(this.npcs).forEach(npc => {
                if (npc.nameLabel) npc.nameLabel.destroy();
                if (npc.questMarker) npc.questMarker.destroy();
                if (npc.shadow) npc.shadow.destroy();
                npc.destroy();
            });
        }
        this.npcs = {};
        
        // Create each NPC exactly once
        Object.entries(NPC_DATA).forEach(([id, data]) => {
            // Skip if already exists
            if (this.npcs[id]) return;
            
            // Create sprite with frame 0 (down-facing idle)
            const npc = this.physics.add.sprite(data.position.x, data.position.y, data.sprite, 0);
            npc.setImmovable(false); // Allow NPCs to move
            npc.body.setSize(20, 16);
            npc.body.setOffset(6, 14);
            npc.setDepth(10);
            npc.npcId = id;
            npc.npcData = data;
            npc.direction = 'down';
            
            // Initialize AI
            NPCAISystem.initNPC(npc, data);
            
            // Add shadow
            const shadow = this.add.ellipse(data.position.x, data.position.y + 14, 14, 5, 0x000000, 0.25);
            shadow.setDepth(9);
            npc.shadow = shadow;
            
            // Add name label
            const nameLabel = this.add.text(data.position.x, data.position.y - 25, data.name, {
                fontSize: '10px',
                fontFamily: 'Georgia, serif',
                color: '#f5deb3',
                stroke: '#000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(11);
            npc.nameLabel = nameLabel;
            
            // Quest marker
            if (data.quests && data.quests.length > 0) {
                const hasAvailable = data.quests.some(qId => 
                    GameQuests.getQuestState(qId) === QUEST_STATES.AVAILABLE
                );
                if (hasAvailable) {
                    const marker = this.add.image(data.position.x, data.position.y - 35, 'questMarker')
                        .setDepth(12);
                    npc.questMarker = marker;
                }
            }
            
            this.npcs[id] = npc;
            
            // Collision with player
            this.physics.add.collider(this.player, npc);
            
            // NPC-to-NPC collision
            Object.values(this.npcs).forEach(otherNpc => {
                if (otherNpc !== npc) {
                    this.physics.add.collider(npc, otherNpc);
                }
            });
        });
        
        // Add obstacle collision for all NPCs
        Object.values(this.npcs).forEach(npc => {
            this.physics.add.collider(npc, this.obstacles);
        });
    }
    
    createAnimals() {
        this.animals = [];
        
        // Chickens near the farm
        const chickenSpots = [
            { x: 600, y: 500 }, { x: 620, y: 520 }, { x: 590, y: 530 }
        ];
        
        chickenSpots.forEach((spot, index) => {
            const chicken = this.add.circle(spot.x, spot.y, 5, 0xFFFFFF, 0.9);
            chicken.setDepth(8);
            chicken.animalType = 'chicken';
            chicken.homeX = spot.x;
            chicken.homeY = spot.y;
            chicken.targetX = spot.x;
            chicken.targetY = spot.y;
            chicken.moveTimer = Math.random() * 3000;
            this.animals.push(chicken);
        });
        
        // Pigs
        const pigSpots = [
            { x: 560, y: 560 }, { x: 580, y: 570 }
        ];
        
        pigSpots.forEach(spot => {
            const pig = this.add.ellipse(spot.x, spot.y, 12, 8, 0xFFB6C1, 0.9);
            pig.setDepth(8);
            pig.animalType = 'pig';
            pig.homeX = spot.x;
            pig.homeY = spot.y;
            pig.targetX = spot.x;
            pig.targetY = spot.y;
            pig.moveTimer = Math.random() * 5000;
            this.animals.push(pig);
        });
        
        // Dog near the inn
        const dog = this.add.ellipse(300, 320, 10, 7, 0x8B4513, 0.9);
        dog.setDepth(8);
        dog.animalType = 'dog';
        dog.homeX = 300;
        dog.homeY = 320;
        dog.targetX = 300;
        dog.targetY = 320;
        dog.moveTimer = Math.random() * 4000;
        dog.followPlayer = false;
        this.animals.push(dog);
        
        // Cat near the mill
        const cat = this.add.ellipse(700, 200, 8, 5, 0x404040, 0.9);
        cat.setDepth(8);
        cat.animalType = 'cat';
        cat.homeX = 700;
        cat.homeY = 200;
        cat.targetX = 700;
        cat.targetY = 200;
        cat.moveTimer = Math.random() * 6000;
        this.animals.push(cat);
    }
    
    createAmbientLife() {
        // Smoke from chimneys
        this.createChimneySmoke(280, 230); // Inn
        this.createChimneySmoke(520, 320); // Smithy
        
        // Flying birds (visual effect)
        this.createBirds();
        
        // Ambient particles (dust, leaves)
        this.createAmbientParticles();
    }
    
    createChimneySmoke(x, y) {
        // Simple smoke effect using tweened circles
        const createSmokeParticle = () => {
            const smoke = this.add.circle(x + (Math.random() - 0.5) * 10, y, 4, 0x808080, 0.5);
            smoke.setDepth(15);
            
            this.tweens.add({
                targets: smoke,
                y: y - 40,
                alpha: 0,
                scale: 2,
                duration: 2000 + Math.random() * 1000,
                onComplete: () => smoke.destroy()
            });
        };
        
        this.time.addEvent({
            delay: 500,
            callback: createSmokeParticle,
            loop: true
        });
    }
    
    createBirds() {
        // Occasional bird flying across screen
        this.time.addEvent({
            delay: 15000,
            callback: () => {
                if (Math.random() < 0.5) {
                    const startY = 50 + Math.random() * 100;
                    const bird = this.add.triangle(0, startY, 0, 0, 6, 3, 0, 6, 0x000000);
                    bird.setDepth(100);
                    
                    this.tweens.add({
                        targets: bird,
                        x: 1200,
                        y: startY + (Math.random() - 0.5) * 50,
                        duration: 8000,
                        onComplete: () => bird.destroy()
                    });
                }
            },
            loop: true
        });
    }
    
    createAmbientParticles() {
        // Occasional dust/leaf particles
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                if (Math.random() < 0.3) {
                    const x = Math.random() * 1200;
                    const y = Math.random() * 800;
                    const particle = this.add.circle(x, y, 2, 0x8b7355, 0.4);
                    particle.setDepth(5);
                    
                    this.tweens.add({
                        targets: particle,
                        x: x + (Math.random() - 0.5) * 50,
                        y: y + 30,
                        alpha: 0,
                        duration: 3000,
                        onComplete: () => particle.destroy()
                    });
                }
            },
            loop: true
        });
    }
    
    createInteractables() {
        this.interactables = [];
        
        // Herb spawn points
        const herbSpawns = [
            { x: 1100, y: 150, name: 'Medicinal Herbs' },
            { x: 1080, y: 250, name: 'Medicinal Herbs' },
            { x: 50, y: 150, name: 'Medicinal Herbs' },
            { x: 80, y: 600, name: 'Medicinal Herbs' },
            { x: 950, y: 150, name: 'Medicinal Herbs' }
        ];
        
        herbSpawns.forEach(spawn => {
            const herb = this.add.circle(spawn.x, spawn.y, 8, 0x4a7023, 0.8);
            herb.setDepth(5);
            herb.interactType = 'herb';
            herb.interactName = spawn.name;
            herb.collected = false;
            this.interactables.push(herb);
        });
        
        // Bandit camp marker
        const banditCamp = this.add.circle(1100, 500, 15, 0x8b0000, 0.5);
        banditCamp.setDepth(5);
        banditCamp.interactType = 'location';
        banditCamp.interactName = 'Bandit Camp';
        banditCamp.locationId = 'bandit_camp';
        this.interactables.push(banditCamp);
        
        // Church cellar
        const cellar = this.add.circle(180, 220, 10, 0x4a3020, 0.7);
        cellar.setDepth(5);
        cellar.interactType = 'location';
        cellar.interactName = 'Church Cellar';
        cellar.locationId = 'church_cellar';
        this.interactables.push(cellar);
        
        // New: Training dummy near smithy
        const dummy = this.add.rectangle(560, 400, 10, 25, 0x8b4513);
        dummy.setDepth(6);
        dummy.interactType = 'training';
        dummy.interactName = 'Training Dummy';
        this.interactables.push(dummy);
        
        // New: Fishing spot at pond
        const fishSpot = this.add.circle(920, 480, 12, 0x4a7090, 0.3);
        fishSpot.setDepth(4);
        fishSpot.interactType = 'fishing';
        fishSpot.interactName = 'Fishing Spot';
        this.interactables.push(fishSpot);
    }
    
    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        this.questKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.saveKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F5);
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    }
    
    setupMobileControls() {
        this.mobileInput = { up: false, down: false, left: false, right: false };
        this.mobileAttack = false;
        this.mobileInteract = false;
        
        document.querySelectorAll('.dpad-btn').forEach(btn => {
            const dir = btn.dataset.dir;
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileInput[dir] = true;
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileInput[dir] = false;
            });
            
            btn.addEventListener('mousedown', () => this.mobileInput[dir] = true);
            btn.addEventListener('mouseup', () => this.mobileInput[dir] = false);
            btn.addEventListener('mouseleave', () => this.mobileInput[dir] = false);
        });
        
        const attackBtn = document.querySelector('.action-btn.attack');
        const interactBtn = document.querySelector('.action-btn.interact');
        
        if (attackBtn) {
            attackBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileAttack = true;
            });
            attackBtn.addEventListener('touchend', () => this.mobileAttack = false);
            attackBtn.addEventListener('click', () => {
                this.mobileAttack = true;
                setTimeout(() => this.mobileAttack = false, 100);
            });
        }
        
        if (interactBtn) {
            interactBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileInteract = true;
            });
            interactBtn.addEventListener('touchend', () => this.mobileInteract = false);
            interactBtn.addEventListener('click', () => {
                this.mobileInteract = true;
                setTimeout(() => this.mobileInteract = false, 100);
            });
        }
    }
    
    update(time, delta) {
        if (this.isPaused || this.inDialogue) {
            this.player.setVelocity(0);
            return;
        }
        
        this.handleMovement();
        this.playerShadow.setPosition(this.player.x, this.player.y + 14);
        this.checkNearby();
        this.updateNPCLabels();
        this.handleInput();
        this.sortByDepth();
        this.updateLighting();
    }
    
    updateNPCAI() {
        if (this.isPaused || this.inDialogue) return;
        
        const delta = 100; // Timer interval
        Object.values(this.npcs).forEach(npc => {
            NPCAISystem.update(npc, delta, this.gameTime, this);
        });
    }
    
    updateAnimals() {
        if (this.isPaused) return;
        
        this.animals.forEach(animal => {
            animal.moveTimer -= 200;
            
            if (animal.moveTimer <= 0) {
                // New movement target
                const range = animal.animalType === 'chicken' ? 20 : 30;
                animal.targetX = animal.homeX + (Math.random() - 0.5) * range * 2;
                animal.targetY = animal.homeY + (Math.random() - 0.5) * range * 2;
                
                // Clamp to bounds
                animal.targetX = Math.max(50, Math.min(1150, animal.targetX));
                animal.targetY = Math.max(80, Math.min(750, animal.targetY));
                
                // Reset timer
                animal.moveTimer = 2000 + Math.random() * 4000;
            }
            
            // Move towards target
            const dx = animal.targetX - animal.x;
            const dy = animal.targetY - animal.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 2) {
                const speed = animal.animalType === 'chicken' ? 0.5 : 0.3;
                animal.x += (dx / dist) * speed;
                animal.y += (dy / dist) * speed;
            }
            
            // Dog follows player sometimes
            if (animal.animalType === 'dog') {
                const playerDist = Phaser.Math.Distance.Between(animal.x, animal.y, this.player.x, this.player.y);
                if (playerDist < 100 && playerDist > 30) {
                    // Follow player
                    animal.x += (this.player.x - animal.x) * 0.01;
                    animal.y += (this.player.y - animal.y) * 0.01;
                }
            }
        });
    }
    
    triggerRandomEvent() {
        const events = [
            { type: 'merchant_call', message: 'Otto calls out: "Fresh goods from Prague!"' },
            { type: 'church_bells', message: '*Church bells ring in the distance*' },
            { type: 'dog_bark', message: '*A dog barks somewhere in the village*' },
            { type: 'child_laughter', message: '*You hear children playing nearby*' },
            { type: 'hammer_sound', message: '*The ring of hammer on anvil echoes*' }
        ];
        
        const hour = Math.floor(this.gameTime / 60);
        
        // Filter events based on time
        let availableEvents = events;
        if (hour < 6 || hour > 22) {
            availableEvents = events.filter(e => e.type !== 'merchant_call' && e.type !== 'child_laughter');
        }
        
        if (Math.random() < 0.4 && availableEvents.length > 0) {
            const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
            this.uiScene.showNotification(event.message, 3000);
        }
    }
    
    // NPC Conversation display
    showNPCConversation(npc1, npc2) {
        const conversation = getRandomConversation(npc1, npc2);
        
        // Show speech bubble for first NPC
        const bubble1 = this.createSpeechBubble(npc1.x, npc1.y - 40, conversation[0]);
        this.speechBubbles[npc1.npcId] = bubble1;
        
        // After delay, show second NPC's response
        this.time.delayedCall(2000, () => {
            if (bubble1) bubble1.destroy();
            
            const bubble2 = this.createSpeechBubble(npc2.x, npc2.y - 40, conversation[1]);
            this.speechBubbles[npc2.npcId] = bubble2;
            
            this.time.delayedCall(2000, () => {
                if (bubble2) bubble2.destroy();
            });
        });
    }
    
    createSpeechBubble(x, y, text) {
        const container = this.add.container(x, y);
        container.setDepth(100);
        
        // Background
        const bg = this.add.graphics();
        const textObj = this.add.text(0, 0, text, {
            fontSize: '9px',
            fontFamily: 'Georgia, serif',
            color: '#000',
            wordWrap: { width: 100 }
        }).setOrigin(0.5);
        
        const padding = 6;
        const width = Math.max(textObj.width + padding * 2, 40);
        const height = textObj.height + padding * 2;
        
        bg.fillStyle(0xffffff, 0.95);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 5);
        bg.lineStyle(1, 0x000000, 0.5);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 5);
        
        // Speech bubble pointer
        bg.fillStyle(0xffffff, 0.95);
        bg.fillTriangle(0, height/2, -5, height/2 + 8, 5, height/2);
        
        container.add(bg);
        container.add(textObj);
        
        return container;
    }
    
    hideNPCConversation(npc1, npc2) {
        if (this.speechBubbles[npc1.npcId]) {
            this.speechBubbles[npc1.npcId].destroy();
            delete this.speechBubbles[npc1.npcId];
        }
        if (this.speechBubbles[npc2.npcId]) {
            this.speechBubbles[npc2.npcId].destroy();
            delete this.speechBubbles[npc2.npcId];
        }
    }
    
    handleMovement() {
        const speed = GAME_CONFIG.PLAYER_SPEED;
        let vx = 0, vy = 0;
        
        const up = this.cursors.up.isDown || this.wasd.up.isDown || this.mobileInput.up;
        const down = this.cursors.down.isDown || this.wasd.down.isDown || this.mobileInput.down;
        const left = this.cursors.left.isDown || this.wasd.left.isDown || this.mobileInput.left;
        const right = this.cursors.right.isDown || this.wasd.right.isDown || this.mobileInput.right;
        
        if (up) vy = -speed;
        if (down) vy = speed;
        if (left) vx = -speed;
        if (right) vx = speed;
        
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }
        
        this.player.setVelocity(vx, vy);
        
        if (vx !== 0 || vy !== 0) {
            if (Math.abs(vx) > Math.abs(vy)) {
                this.player.direction = vx > 0 ? 'right' : 'left';
            } else {
                this.player.direction = vy > 0 ? 'down' : 'up';
            }
            // Use texture swapping for direction
            this.player.setTexture(`player_${this.player.direction}`);
        }
    }
    
    handleInput() {
        if (Phaser.Input.Keyboard.JustDown(this.interactKey) || 
            Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
            this.mobileInteract) {
            this.mobileInteract = false;
            this.interact();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
            this.uiScene.toggleInventory();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.questKey)) {
            this.uiScene.toggleQuestLog();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.uiScene.togglePauseMenu();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.saveKey)) {
            const msg = GameSave.quickSave(
                { x: this.player.x, y: this.player.y, direction: this.player.direction },
                this.gameTime
            );
            this.uiScene.showNotification(msg);
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.attackKey) || this.mobileAttack) {
            this.mobileAttack = false;
            this.performAttack();
        }
    }
    
    checkNearby() {
        this.nearbyNPC = null;
        this.nearbyInteractable = null;
        
        const interactDistance = 50;
        
        Object.values(this.npcs).forEach(npc => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                npc.x, npc.y
            );
            
            if (dist < interactDistance && !npc.isBusy) {
                this.nearbyNPC = npc;
            }
        });
        
        this.interactables.forEach(obj => {
            if (obj.collected) return;
            
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                obj.x, obj.y
            );
            
            if (dist < interactDistance) {
                this.nearbyInteractable = obj;
            }
        });
        
        if (this.nearbyNPC || this.nearbyInteractable) {
            const name = this.nearbyNPC ? 
                this.nearbyNPC.npcData.name : 
                this.nearbyInteractable.interactName;
            this.uiScene.showInteractPrompt(name);
        } else {
            this.uiScene.hideInteractPrompt();
        }
    }
    
    interact() {
        if (this.nearbyNPC) {
            this.startDialogue(this.nearbyNPC);
        } else if (this.nearbyInteractable) {
            this.interactWith(this.nearbyInteractable);
        }
    }
    
    startDialogue(npc) {
        this.inDialogue = true;
        npc.isBusy = true;
        npc.setVelocity(0, 0);
        
        const dialogueKey = npc.npcData.dialogueKey;
        const dialogue = DIALOGUE_DATA[dialogueKey];
        
        if (dialogue) {
            const activeQuests = GameQuests.activeQuests;
            activeQuests.forEach(questId => {
                GameQuests.advanceQuest(questId, 'talk', npc.npcId);
            });
            
            this.uiScene.startDialogue(dialogue, npc.npcData, (result) => {
                this.inDialogue = false;
                npc.isBusy = false;
                
                if (result) {
                    if (result.action === 'startQuest') {
                        GameQuests.startQuest(result.questId);
                        this.updateQuestMarkers();
                        this.uiScene.showNotification(`Quest started: ${QUEST_DATA[result.questId].title}`);
                    }
                    
                    if (result.action === 'questChoice') {
                        const res = GameQuests.makeQuestChoice(result.questId || GameQuests.activeQuests[0], result.choice);
                        if (res && res.completed) {
                            this.uiScene.showNotification('Quest completed!', 3000);
                            this.updateQuestMarkers();
                        }
                    }
                    
                    if (result.flag) {
                        GameQuests.setFlag(result.flag);
                    }
                    
                    if (result.reputation) {
                        GameReputation.modifyReputation(npc.npcId, result.reputation);
                    }
                    
                    if (result.action === 'openShop') {
                        this.uiScene.openShop(npc.npcId);
                    }
                }
            });
        }
    }
    
    interactWith(obj) {
        if (obj.interactType === 'herb' && !obj.collected) {
            obj.collected = true;
            obj.setVisible(false);
            GameInventory.addItem('herbs');
            this.uiScene.showNotification('Collected Medicinal Herbs');
            
            const herbCount = GameInventory.getItemCount('herbs');
            if (herbCount >= 3 && GameQuests.getQuestState('find_herbs') === QUEST_STATES.ACTIVE) {
                this.uiScene.showNotification('You have enough herbs! Return to Marta.');
            }
        }
        
        if (obj.interactType === 'location') {
            GameQuests.activeQuests.forEach(questId => {
                const result = GameQuests.advanceQuest(questId, 'goto', obj.locationId);
                if (result && result.advanced) {
                    this.uiScene.showNotification(`Discovered: ${obj.interactName}`);
                }
            });
            
            if (obj.locationId === 'bandit_camp') {
                this.triggerBanditEncounter();
            }
        }
        
        if (obj.interactType === 'training') {
            this.uiScene.showNotification('You practice your combat skills...', 2000);
            // Could add skill increase here
        }
        
        if (obj.interactType === 'fishing') {
            this.uiScene.showNotification('You cast a line into the water...', 2000);
            this.time.delayedCall(3000, () => {
                if (Math.random() < 0.4) {
                    GameInventory.addItem('bread'); // Using bread as fish for now
                    this.uiScene.showNotification('You caught a fish!', 2000);
                } else {
                    this.uiScene.showNotification('The fish got away...', 2000);
                }
            });
        }
    }
    
    triggerBanditEncounter() {
        if (GameQuests.getQuestState('bandit_threat') !== QUEST_STATES.ACTIVE) {
            this.uiScene.showNotification('A dangerous-looking camp. Best stay away.');
            return;
        }
        
        this.uiScene.showChoiceDialogue(
            'You\'ve found the bandit camp. Rough men drink around a fire. What do you do?',
            [
                { text: 'Attack them!', action: () => this.startBanditFight() },
                { text: 'Try to negotiate', action: () => this.negotiateWithBandits() },
                { text: 'Leave quietly', action: () => this.uiScene.hideChoiceDialogue() }
            ]
        );
    }
    
    startBanditFight() {
        this.uiScene.hideChoiceDialogue();
        const stats = GameInventory.getEquippedStats();
        const combatPower = stats.attack + stats.defense;
        
        if (combatPower >= 5 || GameCombat.playerStats.hp > 70) {
            this.uiScene.showNotification('You fight bravely and defeat the bandits!', 3000);
            GameQuests.makeQuestChoice('bandit_threat', 'fight');
        } else {
            GameCombat.playerStats.hp -= 30;
            this.uiScene.showNotification('You\'re outmatched! Barely escape with your life.', 3000);
        }
    }
    
    negotiateWithBandits() {
        this.uiScene.hideChoiceDialogue();
        if (GameQuests.hasFlag('bandit_leader_name')) {
            this.uiScene.showNotification('You mention Otto\'s name. The bandits agree to leave peacefully.', 4000);
            GameQuests.makeQuestChoice('bandit_threat', 'negotiate');
        } else {
            this.uiScene.showNotification('They laugh at your attempt. "Pay up or fight!"', 3000);
        }
    }
    
    performAttack() {
        const attackRange = 40;
        
        Object.values(this.npcs).forEach(npc => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                npc.x, npc.y
            );
            
            if (dist < attackRange) {
                GameReputation.modifyReputation(npc.npcId, -20);
                this.uiScene.showNotification(`${npc.npcData.name} is outraged!`, 2000);
            }
        });
    }
    
    updateNPCLabels() {
        Object.values(this.npcs).forEach(npc => {
            npc.nameLabel.setPosition(npc.x, npc.y - 25);
            if (npc.shadow) {
                npc.shadow.setPosition(npc.x, npc.y + 14);
            }
            if (npc.questMarker) {
                npc.questMarker.setPosition(npc.x, npc.y - 40);
            }
        });
    }
    
    updateQuestMarkers() {
        Object.values(this.npcs).forEach(npc => {
            const data = npc.npcData;
            if (data.quests && data.quests.length > 0) {
                const hasAvailable = data.quests.some(qId => 
                    GameQuests.getQuestState(qId) === QUEST_STATES.AVAILABLE
                );
                
                if (hasAvailable && !npc.questMarker) {
                    npc.questMarker = this.add.image(npc.x, npc.y - 40, 'questMarker').setDepth(12);
                } else if (!hasAvailable && npc.questMarker) {
                    npc.questMarker.destroy();
                    npc.questMarker = null;
                }
            }
        });
    }
    
    sortByDepth() {
        const allSprites = [this.player, ...Object.values(this.npcs)];
        allSprites.forEach(sprite => {
            sprite.setDepth(sprite.y);
        });
    }
    
    updateGameTime() {
        if (this.isPaused || this.inDialogue) return;
        
        this.gameTime += 1;
        
        if (this.gameTime >= 1440) {
            this.gameTime = 0;
            this.dayCount++;
            this.uiScene.showNotification(`Day ${this.dayCount}`, 2000);
        }
    }
    
    updateLighting() {
        const hour = Math.floor(this.gameTime / 60);
        let alpha = 0;
        
        if (hour < 6) {
            alpha = 0.5;
        } else if (hour < 8) {
            alpha = 0.5 - ((hour - 6) / 2) * 0.5;
        } else if (hour < 18) {
            alpha = 0;
        } else if (hour < 20) {
            alpha = ((hour - 18) / 2) * 0.5;
        } else {
            alpha = 0.5;
        }
        
        if (!this.darkOverlay) {
            this.darkOverlay = this.add.rectangle(600, 400, 1400, 1000, 0x000033, alpha);
            this.darkOverlay.setDepth(1000);
            this.darkOverlay.setScrollFactor(0);
        }
        this.darkOverlay.setAlpha(alpha);
    }
    
    getTimeString() {
        const hour = Math.floor(this.gameTime / 60);
        const minute = this.gameTime % 60;
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    saveGame() {
        return GameSave.saveGame(
            { x: this.player.x, y: this.player.y, direction: this.player.direction },
            this.gameTime
        );
    }
}
