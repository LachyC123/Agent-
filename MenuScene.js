// Menu Scene - Main menu with medieval styling
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }
    
    create() {
        const { width, height } = this.cameras.main;
        
        // Background
        this.add.rectangle(width/2, height/2, width, height, 0x1a0f0a);
        
        // Decorative border
        const border = this.add.graphics();
        border.lineStyle(4, 0xd4af37);
        border.strokeRect(20, 20, width - 40, height - 40);
        border.lineStyle(2, 0x8b4513);
        border.strokeRect(30, 30, width - 60, height - 60);
        
        // Title
        this.add.text(width/2, 100, '⚔️ BOHEMIAN TALES ⚔️', {
            fontSize: '42px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.add.text(width/2, 150, 'A Medieval RPG', {
            fontSize: '20px',
            fontFamily: 'Georgia, serif',
            color: '#a08060',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(width/2, 180, 'Inspired by Kingdom Come: Deliverance', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#6b5344'
        }).setOrigin(0.5);
        
        // Menu buttons
        const buttonStyle = {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            color: '#f5deb3'
        };
        
        // New Game button
        const newGameBtn = this.createMenuButton(width/2, 280, 'New Game', buttonStyle);
        newGameBtn.on('pointerdown', () => this.startNewGame());
        
        // Continue button (if save exists)
        if (GameSave.hasSave()) {
            const continueBtn = this.createMenuButton(width/2, 340, 'Continue', buttonStyle);
            continueBtn.on('pointerdown', () => this.continueGame());
            
            const saveInfo = GameSave.getSaveInfo();
            if (saveInfo) {
                this.add.text(width/2, 375, `Last saved: ${saveInfo.formattedDate}`, {
                    fontSize: '12px',
                    fontFamily: 'Georgia, serif',
                    color: '#6b5344'
                }).setOrigin(0.5);
            }
        }
        
        // Controls info
        this.add.text(width/2, 480, 'CONTROLS', {
            fontSize: '18px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        }).setOrigin(0.5);
        
        const controlsText = [
            'WASD / Arrow Keys - Move',
            'E / Space - Interact',
            'I - Inventory',
            'Q - Quest Log',
            'ESC - Menu'
        ].join('\n');
        
        this.add.text(width/2, 540, controlsText, {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#a08060',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);
        
        // Version
        this.add.text(width - 30, height - 20, 'v1.0', {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            color: '#4a3728'
        }).setOrigin(1);
    }
    
    createMenuButton(x, y, text, style) {
        const container = this.add.container(x, y);
        
        // Button background
        const bg = this.add.graphics();
        bg.fillStyle(0x2c1810, 0.9);
        bg.fillRoundedRect(-120, -25, 240, 50, 8);
        bg.lineStyle(2, 0x8b4513);
        bg.strokeRoundedRect(-120, -25, 240, 50, 8);
        container.add(bg);
        
        // Button text
        const btnText = this.add.text(0, 0, text, style).setOrigin(0.5);
        container.add(btnText);
        
        // Make interactive
        container.setSize(240, 50);
        container.setInteractive({ useHandCursor: true });
        
        // Hover effects
        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x3c2820, 0.9);
            bg.fillRoundedRect(-120, -25, 240, 50, 8);
            bg.lineStyle(2, 0xd4af37);
            bg.strokeRoundedRect(-120, -25, 240, 50, 8);
            btnText.setColor('#ffd700');
        });
        
        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x2c1810, 0.9);
            bg.fillRoundedRect(-120, -25, 240, 50, 8);
            bg.lineStyle(2, 0x8b4513);
            bg.strokeRoundedRect(-120, -25, 240, 50, 8);
            btnText.setColor('#f5deb3');
        });
        
        return container;
    }
    
    startNewGame() {
        // Reset all systems
        GameInventory.init(STARTING_INVENTORY);
        GameQuests.init();
        GameReputation.init();
        GameCombat.init();
        
        // Start game with fresh state
        this.scene.start('GameScene', { newGame: true });
    }
    
    continueGame() {
        const saveData = GameSave.loadGame();
        if (saveData) {
            this.scene.start('GameScene', { 
                loadedSave: saveData,
                newGame: false 
            });
        } else {
            this.startNewGame();
        }
    }
}
