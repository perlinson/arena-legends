/**
 * 🎮 Arena Legends - 即时制炉石传说
 * 完整即时制战斗系统
 */

class ArenaGame {
    constructor() {
        console.log('⚔️ Arena Legends 即时制战斗初始化...');
        
        // 战斗配置
        this.config = {
            manaPerSecond: 0.3,    // 每3.33秒回复1（0.3/秒）
            maxMana: 10,           // 最大圣水
            attackInterval: 5000,   // 攻击间隔 5秒
            manaStart: 4            // 初始圣水
        };
        
        // 玩家状态
        this.player = {
            mana: this.config.manaStart,
            maxMana: this.config.maxMana,
            health: 30,
            maxHealth: 30,
            hand: [],
            // 6个战场格子
            field: [null, null, null, null, null, null],
            deck: []
        };
        
        // 敌人状态
        this.enemy = {
            health: 30,
            maxHealth: 30,
            // 6个战场格子
            field: [null, null, null, null, null, null]
        };
        
        // 游戏状态
        this.isGameRunning = true;
        this.lastManaTime = Date.now();
        this.lastAttackTime = Date.now();
        this.draggedCard = null;
        this.isAttacking = false;
        
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
            { name: '狼骑兵', cost: 3, attack: 4, health: 3, art: '🐺', keywords: ['冲锋'] },
            { name: '火元素', cost: 4, attack: 5, health: 5, art: '🔥', keywords: [] },
            { name: '冰霜骑士', cost: 5, attack: 6, health: 6, art: '🛡️', keywords: ['嘲讽'] },
            { name: '精灵弓手', cost: 2, attack: 3, health: 2, art: '🏹', keywords: ['突袭'] },
            { name: '治疗精灵', cost: 2, attack: 1, health: 4, art: '💚', keywords: ['战吼'] },
            { name: '闪电箭', cost: 3, attack: 4, health: 2, art: '⚡', keywords: [] },
            { name: '火龙', cost: 6, attack: 8, health: 7, art: '🐉', keywords: ['冲锋'] },
            { name: '骷髅兵', cost: 1, attack: 2, health: 1, art: '💀', keywords: [] },
            { name: '石巨人', cost: 4, attack: 4, health: 7, art: '🗿', keywords: ['嘲讽'] },
            { name: '风鹰', cost: 5, attack: 6, health: 4, art: '🦅', keywords: ['突袭'] },
            { name: '水元素', cost: 3, attack: 3, health: 4, art: '💧', keywords: [] },
            { name: '钢铁战士', cost: 4, attack: 5, health: 5, art: '🤖', keywords: [] },
            { name: '暗影刺客', cost: 3, attack: 7, health: 2, art: '🗡️', keywords: ['突袭'] },
            { name: '神圣骑士', cost: 5, attack: 4, health: 6, art: '✨', keywords: ['战吼'] },
            { name: '雷霆豹', cost: 3, attack: 5, health: 3, art: '🐆', keywords: ['冲锋'] }
        ];
        
