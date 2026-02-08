// Audio System - Web Audio API for generative music

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    
    // Oscillators for ambient drone
    this.ambientOsc = null;
    this.ambientGain = null;
    
    // Flow harmonics
    this.harmonicOscs = [];
    this.harmonicGains = [];
    
    this.masterGain = null;
  }
  
  // Initialize on first user interaction (browser policy)
  async init() {
    if (this.initialized) return;
    
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
      
      // Create ambient drone (low continuous tone)
      this.createAmbientDrone();
      
      // Create harmonic oscillators
      this.createHarmonics();
      
      this.initialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }
  
  createAmbientDrone() {
    // Low sine wave drone
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.value = 110; // A2
    
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.15;
    
    // Add gentle filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;
    
    this.ambientOsc.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    
    this.ambientOsc.start();
  }
  
  createHarmonics() {
    // Create 3 harmonic oscillators for flow feedback
    const frequencies = [220, 330, 440]; // A3, E4, A4 (major intervals)
    
    frequencies.forEach(freq => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const gain = this.ctx.createGain();
      gain.gain.value = 0; // Start silent
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      
      this.harmonicOscs.push(osc);
      this.harmonicGains.push(gain);
    });
  }
  
  // Update audio based on flow multiplier
  updateFlow(flowMultiplier) {
    if (!this.initialized) return;
    
    const now = this.ctx.currentTime;
    
    // Fade in harmonics as flow increases
    this.harmonicGains.forEach((gain, index) => {
      let targetGain = 0;
      
      if (flowMultiplier > 1.5) {
        // Optimal flow: bright major-interval harmonics
        targetGain = Math.min(0.1, (flowMultiplier - 1.5) * 0.05);
      } else if (flowMultiplier < 1.2) {
        // Low flow: add a subtle lower tone
        if (index === 0) {
          targetGain = 0.05;
        }
      }
      
      // Smooth ramp to avoid clicks
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(targetGain, now + 0.5);
    });
  }
  
  // Play tap feedback sound
  playTap() {
    if (!this.initialized) return;
    
    const now = this.ctx.currentTime;
    
    // Short pluck sound
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 880; // A5
    
    const gain = this.ctx.createGain();
    gain.gain.value = 0.2;
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }
  
  // Play failure sound
  playFailure() {
    if (!this.initialized) return;
    
    const now = this.ctx.currentTime;
    
    // Gentle descending tone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.5); // Down to A3
    
    const gain = this.ctx.createGain();
    gain.gain.value = 0.15;
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }
  
  // Stop all audio
  stop() {
    if (!this.initialized) return;
    
    if (this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc = null;
    }
    
    this.harmonicOscs.forEach(osc => {
      osc.stop();
    });
    this.harmonicOscs = [];
    this.harmonicGains = [];
  }
}
