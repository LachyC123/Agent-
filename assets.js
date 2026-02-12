// Procedural Pixel Art Asset Generator
const AssetGenerator = {
    
    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    },
    
    // Generate all game assets
    generateAll(scene) {
        this.generateTiles(scene);
        this.generateCharacters(scene);
        this.generateItems(scene);
        this.generateUI(scene);
        this.generateBuildings(scene);
    },
    
    // Tile generation
    generateTiles(scene) {
        // Grass tile
        const grass = this.createCanvas(32, 32);
        const gCtx = grass.getContext('2d');
        gCtx.fillStyle = '#4a7023';
        gCtx.fillRect(0, 0, 32, 32);
        // Add grass detail
        gCtx.fillStyle = '#5a8030';
        for (let i = 0; i < 20; i++) {
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            gCtx.fillRect(x, y, 2, 3);
        }
        gCtx.fillStyle = '#3d5c1a';
        for (let i = 0; i < 15; i++) {
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            gCtx.fillRect(x, y, 1, 2);
        }
        scene.textures.addCanvas('grass', grass);
        
        // Dirt path
        const dirt = this.createCanvas(32, 32);
        const dCtx = dirt.getContext('2d');
        dCtx.fillStyle = '#8b7355';
        dCtx.fillRect(0, 0, 32, 32);
        dCtx.fillStyle = '#9a8265';
        for (let i = 0; i < 10; i++) {
            const x = Math.floor(Math.random() * 30);
            const y = Math.floor(Math.random() * 30);
            dCtx.fillRect(x, y, 3, 2);
        }
        dCtx.fillStyle = '#6b5344';
        for (let i = 0; i < 8; i++) {
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            dCtx.fillRect(x, y, 2, 2);
        }
        scene.textures.addCanvas('dirt', dirt);
        
        // Water
        const water = this.createCanvas(32, 32);
        const wCtx = water.getContext('2d');
        wCtx.fillStyle = '#4a7090';
        wCtx.fillRect(0, 0, 32, 32);
        wCtx.fillStyle = '#5a80a0';
        for (let i = 0; i < 5; i++) {
            const y = 4 + i * 6;
            wCtx.fillRect(0, y, 32, 2);
        }
        scene.textures.addCanvas('water', water);
        
        // Stone floor
        const stone = this.createCanvas(32, 32);
        const sCtx = stone.getContext('2d');
        sCtx.fillStyle = '#707070';
        sCtx.fillRect(0, 0, 32, 32);
        sCtx.strokeStyle = '#5a5a5a';
        sCtx.lineWidth = 1;
        sCtx.strokeRect(0, 0, 16, 16);
        sCtx.strokeRect(16, 16, 16, 16);
        scene.textures.addCanvas('stone', stone);
        
        // Forest/dense trees
        const forest = this.createCanvas(32, 32);
        const fCtx = forest.getContext('2d');
        fCtx.fillStyle = '#2d4a1c';
        fCtx.fillRect(0, 0, 32, 32);
        fCtx.fillStyle = '#1d3a0c';
        fCtx.beginPath();
        fCtx.arc(16, 16, 14, 0, Math.PI * 2);
        fCtx.fill();
        fCtx.fillStyle = '#3d5a2c';
        fCtx.beginPath();
        fCtx.arc(10, 12, 6, 0, Math.PI * 2);
        fCtx.fill();
        scene.textures.addCanvas('forest', forest);
    },
    
    // Character sprite generation - creates individual textures for each direction
    generateCharacters(scene) {
        const directions = ['down', 'left', 'right', 'up'];
        
        // Player sprites - one per direction
        const playerConfig = {
            hair: '#4a3728',
            tunic: '#6b4423',
            pants: '#3d2817',
            skin: '#deb887'
        };
        
        directions.forEach((dir, dirIndex) => {
            const canvas = this.createCanvas(32, 32);
            const ctx = canvas.getContext('2d');
            this.drawCharacter(ctx, 0, 0, {
                ...playerConfig,
                direction: dir,
                frame: 0
            });
            scene.textures.addCanvas(`player_${dir}`, canvas);
        });
        // Also create default 'player' texture (down-facing)
        const playerDefault = this.createCanvas(32, 32);
        const playerCtx = playerDefault.getContext('2d');
        this.drawCharacter(playerCtx, 0, 0, { ...playerConfig, direction: 'down', frame: 0 });
        scene.textures.addCanvas('player', playerDefault);
        
        // NPC sprites - one texture per NPC type
        const npcConfigs = [
            { id: 'blacksmith', hair: '#2a2a2a', tunic: '#4a4a4a', pants: '#2d2d2d', skin: '#c9a57a' },
            { id: 'innkeeper', hair: '#8b4513', tunic: '#8b0000', pants: '#3d2817', skin: '#deb887' },
            { id: 'miller', hair: '#d4a574', tunic: '#c4a35a', pants: '#8b7355', skin: '#e8c89a' },
            { id: 'guard', hair: '#2a2a2a', tunic: '#4a4a60', pants: '#3a3a4a', skin: '#d4a574', armor: true },
            { id: 'merchant', hair: '#6b4423', tunic: '#2e4a1c', pants: '#1d3a0c', skin: '#deb887' },
            { id: 'priest', hair: '#4a4a4a', tunic: '#1a1a1a', pants: '#1a1a1a', skin: '#e8c89a' },
            { id: 'noble', hair: '#3a2818', tunic: '#4a0020', pants: '#2a0010', skin: '#f5deb3' },
            { id: 'peasant', hair: '#8b7355', tunic: '#6b5344', pants: '#4a3d32', skin: '#c9a57a' }
        ];
        
        npcConfigs.forEach(config => {
            // Create textures for each direction
            directions.forEach((dir, dirIndex) => {
                const canvas = this.createCanvas(32, 32);
                const ctx = canvas.getContext('2d');
                this.drawCharacter(ctx, 0, 0, {
                    ...config,
                    direction: dir,
                    frame: 0
                });
                scene.textures.addCanvas(`${config.id}_${dir}`, canvas);
            });
            // Also create default texture (down-facing)
            const defaultCanvas = this.createCanvas(32, 32);
            const defaultCtx = defaultCanvas.getContext('2d');
            this.drawCharacter(defaultCtx, 0, 0, { ...config, direction: 'down', frame: 0 });
            scene.textures.addCanvas(config.id, defaultCanvas);
        });
    },
    
    drawCharacter(ctx, x, y, config) {
        const { hair, tunic, pants, skin, direction, frame, armor } = config;
        
        // Body offset for animation
        const yOffset = frame === 1 ? -1 : 0;
        const legOffset = frame === 1 ? 1 : (frame === 2 ? -1 : 0);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 30, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs
        ctx.fillStyle = pants;
        if (direction === 'left' || direction === 'right') {
            ctx.fillRect(x + 11, y + 22 + yOffset + legOffset, 4, 8);
            ctx.fillRect(x + 17, y + 22 + yOffset - legOffset, 4, 8);
        } else {
            ctx.fillRect(x + 11, y + 22 + yOffset, 4, 8);
            ctx.fillRect(x + 17, y + 22 + yOffset, 4, 8);
        }
        
        // Body/tunic
        ctx.fillStyle = tunic;
        ctx.fillRect(x + 9, y + 12 + yOffset, 14, 12);
        
        // Armor overlay if guard
        if (armor) {
            ctx.fillStyle = '#696969';
            ctx.fillRect(x + 10, y + 13 + yOffset, 12, 10);
            ctx.fillStyle = '#808080';
            ctx.fillRect(x + 11, y + 14 + yOffset, 10, 8);
        }
        
        // Arms
        ctx.fillStyle = tunic;
        if (direction === 'left') {
            ctx.fillRect(x + 6, y + 14 + yOffset, 4, 8);
        } else if (direction === 'right') {
            ctx.fillRect(x + 22, y + 14 + yOffset, 4, 8);
        } else {
            ctx.fillRect(x + 6, y + 14 + yOffset, 4, 8);
            ctx.fillRect(x + 22, y + 14 + yOffset, 4, 8);
        }
        
        // Head
        ctx.fillStyle = skin;
        ctx.fillRect(x + 10, y + 4 + yOffset, 12, 10);
        
        // Hair
        ctx.fillStyle = hair;
        ctx.fillRect(x + 10, y + 3 + yOffset, 12, 4);
        if (direction === 'down') {
            // Face detail
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(x + 12, y + 8 + yOffset, 2, 2);
            ctx.fillRect(x + 18, y + 8 + yOffset, 2, 2);
        } else if (direction === 'left') {
            ctx.fillRect(x + 9, y + 4 + yOffset, 3, 6);
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(x + 11, y + 8 + yOffset, 2, 2);
        } else if (direction === 'right') {
            ctx.fillRect(x + 20, y + 4 + yOffset, 3, 6);
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(x + 19, y + 8 + yOffset, 2, 2);
        }
    },
    
    // Item icons
    generateItems(scene) {
        const items = [
            { id: 'sword', draw: this.drawSword },
            { id: 'shield', draw: this.drawShield },
            { id: 'bread', draw: this.drawBread },
            { id: 'potion', draw: this.drawPotion },
            { id: 'coin', draw: this.drawCoin },
            { id: 'key', draw: this.drawKey },
            { id: 'scroll', draw: this.drawScroll },
            { id: 'hammer', draw: this.drawHammer }
        ];
        
        items.forEach(item => {
            const canvas = this.createCanvas(24, 24);
            const ctx = canvas.getContext('2d');
            item.draw(ctx);
            scene.textures.addCanvas(item.id, canvas);
        });
    },
    
    drawSword(ctx) {
        // Handle
        ctx.fillStyle = '#5c3310';
        ctx.fillRect(10, 16, 4, 6);
        // Guard
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(6, 14, 12, 3);
        // Blade
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(11, 2, 2, 12);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(11, 2, 1, 12);
        // Tip
        ctx.fillRect(11, 1, 2, 1);
    },
    
    drawShield(ctx) {
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(12, 2);
        ctx.lineTo(20, 6);
        ctx.lineTo(20, 14);
        ctx.lineTo(12, 22);
        ctx.lineTo(4, 14);
        ctx.lineTo(4, 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(10, 8, 4, 8);
        ctx.fillRect(8, 10, 8, 4);
    },
    
    drawBread(ctx) {
        ctx.fillStyle = '#c4a35a';
        ctx.beginPath();
        ctx.ellipse(12, 14, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d4b36a';
        ctx.beginPath();
        ctx.ellipse(12, 12, 6, 4, 0, 0, Math.PI);
        ctx.fill();
    },
    
    drawPotion(ctx) {
        ctx.fillStyle = '#4a0000';
        ctx.fillRect(9, 8, 6, 12);
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(10, 10, 4, 8);
        ctx.fillStyle = '#5c3310';
        ctx.fillRect(10, 4, 4, 5);
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(9, 4, 6, 2);
    },
    
    drawCoin(ctx) {
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(12, 12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b8960c';
        ctx.beginPath();
        ctx.arc(12, 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d4af37';
        ctx.font = '10px serif';
        ctx.fillText('G', 9, 16);
    },
    
    drawKey(ctx) {
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(8, 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2c1810';
        ctx.beginPath();
        ctx.arc(8, 8, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(12, 7, 10, 3);
        ctx.fillRect(18, 10, 2, 4);
        ctx.fillRect(14, 10, 2, 3);
    },
    
    drawScroll(ctx) {
        ctx.fillStyle = '#f5deb3';
        ctx.fillRect(6, 4, 12, 16);
        ctx.fillStyle = '#deb887';
        ctx.fillRect(6, 4, 12, 2);
        ctx.fillRect(6, 18, 12, 2);
        ctx.fillStyle = '#8b4513';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(8, 8 + i * 3, 8, 1);
        }
    },
    
    drawHammer(ctx) {
        ctx.fillStyle = '#5c3310';
        ctx.fillRect(11, 10, 3, 12);
        ctx.fillStyle = '#696969';
        ctx.fillRect(6, 4, 12, 8);
        ctx.fillStyle = '#808080';
        ctx.fillRect(7, 5, 10, 6);
    },
    
    // UI elements
    generateUI(scene) {
        // Dialog box
        const dialog = this.createCanvas(600, 150);
        const dlgCtx = dialog.getContext('2d');
        dlgCtx.fillStyle = 'rgba(44, 24, 16, 0.95)';
        dlgCtx.fillRect(0, 0, 600, 150);
        dlgCtx.strokeStyle = '#d4af37';
        dlgCtx.lineWidth = 3;
        dlgCtx.strokeRect(2, 2, 596, 146);
        dlgCtx.strokeStyle = '#8b4513';
        dlgCtx.lineWidth = 1;
        dlgCtx.strokeRect(6, 6, 588, 138);
        scene.textures.addCanvas('dialogBox', dialog);
        
        // Inventory slot
        const slot = this.createCanvas(40, 40);
        const slotCtx = slot.getContext('2d');
        slotCtx.fillStyle = 'rgba(44, 24, 16, 0.9)';
        slotCtx.fillRect(0, 0, 40, 40);
        slotCtx.strokeStyle = '#8b4513';
        slotCtx.lineWidth = 2;
        slotCtx.strokeRect(1, 1, 38, 38);
        scene.textures.addCanvas('invSlot', slot);
        
        // Health bar background
        const hpBg = this.createCanvas(100, 16);
        const hpBgCtx = hpBg.getContext('2d');
        hpBgCtx.fillStyle = '#2c1810';
        hpBgCtx.fillRect(0, 0, 100, 16);
        hpBgCtx.strokeStyle = '#5c4033';
        hpBgCtx.lineWidth = 2;
        hpBgCtx.strokeRect(1, 1, 98, 14);
        scene.textures.addCanvas('hpBarBg', hpBg);
        
        // Health bar fill
        const hpFill = this.createCanvas(96, 12);
        const hpFillCtx = hpFill.getContext('2d');
        const gradient = hpFillCtx.createLinearGradient(0, 0, 0, 12);
        gradient.addColorStop(0, '#8b0000');
        gradient.addColorStop(0.5, '#cc0000');
        gradient.addColorStop(1, '#8b0000');
        hpFillCtx.fillStyle = gradient;
        hpFillCtx.fillRect(0, 0, 96, 12);
        scene.textures.addCanvas('hpBarFill', hpFill);
        
        // Quest marker
        const questMark = this.createCanvas(16, 20);
        const qmCtx = questMark.getContext('2d');
        qmCtx.fillStyle = '#ffd700';
        qmCtx.font = 'bold 18px serif';
        qmCtx.fillText('!', 4, 16);
        scene.textures.addCanvas('questMarker', questMark);
        
        // Talk indicator
        const talkInd = this.createCanvas(16, 16);
        const tiCtx = talkInd.getContext('2d');
        tiCtx.fillStyle = '#ffffff';
        tiCtx.beginPath();
        tiCtx.moveTo(2, 2);
        tiCtx.lineTo(14, 2);
        tiCtx.lineTo(14, 10);
        tiCtx.lineTo(8, 10);
        tiCtx.lineTo(6, 14);
        tiCtx.lineTo(6, 10);
        tiCtx.lineTo(2, 10);
        tiCtx.closePath();
        tiCtx.fill();
        scene.textures.addCanvas('talkBubble', talkInd);
    },
    
    // Building generation
    generateBuildings(scene) {
        // House
        const house = this.createCanvas(96, 96);
        const hCtx = house.getContext('2d');
        // Walls
        hCtx.fillStyle = '#8b7355';
        hCtx.fillRect(8, 40, 80, 48);
        // Timber frame
        hCtx.fillStyle = '#5c3310';
        hCtx.fillRect(8, 40, 80, 4);
        hCtx.fillRect(8, 84, 80, 4);
        hCtx.fillRect(8, 40, 4, 48);
        hCtx.fillRect(84, 40, 4, 48);
        hCtx.fillRect(44, 40, 4, 48);
        // Roof
        hCtx.fillStyle = '#c4a35a';
        hCtx.beginPath();
        hCtx.moveTo(0, 44);
        hCtx.lineTo(48, 8);
        hCtx.lineTo(96, 44);
        hCtx.closePath();
        hCtx.fill();
        hCtx.fillStyle = '#a48340';
        hCtx.fillRect(0, 40, 96, 4);
        // Door
        hCtx.fillStyle = '#4a3020';
        hCtx.fillRect(38, 56, 20, 32);
        hCtx.fillStyle = '#d4af37';
        hCtx.fillRect(52, 70, 3, 3);
        // Window
        hCtx.fillStyle = '#87ceeb';
        hCtx.fillRect(16, 52, 16, 16);
        hCtx.fillRect(64, 52, 16, 16);
        hCtx.fillStyle = '#5c3310';
        hCtx.fillRect(23, 52, 2, 16);
        hCtx.fillRect(16, 59, 16, 2);
        hCtx.fillRect(71, 52, 2, 16);
        hCtx.fillRect(64, 59, 16, 2);
        scene.textures.addCanvas('house', house);
        
        // Inn (larger)
        const inn = this.createCanvas(128, 112);
        const iCtx = inn.getContext('2d');
        // Walls
        iCtx.fillStyle = '#9a8265';
        iCtx.fillRect(8, 48, 112, 56);
        // Timber frame
        iCtx.fillStyle = '#5c3310';
        iCtx.fillRect(8, 48, 112, 4);
        iCtx.fillRect(8, 100, 112, 4);
        iCtx.fillRect(8, 48, 4, 56);
        iCtx.fillRect(116, 48, 4, 56);
        // Roof
        iCtx.fillStyle = '#8b4513';
        iCtx.beginPath();
        iCtx.moveTo(0, 52);
        iCtx.lineTo(64, 8);
        iCtx.lineTo(128, 52);
        iCtx.closePath();
        iCtx.fill();
        // Sign
        iCtx.fillStyle = '#5c3310';
        iCtx.fillRect(100, 60, 24, 16);
        iCtx.fillStyle = '#f5deb3';
        iCtx.font = '10px serif';
        iCtx.fillText('INN', 104, 72);
        // Door
        iCtx.fillStyle = '#4a3020';
        iCtx.fillRect(52, 68, 24, 36);
        iCtx.fillStyle = '#d4af37';
        iCtx.fillRect(70, 84, 3, 3);
        // Windows
        for (let i = 0; i < 2; i++) {
            iCtx.fillStyle = '#ffd700';
            iCtx.fillRect(16 + i * 80, 60, 20, 20);
            iCtx.fillStyle = '#5c3310';
            iCtx.fillRect(25 + i * 80, 60, 2, 20);
            iCtx.fillRect(16 + i * 80, 69, 20, 2);
        }
        scene.textures.addCanvas('inn', inn);
        
        // Blacksmith
        const smithy = this.createCanvas(96, 80);
        const smCtx = smithy.getContext('2d');
        // Open structure
        smCtx.fillStyle = '#5c3310';
        smCtx.fillRect(8, 40, 8, 36);
        smCtx.fillRect(80, 40, 8, 36);
        // Roof
        smCtx.fillStyle = '#696969';
        smCtx.fillRect(0, 32, 96, 12);
        // Forge
        smCtx.fillStyle = '#4a4a4a';
        smCtx.fillRect(56, 48, 28, 24);
        smCtx.fillStyle = '#ff4500';
        smCtx.fillRect(62, 54, 16, 12);
        // Anvil
        smCtx.fillStyle = '#3a3a3a';
        smCtx.fillRect(24, 60, 20, 8);
        smCtx.fillRect(28, 56, 12, 4);
        scene.textures.addCanvas('smithy', smithy);
        
        // Mill
        const mill = this.createCanvas(80, 112);
        const mlCtx = mill.getContext('2d');
        // Tower
        mlCtx.fillStyle = '#c4a35a';
        mlCtx.fillRect(16, 32, 48, 72);
        // Roof
        mlCtx.fillStyle = '#8b4513';
        mlCtx.beginPath();
        mlCtx.moveTo(12, 36);
        mlCtx.lineTo(40, 4);
        mlCtx.lineTo(68, 36);
        mlCtx.closePath();
        mlCtx.fill();
        // Sails
        mlCtx.fillStyle = '#f5f5dc';
        mlCtx.save();
        mlCtx.translate(40, 50);
        for (let i = 0; i < 4; i++) {
            mlCtx.rotate(Math.PI / 2);
            mlCtx.fillRect(-3, 0, 6, 32);
        }
        mlCtx.restore();
        // Door
        mlCtx.fillStyle = '#4a3020';
        mlCtx.fillRect(32, 80, 16, 24);
        scene.textures.addCanvas('mill', mill);
        
        // Church
        const church = this.createCanvas(96, 128);
        const chCtx = church.getContext('2d');
        // Main building
        chCtx.fillStyle = '#a0a0a0';
        chCtx.fillRect(8, 56, 80, 64);
        // Tower
        chCtx.fillStyle = '#909090';
        chCtx.fillRect(32, 24, 32, 40);
        // Spire
        chCtx.fillStyle = '#5c3310';
        chCtx.beginPath();
        chCtx.moveTo(32, 28);
        chCtx.lineTo(48, 4);
        chCtx.lineTo(64, 28);
        chCtx.closePath();
        chCtx.fill();
        // Cross
        chCtx.fillStyle = '#d4af37';
        chCtx.fillRect(46, 6, 4, 12);
        chCtx.fillRect(42, 10, 12, 4);
        // Door
        chCtx.fillStyle = '#4a3020';
        chCtx.beginPath();
        chCtx.moveTo(36, 120);
        chCtx.lineTo(36, 88);
        chCtx.arc(48, 88, 12, Math.PI, 0);
        chCtx.lineTo(60, 120);
        chCtx.closePath();
        chCtx.fill();
        // Window
        chCtx.fillStyle = '#4080c0';
        chCtx.beginPath();
        chCtx.arc(48, 68, 8, 0, Math.PI * 2);
        chCtx.fill();
        scene.textures.addCanvas('church', church);
        
        // Tree
        const tree = this.createCanvas(48, 64);
        const tCtx = tree.getContext('2d');
        // Trunk
        tCtx.fillStyle = '#5c3310';
        tCtx.fillRect(20, 40, 8, 20);
        // Foliage
        tCtx.fillStyle = '#2d4a1c';
        tCtx.beginPath();
        tCtx.arc(24, 28, 20, 0, Math.PI * 2);
        tCtx.fill();
        tCtx.fillStyle = '#3d5a2c';
        tCtx.beginPath();
        tCtx.arc(18, 24, 12, 0, Math.PI * 2);
        tCtx.fill();
        tCtx.beginPath();
        tCtx.arc(30, 20, 10, 0, Math.PI * 2);
        tCtx.fill();
        scene.textures.addCanvas('tree', tree);
        
        // Well
        const well = this.createCanvas(40, 48);
        const weCtx = well.getContext('2d');
        // Base
        weCtx.fillStyle = '#707070';
        weCtx.beginPath();
        weCtx.ellipse(20, 36, 16, 8, 0, 0, Math.PI * 2);
        weCtx.fill();
        weCtx.fillStyle = '#505050';
        weCtx.fillRect(4, 20, 32, 16);
        weCtx.fillStyle = '#4a7090';
        weCtx.beginPath();
        weCtx.ellipse(20, 22, 12, 6, 0, 0, Math.PI * 2);
        weCtx.fill();
        // Roof structure
        weCtx.fillStyle = '#5c3310';
        weCtx.fillRect(6, 4, 4, 20);
        weCtx.fillRect(30, 4, 4, 20);
        weCtx.fillStyle = '#8b4513';
        weCtx.fillRect(2, 2, 36, 4);
        scene.textures.addCanvas('well', well);
        
        // Fence horizontal
        const fenceH = this.createCanvas(32, 24);
        const fhCtx = fenceH.getContext('2d');
        fhCtx.fillStyle = '#5c3310';
        fhCtx.fillRect(0, 8, 32, 4);
        fhCtx.fillRect(0, 16, 32, 4);
        fhCtx.fillRect(2, 4, 4, 18);
        fhCtx.fillRect(26, 4, 4, 18);
        scene.textures.addCanvas('fenceH', fenceH);
        
        // Fence vertical
        const fenceV = this.createCanvas(24, 32);
        const fvCtx = fenceV.getContext('2d');
        fvCtx.fillStyle = '#5c3310';
        fvCtx.fillRect(8, 0, 4, 32);
        fvCtx.fillRect(16, 0, 4, 32);
        fvCtx.fillRect(4, 2, 18, 4);
        fvCtx.fillRect(4, 26, 18, 4);
        scene.textures.addCanvas('fenceV', fenceV);
    }
};
