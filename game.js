/**
 * 🎮 Arena Legends - 即时制炉石传说
 * 完整游戏引擎
 */

class ArenaGame {
    constructor() {
        console.log('⚔️ Arena Legends 初始化中...');
        
        // 玩家状态
        this.player = {
            mana: 5,
            maxMana: 10,
            health: 30,
            hand: [],
            field: [],
            deck: []
        };
        
        // 敌人状态
        this.enemy = {
            health: 30,
            field: []
        };
        
        // 游戏状态
        this.isPlayerTurn = true;
        this.selectedCard = null;
        this.draggedCard = null;
        this.manaPerSecond = 1;
        this.gameLoop = null;
        
        // 初始化
        this.createDeck();
        this.dealCards(4); // 发4张牌
        this.renderAll();
        this.setupEventListeners();
        
        // 圣水恢复
        this.startManaRegen();
        
        console.log('✅ Arena Legends 启动成功!');
    }
    
    // 创建初始牌堆
    createDeck() {
        const cardTemplates = [
            { name: '狼骑兵', cost: 3, attack: 4, health: 3, art: '🐺', keywords: ['charge'], traits: ['fast'] },
            { name: '火元素', cost: 4, attack: 5, health: 5, art: '🔥', keywords: [], traits: [] },
            { name: '冰霜骑士', cost: 5, attack: 6, health: 6, art: '🛡️', keywords: ['taunt'], traits: [] },
            { name: '精灵弓手', cost: 2, attack: 3, health: 2, art: '🏹', keywords: ['rush'], traits: ['ranged'] },
            { name: '治疗精灵', cost: 2, attack: 1, health: 4, art: '💚', keywords: ['battlecry'], traits: ['support'] },
            { name: '闪电箭', cost: 3, attack: 4, health: 2, art: '⚡', keywords: ['ranged'], traits: [] },
            { name: '火龙', cost: 6, attack: 8, health: 7, art: '🐉', keywords: ['charge'], traits: ['flying'] },
            { name: '深渊领主', cost: 7, attack: 10, health: 8, art: '👹', keywords: ['taunt'], traits: ['boss'] },
            { name: '骷髅兵', cost: 1, attack: 2, health: 1, art: '💀', keywords: [], traits: [] },
            { name: '石巨人', cost: 4, attack: 4, health: 7, art: '🗿', keywords: ['taunt'], traits: [] },
            { name: '风鹰', cost: 5, attack: 6, health: 4, art: '🦅', keywords: ['rush', 'flying'], traits: [] },
            { name: '水元素', cost: 3, attack: 3, health: 4, art: '💧', keywords: [], traits: [] }
        ];
        
        // 创建12张牌的牌堆
        for (let i = 0; i < 12; i++) {
            const template = cardTemplates[i % cardTemplates.length];
            this.player.deck.push({ 
                ...template, 
                id: `card_${Date.now()}_${i}` 
            });
        }
        
        console.log(`📦 创建了 ${this.player.deck.length} 张牌的牌堆`);
    }
    
    // 发牌
    dealCards(count) {
        for (let i = 0; i < count; i++) {
            if (this.player.deck.length > 0 && this.player.hand.length < 7) {
                const card = this.player.deck.pop();
                this.player.hand.push(card);
            }
        }
        console.log(`🎴 发牌后: 手牌 ${this.player.hand.length}, 牌堆 ${this.player.deck.length}`);
    }
    
    // 圣水恢复
    startManaRegen() {
        this.gameLoop = setInterval(() => {
            if (this.player.mana < this.player.maxMana) {
                this.player.mana = Math.min(this.player.mana + this.manaPerSecond, this.player.maxMana);
                this.updateManaDisplay();
            }
        }, 1000);
    }
    
    // 渲染所有
    renderAll() {
        this.updateHealthDisplay();
        this.updateManaDisplay();
        this.renderHand();
        this.renderPlayerField();
        this.renderEnemyField();
        this.updateTurnButton();
    }
    
