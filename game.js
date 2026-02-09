/**
 * 🎮 Arena Legends - 即时制炉石传说
 * 真正的即时制战斗系统
 */

class ArenaGame {
    constructor() {
        console.log('⚔️ Arena Legends 即时制战斗初始化...');
        
        // 战斗配置
        this.config = {
            manaPerSecond: 1,      // 每秒回复圣水
            maxMana: 10,           // 最大圣水
            attackInterval: 10000,  // 攻击间隔 10秒
            manaStart: 5            // 初始圣水
        };
        
        // 玩家状态
        this.player = {
            mana: this.config.manaStart,
            maxMana: this.config.maxMana,
            health: 30,
            hand: [],
            // 6个战场格子 [前排左, 前排中, 前排右, 后排左, 后排中, 后排右]
            field: [null, null, null, null, null, null],
            deck: []
        };
        
        // 敌人状态
        this.enemy = {
            health: 30,
            // 6个战场格子
            field: [null, null, null, null, null, null]
        };
        
        // 游戏状态
        this.isGameRunning = true;
        this.lastAttackTime = 0;
        this.draggedCard = null;
        
        // 初始化
        this.createDeck();
        this.dealCards(4);
        this.renderAll();
        this.startGame();
        
        console.log('✅ Arena Legends 即时制战斗启动!');
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
            { name: '骷髅兵', cost: 1, attack: 2, health: 1, art: '💀', keywords: [], traits: [] },
            { name: '石巨人', cost: 4, attack: 4, health: 7, art: '🗿', keywords: ['taunt'], traits: [] },
            { name: '风鹰', cost: 5, attack: 6, health: 4, art: '🦅', keywords: ['rush', 'flying'], traits: [] }
        ];
        
