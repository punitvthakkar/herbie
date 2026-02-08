// Obstacle System - Procedural obstacle generation and interaction

export class ObstacleSystem {
  constructor() {
    this.obstacles = [];
    this.nextObstacleDistance = 0;
    this.baseSpawnRate = 180; // pixels between obstacles (much more frequent!)
    this.minSpawnRate = 120; // minimum spacing (tighter!)
    this.obstaclesCleared = 0; // Track cleared obstacles
    this.lastClearTime = 0; // For combo tracking
  }
  
  init() {
    this.obstacles = [];
    this.nextObstacleDistance = 400; // Start spawning sooner
    this.obstaclesCleared = 0;
    this.lastClearTime = 0;
  }
  
  update(deltaTime, terrain, distance) {
    // Spawn new obstacles based on distance - MUCH MORE FREQUENTLY
    if (distance > this.nextObstacleDistance) {
      this.spawnObstacle(terrain, distance);
      
      // Calculate next spawn distance with difficulty ramp
      const difficulty = Math.min(1.0, distance * 0.0002); // Faster difficulty ramp
      const spawnRate = this.baseSpawnRate - (this.baseSpawnRate - this.minSpawnRate) * difficulty;
      // Reduced randomness for more consistent stream
      this.nextObstacleDistance = distance + spawnRate + Math.random() * 80;
    }
    
    // Update obstacle animations
    this.obstacles.forEach(obstacle => {
      if (obstacle.clearing) {
        obstacle.clearProgress += deltaTime * 2;
        if (obstacle.clearProgress >= 1.0) {
          obstacle.cleared = true;
        }
      }
      
      // Pulse animation for interactable glow
      obstacle.glowPhase = (obstacle.glowPhase || 0) + deltaTime * 2;
    });
    
    // Remove obstacles that are off-screen or cleared
    const cameraX = terrain.cameraX;
    this.obstacles = this.obstacles.filter(obs => 
      !obs.cleared && obs.x > cameraX - 200
    );
  }
  
  spawnObstacle(terrain, distance) {
    // Weight obstacle types based on difficulty
    const difficulty = Math.min(1.0, distance * 0.0002);
    const rand = Math.random();
    
    let type;
    if (difficulty < 0.2) {
      // Early game: mostly walls and barriers (easy to see and click)
      type = rand < 0.4 ? 'wall' : (rand < 0.7 ? 'barrier' : 'gap');
    } else if (difficulty < 0.5) {
      // Mid game: mix of all types
      type = rand < 0.25 ? 'gap' : (rand < 0.5 ? 'wall' : (rand < 0.75 ? 'barrier' : 'platform'));
    } else {
      // Late game: more variety and platforms
      type = rand < 0.2 ? 'gap' : (rand < 0.45 ? 'wall' : (rand < 0.7 ? 'barrier' : 'platform'));
    }
    
    const spawnX = terrain.cameraX + terrain.canvasWidth + 200;
    
    // Find the segment at spawn position
    const segment = terrain.segments.find(seg => 
      spawnX >= seg.x && spawnX < seg.x + seg.width
    );
    
    if (!segment) return;
    
    let obstacle;
    
    switch (type) {
      case 'gap':
        obstacle = {
          type: 'gap',
          x: segment.x,
          y: segment.y,
          width: segment.width,
          height: 20,
          cleared: false,
          clearing: false,
          clearProgress: 0,
          glowPhase: 0,
          segment,
        };
        // Mark segment as having a gap
        segment.hasGap = true;
        break;
        
      case 'wall':
        obstacle = {
          type: 'wall',
          x: segment.x + segment.width * 0.3,
          y: segment.y - 60,
          width: 30,
          height: 60,
          cleared: false,
          clearing: false,
          clearProgress: 0,
          glowPhase: 0,
        };
        break;
        
      case 'platform':
        obstacle = {
          type: 'platform',
          x: segment.x + segment.width * 0.3,
          y: segment.y - 50,
          width: 80,
          height: 50,
          cleared: false,
          clearing: false,
          clearProgress: 0,
          glowPhase: 0,
          lowered: false,
        };
        break;
        
      case 'barrier':
        // New obstacle type: vertical barrier that must be clicked
        obstacle = {
          type: 'barrier',
          x: segment.x + segment.width * 0.4,
          y: segment.y - 80,
          width: 20,
          height: 80,
          cleared: false,
          clearing: false,
          clearProgress: 0,
          glowPhase: 0,
        };
        break;
    }
    
    this.obstacles.push(obstacle);
  }
  
  // Handle tap interaction with obstacle
  clearObstacle(obstacle) {
    if (obstacle.cleared || obstacle.clearing) {
      return false;
    }
    
    obstacle.clearing = true;
    
    // Special handling for gap obstacles
    if (obstacle.type === 'gap') {
      if (obstacle.segment) {
        obstacle.segment.hasGap = false;
      }
    }
    
    // Track cleared obstacles
    this.obstaclesCleared++;
    this.lastClearTime = performance.now();
    
    return true;
  }
  
  // Get obstacles cleared count
  getClearedCount() {
    return this.obstaclesCleared;
  }
  
  // Check collision between Herbie and obstacles
  checkCollision(herbieX, herbieY, herbieSize) {
    for (const obstacle of this.obstacles) {
      if (obstacle.cleared || obstacle.clearing) {
        continue;
      }

      if (obstacle.type === 'gap') {
        continue; // Gaps are handled separately by terrain collision
      }
      
      // Simple AABB collision for wall, platform, and barrier
      const padding = 5;
      const herbieLeft = herbieX - herbieSize / 2 + padding;
      const herbieRight = herbieX + herbieSize / 2 - padding;
      const herbieTop = herbieY - herbieSize / 2 + padding;
      const herbieBottom = herbieY + herbieSize / 2 - padding;
      
      const obsLeft = obstacle.x;
      const obsRight = obstacle.x + obstacle.width;
      const obsTop = obstacle.y - (obstacle.height || 0);
      const obsBottom = obstacle.y;
      
      if (herbieRight > obsLeft && herbieLeft < obsRight &&
          herbieBottom > obsTop && herbieTop < obsBottom) {
        return obstacle;
      }
    }
    
    return null;
  }
  
  // Hit test for tap input
  hitTest(worldX, worldY) {
    for (const obstacle of this.obstacles) {
      if (obstacle.cleared || obstacle.clearing) {
        continue;
      }
      
      // Expand hitbox slightly for easier tapping
      const hitboxPadding = 20;
      const left = obstacle.x - hitboxPadding;
      const right = obstacle.x + obstacle.width + hitboxPadding;
      const top = obstacle.y - (obstacle.height || 20) - hitboxPadding;
      const bottom = obstacle.y + hitboxPadding;
      
      if (worldX >= left && worldX <= right &&
          worldY >= top && worldY <= bottom) {
        return obstacle;
      }
    }
    
    return null;
  }
  
  // Get obstacles in view for rendering
  getVisibleObstacles(cameraX, canvasWidth) {
    const leftEdge = cameraX - 100;
    const rightEdge = cameraX + canvasWidth + 100;
    return this.obstacles.filter(obs => 
      obs.x < rightEdge && obs.x + obs.width > leftEdge
    );
  }
}
