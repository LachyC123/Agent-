// Reputation System - Tracks relationships and consequences
class ReputationSystem {
    constructor() {
        this.reputation = {};
        this.globalReputation = 0;
    }
    
    init() {
        // Initialize reputation with all NPCs
        Object.keys(NPC_DATA).forEach(npcId => {
            this.reputation[npcId] = 0;
        });
        this.globalReputation = 0;
    }
    
    modifyReputation(npcId, amount) {
        if (this.reputation[npcId] !== undefined) {
            this.reputation[npcId] += amount;
            // Clamp reputation
            this.reputation[npcId] = Math.max(-100, Math.min(100, this.reputation[npcId]));
        }
        
        // Adjust global reputation
        this.globalReputation += Math.floor(amount / 2);
        this.globalReputation = Math.max(-100, Math.min(100, this.globalReputation));
        
        // Trigger relationship cascades
        this.cascadeReputation(npcId, amount);
    }
    
    cascadeReputation(sourceNpc, originalAmount) {
        // NPC relationships affect reputation spread
        const relationships = NPC_RELATIONSHIPS[sourceNpc];
        if (!relationships) return;
        
        Object.entries(relationships).forEach(([relatedNpc, modifier]) => {
            // Related NPCs are affected by a percentage based on their relationship
            const cascadeAmount = Math.floor(originalAmount * (modifier / 100));
            if (cascadeAmount !== 0 && this.reputation[relatedNpc] !== undefined) {
                this.reputation[relatedNpc] += cascadeAmount;
                this.reputation[relatedNpc] = Math.max(-100, Math.min(100, this.reputation[relatedNpc]));
            }
        });
    }
    
    getReputation(npcId) {
        return this.reputation[npcId] || 0;
    }
    
    getReputationLevel(npcId) {
        const rep = this.getReputation(npcId);
        
        if (rep <= GAME_CONFIG.REPUTATION.HATED) return 'hated';
        if (rep <= GAME_CONFIG.REPUTATION.DISLIKED) return 'disliked';
        if (rep < GAME_CONFIG.REPUTATION.LIKED) return 'neutral';
        if (rep < GAME_CONFIG.REPUTATION.LOVED) return 'liked';
        return 'loved';
    }
    
    getReputationText(npcId) {
        const level = this.getReputationLevel(npcId);
        const texts = {
            hated: 'Despises you',
            disliked: 'Distrustful',
            neutral: 'Indifferent',
            liked: 'Friendly',
            loved: 'Devoted'
        };
        return texts[level];
    }
    
    getGlobalReputation() {
        return this.globalReputation;
    }
    
    getGlobalReputationText() {
        const rep = this.globalReputation;
        if (rep <= -50) return 'Notorious';
        if (rep <= -20) return 'Questionable';
        if (rep < 20) return 'Unknown';
        if (rep < 50) return 'Respected';
        return 'Renowned';
    }
    
    // Check if player meets reputation requirement
    meetsRequirement(npcId, required) {
        return this.getReputation(npcId) >= required;
    }
    
    // Get dialogue modifier based on reputation
    getDialogueModifier(npcId) {
        const level = this.getReputationLevel(npcId);
        return {
            hated: { priceMultiplier: 2.0, extraDialogue: 'hostile' },
            disliked: { priceMultiplier: 1.3, extraDialogue: 'cold' },
            neutral: { priceMultiplier: 1.0, extraDialogue: null },
            liked: { priceMultiplier: 0.9, extraDialogue: 'friendly' },
            loved: { priceMultiplier: 0.75, extraDialogue: 'warm' }
        }[level];
    }
    
    getSaveData() {
        return {
            reputation: { ...this.reputation },
            globalReputation: this.globalReputation
        };
    }
    
    loadSaveData(data) {
        this.reputation = data.reputation || {};
        this.globalReputation = data.globalReputation || 0;
        
        // Ensure all NPCs have reputation entries
        Object.keys(NPC_DATA).forEach(npcId => {
            if (this.reputation[npcId] === undefined) {
                this.reputation[npcId] = 0;
            }
        });
    }
}

// Global reputation instance
const GameReputation = new ReputationSystem();
