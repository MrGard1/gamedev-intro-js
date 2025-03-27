class Game {
    constructor() {
        this.tiles = [];
        this.selectedTile = null;
        this.energy = 10;  // Start with 10 gold
        this.troops = 0;
        this.battlefield = [];
        this.selectedTroop = null;
        this.availableTroops = [
            { id: 'archer', name: 'Archer', cost: 3, emoji: '🏹' },
            { id: 'knight', name: 'Knight', cost: 5, emoji: '⚔️' },
            { id: 'wizard', name: 'Wizard', cost: 7, emoji: '🧙' },
            { id: 'dragon', name: 'Dragon', cost: 10, emoji: '🐉' }
        ];
        this.gridSize = 5;
        this.comboMultiplier = 1;
        this.flippedTiles = [];
        this.isProcessing = false;
        this.fires = [];
        this.fireCount = 0;
        this.dragonAttackActive = false;
        this.dragonAttackTimer = null;
        this.lastEnergy = 10; // Track last energy value for threshold crossing
        
        // Define tile values and their corresponding emojis
        this.tileValues = [
            { value: 1, emoji: '🌱', color: '#4CAF50' },
            { value: 2, emoji: '🥕', color: '#FF9800' },
            { value: 3, emoji: '🍞', color: '#795548' },
            { value: 4, emoji: '🍎', color: '#E91E63' },
            { value: 5, emoji: '💰', color: '#FFD700' },
            { value: 0, emoji: '👤', color: '#2196F3' }  // New man tile
        ];

        this.initSounds();
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createTileGrid();
                this.setupTroops();
                this.updateUI();
                this.setupEventListeners();
                this.addGoldButton();
            });
        } else {
            this.createTileGrid();
            this.setupTroops();
            this.updateUI();
            this.setupEventListeners();
            this.addGoldButton();
        }
    }

    initSounds() {
        this.sounds = {
            flip: new Audio('sounds/flip.mp3'),
            match: new Audio('sounds/match.mp3'),
            seed: new Audio('sounds/seed.mp3'),
            carrot: new Audio('sounds/carrot.mp3'),
            bread: new Audio('sounds/bread.mp3'),
            apple: new Audio('sounds/apple.mp3'),
            gold: new Audio('sounds/gold.mp3'),
            troop: new Audio('sounds/troop.mp3')
        };

        // Set volumes
        this.sounds.flip.volume = 0.1;
        this.sounds.match.volume = 0.2;
        this.sounds.seed.volume = 0.3;
        this.sounds.carrot.volume = 0.3;
        this.sounds.bread.volume = 0.3;
        this.sounds.apple.volume = 0.4;
        this.sounds.gold.volume = 0.5;
        this.sounds.troop.volume = 0.3;

        // Preload all sounds and handle errors gracefully
        Object.entries(this.sounds).forEach(([name, sound]) => {
            sound.load();
            sound.onerror = (e) => {
                console.warn(`Sound file '${name}.mp3' not found. Game will continue without sound.`);
                // Remove the failed sound from the sounds object
                delete this.sounds[name];
            };
        });
    }

    createTileGrid() {
        const tileGrid = document.getElementById('tile-grid');
        tileGrid.innerHTML = '';
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.index = i;
            tile.innerHTML = '<span class="tile-emoji">❓</span>';
            tileGrid.appendChild(tile);
            this.tiles.push({
                element: tile,
                isFlipped: false,
                value: Math.floor(Math.random() * 6)  // Changed from 5 to 6 to include value 0 (man)
            });
        }
    }

    setupTroops() {
        this.troops = [
            { name: '👨‍🌾 Peasant', cost: 5, attack: 0, isProducer: true },
            { name: '⛏️ Miner', cost: 20, attack: 0, isMiner: true },
            { name: '🏹 Archer', cost: 50, attack: 1 },
            { name: '⚔️ Warrior', cost: 100, attack: 1 },
            { name: '🏹 Knight', cost: 200, attack: 2 },
            { name: '🐉 Dragon', cost: 500, attack: 5 }
        ];
        this.battlefield = [];
        this.producers = [];
        this.miners = [];
        this.updateTroopList();
    }

    updateTroopList() {
        const troopList = document.getElementById('troop-list');
        troopList.innerHTML = '';
        
        this.troops.forEach(troop => {
            const card = document.createElement('div');
            card.className = 'troop-card';
            const isDisabled = this.energy < troop.cost;
            if (isDisabled) {
                card.classList.add('disabled');
            }
            
            // Extract emoji from troop name
            const emoji = troop.name.split(' ')[0];
            
            card.innerHTML = `
                <div class="troop-content">
                    <div class="troop-name">${emoji}</div>
                    <div class="troop-cost">${troop.cost} 💰</div>
                </div>
            `;
            
            if (!isDisabled) {
                card.addEventListener('click', () => this.addTroopToBattlefield(troop));
            }
            troopList.appendChild(card);
        });
    }

    setupEventListeners() {
        document.getElementById('tile-grid').addEventListener('click', (e) => {
            const tile = e.target.closest('.tile');
            if (tile && !this.isProcessing) {
                const index = parseInt(tile.dataset.index);
                this.flipTile(index);
            }
        });

        document.getElementById('troop-list').addEventListener('click', (e) => {
            const card = e.target.closest('.troop-card');
            if (card) {
                const troopId = card.dataset.troopId;
                this.selectTroop(troopId);
            }
        });
    }

    getTileEmoji(value) {
        return this.tileValues.find(tv => tv.value === value)?.emoji || '❓';
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            const sound = this.sounds[soundName];
            sound.currentTime = 0;
            const playPromise = sound.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Could not play ${soundName} sound:`, error);
                });
            }
        }
    }

    async flipTile(index) {
        if (this.tiles[index].isFlipped || this.isProcessing) return;
        
        this.tiles[index].isFlipped = true;
        this.tiles[index].element.classList.add('flipped');
        this.tiles[index].element.querySelector('.tile-emoji').textContent = this.getTileEmoji(this.tiles[index].value);
        this.flippedTiles.push(index);
        this.playSound('flip');

        if (this.flippedTiles.length === 3) {
            this.isProcessing = true;
            await this.checkMatch();
            this.flippedTiles = [];
            this.isProcessing = false;
        }
    }

    async checkMatch() {
        const values = this.flippedTiles.map(index => this.tiles[index].value);
        const isMatch = values.every(value => value === values[0]);

        if (isMatch) {
            // Show match animation
            this.flippedTiles.forEach(index => {
                this.tiles[index].element.classList.add('matched');
            });

            // Special case for man tiles (value 0)
            if (values[0] === 0) {
                // Get a random troop
                const randomIndex = Math.floor(Math.random() * this.availableTroops.length);
                const randomTroop = { ...this.availableTroops[randomIndex] };
                this.battlefield.push(randomTroop);
                this.updateBattlefield();
                this.playSound('troop');
                console.log(`Random troop added: ${randomTroop.name}`);
            } else {
                // Regular match - add energy
                const points = values[0] * 10 * this.comboMultiplier;
                this.energy += points;

                // Play the appropriate sound based on the match value
                switch(values[0]) {
                    case 1:
                        this.playSound('seed');
                        break;
                    case 2:
                        this.playSound('carrot');
                        break;
                    case 3:
                        this.playSound('bread');
                        break;
                    case 4:
                        this.playSound('apple');
                        break;
                    case 5:
                        this.playSound('gold');
                        break;
                }
            }

            // Clear matched tiles after animation
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.clearMatchedTiles();
        } else {
            // Flip tiles back after delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.flippedTiles.forEach(index => {
                this.tiles[index].isFlipped = false;
                this.tiles[index].element.classList.remove('flipped');
                this.tiles[index].element.querySelector('.tile-emoji').textContent = '❓';
            });
        }

        this.updateUI();
    }

    async clearMatchedTiles() {
        // Clear matched tiles with animation
        this.flippedTiles.forEach(index => {
            this.tiles[index].element.classList.add('clearing');
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Replace cleared tiles with new ones
        this.flippedTiles.forEach(index => {
            this.tiles[index] = {
                element: this.tiles[index].element,
                isFlipped: false,
                value: Math.floor(Math.random() * 6)  // Changed from 5 to 6 to include value 0 (man)
            };
            this.tiles[index].element.querySelector('.tile-emoji').textContent = '❓';
            this.tiles[index].element.classList.remove('flipped', 'matched', 'clearing');
            this.tiles[index].element.classList.add('sliding-in');
        });

        // Remove sliding animation class after animation completes
        await new Promise(resolve => setTimeout(resolve, 500));
        this.flippedTiles.forEach(index => {
            this.tiles[index].element.classList.remove('sliding-in');
        });
    }

    selectTroop(troopId) {
        const troop = this.availableTroops.find(t => t.id === troopId);
        if (!troop) return;

        if (this.energy < troop.cost) {
            console.log('Attempting to play denied sound...');
            this.playSound('denied');
            const troopCard = document.querySelector(`[data-troop-id="${troopId}"]`);
            troopCard.classList.add('denied');
            setTimeout(() => troopCard.classList.remove('denied'), 500);
            
            const energyDisplay = document.getElementById('energy');
            energyDisplay.classList.add('shake');
            setTimeout(() => energyDisplay.classList.remove('shake'), 500);
            
            return;
        }

        this.energy -= troop.cost;
        this.battlefield.push({ ...troop });
        this.updateBattlefield();
        this.updateUI();
        this.playSound('troop');
    }

    updateBattlefield() {
        const battlefield = document.getElementById('battlefield');
        battlefield.innerHTML = '';
        
        // Count troops by type
        const troopCounts = {};
        this.battlefield.forEach(troop => {
            const key = troop.name;
            if (!troopCounts[key]) {
                troopCounts[key] = {
                    count: 0,
                    troops: []
                };
            }
            troopCounts[key].count++;
            troopCounts[key].troops.push(troop);
        });
        
        // Display combined troops
        Object.values(troopCounts).forEach(({ troops, count }) => {
            const card = document.createElement('div');
            card.className = 'troop-card';
            // Store all troop IDs in a data attribute
            card.setAttribute('data-troop-ids', troops.map(t => t.id).join(','));
            
            if (troops[0].isMiner && troops[0].cooldown) {
                card.classList.add('miner-cooldown');
                card.innerHTML = `
                    <div class="troop-content">
                        <span class="troop-name">${troops[0].name} ×${count}</span>
                        <span class="cooldown-timer">⏳ ${Math.ceil(troops[0].cooldown)}s</span>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <div class="troop-content">
                        <span class="troop-name">${troops[0].name} ×${count}</span>
                    </div>
                `;
                if (troops[0].isMiner) {
                    card.addEventListener('click', () => this.mineGold(troops[0]));
                } else if (troops[0].name.includes('🐉')) {
                    card.addEventListener('click', () => this.showDragonFireball(troops[0]));
                }
            }
            battlefield.appendChild(card);
        });
    }

    mineGold(miner) {
        if (miner.cooldown) return;
        
        // Calculate cooldown based on number of miners
        const minerCount = this.battlefield.filter(t => t.isMiner).length;
        const baseCooldown = 25;
        const cooldownReduction = Math.min(minerCount * 2, 15); // 2s reduction per miner, max 15s reduction
        const finalCooldown = baseCooldown - cooldownReduction;
        
        // Calculate bonus gold based on number of miners
        const bonusGold = Math.floor(minerCount / 10) * 50; // Extra 50 gold for every 10 miners
        const totalGold = 50 + bonusGold;
        
        // Add gold
        this.energy += totalGold;
        this.updateUI();
        this.playSound('gold');
        
        // Show pickaxe animation
        const battlefield = document.getElementById('battlefield');
        const cards = battlefield.querySelectorAll('.troop-card');
        for (const card of cards) {
            const troopIds = card.getAttribute('data-troop-ids').split(',').map(id => parseFloat(id));
            if (troopIds.includes(miner.id)) {
                const pickaxe = document.createElement('div');
                pickaxe.className = 'miner-animation';
                pickaxe.innerHTML = '⛏️';
                document.body.appendChild(pickaxe);
                
                // Position the animation relative to the card
                const cardRect = card.getBoundingClientRect();
                const cardCenterX = cardRect.left + cardRect.width / 2;
                const cardCenterY = cardRect.top + cardRect.height / 2;
                pickaxe.style.left = `${cardCenterX}px`;
                pickaxe.style.top = `${cardCenterY}px`;
                
                // Remove the animation element after it completes
                setTimeout(() => {
                    if (pickaxe.parentNode) {
                        pickaxe.remove();
                    }
                }, 1000); // Match the animation duration
                break;
            }
        }
        
        // Set cooldown
        miner.cooldown = finalCooldown;
        this.miners.push(miner);
        
        // Start cooldown timer
        const interval = setInterval(() => {
            if (miner.cooldown > 0) {
                miner.cooldown--;
                this.updateBattlefield();
            } else {
                clearInterval(interval);
                this.miners = this.miners.filter(m => m.id !== miner.id);
                this.updateBattlefield();
            }
        }, 1000);
    }

    showDragonFireball(dragon) {
        const battlefield = document.getElementById('battlefield');
        const cards = battlefield.querySelectorAll('.troop-card');
        for (const card of cards) {
            const troopIds = card.getAttribute('data-troop-ids').split(',').map(id => parseFloat(id));
            if (troopIds.includes(dragon.id)) {
                const fireball = document.createElement('div');
                fireball.className = 'dragon-fireball';
                fireball.innerHTML = '🔥';
                document.body.appendChild(fireball);
                
                // Position the animation relative to the card
                const cardRect = card.getBoundingClientRect();
                const cardCenterX = cardRect.left + cardRect.width / 2;
                const cardCenterY = cardRect.top + cardRect.height / 2;
                fireball.style.left = `${cardCenterX}px`;
                fireball.style.top = `${cardCenterY}px`;
                
                // Remove the animation element after it completes
                setTimeout(() => {
                    if (fireball.parentNode) {
                        fireball.remove();
                    }
                }, 1000); // Match the animation duration
                break;
            }
        }
    }

    updateUI() {
        document.getElementById('energy').textContent = this.energy;
        document.getElementById('troops').textContent = this.battlefield.length;
        this.checkDragonAttack(); // Check for dragon attack after updating gold
        this.lastEnergy = this.energy; // Update last energy value
        this.updateTroopList(); // Update troop list to enable/disable buttons based on energy
    }

    checkDragonAttack() {
        // Only trigger if we're crossing the 200 threshold from below
        if (this.energy > 200 && this.lastEnergy <= 200 && !this.dragonAttackActive) {
            this.startDragonAttack();
        }
    }

    startDragonAttack() {
        this.dragonAttackActive = true;
        this.updateUI();
        
        // Create fire overlay
        const fireOverlay = document.createElement('div');
        fireOverlay.className = 'fire-overlay';
        fireOverlay.innerHTML = `
            <div class="dragon-attack">
                <h2>🐉 Dragon Attack! 🐉</h2>
                <p>Put out the fires! Click them quickly!</p>
                <div class="timer">Time remaining: <span id="countdown">7</span>s</div>
                <div class="fire-count">Fires remaining: <span id="fire-count">10</span></div>
                <div class="fire-grid"></div>
            </div>
        `;
        document.body.appendChild(fireOverlay);

        // Create fires
        const fireGrid = fireOverlay.querySelector('.fire-grid');
        for (let i = 0; i < 10; i++) {
            const fire = document.createElement('div');
            fire.className = 'fire';
            fire.innerHTML = '🔥';
            fire.style.left = Math.random() * 80 + 10 + '%';
            fire.style.top = Math.random() * 80 + 10 + '%';
            fireGrid.appendChild(fire);
            this.fires.push(fire);
        }

        // Start countdown timer
        let timeLeft = 7;
        const countdownDisplay = document.getElementById('countdown');
        const countdownInterval = setInterval(() => {
            timeLeft--;
            countdownDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                this.endDragonAttack();
            }
        }, 1000);

        // Start fire movement
        this.startFireMovement();

        // Add click handlers
        this.fires.forEach(fire => {
            fire.addEventListener('click', () => this.putOutFire(fire));
        });
    }

    startFireMovement() {
        // Move fires every 2 seconds
        this.fireMovementInterval = setInterval(() => {
            this.fires.forEach(fire => {
                if (!fire.classList.contains('extinguished') && Math.random() < 0.5) {
                    // 50% chance to move
                    fire.style.left = Math.random() * 80 + 10 + '%';
                    fire.style.top = Math.random() * 80 + 10 + '%';
                }
            });
        }, 2000);
    }

    putOutFire(fire) {
        if (fire.classList.contains('extinguished')) return;
        
        fire.classList.add('extinguished');
        fire.innerHTML = '💧';
        this.fireCount++;
        
        // Update fire count display
        const fireCountDisplay = document.getElementById('fire-count');
        if (fireCountDisplay) {
            fireCountDisplay.textContent = 10 - this.fireCount;
        }

        // Check if all fires are out
        if (this.fireCount >= 10) {
            this.endDragonAttack(true);
        }
    }

    endDragonAttack(success = false) {
        // Clear fire movement interval
        if (this.fireMovementInterval) {
            clearInterval(this.fireMovementInterval);
        }

        // Remove fire overlay
        const fireOverlay = document.querySelector('.fire-overlay');
        if (fireOverlay) {
            // Calculate damage
            const missedFires = 10 - this.fireCount;
            const fireDamage = missedFires * 10;
            const totalDamage = Math.min(100 + fireDamage, 200); // Cap total damage at 200

            // Show damage report
            const damageReport = document.createElement('div');
            damageReport.className = 'damage-report';
            damageReport.innerHTML = `
                <div class="damage-content">
                    <h2>Damage Report</h2>
                    <p>The dragon stole 100 gold!</p>
                    <p>Additional damage from ${missedFires} remaining fires: ${fireDamage} gold</p>
                    <p class="total-damage">Total damage: ${totalDamage} gold</p>
                </div>
            `;
            document.body.appendChild(damageReport);

            // Apply damage
            this.energy -= totalDamage;

            // Remove damage report after 5 seconds
            setTimeout(() => {
                damageReport.remove();
                fireOverlay.remove();
            }, 5000);
        }

        // Reset state
        this.fires = [];
        this.fireCount = 0;
        this.dragonAttackActive = false;
        this.updateUI();
    }

    addGoldButton() {
        const gameHeader = document.querySelector('.game-header');
        const goldButton = document.createElement('button');
        goldButton.className = 'gold-button';
        goldButton.innerHTML = '💰 Get 20 Gold';
        goldButton.addEventListener('click', () => {
            this.energy += 20;
            this.updateUI();
            this.playSound('gold');
            
            // Add click animation
            goldButton.classList.add('clicked');
            setTimeout(() => goldButton.classList.remove('clicked'), 200);
        });
        gameHeader.appendChild(goldButton);
    }

    addTroopToBattlefield(troop) {
        if (this.energy >= troop.cost) {
            this.energy -= troop.cost;
            const newTroop = { ...troop, id: Date.now() + Math.random() }; // Ensure unique IDs
            this.battlefield.push(newTroop);
            
            // If it's a peasant, add to producers and start gold generation
            if (troop.isProducer) {
                this.producers.push(newTroop);
                this.startGoldProduction(newTroop);
            }
            
            this.updateUI();
            this.updateBattlefield();
            this.playSound('troop');
        } else {
            this.playSound('denied');
            document.getElementById('energy').classList.add('shake');
            setTimeout(() => document.getElementById('energy').classList.remove('shake'), 500);
        }
    }

    startGoldProduction(peasant) {
        const interval = setInterval(() => {
            if (this.battlefield.find(t => t.id === peasant.id)) {
                this.energy += 1;
                this.updateUI();
                // Only play sound for the first peasant's harvest
                if (peasant.id === this.producers[0]?.id && this.sounds.gold) {
                    const goldSound = this.sounds.gold.cloneNode();
                    goldSound.volume = 0.05; // Much softer volume for peasant gold
                    goldSound.play().catch(error => console.warn('Could not play gold sound:', error));
                }
                // Show animation for every peasant
                this.showGrainAnimation(peasant);
            } else {
                clearInterval(interval);
                this.producers = this.producers.filter(p => p.id !== peasant.id);
            }
        }, 5000); // Every 5 seconds
    }

    showGrainAnimation(peasant) {
        const battlefield = document.getElementById('battlefield');
        // Find the card that contains this peasant's ID
        const cards = battlefield.querySelectorAll('.troop-card');
        for (const card of cards) {
            const troopIds = card.getAttribute('data-troop-ids').split(',').map(id => parseFloat(id));
            if (troopIds.includes(peasant.id)) {
                const grain = document.createElement('div');
                grain.className = 'grain-animation';
                grain.innerHTML = '🌽';
                document.body.appendChild(grain);
                
                // Position the animation relative to the card
                const cardRect = card.getBoundingClientRect();
                const cardCenterX = cardRect.left + cardRect.width / 2;
                const cardCenterY = cardRect.top + cardRect.height / 2;
                grain.style.left = `${cardCenterX}px`;
                grain.style.top = `${cardCenterY}px`;
                
                // Remove the animation element after it completes
                setTimeout(() => {
                    if (grain.parentNode) {
                        grain.remove();
                    }
                }, 1500); // Match the animation duration
                return;
            }
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 