document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const startButton = document.getElementById('start-button');
    const loadButton = document.getElementById('load-button');
    const dinoImage = document.getElementById('dino-image');
    const statusMessage = document.getElementById('status-message');
    const intervalProgress = document.getElementById('interval-progress');
    
    // Control buttons
    const feedButton = document.getElementById('feed-button');
    const playButton = document.getElementById('play-button');
    const cleanButton = document.getElementById('clean-button');
    const sleepButton = document.getElementById('sleep-button');
    
    // Stat bars
    const hungerBar = document.getElementById('hunger-bar');
    const happinessBar = document.getElementById('happiness-bar');
    const cleanlinessBar = document.getElementById('cleanliness-bar');
    const energyBar = document.getElementById('energy-bar');
    
    // Game state
    let gameState = {
        stage: 'egg', // egg, hatching, baby
        hunger: 100,
        happiness: 100,
        cleanliness: 100,
        energy: 100,
        lastSaved: null,
        currentAction: null,
        actionTimeout: null,
        gameStartTime: null,
        lastUpdateTime: null,
        updateInterval: 5000 // 5 seconds in milliseconds
    };
    
    // Check if there's a saved game
    if (localStorage.getItem('dinoTamagotchiSave')) {
        loadButton.style.display = 'inline-block';
    }
    
    // Start a new game
    startButton.addEventListener('click', () => {
        startScreen.classList.add('fade-out');
        
        setTimeout(() => {
            startScreen.style.display = 'none';
            gameScreen.style.display = 'block';
            gameScreen.classList.add('fade-in');
            
            // Initialize new game
            initGame();
        }, 500);
    });
    
    // Load saved game
    loadButton.addEventListener('click', () => {
        startScreen.classList.add('fade-out');
        
        setTimeout(() => {
            startScreen.style.display = 'none';
            gameScreen.style.display = 'block';
            gameScreen.classList.add('fade-in');
            
            // Load saved game
            loadGame();
        }, 500);
    });
    
    // Initialize a new game
    function initGame() {
        gameState = {
            stage: 'egg',
            hunger: 100,
            happiness: 100,
            cleanliness: 100,
            energy: 100,
            lastSaved: Date.now(),
            currentAction: null,
            actionTimeout: null,
            gameStartTime: Date.now(),
            lastUpdateTime: Date.now(),
            updateInterval: 5000
        };
        
        updateUI();
        startGameLoop();
        
        // Start hatching sequence after 5 seconds
        setTimeout(() => {
            hatchEgg();
        }, 5000);
    }
    
    // Load a saved game
    function loadGame() {
        const savedGame = JSON.parse(localStorage.getItem('dinoTamagotchiSave'));
        
        if (savedGame) {
            gameState = savedGame;
            
            // Calculate stat decay since last save
            const timePassed = (Date.now() - gameState.lastSaved) / 1000; // in seconds
            const decayAmount = Math.min(timePassed / 60, 100); // Max 100% decay
            
            gameState.hunger = Math.max(0, gameState.hunger - decayAmount);
            gameState.happiness = Math.max(0, gameState.happiness - decayAmount);
            gameState.cleanliness = Math.max(0, gameState.cleanliness - decayAmount);
            gameState.energy = Math.max(0, gameState.energy - decayAmount);
            
            // Update time-related state
            gameState.gameStartTime = Date.now() - (timePassed * 1000);
            gameState.lastUpdateTime = Date.now();
            
            updateUI();
            startGameLoop();
        }
    }
    
    // Save the game
    function saveGame() {
        gameState.lastSaved = Date.now();
        localStorage.setItem('dinoTamagotchiSave', JSON.stringify(gameState));
    }
    
    // Update progress bar
    function updateProgressBar() {
        if (!gameState.lastUpdateTime) return;
        
        const currentTime = Date.now();
        
        // Update progress bar
        const timeSinceLastUpdate = currentTime - gameState.lastUpdateTime;
        const progressPercentage = Math.min(100, (timeSinceLastUpdate / gameState.updateInterval) * 100);
        intervalProgress.style.width = `${progressPercentage}%`;
    }
    
    // Start the game loop
    function startGameLoop() {
        // Save game every minute
        setInterval(saveGame, 60000);
        
        // Update progress bar every 100ms for smooth animation
        setInterval(updateProgressBar, 100);
        
        // Decay stats over time
        setInterval(() => {
            if (gameState.stage !== 'egg') {
                // Store previous values to detect changes
                const prevHunger = gameState.hunger;
                const prevHappiness = gameState.happiness;
                const prevCleanliness = gameState.cleanliness;
                const prevEnergy = gameState.energy;
                
                // Update stats
                gameState.hunger = Math.max(0, gameState.hunger - 1);
                gameState.happiness = Math.max(0, gameState.happiness - 0.5);
                gameState.cleanliness = Math.max(0, gameState.cleanliness - 0.3);
                gameState.energy = Math.max(0, gameState.energy - 0.2);
                
                // Reset the progress bar timer
                gameState.lastUpdateTime = Date.now();
                
                // Update UI
                updateUI();
                
                // Add blinking effect for decreased stats
                if (prevHunger > gameState.hunger) {
                    blinkStat(hungerBar, 'decrease');
                }
                if (prevHappiness > gameState.happiness) {
                    blinkStat(happinessBar, 'decrease');
                }
                if (prevCleanliness > gameState.cleanliness) {
                    blinkStat(cleanlinessBar, 'decrease');
                }
                if (prevEnergy > gameState.energy) {
                    blinkStat(energyBar, 'decrease');
                }
                
                checkStatus();
            }
        }, gameState.updateInterval);
    }
    
    // Add blinking effect to a stat bar
    function blinkStat(statBar, changeType) {
        // Save original color
        const originalColor = window.getComputedStyle(statBar).backgroundColor;
        
        // Set color based on change type
        if (changeType === 'decrease') {
            statBar.style.backgroundColor = '#8B0000'; // Dark red
        } else if (changeType === 'increase') {
            statBar.style.backgroundColor = '#006400'; // Dark green
        }
        
        // Reset to original color after a short delay
        setTimeout(() => {
            statBar.style.backgroundColor = originalColor;
        }, 300);
    }
    
    // Hatch the egg
    function hatchEgg() {
        if (gameState.stage === 'egg') {
            gameState.stage = 'hatching';
            dinoImage.src = 'assets/dino_trex_green_hatching.png';
            statusMessage.textContent = 'Your egg is hatching!';
            
            // After hatching animation, show the baby dino
            setTimeout(() => {
                gameState.stage = 'baby';
                dinoImage.src = 'assets/dino_trex_level1.png';
                statusMessage.textContent = 'Your dino has hatched!';
            }, 3000);
        }
    }
    
    // Update the UI based on game state
    function updateUI() {
        // Update stat bars
        hungerBar.style.width = `${gameState.hunger}%`;
        happinessBar.style.width = `${gameState.happiness}%`;
        cleanlinessBar.style.width = `${gameState.cleanliness}%`;
        energyBar.style.width = `${gameState.energy}%`;
        
        // Update dino image based on stage and current action
        if (gameState.stage === 'egg') {
            dinoImage.src = 'assets/egg_green.png';
        } else if (gameState.stage === 'hatching') {
            dinoImage.src = 'assets/dino_trex_green_hatching.png';
        } else if (gameState.currentAction) {
            dinoImage.src = `assets/dino_trex_green_${gameState.currentAction}.png`;
        } else if (gameState.hunger < 30) {
            dinoImage.src = 'assets/dino_trex_green_hungry.png';
            statusMessage.textContent = 'Your dino is hungry!';
        } else if (gameState.happiness < 30) {
            dinoImage.src = 'assets/dino_trex_green_bored.png';
            statusMessage.textContent = 'Your dino is bored!';
        } else if (gameState.cleanliness < 30) {
            dinoImage.src = 'assets/dino_trex_green_smells.png';
            statusMessage.textContent = 'Your dino needs cleaning!';
        } else if (gameState.energy < 30) {
            dinoImage.src = 'assets/dino_trex_green_sleeping.png';
            statusMessage.textContent = 'Your dino is tired!';
        } else {
            dinoImage.src = 'assets/dino_trex_level1.png';
            statusMessage.textContent = '';
        }
    }
    
    // Check dino status and update UI accordingly
    function checkStatus() {
        if (gameState.hunger <= 0 && gameState.happiness <= 0 && 
            gameState.cleanliness <= 0 && gameState.energy <= 0) {
            statusMessage.textContent = 'Your dino is not feeling well! Take better care of it!';
        }
    }
    
    // Perform an action with animation and timeout
    function performAction(action, statToIncrease, amount, duration) {
        if (gameState.stage !== 'baby' || gameState.currentAction) return;
        
        // Set current action
        gameState.currentAction = action;
        
        // Update UI to show action
        dinoImage.src = `assets/dino_trex_green_${action}.png`;
        statusMessage.textContent = getActionMessage(action);
        
        // Clear any existing timeout
        if (gameState.actionTimeout) {
            clearTimeout(gameState.actionTimeout);
        }
        
        // Set timeout to end action
        gameState.actionTimeout = setTimeout(() => {
            gameState.currentAction = null;
            
            // Store previous value to detect change
            const prevValue = gameState[statToIncrease];
            
            // Update stat
            gameState[statToIncrease] = Math.min(100, gameState[statToIncrease] + amount);
            
            // Update UI
            updateUI();
            
            // Add blinking effect for increased stat
            if (gameState[statToIncrease] > prevValue) {
                let statBar;
                switch(statToIncrease) {
                    case 'hunger': statBar = hungerBar; break;
                    case 'happiness': statBar = happinessBar; break;
                    case 'cleanliness': statBar = cleanlinessBar; break;
                    case 'energy': statBar = energyBar; break;
                }
                if (statBar) {
                    blinkStat(statBar, 'increase');
                }
            }
            
            saveGame();
        }, duration);
    }
    
    // Get message for current action
    function getActionMessage(action) {
        switch(action) {
            case 'eating': return 'Yum! Your dino is eating!';
            case 'playing': return 'Your dino is having fun!';
            case 'washing': return 'Scrub-a-dub! Your dino is getting clean!';
            case 'sleeping': return 'Zzz... Your dino is sleeping!';
            default: return '';
        }
    }
    
    // Button event listeners
    feedButton.addEventListener('click', () => {
        performAction('eating', 'hunger', 30, 3000);
    });
    
    playButton.addEventListener('click', () => {
        performAction('playing', 'happiness', 30, 3000);
    });
    
    cleanButton.addEventListener('click', () => {
        performAction('washing', 'cleanliness', 30, 3000);
    });
    
    sleepButton.addEventListener('click', () => {
        performAction('sleeping', 'energy', 30, 5000);
    });
}); 