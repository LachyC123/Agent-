// Inventory System
class InventorySystem {
    constructor() {
        this.items = [];
        this.maxSlots = 20;
        this.gold = 0;
        this.equipped = {
            weapon: null,
            armor: null
        };
    }
    
    init(startingItems) {
        this.items = [];
        startingItems.forEach(item => {
            this.addItem(item.itemId, item.quantity);
        });
        this.gold = 20;
    }
    
    addItem(itemId, quantity = 1) {
        const itemData = ITEMS_DATA[itemId];
        if (!itemData) return false;
        
        // Handle gold separately
        if (itemId === 'coin') {
            this.gold += quantity;
            return true;
        }
        
        // Check for stackable items
        if (itemData.stackable) {
            const existing = this.items.find(i => i.id === itemId);
            if (existing) {
                existing.quantity += quantity;
                return true;
            }
        }
        
        // Check space
        if (this.items.length >= this.maxSlots) {
            return false;
        }
        
        this.items.push({
            id: itemId,
            quantity: quantity,
            data: itemData
        });
        return true;
    }
    
    removeItem(itemId, quantity = 1) {
        if (itemId === 'coin') {
            if (this.gold >= quantity) {
                this.gold -= quantity;
                return true;
            }
            return false;
        }
        
        const index = this.items.findIndex(i => i.id === itemId);
        if (index === -1) return false;
        
        const item = this.items[index];
        if (item.quantity <= quantity) {
            this.items.splice(index, 1);
        } else {
            item.quantity -= quantity;
        }
        return true;
    }
    
    hasItem(itemId, quantity = 1) {
        if (itemId === 'coin') {
            return this.gold >= quantity;
        }
        
        const item = this.items.find(i => i.id === itemId);
        return item && item.quantity >= quantity;
    }
    
    getItemCount(itemId) {
        if (itemId === 'coin') return this.gold;
        
        const item = this.items.find(i => i.id === itemId);
        return item ? item.quantity : 0;
    }
    
    useItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return null;
        
        const itemData = item.data;
        
        if (itemData.type === ITEM_TYPES.CONSUMABLE) {
            this.removeItem(itemId);
            return itemData.effect;
        }
        
        if (itemData.type === ITEM_TYPES.WEAPON) {
            this.equipped.weapon = itemId;
            return { equipped: 'weapon', item: itemData };
        }
        
        if (itemData.type === ITEM_TYPES.ARMOR) {
            this.equipped.armor = itemId;
            return { equipped: 'armor', item: itemData };
        }
        
        return null;
    }
    
    getEquippedStats() {
        let stats = { attack: 1, defense: 0 };
        
        if (this.equipped.weapon) {
            const weapon = ITEMS_DATA[this.equipped.weapon];
            if (weapon && weapon.stats) {
                stats.attack += weapon.stats.attack || 0;
            }
        }
        
        if (this.equipped.armor) {
            const armor = ITEMS_DATA[this.equipped.armor];
            if (armor && armor.stats) {
                stats.defense += armor.stats.defense || 0;
            }
        }
        
        return stats;
    }
    
    getInventoryData() {
        return {
            items: this.items.map(i => ({ id: i.id, quantity: i.quantity })),
            gold: this.gold,
            equipped: { ...this.equipped }
        };
    }
    
    loadInventoryData(data) {
        this.items = [];
        this.gold = data.gold || 0;
        this.equipped = data.equipped || { weapon: null, armor: null };
        
        data.items.forEach(item => {
            const itemData = ITEMS_DATA[item.id];
            if (itemData) {
                this.items.push({
                    id: item.id,
                    quantity: item.quantity,
                    data: itemData
                });
            }
        });
    }
}

// Global inventory instance
const GameInventory = new InventorySystem();
