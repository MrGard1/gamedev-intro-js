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
        this.updateTroopList();
    }

    updateTroopList() {
        const troopList = document.getElementById('troop-list');
        troopList.innerHTML = '';
        
        this.availableTroops.forEach(troop => {
            const card = document.createElement('div');
            card.className = 'troop-card';
            card.innerHTML = `
                <div>${troop.name}</div>
                <div>Cost: ${troop.cost}</div>
            `;
            card.dataset.troopId = troop.id;
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
                this.troops += Math.floor(points / 50); // Gain troops based on points

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
            if (!troopCounts[troop.id]) {
                troopCounts[troop.id] = {
                    count: 0,
                    troop: troop
                };
            }
            troopCounts[troop.id].count++;
        });
        
        // Display combined troops
        Object.values(troopCounts).forEach(({ troop, count }) => {
            const card = document.createElement('div');
            card.className = 'troop-card';
            card.innerHTML = `
                <div>${troop.emoji} ${troop.name} ×${count}</div>
            `;
            battlefield.appendChild(card);
        });
    }

    updateUI() {
        document.getElementById('energy').textContent = this.energy;
        document.getElementById('troops').textContent = this.troops;
        this.checkDragonAttack(); // Check for dragon attack after updating gold
    }

    checkDragonAttack() {
        if (this.energy > 200 && !this.dragonAttackActive) {
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
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 