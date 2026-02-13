// Boot Scene - Initialize game and load assets
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload() {
        // Update loading bar
        const progressBar = document.querySelector('.loading-progress');
        
        this.load.on('progress', (value) => {
            progressBar.style.width = `${value * 100}%`;
        });
    }
    
    create() {
        // Generate all procedural assets
        AssetGenerator.generateAll(this);
        
        // Initialize game systems
        GameInventory.init(STARTING_INVENTORY);
        GameQuests.init();
        GameReputation.init();
        GameCombat.init();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            this.scene.start('MenuScene');
        }, 500);
    }
}
