// Combat System - Medieval melee combat
class CombatSystem {
    constructor() {
        this.inCombat = false;
        this.combatants = [];
        this.turnOrder = [];
        this.currentTurn = 0;
        this.playerStats = {
            maxHp: 100,
            hp: 100,
            stamina: 100,
            maxStamina: 100
        };
    }
    
    init() {
        this.playerStats = {
            maxHp: 100,
            hp: 100,
            stamina: 100,
            maxStamina: 100
        };
    }
    
    // Real-time combat for the game
    startCombat(enemies) {
        this.inCombat = true;
        this.combatants = enemies.map(enemy => ({
            ...enemy,
            hp: enemy.maxHp || 30,
            maxHp: enemy.maxHp || 30,
            stunned: false
        }));
    }
    
    endCombat() {
        this.inCombat = false;
        this.combatants = [];
    }
    
    // Player attacks
    playerAttack(targetIndex) {
        if (!this.inCombat || targetIndex >= this.combatants.length) return null;
        
        const target = this.combatants[targetIndex];
        if (target.hp <= 0) return null;
        
        const stats = GameInventory.getEquippedStats();
        const baseDamage = stats.attack;
        
        // Add some randomness
        const variance = Math.floor(Math.random() * 3) - 1;
        const damage = Math.max(1, baseDamage + variance);
        
        // Stamina cost
        if (this.playerStats.stamina < 10) {
            return { miss: true, reason: 'Too exhausted to attack!' };
        }
        this.playerStats.stamina -= 10;
        
        target.hp -= damage;
        
        const result = {
            hit: true,
            damage: damage,
            targetHp: target.hp,
            targetDead: target.hp <= 0
        };
        
        // Check if combat is over
        if (this.combatants.every(c => c.hp <= 0)) {
            result.victory = true;
            this.endCombat();
        }
        
        return result;
    }
    
    // Enemy attacks player
    enemyAttack(enemy) {
        if (enemy.hp <= 0 || enemy.stunned) return null;
        
        const stats = GameInventory.getEquippedStats();
        const baseDamage = enemy.attack || 5;
        const defense = stats.defense;
        
        // Add randomness and defense reduction
        const variance = Math.floor(Math.random() * 3) - 1;
        const damage = Math.max(1, baseDamage + variance - defense);
        
        this.playerStats.hp -= damage;
        
        const result = {
            damage: damage,
            playerHp: this.playerStats.hp,
            playerDead: this.playerStats.hp <= 0
        };
        
        if (this.playerStats.hp <= 0) {
            result.defeat = true;
            this.endCombat();
        }
        
        return result;
    }
    
    // Block/dodge
    playerBlock() {
        if (this.playerStats.stamina < 15) {
            return { success: false, reason: 'Too exhausted to block!' };
        }
        this.playerStats.stamina -= 15;
        return { 
            success: true, 
            damageReduction: 0.7,
            message: 'Braced for impact!'
        };
    }
    
    // Healing from items
    heal(amount) {
        const oldHp = this.playerStats.hp;
        this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + amount);
        return this.playerStats.hp - oldHp;
    }
    
    // Stamina recovery
    recoverStamina(amount = 5) {
        this.playerStats.stamina = Math.min(
            this.playerStats.maxStamina, 
            this.playerStats.stamina + amount
        );
    }
    
    // Get player's current stats
    getPlayerStats() {
        return { ...this.playerStats };
    }
    
    // Check if in combat
    isInCombat() {
        return this.inCombat;
    }
    
    // Get save data
    getSaveData() {
        return {
            playerStats: { ...this.playerStats }
        };
    }
    
    loadSaveData(data) {
        this.playerStats = data.playerStats || {
            maxHp: 100,
            hp: 100,
            stamina: 100,
            maxStamina: 100
        };
    }
}

// Enemy definitions
const ENEMIES = {
    bandit: {
        name: 'Bandit',
        sprite: 'peasant',
        maxHp: 25,
        attack: 4,
        speed: 80
    },
    bandit_leader: {
        name: 'Bandit Leader',
        sprite: 'guard',
        maxHp: 50,
        attack: 7,
        speed: 70
    },
    wolf: {
        name: 'Wolf',
        sprite: 'peasant', // Would need wolf sprite
        maxHp: 15,
        attack: 3,
        speed: 120
    }
};

// Global combat instance
const GameCombat = new CombatSystem();
