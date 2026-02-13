// UI Scene - Handles all UI elements
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }
    
    create() {
        this.gameScene = this.scene.get('GameScene');
        
        // UI state
        this.inventoryOpen = false;
        this.questLogOpen = false;
        this.dialogueActive = false;
        this.pauseMenuOpen = false;
        this.shopOpen = false;
        
        // Create UI elements
        this.createHUD();
        this.createDialogueUI();
        this.createInventoryUI();
        this.createQuestLogUI();
        this.createPauseMenu();
        this.createNotificationSystem();
        this.createInteractPrompt();
        this.createChoiceDialogue();
        this.createShopUI();
    }
    
    createHUD() {
        // Health bar background
        this.hpBarBg = this.add.image(60, 25, 'hpBarBg').setScrollFactor(0);
        
        // Health bar fill
        this.hpBarFill = this.add.image(12, 27, 'hpBarFill').setScrollFactor(0).setOrigin(0, 0.5);
        
        // Health text
        this.hpText = this.add.text(60, 25, '100/100', {
            fontSize: '10px',
            fontFamily: 'Georgia, serif',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Gold display
        this.goldText = this.add.text(60, 50, '💰 20', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0, 0.5).setScrollFactor(0);
        
        // Time display
        this.timeText = this.add.text(740, 20, '08:00', {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            color: '#f5deb3',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Day display
        this.dayText = this.add.text(740, 40, 'Day 1', {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            color: '#a08060',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Mini quest tracker
        this.questTracker = this.add.text(600, 80, '', {
            fontSize: '11px',
            fontFamily: 'Georgia, serif',
            color: '#f5deb3',
            stroke: '#000',
            strokeThickness: 2,
            align: 'right',
            wordWrap: { width: 180 }
        }).setOrigin(1, 0).setScrollFactor(0);
    }
    
    createDialogueUI() {
        this.dialogueContainer = this.add.container(400, 500).setScrollFactor(0);
        this.dialogueContainer.setVisible(false);
        this.dialogueContainer.setDepth(100);
        
        // Background
        this.dialogueBg = this.add.image(0, 0, 'dialogBox');
        this.dialogueContainer.add(this.dialogueBg);
        
        // Speaker name
        this.speakerText = this.add.text(-280, -55, '', {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37',
            fontStyle: 'bold'
        });
        this.dialogueContainer.add(this.speakerText);
        
        // Dialogue text
        this.dialogueText = this.add.text(-280, -30, '', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#f5deb3',
            wordWrap: { width: 560 },
            lineSpacing: 4
        });
        this.dialogueContainer.add(this.dialogueText);
        
        // Response buttons container
        this.responseContainer = this.add.container(0, 40);
        this.dialogueContainer.add(this.responseContainer);
    }
    
    createInventoryUI() {
        this.inventoryContainer = this.add.container(400, 300).setScrollFactor(0);
        this.inventoryContainer.setVisible(false);
        this.inventoryContainer.setDepth(100);
        
        // Background panel
        const bg = this.add.graphics();
        bg.fillStyle(0x2c1810, 0.95);
        bg.fillRoundedRect(-200, -180, 400, 360, 10);
        bg.lineStyle(3, 0xd4af37);
        bg.strokeRoundedRect(-200, -180, 400, 360, 10);
        this.inventoryContainer.add(bg);
        
        // Title
        const title = this.add.text(0, -160, 'INVENTORY', {
            fontSize: '20px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        }).setOrigin(0.5);
        this.inventoryContainer.add(title);
        
        // Close button
        const closeBtn = this.add.text(180, -165, '✕', {
            fontSize: '20px',
            color: '#a08060'
        }).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.toggleInventory());
        closeBtn.on('pointerover', () => closeBtn.setColor('#d4af37'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#a08060'));
        this.inventoryContainer.add(closeBtn);
        
        // Inventory slots grid
        this.invSlots = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 5; col++) {
                const x = -160 + col * 48;
                const y = -110 + row * 48;
                
                const slot = this.add.image(x, y, 'invSlot');
                this.inventoryContainer.add(slot);
                this.invSlots.push({ slot, x, y, itemSprite: null, countText: null });
            }
        }
        
        // Equipped section
        const equippedTitle = this.add.text(-160, 90, 'Equipped:', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#a08060'
        });
        this.inventoryContainer.add(equippedTitle);
        
        this.equippedWeaponSlot = this.add.image(-120, 130, 'invSlot');
        this.inventoryContainer.add(this.equippedWeaponSlot);
        this.equippedWeaponText = this.add.text(-95, 130, 'Weapon: None', {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            color: '#f5deb3'
        }).setOrigin(0, 0.5);
        this.inventoryContainer.add(this.equippedWeaponText);
        
        this.equippedArmorSlot = this.add.image(-120, 160, 'invSlot');
        this.inventoryContainer.add(this.equippedArmorSlot);
        this.equippedArmorText = this.add.text(-95, 160, 'Armor: None', {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            color: '#f5deb3'
        }).setOrigin(0, 0.5);
        this.inventoryContainer.add(this.equippedArmorText);
    }
    
    createQuestLogUI() {
        this.questLogContainer = this.add.container(400, 300).setScrollFactor(0);
        this.questLogContainer.setVisible(false);
        this.questLogContainer.setDepth(100);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x2c1810, 0.95);
        bg.fillRoundedRect(-250, -200, 500, 400, 10);
        bg.lineStyle(3, 0xd4af37);
        bg.strokeRoundedRect(-250, -200, 500, 400, 10);
        this.questLogContainer.add(bg);
        
        // Title
        const title = this.add.text(0, -180, 'QUEST LOG', {
            fontSize: '20px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        }).setOrigin(0.5);
        this.questLogContainer.add(title);
        
        // Close button
        const closeBtn = this.add.text(230, -185, '✕', {
            fontSize: '20px',
            color: '#a08060'
        }).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.toggleQuestLog());
        this.questLogContainer.add(closeBtn);
        
        // Quest entries container
        this.questEntriesContainer = this.add.container(0, 0);
        this.questLogContainer.add(this.questEntriesContainer);
    }
    
    createPauseMenu() {
        this.pauseContainer = this.add.container(400, 300).setScrollFactor(0);
        this.pauseContainer.setVisible(false);
        this.pauseContainer.setDepth(150);
        
        // Dimmed background
        const dimBg = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7);
        this.pauseContainer.add(dimBg);
        
        // Menu panel
        const bg = this.add.graphics();
        bg.fillStyle(0x2c1810, 0.98);
        bg.fillRoundedRect(-150, -150, 300, 300, 10);
        bg.lineStyle(3, 0xd4af37);
        bg.strokeRoundedRect(-150, -150, 300, 300, 10);
        this.pauseContainer.add(bg);
        
        // Title
        const title = this.add.text(0, -120, 'PAUSED', {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        }).setOrigin(0.5);
        this.pauseContainer.add(title);
        
        // Menu buttons
        const buttons = [
            { text: 'Resume', action: () => this.togglePauseMenu() },
            { text: 'Save Game', action: () => this.saveFromMenu() },
            { text: 'Main Menu', action: () => this.returnToMenu() }
        ];
        
        buttons.forEach((btn, i) => {
            const button = this.createButton(0, -40 + i * 60, btn.text);
            button.on('pointerdown', btn.action);
            this.pauseContainer.add(button);
        });
    }
    
    createButton(x, y, text) {
        const container = this.add.container(x, y);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x3c2820, 1);
        bg.fillRoundedRect(-100, -20, 200, 40, 5);
        bg.lineStyle(2, 0x8b4513);
        bg.strokeRoundedRect(-100, -20, 200, 40, 5);
        container.add(bg);
        
        const label = this.add.text(0, 0, text, {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            color: '#f5deb3'
        }).setOrigin(0.5);
        container.add(label);
        
        container.setSize(200, 40);
        container.setInteractive({ useHandCursor: true });
        
        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x4c3830, 1);
            bg.fillRoundedRect(-100, -20, 200, 40, 5);
            bg.lineStyle(2, 0xd4af37);
            bg.strokeRoundedRect(-100, -20, 200, 40, 5);
            label.setColor('#ffd700');
        });
        
        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x3c2820, 1);
            bg.fillRoundedRect(-100, -20, 200, 40, 5);
            bg.lineStyle(2, 0x8b4513);
            bg.strokeRoundedRect(-100, -20, 200, 40, 5);
            label.setColor('#f5deb3');
        });
        
        return container;
    }
    
    createNotificationSystem() {
        this.notificationText = this.add.text(400, 100, '', {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);
    }
    
    createInteractPrompt() {
        this.interactPrompt = this.add.container(400, 550).setScrollFactor(0);
        this.interactPrompt.setVisible(false);
        this.interactPrompt.setDepth(50);
        
        const bg = this.add.graphics();
        bg.fillStyle(0x2c1810, 0.8);
        bg.fillRoundedRect(-100, -15, 200, 30, 5);
        bg.lineStyle(1, 0x8b4513);
        bg.strokeRoundedRect(-100, -15, 200, 30, 5);
        this.interactPrompt.add(bg);
        
        this.interactPromptText = this.add.text(0, 0, '[E] Talk', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#f5deb3'
        }).setOrigin(0.5);
        this.interactPrompt.add(this.interactPromptText);
    }
    
    createChoiceDialogue() {
        this.choiceContainer = this.add.container(400, 300).setScrollFactor(0);
        this.choiceContainer.setVisible(false);
        this.choiceContainer.setDepth(120);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x2c1810, 0.95);
        bg.fillRoundedRect(-200, -150, 400, 300, 10);
        bg.lineStyle(3, 0xd4af37);
        bg.strokeRoundedRect(-200, -150, 400, 300, 10);
        this.choiceContainer.add(bg);
        
        // Text
        this.choiceText = this.add.text(0, -120, '', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#f5deb3',
            wordWrap: { width: 360 },
            align: 'center'
        }).setOrigin(0.5, 0);
        this.choiceContainer.add(this.choiceText);
        
        // Buttons container
        this.choiceButtonsContainer = this.add.container(0, 0);
        this.choiceContainer.add(this.choiceButtonsContainer);
    }
    
    createShopUI() {
        this.shopContainer = this.add.container(400, 300).setScrollFactor(0);
        this.shopContainer.setVisible(false);
        this.shopContainer.setDepth(100);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x2c1810, 0.95);
        bg.fillRoundedRect(-220, -180, 440, 360, 10);
        bg.lineStyle(3, 0xd4af37);
        bg.strokeRoundedRect(-220, -180, 440, 360, 10);
        this.shopContainer.add(bg);
        
        // Title
        this.shopTitle = this.add.text(0, -160, 'SHOP', {
            fontSize: '20px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        }).setOrigin(0.5);
        this.shopContainer.add(this.shopTitle);
        
        // Close button
        const closeBtn = this.add.text(200, -165, '✕', {
            fontSize: '20px',
            color: '#a08060'
        }).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.closeShop());
        this.shopContainer.add(closeBtn);
        
        // Items container
        this.shopItemsContainer = this.add.container(0, 0);
        this.shopContainer.add(this.shopItemsContainer);
    }
    
    update() {
        // Update HUD
        const stats = GameCombat.getPlayerStats();
        this.hpText.setText(`${stats.hp}/${stats.maxHp}`);
        this.hpBarFill.setScale(stats.hp / stats.maxHp, 1);
        
        this.goldText.setText(`💰 ${GameInventory.gold}`);
        
        if (this.gameScene) {
            this.timeText.setText(this.gameScene.getTimeString());
            this.dayText.setText(`Day ${this.gameScene.dayCount}`);
        }
        
        // Update quest tracker
        this.updateQuestTracker();
    }
    
    updateQuestTracker() {
        const activeQuests = GameQuests.getActiveQuestsInfo();
        if (activeQuests.length > 0) {
            const quest = activeQuests[0];
            this.questTracker.setText(`📜 ${quest.title}\n${quest.description}`);
        } else {
            this.questTracker.setText('');
        }
    }
    
    // Dialogue System
    startDialogue(dialogueTree, npcData, callback) {
        this.dialogueActive = true;
        this.currentDialogue = dialogueTree;
        this.dialogueCallback = callback;
        this.npcData = npcData;
        
        this.dialogueContainer.setVisible(true);
        this.showDialogueNode('greeting');
    }
    
    showDialogueNode(nodeKey) {
        const node = this.currentDialogue[nodeKey];
        if (!node) {
            this.endDialogue();
            return;
        }
        
        this.speakerText.setText(node.speaker || this.npcData.name);
        this.dialogueText.setText(node.text);
        
        // Clear old responses
        this.responseContainer.removeAll(true);
        
        // Add response buttons
        if (node.responses) {
            node.responses.forEach((response, index) => {
                // Check conditions
                if (response.condition) {
                    if (response.condition.quest) {
                        const state = GameQuests.getQuestState(response.condition.quest);
                        if (state !== response.condition.state) return;
                    }
                    if (response.condition.flag && !GameQuests.hasFlag(response.condition.flag)) {
                        return;
                    }
                    if (response.condition.item) {
                        if (!GameInventory.hasItem(response.condition.item, response.condition.count || 1)) {
                            return;
                        }
                    }
                }
                
                const btn = this.createResponseButton(-280, index * 25, response, index);
                this.responseContainer.add(btn);
            });
        }
    }
    
    createResponseButton(x, y, response, index) {
        const container = this.add.container(x, y);
        
        const text = this.add.text(0, 0, `${index + 1}. ${response.text}`, {
            fontSize: '13px',
            fontFamily: 'Georgia, serif',
            color: '#a08060'
        });
        container.add(text);
        
        container.setSize(560, 22);
        container.setInteractive({ useHandCursor: true });
        
        container.on('pointerover', () => text.setColor('#ffd700'));
        container.on('pointerout', () => text.setColor('#a08060'));
        
        container.on('pointerdown', () => {
            // Apply reputation change if any
            if (response.reputation) {
                GameReputation.modifyReputation(this.npcData.id, response.reputation);
            }
            
            // Set flags if any
            if (response.flag) {
                GameQuests.setFlag(response.flag);
            }
            
            // Handle actions
            if (response.action) {
                if (this.dialogueCallback) {
                    this.dialogueCallback({
                        action: response.action,
                        questId: response.questId,
                        choice: response.choice,
                        flag: response.flag,
                        reputation: response.reputation
                    });
                }
            }
            
            // Navigate to next node
            if (response.next) {
                this.showDialogueNode(response.next);
            } else {
                this.endDialogue();
            }
        });
        
        return container;
    }
    
    endDialogue() {
        this.dialogueActive = false;
        this.dialogueContainer.setVisible(false);
        if (this.dialogueCallback) {
            this.dialogueCallback(null);
        }
    }
    
    // Inventory
    toggleInventory() {
        this.inventoryOpen = !this.inventoryOpen;
        this.inventoryContainer.setVisible(this.inventoryOpen);
        
        if (this.inventoryOpen) {
            this.updateInventoryDisplay();
            this.gameScene.isPaused = true;
        } else {
            this.gameScene.isPaused = false;
        }
    }
    
    updateInventoryDisplay() {
        // Clear existing item displays
        this.invSlots.forEach(slot => {
            if (slot.itemSprite) {
                slot.itemSprite.destroy();
                slot.itemSprite = null;
            }
            if (slot.countText) {
                slot.countText.destroy();
                slot.countText = null;
            }
        });
        
        // Display items
        GameInventory.items.forEach((item, index) => {
            if (index < this.invSlots.length) {
                const slot = this.invSlots[index];
                
                // Item sprite
                const sprite = this.add.image(slot.x, slot.y, item.data.sprite)
                    .setScale(1.2);
                slot.itemSprite = sprite;
                this.inventoryContainer.add(sprite);
                
                // Make interactive
                sprite.setInteractive({ useHandCursor: true });
                sprite.on('pointerdown', () => this.useInventoryItem(item));
                
                // Quantity text
                if (item.quantity > 1) {
                    const countText = this.add.text(slot.x + 12, slot.y + 12, item.quantity, {
                        fontSize: '10px',
                        fontFamily: 'Georgia, serif',
                        color: '#fff',
                        stroke: '#000',
                        strokeThickness: 2
                    });
                    slot.countText = countText;
                    this.inventoryContainer.add(countText);
                }
            }
        });
        
        // Update equipped display
        const equipped = GameInventory.equipped;
        this.equippedWeaponText.setText(`Weapon: ${equipped.weapon ? ITEMS_DATA[equipped.weapon].name : 'None'}`);
        this.equippedArmorText.setText(`Armor: ${equipped.armor ? ITEMS_DATA[equipped.armor].name : 'None'}`);
    }
    
    useInventoryItem(item) {
        const result = GameInventory.useItem(item.id);
        if (result) {
            if (result.hp) {
                GameCombat.heal(result.hp);
                this.showNotification(`Restored ${result.hp} health`);
            }
            if (result.equipped) {
                this.showNotification(`Equipped ${item.data.name}`);
            }
            this.updateInventoryDisplay();
        }
    }
    
    // Quest Log
    toggleQuestLog() {
        this.questLogOpen = !this.questLogOpen;
        this.questLogContainer.setVisible(this.questLogOpen);
        
        if (this.questLogOpen) {
            this.updateQuestLogDisplay();
            this.gameScene.isPaused = true;
        } else {
            this.gameScene.isPaused = false;
        }
    }
    
    updateQuestLogDisplay() {
        this.questEntriesContainer.removeAll(true);
        
        // Active quests
        const activeTitle = this.add.text(-230, -140, 'Active Quests:', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#d4af37'
        });
        this.questEntriesContainer.add(activeTitle);
        
        let yOffset = -110;
        const activeQuests = GameQuests.getActiveQuestsInfo();
        
        if (activeQuests.length === 0) {
            const noQuests = this.add.text(-230, yOffset, 'No active quests', {
                fontSize: '12px',
                fontFamily: 'Georgia, serif',
                color: '#6b5344',
                fontStyle: 'italic'
            });
            this.questEntriesContainer.add(noQuests);
            yOffset += 30;
        } else {
            activeQuests.forEach(quest => {
                const questTitle = this.add.text(-230, yOffset, `📜 ${quest.title}`, {
                    fontSize: '13px',
                    fontFamily: 'Georgia, serif',
                    color: '#f5deb3'
                });
                this.questEntriesContainer.add(questTitle);
                
                const questDesc = this.add.text(-215, yOffset + 18, quest.description, {
                    fontSize: '11px',
                    fontFamily: 'Georgia, serif',
                    color: '#a08060',
                    wordWrap: { width: 440 }
                });
                this.questEntriesContainer.add(questDesc);
                
                yOffset += 60;
            });
        }
        
        // Completed quests
        yOffset += 20;
        const completedTitle = this.add.text(-230, yOffset, 'Completed Quests:', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            color: '#4a7023'
        });
        this.questEntriesContainer.add(completedTitle);
        
        yOffset += 25;
        GameQuests.completedQuests.forEach(questId => {
            const quest = QUEST_DATA[questId];
            const questText = this.add.text(-230, yOffset, `✓ ${quest.title}`, {
                fontSize: '12px',
                fontFamily: 'Georgia, serif',
                color: '#4a7023'
            });
            this.questEntriesContainer.add(questText);
            yOffset += 20;
        });
    }
    
    // Pause Menu
    togglePauseMenu() {
        this.pauseMenuOpen = !this.pauseMenuOpen;
        this.pauseContainer.setVisible(this.pauseMenuOpen);
        this.gameScene.isPaused = this.pauseMenuOpen;
    }
    
    saveFromMenu() {
        if (this.gameScene.saveGame()) {
            this.showNotification('Game Saved!');
        } else {
            this.showNotification('Save Failed!');
        }
    }
    
    returnToMenu() {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
    }
    
    // Notifications
    showNotification(text, duration = 2500) {
        this.notificationText.setText(text);
        this.notificationText.setAlpha(1);
        
        this.tweens.add({
            targets: this.notificationText,
            alpha: 0,
            delay: duration - 500,
            duration: 500
        });
    }
    
    // Interact Prompt
    showInteractPrompt(name) {
        this.interactPromptText.setText(`[E] ${name}`);
        this.interactPrompt.setVisible(true);
    }
    
    hideInteractPrompt() {
        this.interactPrompt.setVisible(false);
    }
    
    // Choice Dialogue
    showChoiceDialogue(text, choices) {
        this.choiceText.setText(text);
        this.choiceButtonsContainer.removeAll(true);
        
        choices.forEach((choice, index) => {
            const btn = this.createButton(0, -40 + index * 50, choice.text);
            btn.on('pointerdown', choice.action);
            this.choiceButtonsContainer.add(btn);
        });
        
        this.choiceContainer.setVisible(true);
        this.gameScene.isPaused = true;
    }
    
    hideChoiceDialogue() {
        this.choiceContainer.setVisible(false);
        this.gameScene.isPaused = false;
    }
    
    // Shop
    openShop(npcId) {
        const inventory = SHOP_INVENTORIES[npcId];
        if (!inventory) return;
        
        this.shopTitle.setText(`${NPC_DATA[npcId].name}'s Wares`);
        this.shopItemsContainer.removeAll(true);
        
        inventory.forEach((shopItem, index) => {
            const itemData = ITEMS_DATA[shopItem.itemId];
            const y = -100 + index * 50;
            
            // Item icon
            const icon = this.add.image(-180, y, itemData.sprite);
            this.shopItemsContainer.add(icon);
            
            // Item name and description
            const nameText = this.add.text(-150, y - 12, itemData.name, {
                fontSize: '14px',
                fontFamily: 'Georgia, serif',
                color: '#f5deb3'
            });
            this.shopItemsContainer.add(nameText);
            
            const descText = this.add.text(-150, y + 6, itemData.description, {
                fontSize: '10px',
                fontFamily: 'Georgia, serif',
                color: '#a08060',
                wordWrap: { width: 250 }
            });
            this.shopItemsContainer.add(descText);
            
            // Price and buy button
            const priceText = this.add.text(120, y - 8, `${shopItem.price}g`, {
                fontSize: '14px',
                fontFamily: 'Georgia, serif',
                color: '#d4af37'
            });
            this.shopItemsContainer.add(priceText);
            
            const buyBtn = this.add.text(160, y - 8, '[Buy]', {
                fontSize: '14px',
                fontFamily: 'Georgia, serif',
                color: '#4a7023'
            }).setInteractive({ useHandCursor: true });
            
            buyBtn.on('pointerover', () => buyBtn.setColor('#6b9033'));
            buyBtn.on('pointerout', () => buyBtn.setColor('#4a7023'));
            buyBtn.on('pointerdown', () => this.buyItem(shopItem.itemId, shopItem.price));
            
            this.shopItemsContainer.add(buyBtn);
        });
        
        this.shopContainer.setVisible(true);
        this.shopOpen = true;
        this.gameScene.isPaused = true;
    }
    
    buyItem(itemId, price) {
        if (GameInventory.gold >= price) {
            GameInventory.gold -= price;
            GameInventory.addItem(itemId);
            this.showNotification(`Purchased ${ITEMS_DATA[itemId].name}`);
        } else {
            this.showNotification('Not enough gold!');
        }
    }
    
    closeShop() {
        this.shopContainer.setVisible(false);
        this.shopOpen = false;
        this.gameScene.isPaused = false;
    }
}
