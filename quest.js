// Quest System with branching and consequences
class QuestSystem {
    constructor() {
        this.quests = {};
        this.activeQuests = [];
        this.completedQuests = [];
        this.failedQuests = [];
        this.consequences = [];
        this.flags = {};
    }
    
    init() {
        // Initialize all quests from data
        Object.keys(QUEST_DATA).forEach(questId => {
            const questData = QUEST_DATA[questId];
            this.quests[questId] = {
                ...questData,
                state: questData.available ? QUEST_STATES.AVAILABLE : 'locked',
                currentStage: null,
                completedObjectives: [],
                chosenPath: null
            };
        });
    }
    
    startQuest(questId) {
        const quest = this.quests[questId];
        if (!quest || quest.state !== QUEST_STATES.AVAILABLE) return false;
        
        quest.state = QUEST_STATES.ACTIVE;
        quest.currentStage = quest.stages[0].id;
        this.activeQuests.push(questId);
        
        return true;
    }
    
    advanceQuest(questId, objectiveType, target) {
        const quest = this.quests[questId];
        if (!quest || quest.state !== QUEST_STATES.ACTIVE) return false;
        
        const stage = quest.stages.find(s => s.id === quest.currentStage);
        if (!stage) return false;
        
        // Check if this objective is in the current stage
        if (stage.objectives) {
            const objective = stage.objectives.find(o => 
                o.type === objectiveType && o.target === target
            );
            
            if (objective && !quest.completedObjectives.includes(`${quest.currentStage}_${target}`)) {
                quest.completedObjectives.push(`${quest.currentStage}_${target}`);
                
                // Check if all required objectives are complete
                const requiredObjectives = stage.objectives.filter(o => !o.optional);
                const completedRequired = requiredObjectives.every(o => 
                    quest.completedObjectives.includes(`${quest.currentStage}_${o.target}`)
                );
                
                if (completedRequired && stage.nextStage) {
                    quest.currentStage = stage.nextStage;
                    return { advanced: true, newStage: stage.nextStage };
                }
            }
        }
        
        return { advanced: false };
    }
    
    makeQuestChoice(questId, choice) {
        const quest = this.quests[questId];
        if (!quest || quest.state !== QUEST_STATES.ACTIVE) return null;
        
        const stage = quest.stages.find(s => s.id === quest.currentStage);
        if (!stage || !stage.branches || !stage.branches[choice]) return null;
        
        const branch = stage.branches[choice];
        quest.chosenPath = choice;
        quest.currentStage = branch.nextStage;
        
        // Check if this is an ending stage
        const endingStage = quest.stages.find(s => s.id === branch.nextStage);
        if (endingStage && endingStage.rewards) {
            return this.completeQuest(questId, endingStage);
        }
        
        return { nextStage: branch.nextStage };
    }
    
    completeQuest(questId, endingStage) {
        const quest = this.quests[questId];
        quest.state = QUEST_STATES.COMPLETED;
        
        const index = this.activeQuests.indexOf(questId);
        if (index > -1) {
            this.activeQuests.splice(index, 1);
        }
        this.completedQuests.push(questId);
        
        // Apply rewards
        const rewards = endingStage.rewards;
        if (rewards) {
            // Reputation changes
            if (rewards.reputation) {
                Object.entries(rewards.reputation).forEach(([npcId, change]) => {
                    GameReputation.modifyReputation(npcId, change);
                });
            }
            
            // Item rewards
            if (rewards.items) {
                rewards.items.forEach(itemId => {
                    GameInventory.addItem(itemId);
                });
            }
            
            // Gold reward
            if (rewards.gold) {
                GameInventory.addItem('coin', rewards.gold);
            }
        }
        
        // Apply consequences
        if (endingStage.consequences) {
            endingStage.consequences.forEach(consequence => {
                this.consequences.push(consequence);
            });
        }
        
        // Check if other quests become available
        this.checkQuestUnlocks();
        
        return {
            completed: true,
            rewards: rewards,
            consequences: endingStage.consequences
        };
    }
    
    failQuest(questId) {
        const quest = this.quests[questId];
        if (!quest) return;
        
        quest.state = QUEST_STATES.FAILED;
        const index = this.activeQuests.indexOf(questId);
        if (index > -1) {
            this.activeQuests.splice(index, 1);
        }
        this.failedQuests.push(questId);
    }
    
    checkQuestUnlocks() {
        Object.keys(this.quests).forEach(questId => {
            const quest = this.quests[questId];
            if (quest.state !== 'locked') return;
            
            if (quest.prerequisites && this.checkPrerequisites(quest.prerequisites)) {
                quest.state = QUEST_STATES.AVAILABLE;
            }
        });
    }
    
    checkPrerequisites(prerequisites) {
        return prerequisites.every(prereq => {
            switch (prereq.type) {
                case 'quest':
                    return this.completedQuests.includes(prereq.questId);
                case 'reputation':
                    return GameReputation.getReputation(prereq.target) >= prereq.value;
                case 'item':
                    return GameInventory.hasItem(prereq.itemId, prereq.quantity || 1);
                case 'flag':
                    return this.flags[prereq.flag];
                default:
                    return false;
            }
        });
    }
    
    setFlag(flag, value = true) {
        this.flags[flag] = value;
    }
    
    hasFlag(flag) {
        return !!this.flags[flag];
    }
    
    getQuestState(questId) {
        return this.quests[questId]?.state || null;
    }
    
    getCurrentStage(questId) {
        const quest = this.quests[questId];
        if (!quest) return null;
        return quest.stages.find(s => s.id === quest.currentStage);
    }
    
    getActiveQuestsInfo() {
        return this.activeQuests.map(questId => {
            const quest = this.quests[questId];
            const stage = this.getCurrentStage(questId);
            return {
                id: questId,
                title: quest.title,
                description: stage?.description || quest.description,
                objectives: stage?.objectives || []
            };
        });
    }
    
    hasConsequence(consequence) {
        return this.consequences.includes(consequence);
    }
    
    getSaveData() {
        return {
            quests: Object.fromEntries(
                Object.entries(this.quests).map(([id, q]) => [id, {
                    state: q.state,
                    currentStage: q.currentStage,
                    completedObjectives: q.completedObjectives,
                    chosenPath: q.chosenPath
                }])
            ),
            activeQuests: [...this.activeQuests],
            completedQuests: [...this.completedQuests],
            failedQuests: [...this.failedQuests],
            consequences: [...this.consequences],
            flags: { ...this.flags }
        };
    }
    
    loadSaveData(data) {
        this.activeQuests = data.activeQuests || [];
        this.completedQuests = data.completedQuests || [];
        this.failedQuests = data.failedQuests || [];
        this.consequences = data.consequences || [];
        this.flags = data.flags || {};
        
        Object.entries(data.quests).forEach(([id, savedQuest]) => {
            if (this.quests[id]) {
                this.quests[id].state = savedQuest.state;
                this.quests[id].currentStage = savedQuest.currentStage;
                this.quests[id].completedObjectives = savedQuest.completedObjectives;
                this.quests[id].chosenPath = savedQuest.chosenPath;
            }
        });
    }
}

// Global quest system instance
const GameQuests = new QuestSystem();
