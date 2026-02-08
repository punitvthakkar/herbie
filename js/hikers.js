// Hiker System - Caravan with constraint logic

export class HikerSystem {
  constructor() {
    this.hikers = [];
    this.herbieIndex = 0; // Herbie is always the first hiker (slowest)
    this.spacing = 60; // Target spacing between hikers
    this.maxStretch = 220; // Maximum allowed distance before failure
    this.herbieLabelTime = 0;
  }
  
  init(startX, startY) {
    // Create 5 hikers with varying base speeds
    // Herbie (index 0) is slowest at 1.0, fastest is 1.6 (reduced for better balance)
    const baseSpeeds = [1.0, 1.15, 1.3, 1.45, 1.6];
    
    this.hikers = baseSpeeds.map((baseSpeed, index) => ({
      index,
      baseSpeed,
      currentSpeed: baseSpeed,
      x: startX - index * this.spacing, // Start in a line
      y: startY,
      targetY: startY,
      vx: 0,
      vy: 0,
      size: 16,
      glowRadius: index === 0 ? 16 : 10, // Herbie has larger glow
      swayPhase: Math.random() * Math.PI * 2,
      swayOffset: 0,
      walkPhase: Math.random() * Math.PI * 2,
      bobOffset: 0,
      isWaiting: false,
      offloadBoost: 0, // Temporary speed boost from offloading
      pulseTime: 0,
    }));
  }
  
  update(deltaTime, terrain) {
    const herbie = this.hikers[this.herbieIndex];
    this.herbieLabelTime = Math.max(0, this.herbieLabelTime - deltaTime);
    
    // Update Herbie's speed (may have offload boost)
    const herbieSpeed = herbie.baseSpeed + herbie.offloadBoost;
    
    // All hikers constrained to Herbie's pace
    this.hikers.forEach((hiker, index) => {
      // Target speed is min of own base speed and Herbie's current speed
      const targetSpeed = Math.min(hiker.baseSpeed + hiker.offloadBoost, herbieSpeed);
      
      // Check if hiker is bunched up behind others
      if (index > 0) {
        const hikerAhead = this.hikers[index - 1];
        const distance = hikerAhead.x - hiker.x;
        
        if (distance < this.spacing * 0.8) {
          // Too close, slow down or stop
          hiker.isWaiting = true;
          hiker.currentSpeed = Math.max(0, targetSpeed * (distance / this.spacing));
        } else if (distance > this.spacing * 1.5) {
          // Too far, catch up
          hiker.isWaiting = false;
          hiker.currentSpeed = hiker.baseSpeed * 1.2;
        } else {
          hiker.isWaiting = false;
          hiker.currentSpeed = targetSpeed;
        }
      } else {
        // Herbie sets the pace
        hiker.currentSpeed = herbieSpeed;
        hiker.isWaiting = false;
      }
      
      // Move horizontally
      hiker.x += hiker.currentSpeed * 100 * deltaTime;
      
      // Update vertical position to match terrain
      const groundY = terrain.getYAtX(hiker.x);
      if (groundY !== null) {
        hiker.targetY = groundY;
      }
      
      // Smooth Y movement
      const yDiff = hiker.targetY - hiker.y;
      hiker.y += yDiff * 5 * deltaTime;
      
      // Walking bob animation
      if (hiker.currentSpeed > 0.1) {
        hiker.walkPhase += hiker.currentSpeed * 8 * deltaTime;
        hiker.bobOffset = Math.sin(hiker.walkPhase) * 3;
      } else {
        hiker.bobOffset = 0;
      }
      
      // Idle sway when waiting
      if (hiker.isWaiting) {
        hiker.swayPhase += deltaTime;
        hiker.swayOffset = Math.sin(hiker.swayPhase) * 2;
      } else {
        hiker.swayOffset = 0;
      }
      
      // Decay offload boost back to neutral
      if (hiker.offloadBoost !== 0) {
        const direction = hiker.offloadBoost > 0 ? -1 : 1;
        hiker.offloadBoost += direction * deltaTime * 0.5;
        if (Math.abs(hiker.offloadBoost) < 0.01) {
          hiker.offloadBoost = 0;
        }
      }

      if (hiker.pulseTime > 0) {
        hiker.pulseTime = Math.max(0, hiker.pulseTime - deltaTime);
      }
    });
  }
  
  // Offload mechanic: tap a hiker to temporarily boost Herbie
  offloadHiker(hikerIndex) {
    if (hikerIndex === this.herbieIndex) {
      return; // Can't offload Herbie to himself
    }
    
    const hiker = this.hikers[hikerIndex];
    const herbie = this.hikers[this.herbieIndex];
    
    // Transfer some speed from tapped hiker to Herbie
    hiker.offloadBoost = -0.2; // Tapped hiker slows down
    herbie.offloadBoost = Math.max(herbie.offloadBoost, 0.4); // Herbie speeds up
    this.triggerPulse();
  }

  setHerbieLabel(seconds) {
    this.herbieLabelTime = seconds;
  }

  triggerPulse() {
    this.hikers.forEach(hiker => {
      hiker.pulseTime = 0.8;
    });
  }
  
  // Calculate flow multiplier based on caravan tightness
  getFlowMultiplier() {
    let totalSpacing = 0;
    let count = 0;
    
    for (let i = 1; i < this.hikers.length; i++) {
      const distance = this.hikers[i - 1].x - this.hikers[i].x;
      totalSpacing += distance;
      count++;
    }
    
    const avgSpacing = totalSpacing / count;
    const idealSpacing = this.spacing;
    
    // Flow multiplier: 1.0 at ideal spacing, up to 3.0 when very tight
    const deviation = Math.abs(avgSpacing - idealSpacing);
    const multiplier = Math.max(1.0, 3.0 - deviation / idealSpacing);
    
    return Math.min(3.0, multiplier);
  }
  
  // Check if caravan is too stretched (failure condition)
  isTooStretched() {
    for (let i = 1; i < this.hikers.length; i++) {
      const distance = this.hikers[i - 1].x - this.hikers[i].x;
      if (distance > this.maxStretch) {
        return true;
      }
    }
    return false;
  }
  
  // Get pairs of hikers that need tension lines drawn
  getTensionLines() {
    const lines = [];
    const tensionThreshold = this.spacing * 2;
    
    for (let i = 1; i < this.hikers.length; i++) {
      const distance = this.hikers[i - 1].x - this.hikers[i].x;
      if (distance > tensionThreshold) {
        lines.push({
          from: this.hikers[i],
          to: this.hikers[i - 1],
          tension: (distance - tensionThreshold) / (this.maxStretch - tensionThreshold),
        });
      }
    }
    
    return lines;
  }
  
  // Get Herbie's position (for camera follow)
  getHerbiePosition() {
    return {
      x: this.hikers[this.herbieIndex].x,
      y: this.hikers[this.herbieIndex].y,
    };
  }
  
  // Check if Herbie is on ground (collision detection)
  isHerbieOnGround(terrain) {
    const herbie = this.hikers[this.herbieIndex];
    return terrain.isOnGround(herbie.x, herbie.y);
  }
}
