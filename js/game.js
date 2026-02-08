// Game - Main game loop and state machine

import { Renderer } from './renderer.js';
import { Terrain } from './terrain.js';
import { HikerSystem } from './hikers.js';
import { ObstacleSystem } from './obstacles.js';
import { InputSystem } from './input.js';
import { AudioSystem } from './audio.js';
import { UISystem } from './ui.js';
import { getPalette } from './palette.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // State machine: 'title' | 'playing' | 'paused' | 'gameover'
    this.gameState = 'title';
    
    // Current palette
    this.currentPalette = getPalette('sunset');
    
    // Game state
    this.state = {
      terrain: new Terrain(),
      hikers: new HikerSystem(),
      obstacles: new ObstacleSystem(),
      distance: 0,
      score: 0,
      flowMultiplier: 1.0,
      lastFlowUpdate: 0,
      runStartX: 0,
      obstaclesCleared: 0,
    };
    
    // Systems
    this.renderer = new Renderer(canvas);
    this.input = new InputSystem(canvas, this);
    this.audio = new AudioSystem();
    this.ui = new UISystem(this);
    
    // Animation loop
    this.lastTime = 0;
    this.animationId = null;
  }
  
  init() {
    // Load user preferences
    this.ui.loadHighContrastPreference();
    
    // Show title screen
    this.ui.showTitle();
    
    // Start render loop (runs continuously even in title)
    this.lastTime = performance.now();
    this.loop();
  }
  
  setPalette(name) {
    this.currentPalette = getPalette(name);
  }
  
  startGame() {
    // Initialize audio on first interaction
    if (!this.audio.initialized) {
      this.audio.init();
    }
    
    // Reset game state
    const canvasRect = this.canvas.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;
    
    this.state.terrain.init(canvasWidth, canvasHeight);
    this.state.hikers.init(200, canvasHeight * 0.7);
    this.state.obstacles.init();
    this.state.runStartX = this.state.hikers.hikers[0].x;
    this.state.distance = 0;
    this.state.score = 0;
    this.state.flowMultiplier = 1.0;
    this.state.lastFlowUpdate = 0;
    this.state.obstaclesCleared = 0;
    this.state.hikers.setHerbieLabel(6);
    
    // Update UI
    this.ui.showHUD();
    this.ui.updateScore(0);
    this.ui.updateFlow(1.0);
    
    // Enable input
    this.input.enable();
    
    // Change state
    this.gameState = 'playing';
  }
  
  pauseGame() {
    if (this.gameState !== 'playing') return;
    this.gameState = 'paused';
    this.ui.showPause();
    this.input.disable();
  }
  
  resumeGame() {
    if (this.gameState !== 'paused') return;
    this.gameState = 'playing';
    this.ui.hidePause();
    this.input.enable();
  }
  
  endGame() {
    this.gameState = 'gameover';
    this.input.disable();
    
    // Play failure sound
    this.audio.playFailure();
    
    // Save best score
    const bestScore = this.ui.loadBestScore();
    const isNewRecord = this.ui.saveBestScore(this.state.score);
    const displayBest = isNewRecord ? this.state.score : bestScore;
    
    // Show game over screen
    this.ui.showGameOver(this.state.score, displayBest);
  }
  
  showTitle() {
    this.gameState = 'title';
    this.input.disable();
    this.ui.showTitle();
  }
  
  loop() {
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = now;
    
    // Update game logic if playing
    if (this.gameState === 'playing') {
      this.update(deltaTime);
    }
    
    // Always render
    this.render();
    
    // Continue loop
    this.animationId = requestAnimationFrame(() => this.loop());
  }
  
  update(deltaTime) {
    // Update hikers
    this.state.hikers.update(deltaTime, this.state.terrain);
    
    // Update distance/score based on Herbie's progress
    const herbieX = this.state.hikers.hikers[0].x;
    this.state.distance = Math.max(0, herbieX - this.state.runStartX);
    this.state.score = this.state.distance / 10; // Score is distance/10
    
    // Update terrain (camera follows Herbie, generate new segments)
    this.state.terrain.update(deltaTime, this.state.distance, herbieX);
    
    // Update obstacles
    this.state.obstacles.update(deltaTime, this.state.terrain, this.state.distance);
    
    // Calculate flow multiplier
    this.state.flowMultiplier = this.state.hikers.getFlowMultiplier();
    
    // Update palette flow shift
    this.currentPalette.setFlowShift(this.state.flowMultiplier);
    
    // Update audio based on flow
    this.audio.updateFlow(this.state.flowMultiplier);
    
    // Update obstacles cleared count
    this.state.obstaclesCleared = this.state.obstacles.getClearedCount();
    
    // Update UI periodically
    const now = performance.now();
    if (now - this.state.lastFlowUpdate > 100) { // Update every 100ms
      this.ui.updateScore(this.state.score);
      this.ui.updateFlow(this.state.flowMultiplier);
      this.ui.updateObstaclesCleared(this.state.obstaclesCleared);
      this.state.lastFlowUpdate = now;
    }
    
    // Check failure conditions
    this.checkFailureConditions();
  }
  
  checkFailureConditions() {
    const herbie = this.state.hikers.hikers[0];
    
    // Check if Herbie hit an obstacle
    const collision = this.state.obstacles.checkCollision(
      herbie.x, herbie.y, herbie.size
    );
    if (collision) {
      this.endGame();
      return;
    }
    
    // Check if Herbie fell into a gap
    if (!this.state.hikers.isHerbieOnGround(this.state.terrain)) {
      this.endGame();
      return;
    }
    
    // Check if caravan is too stretched
    if (this.state.hikers.isTooStretched()) {
      this.endGame();
      return;
    }
  }
  
  render() {
    // Render game state
    if (this.gameState === 'playing' || this.gameState === 'paused' || this.gameState === 'gameover') {
      this.renderer.render(this.state, this.currentPalette);
    } else if (this.gameState === 'title') {
      // Render a static/animated title background
      this.renderTitleBackground();
    }
  }
  
  // Update renderer canvas size
  updateCanvasSize(width, height) {
    if (this.renderer) {
      this.renderer.updateCanvasSize(width, height);
    }
  }
  
  renderTitleBackground() {
    // Draw a simple ambient background for title screen
    const ctx = this.ctx;
    const sky = this.currentPalette.getSkyGradient();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, this.renderer.height);
    gradient.addColorStop(0, sky.top);
    gradient.addColorStop(1, sky.bottom);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);
    
    // Decorative silhouettes and a quiet landmark
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = this.currentPalette.terrain.far;
    const horizon = this.renderer.height * 0.7;
    this.renderer.drawTower(ctx, this.renderer.width * 0.15, horizon - 180, 120, 200);
    this.renderer.drawArch(ctx, this.renderer.width * 0.55, horizon - 120, 140, 160);
    ctx.globalAlpha = 0.5;
    this.renderer.drawRing(ctx, this.renderer.width * 0.75, horizon - 200, 100);
    
    // Foreground platform
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = this.currentPalette.terrain.foreground;
    ctx.fillRect(0, horizon + 10, this.renderer.width, 20);
    
    // Herbie glow hint
    const herbieX = this.renderer.width * 0.25;
    const herbieY = horizon + 10;
    const glow = ctx.createRadialGradient(herbieX, herbieY, 0, herbieX, herbieY, 40);
    glow.addColorStop(0, this.currentPalette.hsla(this.currentPalette.baseHue - 10, 80, 70, 0.5));
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(herbieX, herbieY, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1;
  }
}