    // 渲染手牌
    renderHand() {
        const handContainer = document.getElementById('handContainer');
        if (!handContainer) {
            console.log('❌ 手牌容器不存在');
            return;
        }
        
        if (this.player.hand.length === 0) {
            handContainer.innerHTML = '<div style="text-align: center; padding: 20px; opacity: 0.6;">🎴 等待发牌...</div>';
            return;
        }
        
        handContainer.innerHTML = this.player.hand.map((card, index) => `
            <div class="hand-card" draggable="true" data-index="${index}" data-card-id="${card.id}">
                <div class="card-cost">${card.cost}</div>
                <div class="card-art">${card.art}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-stats-inline">
                    <span class="attack">⚔️${card.attack}</span>
                    <span class="health">❤️${card.health}</span>
                </div>
                ${card.keywords.length > 0 ? `<div class="card-keywords">${card.keywords.map(k => `<span class="kw">${k}</span>`).join('')}</div>` : ''}
            </div>
        `).join('');
        
        // 重新添加拖拽事件
        this.player.hand.forEach((card, index) => {
            const el = handContainer.querySelector(`[data-index="${index}"]`);
            if (el) {
                el.addEventListener('dragstart', (e) => {
                    this.draggedCard = { el, card, index };
                    el.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index);
                });
                el.addEventListener('dragend', () => {
                    el.classList.remove('dragging');
                    this.draggedCard = null;
                });
            }
        });
        
