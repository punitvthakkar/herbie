// Palette System - Procedural color generation

class Palette {
  constructor(name, baseHue) {
    this.name = name;
    this.baseHue = baseHue;
    this.flowShift = 0; // Hue shift based on flow (+5 degrees at optimal flow)
    
    this.generateColors();
  }
  
  generateColors() {
    // Generate 3 hues: base, base + 20, base - 30
    const hue1 = this.baseHue;
    const hue2 = (this.baseHue + 20) % 360;
    const hue3 = (this.baseHue - 30 + 360) % 360;
    
    // 2 tints per hue (light + dark)
    this.colors = {
      hue1Light: this.hsl(hue1, 70, 75),
      hue1Dark: this.hsl(hue1, 60, 45),
      hue2Light: this.hsl(hue2, 65, 70),
      hue2Dark: this.hsl(hue2, 55, 40),
      hue3Light: this.hsl(hue3, 60, 65),
      hue3Dark: this.hsl(hue3, 50, 35),
    };
    
    // Sky gradient (top darker, bottom lighter)
    this.sky = {
      top: this.hsl(hue1, 50, 35),
      bottom: this.hsl(hue1, 60, 65),
    };
    
    // Hiker colors (5 shades, Herbie = warmest)
    this.hikers = [
      this.hsl((hue1 - 10 + 360) % 360, 75, 60), // Herbie - warmest
      this.hsl(hue1, 70, 58),
      this.hsl((hue1 + 5) % 360, 65, 56),
      this.hsl((hue1 + 10) % 360, 60, 54),
      this.hsl((hue1 + 15) % 360, 55, 52), // Fastest - coolest
    ];
    
    // Obstacle colors
    this.obstacles = {
      gap: this.hsl(hue3, 40, 30),
      wall: this.hsl(hue2, 50, 40),
      platform: this.hsl(hue1, 55, 45),
      glow: this.hsl(hue1, 80, 70),
    };
    
    // Terrain colors
    this.terrain = {
      foreground: this.hsl(hue2, 45, 50),
      foregroundHighlight: this.hsl(hue2, 50, 60),
      mid: this.hsl(hue2, 40, 45),
      far: this.hsl(hue3, 35, 40),
    };
    
    // UI colors
    this.ui = {
      text: 'rgba(255, 255, 255, 0.95)',
      textDim: 'rgba(255, 255, 255, 0.7)',
      overlay: 'rgba(0, 0, 0, 0.3)',
    };
  }
  
  // Apply flow shift to colors (called when flow changes)
  setFlowShift(flowMultiplier) {
    // Shift hue by +5 degrees when flow is optimal (2.0+)
    this.flowShift = Math.min(5, (flowMultiplier - 1.0) * 5);
    this.generateColors();
  }
  
  // Get sky gradient with flow shift applied
  getSkyGradient() {
    const shift = this.flowShift;
    return {
      top: this.hsl((this.baseHue + shift) % 360, 50, 35),
      bottom: this.hsl((this.baseHue + shift) % 360, 60, 65),
    };
  }
  
  // HSL to CSS string helper
  hsl(h, s, l) {
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  
  // HSL with alpha
  hsla(h, s, l, a) {
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  }
}

// Palette presets
export const PALETTES = {
  dawn: new Palette('dawn', 30),     // Warm peach/coral
  sunset: new Palette('sunset', 270), // Deep purple/magenta
};

export function getPalette(name) {
  return PALETTES[name] || PALETTES.sunset;
}
