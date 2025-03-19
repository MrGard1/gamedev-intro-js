class Game {
    constructor() {
        this.energy = 0;
        this.troops = 0;
        this.tiles = [];
        this.availableTroops = [];
        this.battlefield = [];
        this.gridSize = 5;
        this.comboMultiplier = 1;
        this.flippedTiles = [];
        this.isProcessing = false;
        
        // Define tile values and their corresponding emojis
        this.tileValues = [
            { value: 1, emoji: '🌱', name: 'Seed' },
            { value: 2, emoji: '🌿', name: 'Plant' },
            { value: 3, emoji: '💰', name: 'Gold' }
        ];
        
        this.init();
    }

    init() {
        this.createTileGrid();
        this.setupTroops();
        this.updateUI();
        this.setupEventListeners();
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
                value: Math.floor(Math.random() * 3) + 1
            });
        }
    }

    setupTroops() {
        this.availableTroops = [
            { id: 'warrior', name: 'Warrior', cost: 5, power: 2 },
            { id: 'archer', name: 'Archer', cost: 8, power: 3 },
            { id: 'knight', name: 'Knight', cost: 12, power: 5 }
        ];
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
                <div>Power: ${troop.power}</div>
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

    async flipTile(index) {
        if (this.tiles[index].isFlipped || this.isProcessing) return;
        
        this.tiles[index].isFlipped = true;
        this.tiles[index].element.classList.add('flipped');
        this.tiles[index].element.querySelector('.tile-emoji').textContent = this.getTileEmoji(this.tiles[index].value);
        this.flippedTiles.push(index);

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

            // Award points
            const matchValue = values[0];
            const points = matchValue * 10 * this.comboMultiplier;
            this.energy += points;
            this.troops += Math.floor(points / 50); // Gain troops based on points

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
                value: Math.floor(Math.random() * 3) + 1
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
        if (!troop || this.energy < troop.cost) return;

        this.energy -= troop.cost;
        this.battlefield.push({ ...troop });
        this.updateBattlefield();
        this.updateUI();
    }

    updateBattlefield() {
        const battlefield = document.getElementById('battlefield');
        battlefield.innerHTML = '';
        
        this.battlefield.forEach((troop, index) => {
            const card = document.createElement('div');
            card.className = 'troop-card';
            card.innerHTML = `
                <div>${troop.name}</div>
                <div>Power: ${troop.power}</div>
            `;
            battlefield.appendChild(card);
        });
    }

    updateUI() {
        document.getElementById('energy').textContent = this.energy;
        document.getElementById('troops').textContent = this.troops;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 