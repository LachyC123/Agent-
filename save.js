// Save/Load System using localStorage
class SaveSystem {
    constructor() {
        this.saveKey = 'bohemian_tales_save';
        this.autoSaveInterval = 60000; // Auto-save every minute
        this.lastSave = null;
    }
    
    // Save game state
    saveGame(playerPosition, gameTime) {
        const saveData = {
            version: '1.0',
            timestamp: Date.now(),
            player: {
                x: playerPosition.x,
                y: playerPosition.y,
                direction: playerPosition.direction || 'down'
            },
            gameTime: gameTime,
            inventory: GameInventory.getInventoryData(),
            quests: GameQuests.getSaveData(),
            reputation: GameReputation.getSaveData(),
            combat: GameCombat.getSaveData()
        };
        
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            this.lastSave = Date.now();
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }
    
    // Load game state
    loadGame() {
        try {
            const saveString = localStorage.getItem(this.saveKey);
            if (!saveString) return null;
            
            const saveData = JSON.parse(saveString);
            
            // Load into systems
            if (saveData.inventory) {
                GameInventory.loadInventoryData(saveData.inventory);
            }
            if (saveData.quests) {
                GameQuests.loadSaveData(saveData.quests);
            }
            if (saveData.reputation) {
                GameReputation.loadSaveData(saveData.reputation);
            }
            if (saveData.combat) {
                GameCombat.loadSaveData(saveData.combat);
            }
            
            return saveData;
        } catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    }
    
    // Check if save exists
    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }
    
    // Delete save
    deleteSave() {
        localStorage.removeItem(this.saveKey);
    }
    
    // Get save info without loading
    getSaveInfo() {
        try {
            const saveString = localStorage.getItem(this.saveKey);
            if (!saveString) return null;
            
            const saveData = JSON.parse(saveString);
            return {
                timestamp: saveData.timestamp,
                formattedDate: new Date(saveData.timestamp).toLocaleString(),
                questsCompleted: saveData.quests?.completedQuests?.length || 0,
                gold: saveData.inventory?.gold || 0
            };
        } catch (e) {
            return null;
        }
    }
    
    // Create a quick save slot
    quickSave(playerPosition, gameTime) {
        const result = this.saveGame(playerPosition, gameTime);
        if (result) {
            return 'Game saved!';
        }
        return 'Save failed!';
    }
}

// Global save system instance
const GameSave = new SaveSystem();
