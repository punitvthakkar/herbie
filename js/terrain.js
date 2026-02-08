// Terrain System - Procedural endless terrain generation

export class Terrain {
  constructor() {
    this.cameraX = 0;
    this.scrollSpeed = 80; // pixels per second (reduced for better pacing)
    
    // Platform segments for foreground (walkable surface)
    this.segments = [];
    this.segmentWidth = 150;
    this.baseY = 0.7; // 70% down the screen (low horizon)
    
    // Parallax layers (decorative)
    this.farLayer = [];
    this.midLayer = [];
    
    // Generation state
    this.nextSegmentX = 0;
    this.nextFarX = 0;
    this.nextMidX = 0;
    
    this.canvasWidth = 800;
    this.canvasHeight = 600;
  }
  
  init(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.baseY = canvasHeight * 0.7;
    this.cameraX = 0;
    this.segments = [];
    this.farLayer = [];
    this.midLayer = [];
    this.nextSegmentX = 0;
    this.nextFarX = 0;
    this.nextMidX = 0;
    
    // Generate initial segments
    for (let i = 0; i < 10; i++) {
      this.generateSegment();
    }
    
    // Generate initial parallax elements
    this.generateFarElement();
    this.generateMidElement();
  }
  
  update(deltaTime, distance, herbieX = null) {
    if (herbieX !== null) {
      const targetX = Math.max(0, herbieX - this.canvasWidth * 0.3);
      this.cameraX += (targetX - this.cameraX) * Math.min(1, deltaTime * 4);
    } else {
      this.cameraX += this.scrollSpeed * deltaTime;
    }
    
    // Generate new segments as camera advances
    const rightEdge = this.cameraX + this.canvasWidth + 200;
    
    while (this.nextSegmentX < rightEdge) {
      this.generateSegment();
    }
    
    while (this.nextFarX < rightEdge) {
      this.generateFarElement();
    }
    
    while (this.nextMidX < rightEdge) {
      this.generateMidElement();
    }
    
    // Recycle segments that are off-screen
    this.segments = this.segments.filter(seg => seg.x + seg.width > this.cameraX - 100);
    this.farLayer = this.farLayer.filter(el => el.x + el.width > this.cameraX - 200);
    this.midLayer = this.midLayer.filter(el => el.x + el.width > this.cameraX - 200);
  }
  
  generateSegment() {
    const segment = {
      x: this.nextSegmentX,
      y: this.baseY,
      width: this.segmentWidth,
      height: 20,
      hasGap: false, // Will be set by obstacles
    };
    
    this.segments.push(segment);
    this.nextSegmentX += this.segmentWidth;
  }
  
  generateFarElement() {
    // Large isometric shapes: towers, arches, rings
    const types = ['tower', 'arch', 'ring'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const element = {
      type,
      x: this.nextFarX,
      y: this.baseY - 200,
      width: 100 + Math.random() * 100,
      height: 150 + Math.random() * 150,
    };
    
    this.farLayer.push(element);
    this.nextFarX += 400 + Math.random() * 400; // Sparse placement
  }
  
  generateMidElement() {
    // Impossible geometry: bridges, stairways
    const types = ['bridge', 'stairs', 'platform'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const element = {
      type,
      x: this.nextMidX,
      y: this.baseY - 100 - Math.random() * 100,
      width: 80 + Math.random() * 80,
      height: 60 + Math.random() * 60,
    };
    
    this.midLayer.push(element);
    this.nextMidX += 250 + Math.random() * 250;
  }
  
  // Get Y position for a given X coordinate (for hiker placement)
  getYAtX(x) {
    const segment = this.segments.find(seg => x >= seg.x && x < seg.x + seg.width);
    if (segment && !segment.hasGap) {
      return segment.y;
    }
    return null; // Gap or no surface
  }
  
  // Check if position is on solid ground
  isOnGround(x, y) {
    const segment = this.segments.find(seg => x >= seg.x && x < seg.x + seg.width);
    if (!segment || segment.hasGap) {
      return false;
    }
    return Math.abs(y - segment.y) < 5;
  }
  
  // Get all segments in view (for rendering)
  getVisibleSegments() {
    const leftEdge = this.cameraX - 100;
    const rightEdge = this.cameraX + this.canvasWidth + 100;
    return this.segments.filter(seg => seg.x < rightEdge && seg.x + seg.width > leftEdge);
  }
  
  getVisibleFar() {
    const leftEdge = this.cameraX - 200;
    const rightEdge = this.cameraX + this.canvasWidth + 200;
    return this.farLayer.filter(el => el.x < rightEdge && el.x + el.width > leftEdge);
  }
  
  getVisibleMid() {
    const leftEdge = this.cameraX - 200;
    const rightEdge = this.cameraX + this.canvasWidth + 200;
    return this.midLayer.filter(el => el.x < rightEdge && el.x + el.width > leftEdge);
  }
}
