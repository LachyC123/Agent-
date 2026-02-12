// Main Game Configuration and Initialization
const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    backgroundColor: '#1a0f0a',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 400,
            height: 300
        },
        max: {
            width: 1600,
            height: 1200
        }
    },
    scene: [BootScene, MenuScene, GameScene, UIScene]
};

// Create the game instance
const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
    game.scale.refresh();
});

// Prevent context menu on right-click
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#game-container')) {
        e.preventDefault();
    }
});

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        game.scene.pause('GameScene');
    } else {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && !gameScene.isPaused) {
            game.scene.resume('GameScene');
        }
    }
});

console.log('🏰 Bohemian Tales - A Medieval RPG');
console.log('Inspired by Kingdom Come: Deliverance');
console.log('Press E to interact, I for inventory, Q for quests');
