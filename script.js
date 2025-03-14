document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    
    startButton.addEventListener('click', () => {
        const titleWindow = document.querySelector('.title-window');
        
        // Add a class for transition effect
        titleWindow.classList.add('fade-out');
        
        // After animation completes, we could initialize the game
        // or navigate to another screen
        setTimeout(() => {
            titleWindow.innerHTML = '<h2>Game Loading...</h2>';
            titleWindow.classList.remove('fade-out');
            titleWindow.classList.add('fade-in');
            
            // Here you would typically initialize your game
            // or navigate to the game screen
        }, 500);
    });
}); 