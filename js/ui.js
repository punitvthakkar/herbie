// UI System - HUD, screens, and overlays

export class UISystem {
  constructor(game) {
    this.game = game;
    
    // Get DOM elements
    this.titleScreen = document.getElementById('title-screen');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.onboardingPrompt = document.getElementById('onboarding');
    this.onboardingText = document.getElementById('onboarding-text');
    this.hud = document.getElementById('hud');
    
    this.scoreDisplay = document.getElementById('score');
    this.flowDisplay = document.getElementById('flow');
    this.obstaclesClearedDisplay = document.getElementById('obstacles-cleared');
    this.finalScoreDisplay = document.getElementById('final-score');
    this.bestScoreDisplay = document.getElementById('best-score');
    this.finalObstaclesClearedDisplay = document.getElementById('final-obstacles-cleared');
    
    // Buttons
    this.startButton = document.getElementById('start-button');
    this.retryButton = document.getElementById('retry-button');
    this.menuButton = document.getElementById('menu-button');
    this.pauseButton = document.getElementById('pause-button');
    this.resumeButton = document.getElementById('resume-button');
    this.quitButton = document.getElementById('quit-button');
    this.contrastToggle = document.getElementById('contrast-toggle');
    
    // Palette selection
    this.paletteDots = document.querySelectorAll('.palette-dot');
    
    this.onboardingDismissed = false;
    this.highContrastMode = false;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.startButton.addEventListener('click', () => {
      this.game.startGame();
    });
    
    this.retryButton.addEventListener('click', () => {
      this.game.startGame();
    });
    
    this.menuButton.addEventListener('click', () => {
      this.game.showTitle();
    });
    
    this.pauseButton.addEventListener('click', () => {
      this.game.pauseGame();
    });
    
    this.resumeButton.addEventListener('click', () => {
      this.game.resumeGame();
    });
    
    this.quitButton.addEventListener('click', () => {
      this.game.showTitle();
    });
    
    // Palette selection
    this.paletteDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const paletteName = dot.getAttribute('data-palette');
        this.selectPalette(paletteName);
      });
    });
    
    // High contrast toggle
    if (this.contrastToggle) {
      this.contrastToggle.addEventListener('click', () => {
        this.toggleHighContrast();
      });
    }
  }
  
  selectPalette(name) {
    this.paletteDots.forEach(dot => {
      dot.classList.toggle('active', dot.getAttribute('data-palette') === name);
    });
    this.game.setPalette(name);
  }
  
  showTitle() {
    this.titleScreen.classList.remove('hidden');
    this.gameoverScreen.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.onboardingPrompt.classList.add('hidden');
    this.hud.classList.add('hidden');
  }
  
  showOnboarding() {
    if (!this.onboardingDismissed) {
      if (this.onboardingText) {
        this.onboardingText.textContent = 'Tap obstacles to help Herbie';
      }
      this.onboardingPrompt.classList.remove('hidden');
      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        this.dismissOnboarding();
      }, 10000);
    }
  }
  
  dismissOnboarding() {
    this.onboardingDismissed = true;
    this.onboardingPrompt.classList.add('hidden');
  }
  
  showHUD() {
    this.titleScreen.classList.add('hidden');
    this.gameoverScreen.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.showOnboarding();
  }
  
  showPause() {
    this.pauseOverlay.classList.remove('hidden');
  }
  
  hidePause() {
    this.pauseOverlay.classList.add('hidden');
  }
  
  showGameOver(score, bestScore) {
    this.hud.classList.add('hidden');
    this.onboardingPrompt.classList.add('hidden');
    
    // Add desaturation effect to canvas
    const canvas = this.game.canvas;
    canvas.classList.add('desaturate');
    
    // Wait for fade transition
    setTimeout(() => {
      this.gameoverScreen.classList.remove('hidden');
      this.finalScoreDisplay.textContent = Math.floor(score);
      this.bestScoreDisplay.textContent = Math.floor(bestScore);
      
      // Show obstacles cleared
      if (this.finalObstaclesClearedDisplay) {
        this.finalObstaclesClearedDisplay.textContent = this.game.state.obstaclesCleared;
      }
      
      // Remove desaturation
      canvas.classList.remove('desaturate');
    }, 600);
  }
  
  updateScore(score) {
    const displayScore = Math.floor(score);
    this.scoreDisplay.textContent = displayScore;
    
    // Pulse animation
    this.scoreDisplay.classList.remove('pulse');
    void this.scoreDisplay.offsetWidth; // Trigger reflow
    this.scoreDisplay.classList.add('pulse');
  }
  
  updateFlow(flowMultiplier) {
    this.flowDisplay.textContent = flowMultiplier.toFixed(1) + 'x';
    
    // Pulse animation when flow changes significantly
    if (flowMultiplier > 2.0) {
      this.flowDisplay.classList.remove('pulse');
      void this.flowDisplay.offsetWidth;
      this.flowDisplay.classList.add('pulse');
    }
  }
  
  updateObstaclesCleared(count) {
    if (this.obstaclesClearedDisplay) {
      this.obstaclesClearedDisplay.textContent = count;
      
      // Pulse animation on each clear
      this.obstaclesClearedDisplay.classList.remove('pulse');
      void this.obstaclesClearedDisplay.offsetWidth;
      this.obstaclesClearedDisplay.classList.add('pulse');
    }
  }
  
  toggleHighContrast() {
    this.highContrastMode = !this.highContrastMode;
    document.body.classList.toggle('high-contrast', this.highContrastMode);
    
    // Save preference
    localStorage.setItem('herbie-high-contrast', this.highContrastMode.toString());
  }
  
  loadHighContrastPreference() {
    const stored = localStorage.getItem('herbie-high-contrast');
    if (stored === 'true') {
      this.highContrastMode = true;
      document.body.classList.add('high-contrast');
    }
  }
  
  // LocalStorage for best score
  loadBestScore() {
    const stored = localStorage.getItem('herbie-best-score');
    return stored ? parseFloat(stored) : 0;
  }
  
  saveBestScore(score) {
    const currentBest = this.loadBestScore();
    if (score > currentBest) {
      localStorage.setItem('herbie-best-score', score.toString());
      return true; // New record
    }
    return false;
  }
}
