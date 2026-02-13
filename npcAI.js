// NPC AI System - Dynamic Movement, Schedules, and Interactions
const NPCAISystem = {
    // AI States
    STATES: {
        IDLE: 'idle',
        WALKING: 'walking',
        WORKING: 'working',
        TALKING: 'talking',
        RESTING: 'resting',
        EATING: 'eating',
        PRAYING: 'praying',
        PATROLLING: 'patrolling',
        SOCIALIZING: 'socializing'
    },
    
    // Movement speeds
    SPEEDS: {
        SLOW: 30,
        NORMAL: 50,
        FAST: 80,
        PATROL: 40
    },
    
    // Conversation cooldown (ms)
    CONVERSATION_COOLDOWN: 15000,
    
    // Social gathering spots
    SOCIAL_SPOTS: [
        { x: 280, y: 280, name: 'inn', radius: 60 },
        { x: 400, y: 380, name: 'well', radius: 40 },
        { x: 160, y: 180, name: 'church', radius: 50 },
        { x: 350, y: 380, name: 'market', radius: 50 }
    ],
    
    // Work locations
    WORK_LOCATIONS: {
        forge: { x: 520, y: 380 },
        inn_bar: { x: 280, y: 280 },
        mill: { x: 680, y: 180 },
        church_altar: { x: 160, y: 180 },
        market_stall: { x: 350, y: 380 },
        field_north: { x: 600, y: 450 },
        field_south: { x: 580, y: 520 },
        patrol_center: { x: 400, y: 400 },
        noble_manor: { x: 400, y: 180 }
    },
    
    // Initialize NPC AI data
    initNPC(npc, npcData) {
        npc.aiState = this.STATES.IDLE;
        npc.aiTarget = null;
        npc.aiPath = [];
        npc.aiTimer = 0;
        npc.lastConversation = 0;
        npc.currentActivity = 'idle';
        npc.isBusy = false;
        npc.conversationPartner = null;
        npc.homePosition = { x: npcData.position.x, y: npcData.position.y };
        npc.workPosition = this.getWorkPosition(npcData);
        npc.socialCooldown = 0;
        npc.wanderRadius = 80;
        npc.schedule = npcData.schedule || {};
        npc.movementStyle = this.getMovementStyle(npcData);
    },
    
    getWorkPosition(npcData) {
        const workMap = {
            'vaclav': this.WORK_LOCATIONS.forge,
            'marta': this.WORK_LOCATIONS.inn_bar,
            'jiri': this.WORK_LOCATIONS.mill,
            'father_metodej': this.WORK_LOCATIONS.church_altar,
            'otto': this.WORK_LOCATIONS.market_stall,
            'borek': this.WORK_LOCATIONS.patrol_center,
            'karel': this.WORK_LOCATIONS.noble_manor,
            'hana': this.WORK_LOCATIONS.field_south
        };
        return workMap[npcData.id] || npcData.position;
    },
    
    getMovementStyle(npcData) {
        const styles = {
            'borek': 'patrol',
            'otto': 'wander',
            'hana': 'work',
            'vaclav': 'work',
            'marta': 'stationary',
            'jiri': 'work',
            'father_metodej': 'slow',
            'karel': 'wander'
        };
        return styles[npcData.id] || 'normal';
    },
    
    // Get current schedule activity based on game time
    getCurrentSchedule(npc, gameTime) {
        const hour = Math.floor(gameTime / 60);
        
        // Time periods
        if (hour >= 6 && hour < 8) return 'dawn';
        if (hour >= 8 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 14) return 'noon';
        if (hour >= 14 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 21) return 'evening';
        return 'night';
    },
    
    // Update NPC AI state
    update(npc, delta, gameTime, scene) {
        if (npc.isBusy || scene.inDialogue) return;
        
        // Update timers
        npc.aiTimer -= delta;
        npc.socialCooldown -= delta;
        
        // Check for schedule changes
        const currentPeriod = this.getCurrentSchedule(npc, gameTime);
        this.applySchedule(npc, currentPeriod, gameTime);
        
        // State machine
        switch (npc.aiState) {
            case this.STATES.IDLE:
                this.handleIdleState(npc, delta, gameTime, scene);
                break;
            case this.STATES.WALKING:
                this.handleWalkingState(npc, delta, scene);
                break;
            case this.STATES.WORKING:
                this.handleWorkingState(npc, delta, gameTime);
                break;
            case this.STATES.TALKING:
                this.handleTalkingState(npc, delta, scene);
                break;
            case this.STATES.PATROLLING:
                this.handlePatrollingState(npc, delta, scene);
                break;
            case this.STATES.SOCIALIZING:
                this.handleSocializingState(npc, delta, scene);
                break;
        }
    },
    
    applySchedule(npc, period, gameTime) {
        const schedule = npc.schedule[period === 'morning' || period === 'afternoon' ? 'day' : period];
        if (!schedule) return;
        
        const hour = Math.floor(gameTime / 60);
        const npcData = npc.npcData;
        
        // Profession-based behaviors
        switch (npcData.profession) {
            case 'Blacksmith':
                if (period === 'morning' || period === 'afternoon') {
                    npc.currentActivity = 'forging';
                } else if (period === 'evening') {
                    npc.currentActivity = 'resting';
                }
                break;
            case 'Innkeeper':
                if (period !== 'night') {
                    npc.currentActivity = 'serving';
                }
                break;
            case 'Guard Captain':
                if (period === 'morning' || period === 'afternoon') {
                    npc.currentActivity = 'patrolling';
                    if (npc.aiState !== this.STATES.PATROLLING) {
                        this.startPatrolling(npc);
                    }
                }
                break;
            case 'Priest':
                if (hour === 9 || hour === 18) {
                    npc.currentActivity = 'praying';
                }
                break;
            case 'Farmwife':
                if (period === 'morning' || period === 'afternoon') {
                    npc.currentActivity = 'farming';
                }
                break;
            case 'Miller':
                if (period === 'morning' || period === 'afternoon') {
                    npc.currentActivity = 'milling';
                }
                break;
            case 'Merchant':
                if (period === 'morning' || period === 'afternoon') {
                    npc.currentActivity = 'trading';
                }
                break;
        }
    },
    
    handleIdleState(npc, delta, gameTime, scene) {
        // Random chance to start moving
        if (npc.aiTimer <= 0) {
            const roll = Math.random();
            
            // Check for social opportunity
            if (roll < 0.3 && npc.socialCooldown <= 0) {
                const nearbyNPC = this.findNearbyNPC(npc, scene, 100);
                if (nearbyNPC && !nearbyNPC.isBusy) {
                    this.startConversation(npc, nearbyNPC, scene);
                    return;
                }
            }
            
            // Random wander
            if (roll < 0.6) {
                const target = this.getWanderTarget(npc);
                this.moveTo(npc, target.x, target.y);
            }
            
            // Reset timer
            npc.aiTimer = 2000 + Math.random() * 4000;
        }
    },
    
    handleWalkingState(npc, delta, scene) {
        if (!npc.aiTarget) {
            npc.aiState = this.STATES.IDLE;
            return;
        }
        
        const dx = npc.aiTarget.x - npc.x;
        const dy = npc.aiTarget.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 5) {
            // Reached target
            npc.setVelocity(0, 0);
            npc.aiState = this.STATES.IDLE;
            npc.aiTarget = null;
            // Use texture swapping for idle
            npc.setTexture(`${npc.npcData.sprite}_${npc.direction}`);
            return;
        }
        
        // Move towards target
        const speed = this.getSpeed(npc);
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        
        npc.setVelocity(vx, vy);
        
        // Update direction and texture
        this.updateDirection(npc, vx, vy);
    },
    
    handleWorkingState(npc, delta, gameTime) {
        // Stay at work position with occasional small movements
        if (npc.aiTimer <= 0) {
            if (Math.random() < 0.3) {
                // Small work area movement
                const offset = {
                    x: npc.workPosition.x + (Math.random() - 0.5) * 40,
                    y: npc.workPosition.y + (Math.random() - 0.5) * 40
                };
                this.moveTo(npc, offset.x, offset.y);
            }
            npc.aiTimer = 3000 + Math.random() * 5000;
        }
    },
    
    handleTalkingState(npc, delta, scene) {
        // Face conversation partner
        if (npc.conversationPartner) {
            const dx = npc.conversationPartner.x - npc.x;
            const dy = npc.conversationPartner.y - npc.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                npc.direction = dx > 0 ? 'right' : 'left';
            } else {
                npc.direction = dy > 0 ? 'down' : 'up';
            }
            // Use texture swapping
            npc.setTexture(`${npc.npcData.sprite}_${npc.direction}`);
        }
        
        // Conversation ends via timer set in startConversation
    },
    
    handlePatrollingState(npc, delta, scene) {
        if (!npc.patrolPoints || npc.patrolPoints.length === 0) {
            this.initPatrolRoute(npc);
        }
        
        if (!npc.aiTarget && npc.patrolPoints.length > 0) {
            npc.currentPatrolIndex = (npc.currentPatrolIndex || 0) + 1;
            if (npc.currentPatrolIndex >= npc.patrolPoints.length) {
                npc.currentPatrolIndex = 0;
            }
            npc.aiTarget = npc.patrolPoints[npc.currentPatrolIndex];
        }
        
        if (npc.aiTarget) {
            const dx = npc.aiTarget.x - npc.x;
            const dy = npc.aiTarget.y - npc.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 10) {
                npc.setVelocity(0, 0);
                npc.aiTarget = null;
                npc.aiTimer = 1000 + Math.random() * 2000;
                // Use texture swapping for idle
                npc.setTexture(`${npc.npcData.sprite}_${npc.direction}`);
            } else {
                const speed = this.SPEEDS.PATROL;
                const vx = (dx / dist) * speed;
                const vy = (dy / dist) * speed;
                npc.setVelocity(vx, vy);
                this.updateDirection(npc, vx, vy);
            }
        }
    },
    
    handleSocializingState(npc, delta, scene) {
        // Move towards social spot and mingle
        const spot = this.SOCIAL_SPOTS[Math.floor(Math.random() * this.SOCIAL_SPOTS.length)];
        if (!npc.socialTarget) {
            npc.socialTarget = {
                x: spot.x + (Math.random() - 0.5) * spot.radius,
                y: spot.y + (Math.random() - 0.5) * spot.radius
            };
        }
        
        // Move towards social spot
        this.moveTo(npc, npc.socialTarget.x, npc.socialTarget.y);
    },
    
    initPatrolRoute(npc) {
        // Guard patrol points around the village
        npc.patrolPoints = [
            { x: 400, y: 480 },
            { x: 280, y: 350 },
            { x: 160, y: 250 },
            { x: 350, y: 380 },
            { x: 520, y: 400 },
            { x: 680, y: 250 },
            { x: 400, y: 350 }
        ];
        npc.currentPatrolIndex = 0;
    },
    
    startPatrolling(npc) {
        npc.aiState = this.STATES.PATROLLING;
        this.initPatrolRoute(npc);
    },
    
    getWanderTarget(npc) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * npc.wanderRadius;
        
        let x = npc.x + Math.cos(angle) * distance;
        let y = npc.y + Math.sin(angle) * distance;
        
        // Clamp to world bounds
        x = Math.max(50, Math.min(1150, x));
        y = Math.max(80, Math.min(750, y));
        
        return { x, y };
    },
    
    moveTo(npc, x, y) {
        npc.aiTarget = { x, y };
        npc.aiState = this.STATES.WALKING;
    },
    
    getSpeed(npc) {
        switch (npc.movementStyle) {
            case 'slow': return this.SPEEDS.SLOW;
            case 'fast': return this.SPEEDS.FAST;
            case 'patrol': return this.SPEEDS.PATROL;
            default: return this.SPEEDS.NORMAL;
        }
    },
    
    updateDirection(npc, vx, vy) {
        if (Math.abs(vx) > Math.abs(vy)) {
            npc.direction = vx > 0 ? 'right' : 'left';
        } else {
            npc.direction = vy > 0 ? 'down' : 'up';
        }
        // Use texture swapping instead of animation
        npc.setTexture(`${npc.npcData.sprite}_${npc.direction}`);
    },
    
    findNearbyNPC(npc, scene, radius) {
        let closest = null;
        let closestDist = radius;
        
        Object.values(scene.npcs).forEach(other => {
            if (other === npc || other.isBusy || other.npcId === npc.npcId) return;
            
            const dist = Phaser.Math.Distance.Between(npc.x, npc.y, other.x, other.y);
            if (dist < closestDist) {
                closestDist = dist;
                closest = other;
            }
        });
        
        return closest;
    },
    
    startConversation(npc1, npc2, scene) {
        if (npc1.isBusy || npc2.isBusy) return;
        
        npc1.isBusy = true;
        npc2.isBusy = true;
        npc1.aiState = this.STATES.TALKING;
        npc2.aiState = this.STATES.TALKING;
        npc1.conversationPartner = npc2;
        npc2.conversationPartner = npc1;
        npc1.setVelocity(0, 0);
        npc2.setVelocity(0, 0);
        
        // Show conversation
        scene.showNPCConversation(npc1, npc2);
        
        // Set conversation duration
        const duration = 4000 + Math.random() * 4000;
        
        scene.time.delayedCall(duration, () => {
            this.endConversation(npc1, npc2, scene);
        });
    },
    
    endConversation(npc1, npc2, scene) {
        npc1.isBusy = false;
        npc2.isBusy = false;
        npc1.aiState = this.STATES.IDLE;
        npc2.aiState = this.STATES.IDLE;
        npc1.conversationPartner = null;
        npc2.conversationPartner = null;
        npc1.socialCooldown = this.CONVERSATION_COOLDOWN;
        npc2.socialCooldown = this.CONVERSATION_COOLDOWN;
        npc1.lastConversation = Date.now();
        npc2.lastConversation = Date.now();
        
        scene.hideNPCConversation(npc1, npc2);
    }
};