        // 创建15张牌的牌堆
        for (let i = 0; i < 15; i++) {
            const template = cardTemplates[i % cardTemplates.length];
            this.player.deck.push({ 
                ...template, 
                id: `p_${Date.now()}_${i}`,
                attack: template.attack,
                health: template.health
            });
        }
    }
    
    // 发牌
    dealCards(count) {
        for (let i = 0; i < count; i++) {
            if (this.player.deck.length > 0 && this.player.hand.length < 7) {
                const card = this.player.deck.pop();
                this.player.hand.push(card);
            }
        }
    }
    
    // 启动游戏
    startGame() {
        // 圣水恢复定时器
        setInterval(() => {
            if (!this.isGameRunning) return;
            if (this.player.mana < this.config.maxMana) {
                this.player.mana = Math.min(this.player.mana + 1, this.config.maxMana);
                this.updateManaDisplay();
            }
        }, 1000);
        
        // 更新攻击倒计时条
        setInterval(() => {
            if (!this.isGameRunning) return;
            const elapsed = Date.now() - this.lastAttackTime;
            const progress = Math.min((elapsed / this.config.attackInterval) * 100, 100);
            const timerFill = document.getElementById('timerFill');
            if (timerFill) {
                timerFill.style.width = `${progress}%`;
            }
        }, 500);
        
        // 自动攻击定时器 - 每10秒
        setInterval(() => {
            if (!this.isGameRunning) return;
            const timerFill = document.getElementById('timerFill');
            if (timerFill) timerFill.style.width = '0%';
            
            this.autoAttack();
        }, this.config.attackInterval);
        
        // 敌方AI定时器
        setInterval(() => {
            if (!this.isGameRunning) return;
            this.enemyAI();
        }, 3000);
        
        // 定时发牌
        setInterval(() => {
            if (!this.isGameRunning) return;
            if (this.player.hand.length < 7) {
                this.dealCards(1);
                this.renderHand();
            }
        }, 15000);
    }
    
    // 自动攻击
    autoAttack() {
        const now = Date.now();
        if (now - this.lastAttackTime < this.config.attackInterval - 1000) return;
        this.lastAttackTime = now;
        
        console.log('⚔️ 自动攻击回合!');
        
        // 玩家随从攻击
        for (let i = 0; i < 6; i++) {
            const minion = this.player.field[i];
            if (minion && minion.health > 0) {
                this.performAttack('player', i);
            }
        }
        
        // 敌方随从攻击
        for (let i = 0; i < 6; i++) {
            const minion = this.enemy.field[i];
            if (minion && minion.health > 0) {
                this.performAttack('enemy', i);
            }
        }
        
        // 更新显示
        this.renderField();
        this.updateHealthDisplay();
        this.checkGameEnd();
    }
    
    // 执行攻击
    performAttack(side, index) {
        const field = side === 'player' ? this.player.field : this.enemy.field;
        const opponent = side === 'player' ? this.enemy : this.player;
        const opponentField = opponent.field;
        
        const attacker = field[index];
        if (!attacker || attacker.health <= 0) return;
        
        // 计算目标位置
        // 玩家: 0,1,2(前排) -> 3,4,5(后排) -> 对应敌方: 0,1,2(前排) -> 3,4,5(后排)
        const targetIndex = index; // 正前方
        
        const target = opponentField[targetIndex];
        
        if (target && target.health > 0) {
            // 攻击敌方随从
            target.health -= attacker.attack;
            attacker.health -= target.attack;
            this.showMessage(`⚔️ ${attacker.name} ↔️ ${target.name}!`);
        } else {
            // 攻击敌方英雄
            opponent.health -= attacker.attack;
            this.showMessage(`⚔️ ${attacker.name} 攻击敌方英雄! -${attacker.attack}`);
        }
        
        // 检查死亡
        if (attacker.health <= 0) {
            field[index] = null;
        }
        if (target && target.health <= 0) {
            opponentField[targetIndex] = null;
        }
    }
    
    // 敌方AI
    enemyAI() {
        // 随机放置随从
        const emptySlots = this.enemy.field.map((s, i) => s === null ? i : -1).filter(i => i !== -1);
        
        if (emptySlots.length > 0 && Math.random() > 0.5) {
            const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
            
            const enemyCards = [
                { name: '敌方狼人', cost: 3, attack: 4, health: 3, art: '🐺' },
                { name: '敌方火元素', cost: 4, attack: 5, health: 5, art: '🔥' },
                { name: '敌方骷髅', cost: 1, attack: 2, health: 1, art: '💀' },
                { name: '敌方石巨人', cost: 4, attack: 4, health: 7, art: '🗿' }
            ];
            
            const card = { ...enemyCards[Math.floor(Math.random() * enemyCards.length)], id: `e_${Date.now()}` };
            this.enemy.field[slot] = card;
            
            this.renderEnemyField();
            this.showMessage(`😈 敌方放置了 ${card.name}!`);
        }
    }
    
    // 渲染所有
    renderAll() {
        this.renderHand();
        this.renderPlayerField();
        this.renderEnemyField();
        this.updateManaDisplay();
        this.updateHealthDisplay();
        this.renderFieldGrid();
    }
    
    // 渲染战场格子
    renderFieldGrid() {
        // 渲染玩家战场格子
        const playerGrid = document.getElementById('playerFieldGrid');
        if (playerGrid) {
            playerGrid.innerHTML = '';
            for (let i = 0; i < 6; i++) {
                const slot = document.createElement('div');
                slot.className = 'field-slot';
                slot.dataset.slot = i;
                slot.dataset.side = 'player';
                
                const minion = this.player.field[i];
                if (minion) {
                    slot.innerHTML = this.createMinionHTML(minion);
                    slot.classList.add('occupied');
                } else {
                    slot.innerHTML = `<span class="slot-label">${this.getSlotLabel(i)}</span>`;
                }
                
                playerGrid.appendChild(slot);
            }
        }
        
        // 渲染敌方战场格子
        const enemyGrid = document.getElementById('enemyFieldGrid');
        if (enemyGrid) {
            enemyGrid.innerHTML = '';
            for (let i = 0; i < 6; i++) {
                const slot = document.createElement('div');
                slot.className = 'field-slot enemy';
                slot.dataset.slot = i;
                slot.dataset.side = 'enemy';
                
                const minion = this.enemy.field[i];
                if (minion) {
                    slot.innerHTML = this.createEnemyMinionHTML(minion);
                    slot.classList.add('occupied');
                } else {
                    slot.innerHTML = `<span class="slot-label">${this.getSlotLabel(i)}</span>`;
                }
                
                enemyGrid.appendChild(slot);
            }
        }
    }
    
    // 获取格子标签
    getSlotLabel(index) {
        const labels = ['前左', '前中', '前右', '后左', '后中', '后右'];
        return labels[index];
    }
    
    // 创建随从HTML
    createMinionHTML(minion) {
        return `
            <div class="minion-content" data-id="${minion.id}">
                <div class="minion-art">${minion.art}</div>
                <div class="minion-name">${minion.name}</div>
                <div class="minion-stats">
                    <span class="attack">⚔️${minion.attack}</span>
                    <span class="health">❤️${minion.health}</span>
                </div>
                ${minion.keywords.length > 0 ? `<div class="keywords">${minion.keywords.map(k => `<span class="kw">${k}</span>`).join('')}</div>` : ''}
            </div>
        `;
    }
    
    // 创建敌方随从HTML
    createEnemyMinionHTML(minion) {
        return `
            <div class="minion-content enemy">
                <div class="minion-art">${minion.art}</div>
                <div class="minion-name">${minion.name}</div>
                <div class="minion-stats">
                    <span class="attack">⚔️${minion.attack}</span>
                    <span class="health">❤️${minion.health}</span>
                </div>
            </div>
        `;
    }
    
    // 渲染手牌
    renderHand() {
        const handContainer = document.getElementById('handContainer');
        if (!handContainer) return;
        
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
        
        // 拖拽事件
        this.player.hand.forEach((card, index) => {
            const el = handContainer.querySelector(`[data-index="${index}"]`);
            if (el) {
                el.addEventListener('dragstart', (e) => {
                    this.draggedCard = { el, card, index };
                    el.classList.add('dragging');
                });
                el.addEventListener('dragend', () => {
                    el.classList.remove('dragging');
                    this.draggedCard = null;
                });
            }
        });
    }
    
    // 渲染玩家战场
    renderPlayerField() {
        // 更新格子内容
        for (let i = 0; i < 6; i++) {
            const slot = document.querySelector(`#playerFieldGrid .field-slot[data-slot="${i}"]`);
            if (slot) {
                const minion = this.player.field[i];
                if (minion) {
                    slot.innerHTML = this.createMinionHTML(minion);
                    slot.classList.add('occupied');
                } else {
                    slot.innerHTML = `<span class="slot-label">${this.getSlotLabel(i)}</span>`;
                    slot.classList.remove('occupied');
                }
            }
        }
    }
    
    // 渲染敌方战场
    renderEnemyField() {
        // 更新格子内容
        for (let i = 0; i < 6; i++) {
            const slot = document.querySelector(`#enemyFieldGrid .field-slot[data-slot="${i}"]`);
            if (slot) {
                const minion = this.enemy.field[i];
                if (minion) {
                    slot.innerHTML = this.createEnemyMinionHTML(minion);
                    slot.classList.add('occupied');
                } else {
                    slot.innerHTML = `<span class="slot-label">${this.getSlotLabel(i)}</span>`;
                    slot.classList.remove('occupied');
                }
            }
        }
    }
    
    // 渲染战场（兼容旧版本）
    renderField() {
        this.renderPlayerField();
        this.renderEnemyField();
    }
    
    // 设置事件
    setupEventListeners() {
        // 格子放置
        document.querySelectorAll('.field-slot[data-side="player"]').forEach(slot => {
            slot.addEventListener('dragover', (e) => e.preventDefault());
            slot.addEventListener('dragenter', () => slot.classList.add('drag-over'));
            slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                const slotIndex = parseInt(slot.dataset.slot);
                this.placeCard(slotIndex);
            });
            slot.addEventListener('click', () => {
                const slotIndex = parseInt(slot.dataset.slot);
                this.selectMinion(slotIndex);
            });
        });
        
        // 敌方格子点击攻击
        document.querySelectorAll('.field-slot[data-side="enemy"]').forEach(slot => {
            slot.addEventListener('click', () => {
                const slotIndex = parseInt(slot.dataset.slot);
                this.attackTarget(slotIndex);
            });
        });
    }
    
    // 放置卡牌到格子
    placeCard(slotIndex) {
        if (!this.draggedCard) return;
        
        const { index, card } = this.draggedCard;
        
        // 检查费用
        if (card.cost > this.player.mana) {
            this.showMessage('💎 圣水不足!');
            return;
        }
        
        // 检查格子是否已有随从
        if (this.player.field[slotIndex]) {
            this.showMessage('⚠️ 该格子已有随从!');
            return;
        }
        
        // 扣费
        this.player.mana -= card.cost;
        
        // 移出手牌
        this.player.hand.splice(index, 1);
        
        // 放置到战场格子
        this.player.field[slotIndex] = { ...card, placedAt: Date.now() };
        
        // 触发战吼
        if (card.keywords.includes('battlecry')) {
            this.triggerBattlecry(card);
        }
        
        // 更新显示
        this.updateManaDisplay();
        this.renderHand();
        this.renderPlayerField();
        
        this.showMessage(`🎴 ${card.name} 放置到 ${this.getSlotLabel(slotIndex)}!`);
        console.log(`✅ ${card.name} -> 格子 ${slotIndex}`);
    }
    
    // 战吼效果
    triggerBattlecry(card) {
        if (card.name === '治疗精灵') {
            this.player.health = Math.min(this.player.health + 3, 30);
            this.updateHealthDisplay();
            this.showMessage('✨ 治疗精灵回复 3 点生命!');
        }
    }
    
    // 选择随从
    selectMinion(slotIndex) {
        const minion = this.player.field[slotIndex];
        if (!minion) return;
        
        this.showMessage(`⚔️ ${minion.name} 已选择，点击敌方目标攻击`);
        this.selectedSlot = slotIndex;
    }
    
    // 攻击目标
    attackTarget(targetSlot) {
        if (this.selectedSlot === undefined) {
            this.showMessage('💡 先点击我方随从选择!');
            return;
        }
        
        const attacker = this.player.field[this.selectedSlot];
        const target = this.enemy.field[targetSlot];
        
        if (!attacker) {
            this.showMessage('⚠️ 该随从已不在场!');
            return;
        }
        
        if (target) {
            // 攻击随从
            target.health -= attacker.attack;
            attacker.health -= target.attack;
            this.showMessage(`⚔️ ${attacker.name} ↔️ ${target.name}!`);
            
            if (target.health <= 0) this.enemy.field[targetSlot] = null;
            if (attacker.health <= 0) this.player.field[this.selectedSlot] = null;
        } else {
            // 攻击英雄
            this.enemy.health -= attacker.attack;
            this.showMessage(`⚔️ ${attacker.name} 攻击敌方英雄! -${attacker.attack}`);
        }
        
        this.selectedSlot = undefined;
        this.renderPlayerField();
        this.renderEnemyField();
        this.updateHealthDisplay();
        this.checkGameEnd();
    }
    
    // 更新显示
    updateManaDisplay() {
        const manaDisplay = document.getElementById('manaDisplay');
        if (manaDisplay) {
            manaDisplay.textContent = `${this.player.mana}/${this.player.maxMana}`;
        }
    }
    
    updateHealthDisplay() {
        const playerHealth = document.getElementById('playerHealth');
        const enemyHealth = document.getElementById('enemyHealth');
        
        if (playerHealth) playerHealth.textContent = this.player.health;
        if (enemyHealth) enemyHealth.textContent = this.enemy.health;
    }
    
    // 显示消息
    showMessage(text) {
        const msgEl = document.getElementById('gameMessage');
        if (msgEl) {
            msgEl.textContent = text;
            msgEl.style.opacity = '1';
            setTimeout(() => { msgEl.style.opacity = '0'; }, 2500);
        }
        console.log(`💬 ${text}`);
    }
    
    // 检查游戏结束
    checkGameEnd() {
        if (this.player.health <= 0) {
            this.isGameRunning = false;
            this.showMessage('💀 你输了!');
            setTimeout(() => alert('💀 游戏结束! 敌方获胜!'), 500);
        } else if (this.enemy.health <= 0) {
            this.isGameRunning = false;
            this.showMessage('🎉 你赢了!');
            setTimeout(() => alert('🎉 游戏结束! 你获胜!'), 500);
        }
    }
    
    // 重新开始
    restart() {
        location.reload();
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM加载完成');
    window.game = new ArenaGame();
    setTimeout(() => game.setupEventListeners(), 100);
});
