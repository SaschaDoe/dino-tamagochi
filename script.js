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
        updateInterval: 5000, // 5 seconds in milliseconds
        lastIdleTime: null,
        isWobbling: false,
        isJumping: false,
        wobbleInterval: null,
        clicksNeeded: 0
    };
    
    // Prevent default touch behaviors on game elements
    document.querySelectorAll('.control-button, .dino-container, button').forEach(element => {
        element.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior like double-tap zoom
        }, { passive: false });
    });
    
    // Handle visibility change to pause/resume game
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // App is in background, save the game
            saveGame();
        } else {
            // App is visible again, update UI
            updateUI();
        }
    });
    
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
            hunger: 50,
            happiness: 50,
            cleanliness: 50,
            energy: 50,
            lastSaved: Date.now(),
            currentAction: null,
            actionTimeout: null,
            gameStartTime: Date.now(),
            lastUpdateTime: Date.now(),
            updateInterval: 5000,
            lastIdleTime: Date.now(),
            isWobbling: false,
            isJumping: false,
            wobbleInterval: null,
            clicksNeeded: 0
        };
        
        updateUI();
        startGameLoop();
        
        // Start egg wobbling animation
        startEggWobbling();
        
        // Start hatching sequence after 5 seconds
        setTimeout(() => {
            hatchEgg();
        }, 5000);
    }
    
    // Start egg wobbling animation
    function startEggWobbling() {
        if (gameState.stage !== 'egg') return;
        
        // Initial wobble to ensure it starts immediately
        setTimeout(() => {
            if (gameState.stage === 'egg' && !gameState.isWobbling) {
                gameState.isWobbling = true;
                dinoImage.classList.add('wobble');
                
                // Stop wobbling after a short duration (0.5-1 seconds)
                setTimeout(() => {
                    stopEggWobbling();
                }, 500 + Math.random() * 500);
            }
        }, 1000);
        
        // Set up periodic wobbling
        const wobbleInterval = setInterval(() => {
            // Only wobble if not already wobbling and in egg stage
            if (!gameState.isWobbling && gameState.stage === 'egg') {
                // Start wobbling
                gameState.isWobbling = true;
                dinoImage.classList.add('wobble');
                
                // Stop wobbling after a short duration (0.5-1 seconds)
                setTimeout(() => {
                    stopEggWobbling();
                }, 500 + Math.random() * 500);
            }
        }, 3000 + Math.random() * 2000); // Wobble every 3-5 seconds
        
        // Store the interval ID in the game state for cleanup
        gameState.wobbleInterval = wobbleInterval;
    }
    
    // Stop egg wobbling animation
    function stopEggWobbling() {
        gameState.isWobbling = false;
        dinoImage.classList.remove('wobble');
        dinoImage.style.animation = '';
    }
    
    // Make dino jump (idle animation)
    function makeJump() {
        if (gameState.stage !== 'baby' || gameState.currentAction || gameState.isJumping) return;
        
        gameState.isJumping = true;
        
        // Add jump animation
        dinoImage.classList.add('jump');
        
        // Reset after animation completes
        setTimeout(() => {
            dinoImage.classList.remove('jump');
            gameState.isJumping = false;
        }, 800);
    }
    
    // Load a saved game
    function loadGame() {
        const savedGame = JSON.parse(localStorage.getItem('dinoTamagotchiSave'));
        
        if (savedGame) {
            // Clear any existing wobble interval
            if (gameState.wobbleInterval) {
                clearInterval(gameState.wobbleInterval);
            }
            
            // Remove any existing click event listener
            dinoImage.removeEventListener('click', handleDinoClick);
            dinoImage.removeEventListener('touchend', handleDinoClick);
            
            gameState = savedGame;
            
            // Ensure wobble interval is null (it can't be serialized)
            gameState.wobbleInterval = null;
            gameState.isWobbling = false;
            gameState.isJumping = false;
            
            // Calculate stat decay since last save
            const timePassed = (Date.now() - gameState.lastSaved) / 1000; // in seconds
            const decayAmount = Math.min(timePassed / 60, 100); // Max 100% decay
            
            // Ensure stats don't go below 0
            gameState.hunger = Math.max(0, gameState.hunger - decayAmount);
            gameState.happiness = Math.max(0, gameState.happiness - decayAmount);
            gameState.cleanliness = Math.max(0, gameState.cleanliness - decayAmount);
            gameState.energy = Math.max(0, gameState.energy - decayAmount);
            
            // Update time-related state
            gameState.gameStartTime = Date.now() - (timePassed * 1000);
            gameState.lastUpdateTime = Date.now();
            gameState.lastIdleTime = Date.now();
            gameState.isWobbling = false;
            gameState.isJumping = false;
            
            updateUI();
            startGameLoop();
            
            // If in egg stage, start wobbling
            if (gameState.stage === 'egg') {
                startEggWobbling();
            }
            
            // If in the middle of an action that requires clicks, reattach event listeners
            if (gameState.currentAction && gameState.currentAction !== 'sleeping' && gameState.clicksNeeded > 0) {
                dinoImage.addEventListener('click', handleDinoClick);
                dinoImage.addEventListener('touchend', handleDinoClick);
            }
        } else {
            // If no saved game or error loading, start a new game
            initGame();
        }
    }
    
    // Save the game
    function saveGame() {
        gameState.lastSaved = Date.now();
        
        // Create a copy of the game state without the interval
        const gameStateCopy = { ...gameState };
        delete gameStateCopy.wobbleInterval;
        
        localStorage.setItem('dinoTamagotchiSave', JSON.stringify(gameStateCopy));
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
    
    // Check for idle animations
    function checkIdleAnimations() {
        if (gameState.stage === 'baby' && !gameState.currentAction && !gameState.isJumping) {
            const currentTime = Date.now();
            const idleTime = currentTime - gameState.lastIdleTime;
            
            // Random jump every 10-20 seconds of idle time
            if (idleTime > 10000 + Math.random() * 10000) {
                makeJump();
                gameState.lastIdleTime = currentTime;
            }
        }
    }
    
    // Start the game loop
    function startGameLoop() {
        // Save game every minute
        setInterval(saveGame, 60000);
        
        // Update progress bar every 100ms for smooth animation
        setInterval(updateProgressBar, 100);
        
        // Check for idle animations every second
        setInterval(checkIdleAnimations, 1000);
        
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
        // Store the original color based on the stat bar ID
        let originalColor;
        switch(statBar.id) {
            case 'hunger-bar': originalColor = '#e74c3c'; break;
            case 'happiness-bar': originalColor = '#f1c40f'; break;
            case 'cleanliness-bar': originalColor = '#3498db'; break;
            case 'energy-bar': originalColor = '#2ecc71'; break;
            default: originalColor = '#5d4f6f';
        }
        
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
            // Stop wobbling animation and clear interval
            stopEggWobbling();
            if (gameState.wobbleInterval) {
                clearInterval(gameState.wobbleInterval);
                gameState.wobbleInterval = null;
            }
            
            gameState.stage = 'hatching';
            dinoImage.src = 'assets/dino_trex_green_hatching.png';
            statusMessage.textContent = 'Your egg is hatching!';
            
            // After hatching animation, show the baby dino
            setTimeout(() => {
                gameState.stage = 'baby';
                dinoImage.src = 'assets/dino_trex_level1.png';
                statusMessage.textContent = 'Your dino has hatched!';
                gameState.lastIdleTime = Date.now();
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
        } else if (isHappy()) {
            dinoImage.src = 'assets/dino_trex_green_happy.png';
            statusMessage.textContent = 'Your dino is happy!';
        } else {
            dinoImage.src = 'assets/dino_trex_level1.png';
            statusMessage.textContent = '';
        }
    }
    
    // Check if dino is happy (all stats 80% or higher)
    function isHappy() {
        return gameState.hunger >= 80 && 
               gameState.happiness >= 80 && 
               gameState.cleanliness >= 80 && 
               gameState.energy >= 80;
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
        
        // For sleeping action, use timer as before
        if (action === 'sleeping') {
            // Set timeout to end action
            gameState.actionTimeout = setTimeout(() => {
                completeAction(statToIncrease, amount);
            }, duration);
        } else {
            // For other actions, require 3 clicks on the dino
            gameState.clicksNeeded = 3;
            statusMessage.textContent = `${getActionMessage(action)} Tap the dino ${gameState.clicksNeeded} times!`;
            
            // Add click/touch event listeners for the dino
            dinoImage.addEventListener('click', handleDinoClick);
            dinoImage.addEventListener('touchend', handleDinoClick);
        }
    }
    
    // Handle dino clicks/touches during actions
    function handleDinoClick(e) {
        // Prevent default behavior for touch events
        if (e.type === 'touchend') {
            e.preventDefault();
        }
        
        if (!gameState.currentAction || gameState.currentAction === 'sleeping') return;
        
        gameState.clicksNeeded--;
        
        if (gameState.clicksNeeded <= 0) {
            // Action complete
            dinoImage.removeEventListener('click', handleDinoClick);
            dinoImage.removeEventListener('touchend', handleDinoClick);
            completeAction(getStatForAction(gameState.currentAction), getAmountForAction(gameState.currentAction));
        } else {
            // Update status message with remaining clicks
            statusMessage.textContent = `${getActionMessage(gameState.currentAction)} Tap the dino ${gameState.clicksNeeded} more times!`;
        }
    }
    
    // Helper function to get the stat for an action
    function getStatForAction(action) {
        switch(action) {
            case 'eating': return 'hunger';
            case 'playing': return 'happiness';
            case 'washing': return 'cleanliness';
            case 'sleeping': return 'energy';
            default: return '';
        }
    }
    
    // Helper function to get the amount for an action
    function getAmountForAction(action) {
        // You can customize these amounts if needed
        return 30;
    }
    
    // Complete an action and update stats
    function completeAction(statToIncrease, amount) {
        // Store previous value to detect change
        const prevValue = gameState[statToIncrease];
        
        // Update stat
        gameState[statToIncrease] = Math.min(100, gameState[statToIncrease] + amount);
        
        // Reset current action
        gameState.currentAction = null;
        
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
        
        // Reset idle timer after action
        gameState.lastIdleTime = Date.now();
        
        saveGame();
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
    
    // Add touch event listeners for mobile
    feedButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        performAction('eating', 'hunger', 30, 3000);
    });
    
    playButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        performAction('playing', 'happiness', 30, 3000);
    });
    
    cleanButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        performAction('washing', 'cleanliness', 30, 3000);
    });
    
    sleepButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        performAction('sleeping', 'energy', 30, 5000);
    });
}); 