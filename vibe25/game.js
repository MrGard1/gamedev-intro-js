class Game {
    constructor() {
        this.energy = 0;
        this.troops = 0;
        this.tiles = [];
        this.availableTroops = [];
        this.battlefield = [];
        this.gridSize = 4;
        this.comboMultiplier = 1;
        
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
            tile.textContent = '?';
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
        // Tile click events
        document.getElementById('tile-grid').addEventListener('click', (e) => {
            const tile = e.target.closest('.tile');
            if (tile) {
                const index = parseInt(tile.dataset.index);
                this.flipTile(index);
            }
        });

        // Troop selection events
        document.getElementById('troop-list').addEventListener('click', (e) => {
            const card = e.target.closest('.troop-card');
            if (card) {
                const troopId = card.dataset.troopId;
                this.selectTroop(troopId);
            }
        });
    }

    flipTile(index) {
        if (this.tiles[index].isFlipped) return;
        
        this.tiles[index].isFlipped = true;
        this.tiles[index].element.classList.add('flipped');
        this.tiles[index].element.textContent = this.tiles[index].value;
        
        this.energy += this.tiles[index].value * this.comboMultiplier;
        this.checkCombo();
        this.updateUI();
    }

    checkCombo() {
        const flippedValues = this.tiles
            .filter(tile => tile.isFlipped)
            .map(tile => tile.value);
        
        // Check for three or more matching values
        const valueCounts = {};
        flippedValues.forEach(value => {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        });

        for (const [value, count] of Object.entries(valueCounts)) {
            if (count >= 3) {
                this.comboMultiplier = count;
                this.energy += value * count * 2; // Bonus energy for combos
                this.troops += Math.floor(count / 3); // Gain troops for combos
            }
        }
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