// NPC Conversation Topics
const NPC_CONVERSATIONS = {
    general: [
        ["Fine weather today.", "Aye, good for the crops."],
        ["Have you heard? Bandits on the roads.", "Dangerous times indeed."],
        ["The price of grain is too high.", "What isn't these days?"],
        ["God be with you.", "And with you as well."],
        ["Any news from Prague?", "Nothing good, I'm afraid."],
        ["How's business?", "Could be better, could be worse."]
    ],
    gossip: [
        ["Did you see the stranger?", "Trouble, if you ask me."],
        ["Young Karel's been acting odd.", "Nobles... always scheming."],
        ["The smith seems worried.", "Lost his tools, I heard."],
        ["Poor Hana's child is sick.", "God grant them healing."]
    ],
    work: [
        ["The harvest will be good this year.", "If the weather holds."],
        ["I have too much work.", "Better than none at all."],
        ["The Lord demands more taxes.", "As always."],
        ["Trade is slow lately.", "These bandits drive away merchants."]
    ],
    friendly: [
        ["Join me for an ale later?", "Gladly, friend!"],
        ["Your family is well?", "By God's grace, yes."],
        ["You look tired.", "Long day's work."],
        ["Take care of yourself.", "You too, friend."]
    ]
};

// Get random conversation based on NPC relationship
function getRandomConversation(npc1, npc2) {
    let category = 'general';
    
    // Check relationship
    const rel = NPC_RELATIONSHIPS[npc1.npcId]?.[npc2.npcId] || 0;
    
    if (rel > 15) {
        category = Math.random() < 0.5 ? 'friendly' : 'general';
    } else if (rel < -10) {
        category = 'gossip';
    } else {
        const categories = ['general', 'gossip', 'work'];
        category = categories[Math.floor(Math.random() * categories.length)];
    }
    
    const conversations = NPC_CONVERSATIONS[category];
    return conversations[Math.floor(Math.random() * conversations.length)];
}
