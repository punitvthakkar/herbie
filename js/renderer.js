// Renderer - All canvas drawing (procedural geometry)

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.tapFeedback = []; // Array of tap feedback animations
  }
  
  updateCanvasSize(width, height) {
    this.width = width;
    this.height = height;
  }
  
  render(state, palette) {
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Save context
    ctx.save();
    
    // 1. Draw sky with flow-based hue shift
    this.drawSky(palette, state.flowMultiplier);
    
    // 2. Draw parallax layers (far background)
    this.drawFarParallax(state.terrain, palette);
    
    // 3. Draw mid parallax
    this.drawMidParallax(state.terrain, palette);
    
    // 4. Translate for camera
    ctx.save();
    ctx.translate(-state.terrain.cameraX, 0);
    
    // 5. Draw foreground terrain
    this.drawTerrain(state.terrain, palette);
    
    // 6. Draw obstacles
    this.drawObstacles(state.obstacles, palette);
    
    // 7. Draw tension lines between hikers
    this.drawTensionLines(state.hikers, palette);
    
    // 8. Draw hikers
    this.drawHikers(state.hikers, palette);
    
    // 9. Draw tap feedback
    this.drawTapFeedback(ctx);
    
    ctx.restore();
    
    // 10. Draw bloom effect when flow is optimal
    if (state.flowMultiplier > 2.0) {
      this.drawBloom(palette, state.flowMultiplier);
    }
    
    // 11. Draw fog fade at bottom
    this.drawFog(palette);
    
    ctx.restore();
  }
  
  drawSky(palette, flowMultiplier) {
    const ctx = this.ctx;
    const sky = palette.getSkyGradient();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, sky.top);
    gradient.addColorStop(1, sky.bottom);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }
  
  drawFarParallax(terrain, palette) {
    const ctx = this.ctx;
    const elements = terrain.getVisibleFar();
    const parallaxOffset = terrain.cameraX * 0.3; // Slower scroll
    
    ctx.save();
    ctx.translate(-parallaxOffset, 0);
    ctx.globalAlpha = 0.4;
    
    elements.forEach(el => {
      ctx.fillStyle = palette.terrain.far;
      
      switch (el.type) {
        case 'tower':
          this.drawTower(ctx, el.x, el.y, el.width, el.height);
          break;
        case 'arch':
          this.drawArch(ctx, el.x, el.y, el.width, el.height);
          break;
        case 'ring':
          this.drawRing(ctx, el.x, el.y, el.width);
          break;
      }
    });
    
    ctx.restore();
  }
  
  drawMidParallax(terrain, palette) {
    const ctx = this.ctx;
    const elements = terrain.getVisibleMid();
    const parallaxOffset = terrain.cameraX * 0.6; // Medium scroll
    
    ctx.save();
    ctx.translate(-parallaxOffset, 0);
    ctx.globalAlpha = 0.6;
    
    elements.forEach(el => {
      ctx.fillStyle = palette.terrain.mid;
      
      switch (el.type) {
        case 'bridge':
          this.drawBridge(ctx, el.x, el.y, el.width, el.height);
          break;
        case 'stairs':
          this.drawStairs(ctx, el.x, el.y, el.width, el.height);
          break;
        case 'platform':
          this.drawIsometricPlatform(ctx, el.x, el.y, el.width, el.height, palette.terrain.mid);
          break;
      }
    });
    
    ctx.restore();
  }
  
  drawTerrain(terrain, palette) {
    const ctx = this.ctx;
    const segments = terrain.getVisibleSegments();
    
    segments.forEach(seg => {
      if (!seg.hasGap) {
        // Draw isometric platform with highlight edge
        ctx.fillStyle = palette.terrain.foreground;
        ctx.fillRect(seg.x, seg.y, seg.width, seg.height);
        
        // Highlight edge
        ctx.strokeStyle = palette.terrain.foregroundHighlight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(seg.x, seg.y);
        ctx.lineTo(seg.x + seg.width, seg.y);
        ctx.stroke();
      }
    });
  }
  
  drawObstacles(obstacleSystem, palette) {
    const ctx = this.ctx;
    const obstacles = obstacleSystem.obstacles;
    
    obstacles.forEach(obs => {
      if (obs.cleared) return;
      
      const alpha = obs.clearing ? 1 - obs.clearProgress : 1;
      ctx.globalAlpha = alpha;
      
      // Interactable glow pulse
      const glowIntensity = 0.5 + Math.sin(obs.glowPhase) * 0.3;
      
      switch (obs.type) {
        case 'gap':
          if (obs.clearing) {
            // Draw extending bridge
            ctx.fillStyle = palette.obstacles.glow;
            const bridgeWidth = obs.width * obs.clearProgress;
            ctx.fillRect(obs.x, obs.y - 5, bridgeWidth, 10);
          }
          break;
          
        case 'wall':
          ctx.shadowBlur = 12 * glowIntensity;
          ctx.shadowColor = palette.obstacles.glow;
          ctx.fillStyle = palette.obstacles.wall;
          
          if (obs.clearing) {
            // Crumble effect
            const scale = 1 - obs.clearProgress;
            ctx.save();
            ctx.translate(obs.x + obs.width / 2, obs.y - obs.height / 2);
            ctx.scale(scale, scale);
            ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
            ctx.restore();
          } else {
            ctx.fillRect(obs.x, obs.y - obs.height, obs.width, obs.height);
          }
          
          ctx.shadowBlur = 0;
          break;
          
        case 'platform':
          ctx.shadowBlur = 12 * glowIntensity;
          ctx.shadowColor = palette.obstacles.glow;
          ctx.fillStyle = palette.obstacles.platform;
          
          const yOffset = obs.clearing ? obs.height * obs.clearProgress : 0;
          ctx.fillRect(obs.x, obs.y - obs.height + yOffset, obs.width, obs.height);
          
          ctx.shadowBlur = 0;
          break;
          
        case 'barrier':
          ctx.shadowBlur = 14 * glowIntensity;
          ctx.shadowColor = palette.obstacles.glow;
          ctx.fillStyle = palette.obstacles.wall;
          
          if (obs.clearing) {
            // Fade and shrink effect
            const scale = 1 - obs.clearProgress;
            ctx.save();
            ctx.translate(obs.x + obs.width / 2, obs.y - obs.height / 2);
            ctx.scale(1, scale);
            ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
            ctx.restore();
          } else {
            // Draw vertical barrier with stripes for visibility
            ctx.fillRect(obs.x, obs.y - obs.height, obs.width, obs.height);
            
            // Add stripes for better visibility
            ctx.fillStyle = palette.obstacles.glow;
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 3; i++) {
              const stripeY = obs.y - obs.height + (obs.height / 4) * (i + 0.5);
              ctx.fillRect(obs.x, stripeY - 2, obs.width, 4);
            }
            ctx.globalAlpha = alpha;
          }
          
          ctx.shadowBlur = 0;
          break;
      }
      
      ctx.globalAlpha = 1;
    });
  }
  
  drawHikers(hikerSystem, palette) {
    const ctx = this.ctx;
    
    hikerSystem.hikers.forEach((hiker, index) => {
      const x = hiker.x + hiker.swayOffset;
      const y = hiker.y + hiker.bobOffset;
      const color = palette.hikers[index];
      
      // Extra visual indicator for Herbie (the constraint)
      if (index === 0) {
        // Ground glow to anchor Herbie
        const glow = ctx.createRadialGradient(x, y + 6, 0, x, y + 6, hiker.size * 1.6);
        glow.addColorStop(0, palette.hsla(palette.baseHue - 5, 80, 70, 0.4));
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y + 6, hiker.size * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Draw a subtle ring around Herbie
        ctx.strokeStyle = palette.hsla(palette.baseHue - 10, 80, 70, 0.4);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y - hiker.size / 2, hiker.size * 1.3, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Glow for Herbie
      if (index === 0) {
        ctx.shadowBlur = hiker.glowRadius;
        ctx.shadowColor = color;
      } else if (hiker.isWaiting) {
        // Subtle glow when waiting
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
      } else if (hiker.pulseTime > 0) {
        ctx.shadowBlur = Math.min(16, 10 + hiker.pulseTime * 6);
        ctx.shadowColor = color;
      }
      
      // Create gradient fill for more depth
      const gradient = ctx.createRadialGradient(
        x, y - hiker.size / 2, 0,
        x, y - hiker.size / 2, hiker.size
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.darkenColor(color, 20));
      
      // Draw hiker as iconic silhouette
      ctx.fillStyle = gradient;
      
      // Head
      ctx.beginPath();
      ctx.arc(x, y - hiker.size, hiker.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      // Body (rounded rectangle)
      ctx.fillStyle = gradient;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(
          x - hiker.size * 0.35, 
          y - hiker.size * 0.7, 
          hiker.size * 0.7, 
          hiker.size * 0.7, 
          hiker.size * 0.2
        );
        ctx.fill();
      } else {
        // Fallback to simple rectangle
        ctx.fillRect(
          x - hiker.size * 0.35, 
          y - hiker.size * 0.7, 
          hiker.size * 0.7, 
          hiker.size * 0.7
        );
      }
      
      ctx.shadowBlur = 0;

      if (index === 0 && hikerSystem.herbieLabelTime > 0) {
        this.drawHerbieLabel(ctx, x, y - hiker.size * 1.6, hikerSystem.herbieLabelTime);
      }
    });
  }
  
  darkenColor(color, percent) {
    // Simple color darkening for gradient
    return color.replace(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/, (match, h, s, l) => {
      const newL = Math.max(0, parseInt(l) - percent);
      return `hsl(${h}, ${s}%, ${newL}%)`;
    });
  }
  
  drawTensionLines(hikerSystem, palette) {
    const ctx = this.ctx;
    const lines = hikerSystem.getTensionLines();
    
    lines.forEach(line => {
      const alpha = Math.min(0.5, line.tension);
      ctx.strokeStyle = palette.hsla(palette.baseHue, 60, 70, alpha);
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(line.from.x, line.from.y);
      ctx.lineTo(line.to.x, line.to.y);
      ctx.stroke();
      
      ctx.setLineDash([]);
    });
  }

  drawHerbieLabel(ctx, x, y, timeLeft) {
    const alpha = Math.min(1, timeLeft / 2);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    const paddingX = 10;
    const paddingY = 6;
    const text = 'Herbie';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    const textWidth = ctx.measureText(text).width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = 22;
    ctx.beginPath();
    ctx.roundRect(x - boxWidth / 2, y - boxHeight, boxWidth, boxHeight, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - boxHeight / 2);
    ctx.restore();
  }
  
  drawBloom(palette, flowMultiplier) {
    const ctx = this.ctx;
    const intensity = Math.min(0.15, (flowMultiplier - 2.0) * 0.08);
    
    // Draw a subtle radial bloom from center
    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, this.width * 0.8
    );
    gradient.addColorStop(0, palette.hsla(palette.baseHue, 80, 70, intensity));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  
  drawFog(palette) {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, this.height - 100, 0, this.height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, this.height - 100, this.width, 100);
  }
  
  drawTapFeedback(ctx) {
    this.tapFeedback = this.tapFeedback.filter(tap => tap.progress < 1);
    
    this.tapFeedback.forEach(tap => {
      const radius = 20 + tap.progress * 30;
      const alpha = 1 - tap.progress;
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tap.x, tap.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      tap.progress += 0.05;
    });
  }
  
  addTapFeedback(worldX, worldY, cameraX) {
    this.tapFeedback.push({
      x: worldX - cameraX,
      y: worldY,
      progress: 0,
    });
  }
  
  // Helper methods for drawing parallax elements
  drawTower(ctx, x, y, width, height) {
    // Simple tower shape
    ctx.fillRect(x + width * 0.3, y, width * 0.4, height);
    ctx.fillRect(x, y + height * 0.3, width, height * 0.2);
  }
  
  drawArch(ctx, x, y, width, height) {
    // Simple arch shape
    ctx.fillRect(x, y + height * 0.3, width * 0.2, height * 0.7);
    ctx.fillRect(x + width * 0.8, y + height * 0.3, width * 0.2, height * 0.7);
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height * 0.5, width * 0.3, 0, Math.PI, true);
    ctx.fill();
  }
  
  drawRing(ctx, x, y, width) {
    // Simple ring shape
    ctx.beginPath();
    ctx.arc(x + width / 2, y + width / 2, width / 2, 0, Math.PI * 2);
    ctx.lineWidth = width * 0.1;
    ctx.stroke();
  }
  
  drawBridge(ctx, x, y, width, height) {
    // Simple bridge shape
    ctx.fillRect(x, y + height * 0.8, width, height * 0.2);
    ctx.fillRect(x, y, width * 0.1, height * 0.8);
    ctx.fillRect(x + width * 0.9, y, width * 0.1, height * 0.8);
  }
  
  drawStairs(ctx, x, y, width, height) {
    // Simple stairs shape
    const steps = 4;
    const stepHeight = height / steps;
    const stepWidth = width / steps;
    
    for (let i = 0; i < steps; i++) {
      ctx.fillRect(x + i * stepWidth, y + height - (i + 1) * stepHeight, 
                   stepWidth, (i + 1) * stepHeight);
    }
  }
  
  drawIsometricPlatform(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }
}
