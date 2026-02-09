/**
 * 🎮 Arena Legends - 即时制炉石传说
 * 核心游戏引擎
 */

class ArenaGame {
    constructor() {
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
        this.init();
    }
    
    init() {
        console.log('⚔️ Arena Legends 启动!');
        this.createDeck();
        this.dealCards(3);
        this.startManaRegen();
        this.setupEventListeners();
        this.render();
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
            { name: '深渊领主', cost: 7, attack: 10, health: 8, art: '👹', keywords: ['taunt'], traits: ['boss'] }
        ];
        
        for (let i = 0; i < 8; i++) {
            const template = cardTemplates[Math.floor(Math.random() * cardTemplates.length)];
            this.player.deck.push({ ...template, id: `card_${Date.now()}_${i}` });
        }
    }
    
    // 发牌
    dealCards(count) {
        for (let i = 0; i < count && this.player.deck.length > 0; i++) {
            const card = this.player.deck.pop();
            this.player.hand.push(card);
        }
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
    
    // 设置事件监听
    setupEventListeners() {
        // 拖拽开始
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('hand-card')) {
                this.draggedCard = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });
        
        // 拖拽结束
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('hand-card')) {
                e.target.classList.remove('dragging');
                this.draggedCard = null;
            }
        });
        
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
                const cardId = this.draggedCard.dataset.cardId;
                const zoneType = dropZone.dataset.zone;
                
                this.playCard(cardId, zoneType);
                
                dropZone.classList.remove('drag-over');
            }
        });
        
        // 结束回合按钮
        document.getElementById('endTurnBtn')?.addEventListener('click', () => {
            this.endTurn();
        });
        
        // 重新开始
        document.getElementById('restartBtn')?.addEventListener('click', () => {
            this.restart();
        });
    }
    
    // 出牌
    playCard(cardId, zoneType) {
        const cardIndex = this.player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;
        
        const card = this.player.hand[cardIndex];
        
        // 检查费用
        if (card.cost > this.player.mana) {
            this.showMessage('💎 圣水不足!');
            return;
        }
        
        // 扣费
        this.player.mana -= card.cost;
        
        // 移出手牌
        this.player.hand.splice(cardIndex, 1);
        
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
        this.renderField();
        
        this.showMessage(`🎴 ${card.name} 出场!`);
        
        // 播放音效
        this.playSound('play');
    }
    
    // 战吼效果
    triggerBattlecry(card) {
        if (card.name === '治疗精灵') {
            this.player.health = Math.min(this.player.health + 3, 30);
            this.updateHealthDisplay();
        }
    }
    
    // 结束回合
    endTurn() {
        this.isPlayerTurn = false;
        document.getElementById('endTurnBtn').disabled = true;
        document.getElementById('endTurnBtn').textContent = '⏳ 敌方回合...';
        
        this.showMessage('😈 敌方回合...');
        
        // 敌方AI简单逻辑
        setTimeout(() => {
            this.enemyTurn();
        }, 1000);
    }
    
    // 敌方回合
    enemyTurn() {
        // 敌方随机攻击
        if (this.player.field.length > 0) {
            const target = this.player.field[Math.floor(Math.random() * this.player.field.length)];
            const damage = Math.floor(Math.random() * 5) + 2;
            
            target.health -= damage;
            this.showMessage(`⚔️ 敌方攻击 ${target.name}! -${damage}`);
            
            if (target.health <= 0) {
                this.player.field = this.player.field.filter(c => c.id !== target.id);
            }
        }
        
        this.renderField();
        
        // 回到玩家回合
        setTimeout(() => {
            this.isPlayerTurn = true;
            this.player.mana = Math.min(this.player.mana + 2, this.player.maxMana);
            document.getElementById('endTurnBtn').disabled = false;
            document.getElementById('endTurnBtn').textContent = '✅ 结束回合';
            this.dealCards(1);
            this.updateManaDisplay();
            this.renderHand();
            this.showMessage('⚔️ 你的回合!');
        }, 1000);
    }
    
    // 渲染手牌
    renderHand() {
        const handContainer = document.getElementById('handContainer');
        if (!handContainer) return;
        
        handContainer.innerHTML = this.player.hand.map(card => `
            <div class="hand-card" draggable="true" data-card-id="${card.id}">
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
        this.player.hand.forEach(card => {
            const el = document.querySelector(`[data-card-id="${card.id}"]`);
            if (el) {
                el.addEventListener('dragstart', (e) => {
                    this.draggedCard = el;
                    el.classList.add('dragging');
                });
                el.addEventListener('dragend', () => {
                    el.classList.remove('dragging');
                    this.draggedCard = null;
                });
            }
        });
    }
    
    // 渲染战场
    renderField() {
        const fieldContainer = document.getElementById('playerField');
        if (!fieldContainer) return;
        
        fieldContainer.innerHTML = this.player.field.map(card => `
            <div class="field-minion" data-card-id="${card.id}">
                <div class="minion-art">${card.art}</div>
                <div class="minion-stats">
                    <span class="attack">⚔️${card.attack}</span>
                    <span class="health">❤️${card.health}</span>
                </div>
                <div class="minion-name">${card.name}</div>
                ${card.keywords.length > 0 ? `<div class="minion-keywords">${card.keywords.map(k => `<span class="kw">${k}</span>`).join('')}</div>` : ''}
            </div>
        `).join('');
        
        // 添加点击攻击事件
        this.player.field.forEach(card => {
            const el = document.querySelector(`.field-minion[data-card-id="${card.id}"]`);
            if (el) {
                el.addEventListener('click', () => {
                    this.selectMinion(card);
                });
            }
        });
    }
    
    // 选择随从
    selectMinion(card) {
        if (this.selectedCard && this.selectedCard.id !== card.id) {
            // 攻击
            this.attackMinion(this.selectedCard, card);
        } else if (!this.selectedCard) {
            this.selectedCard = card;
            document.querySelectorAll('.field-minion').forEach(el => el.classList.remove('selected'));
            document.querySelector(`.field-minion[data-card-id="${card.id}"]`)?.classList.add('selected');
        } else {
            this.selectedCard = null;
            document.querySelectorAll('.field-minion').forEach(el => el.classList.remove('selected'));
        }
    }
    
    // 随从攻击
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
        this.renderField();
    }
    
    // 渲染
    render() {
        this.updateHealthDisplay();
        this.updateManaDisplay();
        this.renderHand();
        this.renderField();
        this.renderEnemy();
    }
    
    // 更新生命显示
    updateHealthDisplay() {
        document.getElementById('playerHealth')!.textContent = this.player.health;
        document.getElementById('enemyHealth')!.textContent = this.enemy.health;
    }
    
    // 更新圣水显示
    updateManaDisplay() {
        document.getElementById('manaDisplay')!.textContent = `${this.player.mana}/${this.player.maxMana}`;
    }
    
    // 渲染敌人
    renderEnemy() {
        const enemyContainer = document.getElementById('enemyField');
        if (!enemyContainer) return;
        
        enemyContainer.innerHTML = this.enemy.field.map(card => `
            <div class="enemy-minion">
                <div class="enemy-art">${card.art}</div>
                <div class="enemy-stats">
                    <span class="attack">⚔️${card.attack}</span>
                    <span class="health">❤️${card.health}</span>
                </div>
            </div>
        `).join('');
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
    }
    
    // 播放音效
    playSound(type) {
        // 后续添加
    }
    
    // 重新开始
    restart() {
        this.player.mana = 5;
        this.player.health = 30;
        this.player.hand = [];
        this.player.field = [];
        this.player.deck = [];
        this.enemy.health = 30;
        this.enemy.field = [];
        this.isPlayerTurn = true;
        
        this.createDeck();
        this.dealCards(3);
        this.render();
        
        document.getElementById('endTurnBtn').disabled = false;
        document.getElementById('endTurnBtn').textContent = '✅ 结束回合';
        
        this.showMessage('🎮 新游戏开始!');
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ArenaGame();
});