        console.log(`🎴 渲染了 ${this.player.hand.length} 张手牌`);
    }
    
    // 渲染我方战场
    renderPlayerField() {
        const fieldContainer = document.getElementById('playerField');
        if (!fieldContainer) {
            console.log('❌ 战场容器不存在');
            return;
        }
        
        if (this.player.field.length === 0) {
            fieldContainer.innerHTML = '<div style="text-align: center; padding: 20px; opacity: 0.5;">⚔️ 等待放置随从...</div>';
            return;
        }
        
        fieldContainer.innerHTML = this.player.field.map(card => `
            <div class="field-minion" data-card-id="${card.id}" onclick="game.selectMinion('${card.id}')">
                <div class="minion-art">${card.art}</div>
                <div class="minion-stats">
                    <span class="attack">⚔️${card.attack}</span>
                    <span class="health">❤️${card.health}</span>
                </div>
                <div class="minion-name">${card.name}</div>
                ${card.keywords.length > 0 ? `<div class="minion-keywords">${card.keywords.map(k => `<span class="kw">${k}</span>`).join('')}</div>` : ''}
            </div>
        `).join('');
    }
    
    // 渲染敌方战场
    renderEnemyField() {
        const enemyContainer = document.getElementById('enemyField');
        if (!enemyContainer) return;
        
        if (this.enemy.field.length === 0) {
            enemyContainer.innerHTML = '<div style="text-align: center; padding: 20px; opacity: 0.5;">👹 敌方区域</div>';
            return;
        }
        
        enemyContainer.innerHTML = this.enemy.field.map(card => `
            <div class="enemy-minion" onclick="game.attackEnemyMinion('${card.id}')">
                <div class="enemy-art">${card.art}</div>
                <div class="enemy-stats">
                    <span class="attack">⚔️${card.attack}</span>
                    <span class="health">❤️${card.health}</span>
                </div>
            </div>
        `).join('');
    }
    
    // 设置事件监听
    setupEventListeners() {
        // 拖拽经过
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('drop-zone') || e.target.closest('.drop-zone')) {
                e.dataTransfer.dropEffect = 'move';
            }
        });
        
        // 拖拽进入
        document.addEventListener('dragenter', (e) => {
            if (e.target.classList.contains('drop-zone') || e.target.closest('.drop-zone')) {
                e.target.classList.add('drag-over');
            }
        });
        
        // 拖拽离开
        document.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('drop-zone')) {
                e.target.classList.remove('drag-over');
            }
        });
        
        // 放下卡牌
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const dropZone = e.target.classList.contains('drop-zone') 
                ? e.target 
                : e.target.closest('.drop-zone');
            
            if (dropZone && this.draggedCard) {
                const { index, card } = this.draggedCard;
                const zoneType = dropZone.dataset.zone;
                
                this.playCard(index, card, zoneType);
                
                dropZone.classList.remove('drag-over');
            }
        });
        
        // 结束回合按钮
        const endTurnBtn = document.getElementById('endTurnBtn');
        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => this.endTurn());
        }
        
        // 重新开始按钮
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
        }
        
        console.log('✅ 事件监听已设置');
    }
    
    // 出牌
    playCard(index, card, zoneType) {
        // 检查费用
        if (card.cost > this.player.mana) {
            this.showMessage('💎 圣水不足!');
            return;
        }
        
        // 扣费
        this.player.mana -= card.cost;
        
        // 移出手牌
        this.player.hand.splice(index, 1);
        
        // 放置到战场
        card.zone = zoneType;
        this.player.field.push(card);
        
        // 触发战吼
        if (card.keywords.includes('battlecry')) {
            this.triggerBattlecry(card);
        }
        
        // 更新显示
        this.updateManaDisplay();
        this.renderHand();
        this.renderPlayerField();
        
        this.showMessage(`🎴 ${card.name} 出场!`);
        
        console.log(`✅ ${card.name} 放置到 ${zoneType} 区域`);
    }
    
    // 战吼效果
    triggerBattlecry(card) {
        if (card.name === '治疗精灵') {
            this.player.health = Math.min(this.player.health + 3, 30);
            this.updateHealthDisplay();
            this.showMessage('✨ 治疗精灵回复了 3 点生命!');
        }
    }
    
    // 选择随从
    selectMinion(cardId) {
        const card = this.player.field.find(c => c.id === cardId);
        if (!card) return;
        
        if (this.selectedCard && this.selectedCard.id !== cardId) {
            // 攻击
            this.attackMinion(this.selectedCard, card);
        } else if (!this.selectedCard) {
            this.selectedCard = card;
            document.querySelectorAll('.field-minion').forEach(el => el.classList.remove('selected'));
            const el = document.querySelector(`.field-minion[data-card-id="${cardId}"]`);
            if (el) el.classList.add('selected');
            this.showMessage(`⚔️ ${card.name} 已选择，点击目标攻击`);
        } else {
            this.selectedCard = null;
            document.querySelectorAll('.field-minion').forEach(el => el.classList.remove('selected'));
        }
    }
    
    // 攻击随从
    attackMinion(attacker, defender) {
        defender.health -= attacker.attack;
        attacker.health -= defender.attack;
        
        this.showMessage(`⚔️ ${attacker.name} 攻击 ${defender.name}!`);
        
        if (defender.health <= 0) {
            this.player.field = this.player.field.filter(c => c.id !== defender.id);
        }
        
        if (attacker.health <= 0) {
            this.player.field = this.player.field.filter(c => c.id !== attacker.id);
        }
        
        this.selectedCard = null;
        document.querySelectorAll('.field-minion').forEach(el => el.classList.remove('selected'));
        this.renderPlayerField();
    }
    
    // 攻击敌方随从
    attackEnemyMinion(cardId) {
        if (!this.selectedCard) {
            this.showMessage('💡 先点击我方随从选择!');
            return;
        }
        
        const enemyCard = this.enemy.field.find(c => c.id === cardId);
        if (!enemyCard) return;
        
        this.selectedCard.attackStat = (this.selectedCard.attackStat || this.selectedCard.attack);
        enemyCard.health -= this.selectedCard.attack;
        
        this.showMessage(`⚔️ ${this.selectedCard.name} 攻击 ${enemyCard.name}!`);
        
        if (enemyCard.health <= 0) {
            this.enemy.field = this.enemy.field.filter(c => c.id !== cardId);
        }
        
        this.selectedCard = null;
        document.querySelectorAll('.field-minion').forEach(el => el.classList.remove('selected'));
        this.renderPlayerField();
        this.renderEnemyField();
    }
    
    // 结束回合
    endTurn() {
        this.isPlayerTurn = false;
        this.updateTurnButton();
        
        this.showMessage('⏳ 敌方回合...');
        
        // 敌方AI简单逻辑
        setTimeout(() => {
            this.enemyTurn();
        }, 1500);
    }
    
    // 敌方回合
    enemyTurn() {
        // 敌方随机放置随从
        if (Math.random() > 0.3 && this.enemy.field.length < 5) {
            const enemyCards = [
                { name: '敌方狼人', cost: 3, attack: 4, health: 3, art: '🐺' },
                { name: '敌方火元素', cost: 4, attack: 5, health: 5, art: '🔥' },
                { name: '敌方骷髅', cost: 1, attack: 2, health: 1, art: '💀' }
            ];
            const card = { ...enemyCards[Math.floor(Math.random() * enemyCards.length)], id: `enemy_${Date.now()}` };
            this.enemy.field.push(card);
            this.showMessage(`😈 敌方放置了 ${card.name}!`);
        }
        
        // 敌方攻击
        if (this.player.field.length > 0) {
            const target = this.player.field[Math.floor(Math.random() * this.player.field.length)];
            const damage = Math.floor(Math.random() * 4) + 2;
            
            target.health -= damage;
            this.showMessage(`⚔️ 敌方攻击 ${target.name}! -${damage}`);
            
            if (target.health <= 0) {
                this.player.field = this.player.field.filter(c => c.id !== target.id);
            }
        }
        
        this.renderPlayerField();
        this.renderEnemyField();
        
        // 回到玩家回合
        setTimeout(() => {
            this.isPlayerTurn = true;
            this.player.mana = Math.min(this.player.mana + 2, this.player.maxMana);
            this.dealCards(1);
            this.updateTurnButton();
            this.updateManaDisplay();
            this.renderHand();
            this.showMessage('⚔️ 你的回合!');
        }, 1500);
    }
    
    // 更新生命显示
    updateHealthDisplay() {
        const playerHealth = document.getElementById('playerHealth');
        const enemyHealth = document.getElementById('enemyHealth');
        
        if (playerHealth) playerHealth.textContent = this.player.health;
        if (enemyHealth) enemyHealth.textContent = this.enemy.health;
    }
    
    // 更新圣水显示
    updateManaDisplay() {
        const manaDisplay = document.getElementById('manaDisplay');
        if (manaDisplay) {
            manaDisplay.textContent = `${this.player.mana}/${this.player.maxMana}`;
        }
    }
    
    // 更新回合按钮
    updateTurnButton() {
        const endTurnBtn = document.getElementById('endTurnBtn');
        if (endTurnBtn) {
            if (this.isPlayerTurn) {
                endTurnBtn.disabled = false;
                endTurnBtn.textContent = '✅ 结束回合';
            } else {
                endTurnBtn.disabled = true;
                endTurnBtn.textContent = '⏳ 敌方回合...';
            }
        }
    }
    
    // 显示消息
    showMessage(text) {
        const msgEl = document.getElementById('gameMessage');
        if (msgEl) {
            msgEl.textContent = text;
            msgEl.style.opacity = '1';
            setTimeout(() => {
                msgEl.style.opacity = '0';
            }, 2000);
        }
        console.log(`💬 ${text}`);
    }
    
    // 重新开始
    restart() {
        // 重置状态
        this.player.mana = 5;
        this.player.health = 30;
        this.player.hand = [];
        this.player.field = [];
        this.player.deck = [];
        this.enemy.health = 30;
        this.enemy.field = [];
        this.isPlayerTurn = true;
        this.selectedCard = null;
        
        // 重新初始化
        this.createDeck();
        this.dealCards(4);
        this.renderAll();
        this.updateTurnButton();
        
        this.showMessage('🎮 新游戏开始!');
        console.log('✅ 游戏已重置');
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM加载完成');
    window.game = new ArenaGame();
});
