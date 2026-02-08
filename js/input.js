// Input System - Pointer event handling and hit-testing

export class InputSystem {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.isEnabled = false;
    
    this.boundPointerDown = this.handlePointerDown.bind(this);
  }
  
  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
  }
  
  disable() {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
  }
  
  handlePointerDown(event) {
    event.preventDefault();
    
    // Get canvas-relative coordinates
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // Convert to world coordinates (accounting for camera)
    const worldX = canvasX + this.game.state.terrain.cameraX;
    const worldY = canvasY;
    
    // Hit test obstacles first
    const hitObstacle = this.game.state.obstacles.hitTest(worldX, worldY);
    if (hitObstacle) {
      this.handleObstacleTap(hitObstacle, worldX, worldY);
      return;
    }
    
    // Hit test hikers
    const hitHiker = this.hitTestHikers(worldX, worldY);
    if (hitHiker !== null) {
      this.handleHikerTap(hitHiker);
      return;
    }

    if (this.game.ui) {
      this.game.ui.dismissOnboarding();
    }
  }
  
  handleObstacleTap(obstacle, worldX, worldY) {
    const success = this.game.state.obstacles.clearObstacle(obstacle);
    
    if (success) {
      // Add visual feedback
      if (this.game.renderer) {
        this.game.renderer.addTapFeedback(worldX, worldY, this.game.state.terrain.cameraX);
      }
      
      // Play tap sound
      if (this.game.audio) {
        this.game.audio.playTap();
      }
      
      // Dismiss onboarding prompt after first tap
      if (this.game.ui) {
        this.game.ui.dismissOnboarding();
      }

      if (this.game.state.hikers) {
        this.game.state.hikers.triggerPulse();
      }
    }
  }
  
  handleHikerTap(hikerIndex) {
    this.game.state.hikers.offloadHiker(hikerIndex);
    
    // Play tap sound
    if (this.game.audio) {
      this.game.audio.playTap();
    }

    if (this.game.ui) {
      this.game.ui.dismissOnboarding();
    }
  }
  
  hitTestHikers(worldX, worldY) {
    const hikers = this.game.state.hikers.hikers;
    
    for (let i = 0; i < hikers.length; i++) {
      const hiker = hikers[i];
      const distance = Math.sqrt(
        Math.pow(worldX - hiker.x, 2) + 
        Math.pow(worldY - hiker.y, 2)
      );
      
      // Expanded hit radius for easier tapping
      const hitRadius = hiker.size + 20;
      if (distance < hitRadius) {
        return i;
      }
    }
    
    return null;
  }
}