        for (let i = 0; i < 15; i++) {
            const template = cardTemplates[i % cardTemplates.length];
            this.player.deck.push({ 
                ...template, 
                id: `p_${Date.now()}_${i}`,
                attack: template.attack,
                health: template.health,
                maxHealth: template.health,
                attackProgress: 0  // 攻击进度 0-100
            });
        }
    }
    
    // 发牌
    dealCards(count) {
        for (let i = 0; i < count; i++) {
            if (this.player.deck.length > 0 && this.player.hand.length < 7) {
                const card = this.player.deck.pop();
                card.attackProgress = 0;
                this.player.hand.push(card);
            }
        }
    }
    
    // 启动游戏
    startGame() {
        // 圣水恢复定时器 - 每3.33秒
        setInterval(() => {
            if (!this.isGameRunning) return;
            if (this.player.mana < this.config.maxMana) {
                this.player.mana = Math.min(this.player.mana + 1, this.config.maxMana);
                this.updateManaDisplay();
            }
        }, 3330);
        
        // 攻击进度更新 - 每100ms
        setInterval(() => {
            if (!this.isGameRunning) return;
            this.updateAttackProgress();
        }, 100);
        
        // 敌方AI定时器
        setInterval(() => {
            if (!this.isGameRunning) return;
            this.enemyAI();
        }, 4000);
        
        // 定时发牌
        setInterval(() => {
            if (!this.isGameRunning) return;
            if (this.player.hand.length < 7) {
                this.dealCards(1);
                this.renderHand();
            }
        }, 12000);
    }
    
    // 更新攻击进度
    updateAttackProgress() {
        if (this.isAttacking) return;
        
        const attackPerSecond = 100 / (this.config.attackInterval / 100);
        
        // 更新己方随从进度
        let hasFullProgress = false;
        for (let i = 0; i < 6; i++) {
            const minion = this.player.field[i];
            if (minion && minion.health > 0) {
                minion.attackProgress = Math.min(minion.attackProgress + attackPerSecond, 100);
                
                // 进度满了就攻击
                if (minion.attackProgress >= 100) {
                    this.performAttack('player', i);
                    hasFullProgress = true;
                }
            }
        }
        
        // 更新敌方随从进度
        if (!hasFullProgress) {
            for (let i = 0; i < 6; i++) {
                const minion = this.enemy.field[i];
                if (minion && minion.health > 0) {
                    minion.attackProgress = Math.min(minion.attackProgress + attackPerSecond, 100);
                    
                    if (minion.attackProgress >= 100) {
                        this.performAttack('enemy', i);
                    }
                }
            }
        }
        
        // 更新UI
        this.updateProgressBars();
    }
    
    // 执行攻击
    performAttack(side, index) {
        if (this.isAttacking) return;
        this.isAttacking = true;
        
        const field = side === 'player' ? this.player.field : this.enemy.field;
        const attacker = field[index];
        
        if (!attacker || attacker.health <= 0) {
            this.isAttacking = false;
            return;
        }
        
        const opponent = side === 'player' ? this.enemy : this.player;
        const targetField = opponent.field;
        const targetIndex = index;
        const target = targetField[targetIndex];
        
        // 播放攻击动画
        this.playAttackAnimation(side, index, targetIndex, () => {
            if (target && target.health > 0) {
                // 攻击随从
                target.health -= attacker.attack;
                attacker.health -= target.attack;
                this.showMessage(`⚔️ ${attacker.name} ↔️ ${target.name}!`);
            } else {
                // 攻击英雄
                opponent.health -= attacker.attack;
                this.showMessage(`⚔️ ${attacker.name} 攻击英雄! -${attacker.attack}`);
            }
            
            // 检查死亡
            if (attacker.health <= 0) {
                field[index] = null;
            }
            if (target && target.health <= 0) {
                targetField[targetIndex] = null;
            }
            
            // 重置进度
            attacker.attackProgress = 0;
            if (target) target.attackProgress = 0;
            
            // 更新显示
            this.renderAll();
            this.updateHealthDisplay();
            this.checkGameEnd();
            
            this.isAttacking = false;
        });
    }
    
    // 播放攻击动画
    playAttackAnimation(side, fromIndex, toIndex, callback) {
        const fromEl = document.querySelector(`.field-slot[data-side="${side}"][data-slot="${fromIndex}"] .minion-content`);
        
        if (!fromEl) {
            callback();
            return;
        }
        
        // 计算移动方向
        const isPlayer = side === 'player';
        const moveX = isPlayer ? 50 : -50;
        const moveY = isPlayer ? 30 : -30;
        
        // 添动效元素
        const clone = fromEl.cloneNode(true);
        clone.style.cssText = `
            position: fixed;
            left: ${fromEl.getBoundingClientRect().left}px;
            top: ${fromEl.getBoundingClientRect().top}px;
            z-index: 1000;
            pointer-events: none;
            transition: all 0.2s ease-in-out;
        `;
        document.body.appendChild(clone);
        
        // 攻击动画
        setTimeout(() => {
            clone.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.2)`;
        }, 50);
        
        // 返回动画
        setTimeout(() => {
            clone.style.transform = 'translate(0, 0) scale(1)';
        }, 300);
        
        // 清理
        setTimeout(() => {
            clone.remove();
            callback();
        }, 500);
    }
    
    // 敌方AI
    enemyAI() {
        const emptySlots = this.enemy.field.map((s, i) => s === null ? i : -1).filter(i => i !== -1);
        
        if (emptySlots.length > 0 && Math.random() > 0.4) {
            const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
            
            const enemyCards = [
                { name: '敌方狼人', cost: 3, attack: 4, health: 3, art: '🐺' },
                { name: '敌方火元素', cost: 4, attack: 5, health: 5, art: '🔥' },
                { name: '敌方骷髅', cost: 1, attack: 2, health: 1, art: '💀' },
                { name: '敌方石巨人', cost: 4, attack: 4, health: 7, art: '🗿' },
                { name: '敌方刺客', cost: 3, attack: 6, health: 2, art: '🗡️' }
            ];
            
            const card = { ...enemyCards[Math.floor(Math.random() * enemyCards.length)], id: `e_${Date.now()}` };
            card.attackProgress = 0;
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
        for (let i = 0; i < 6; i++) {
            const slot = document.querySelector(`#playerFieldGrid .field-slot[data-slot="${i}"]`);
            if (slot) {
                const minion = this.player.field[i];
                if (minion) {
                    slot.innerHTML = this.createMinionHTML(minion, 'player');
                    slot.classList.add('occupied', 'player-minion');
                } else {
                    slot.innerHTML = `<span class="slot-label">${this.getSlotLabel(i)}</span>`;
                    slot.classList.remove('occupied', 'player-minion');
                }
            }
        }
    }
    
    // 渲染敌方战场
    renderEnemyField() {
        for (let i = 0; i < 6; i++) {
            const slot = document.querySelector(`#enemyFieldGrid .field-slot[data-slot="${i}"]`);
            if (slot) {
                const minion = this.enemy.field[i];
                if (minion) {
                    slot.innerHTML = this.createEnemyMinionHTML(minion);
                    slot.classList.add('occupied', 'enemy-minion');
                } else {
                    slot.innerHTML = `<span class="slot-label">${this.getSlotLabel(i)}</span>`;
                    slot.classList.remove('occupied', 'enemy-minion');
                }
            }
        }
    }
    
    // 创建随从HTML（蓝色底 - 己方）
    createMinionHTML(minion, side) {
        return `
            <div class="minion-content player" data-id="${minion.id}">
                <div class="minion-art">${minion.art}</div>
                <div class="minion-name">${minion.name}</div>
                <div class="minion-stats">
                    <span class="attack">⚔️${minion.attack}</span>
                    <span class="health">❤️${minion.health}</span>
                </div>
                <div class="attack-progress-bar">
                    <div class="attack-progress-fill" style="width: ${minion.attackProgress || 0}%;"></div>
                </div>
                ${minion.keywords.length > 0 ? `<div class="keywords">${minion.keywords.map(k => `<span class="kw">${k}</span>`).join('')}</div>` : ''}
            </div>
        `;
    }
    
    // 创建敌方随从HTML（红色底 - 敌方）
    createEnemyMinionHTML(minion) {
        return `
            <div class="minion-content enemy" data-id="${minion.id}">
                <div class="minion-art">${minion.art}</div>
                <div class="minion-name">${minion.name}</div>
                <div class="minion-stats">
                    <span class="attack">⚔️${minion.attack}</span>
                    <span class="health">❤️${minion.health}</span>
                </div>
                <div class="attack-progress-bar enemy">
                    <div class="attack-progress-fill" style="width: ${minion.attackProgress || 0}%;"></div>
                </div>
            </div>
        `;
    }
    
    // 更新进度条
    updateProgressBars() {
        // 己方
        for (let i = 0; i < 6; i++) {
            const minion = this.player.field[i];
            const fill = document.querySelector(`#playerFieldGrid .field-slot[data-slot="${i}"] .attack-progress-fill`);
            if (fill && minion) {
                fill.style.width = `${minion.attackProgress}%`;
            }
        }
        
        // 敌方
        for (let i = 0; i < 6; i++) {
            const minion = this.enemy.field[i];
            const fill = document.querySelector(`#enemyFieldGrid .field-slot[data-slot="${i}"] .attack-progress-fill`);
            if (fill && minion) {
                fill.style.width = `${minion.attackProgress}%`;
            }
        }
    }
    
    // 获取格子标签
    getSlotLabel(index) {
        const labels = ['前左', '前中', '前右', '后左', '后中', '后右'];
        return labels[index];
    }
    
    // 放置卡牌
    placeCard(slotIndex) {
        if (!this.draggedCard) return;
        
        const { index, card } = this.draggedCard;
        
        if (card.cost > this.player.mana) {
            this.showMessage('💎 圣水不足!');
            return;
        }
        
        if (this.player.field[slotIndex]) {
            this.showMessage('⚠️ 该格子已有随从!');
            return;
        }
        
        this.player.mana -= card.cost;
        this.player.hand.splice(index, 1);
        
        const newMinion = { ...card, placedAt: Date.now(), attackProgress: 0 };
        this.player.field[slotIndex] = newMinion;
        
        this.updateManaDisplay();
        this.renderHand();
        this.renderPlayerField();
        
        this.showMessage(`🎴 ${card.name} -> ${this.getSlotLabel(slotIndex)}!`);
    }
    
    // 战吼效果
    triggerBattlecry(card) {
        if (card.name === '治疗精灵') {
            this.player.health = Math.min(this.player.health + 3, this.player.maxHealth);
            this.updateHealthDisplay();
            this.showMessage('✨ 治疗精灵回复 3 点生命!');
        }
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
        const playerBar = document.getElementById('playerHealthBar');
        const enemyBar = document.getElementById('enemyHealthBar');
        
        if (playerHealth) playerHealth.textContent = this.player.health;
        if (enemyHealth) enemyHealth.textContent = this.enemy.health;
        
        if (playerBar) playerBar.style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
        if (enemyBar) enemyBar.style.width = `${(this.enemy.health / this.enemy.maxHealth) * 100}%`;
    }
    
    // 显示消息
    showMessage(text) {
        const msgEl = document.getElementById('gameMessage');
        if (msgEl) {
            msgEl.textContent = text;
            msgEl.classList.add('show');
            setTimeout(() => msgEl.classList.remove('show'), 2000);
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
});
