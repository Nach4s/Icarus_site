// ─── TOXIC BARRELS & POISON GAS CLOUDS (FOG OF WAR) ───────────
let toxicBarrels = [];
let toxicBarrelTimer = 0;
let nextToxicBarrelInterval = 0;
let toxicClouds = [];
let rocketFogTransition = 0; // Smooth 0..1 transition for entering/exiting fog

function getToxicBarrelInterval(isGreen = isGreenZoneTheme()) {
  if (isGreen) {
    // Green Zone (Изумрудная туманность): frequent timer every 14–22 seconds
    return 14 + Math.random() * 8;
  }
  // Other biomes: rare random timer every 50–80 seconds
  return 50 + Math.random() * 30;
}

function isPointInToxicCloud(x, y) {
  if (toxicClouds.length === 0) return false;
  for (let i = 0; i < toxicClouds.length; i++) {
    const c = toxicClouds[i];
    if (c.alpha <= 0.05) continue;
    const dx = x - c.x;
    const dy = y - c.y;
    if (dx * dx + dy * dy <= c.r * c.r) {
      return true;
    }
  }
  return false;
}

function isRocketInFog() {
  if (!rocket || !rocket.alive) return false;
  return rocketFogTransition > 0.003;
}

function getObstacleFogAlpha(ob) {
  if (toxicClouds.length === 0) {
    ob.fogAlpha = ob.fogAlpha !== undefined ? ob.fogAlpha + (1.0 - ob.fogAlpha) * 0.25 : 1.0;
    if (ob.fogAlpha > 0.99) ob.fogAlpha = 1.0;
    return ob.fogAlpha;
  }

  // 1. Calculate how deep the obstacle is inside toxic clouds, scaled by cloud opacity (dissipation)
  let maxCloudFog = 0;
  for (let i = 0; i < toxicClouds.length; i++) {
    const c = toxicClouds[i];
    if (c.alpha <= 0.01) continue;
    const distToC = Math.hypot(ob.x - c.x, ob.y - c.y);
    const penetration = (c.r - distToC);
    let spatialFactor = 0;
    if (penetration > 35) {
      spatialFactor = 1.0;
    } else if (penetration > -45) {
      // Smooth feathering across cloud boundary [-45px outside, +35px inside]
      spatialFactor = (penetration + 45) / 80;
    }
    // Scale spatial obstruction by the cloud's current alpha (dissipation progress!)
    const cloudFog = spatialFactor * Math.max(0, Math.min(1, c.alpha));
    maxCloudFog = Math.max(maxCloudFog, cloudFog);
  }

  // Completely outside any cloud or cloud completely dissipated: smooth transition to 1.0
  if (maxCloudFog <= 0.005) {
    ob.fogAlpha = ob.fogAlpha !== undefined ? ob.fogAlpha + (1.0 - ob.fogAlpha) * 0.35 : 1.0;
    return ob.fogAlpha;
  }

  // 2. Calculate player reveal factor (circular deflector vision bubble, R = 165px)
  let playerReveal = 0;
  if (rocket && rocket.alive && rocketFogTransition > 0.003) {
    const rdx = ob.x - rocket.x;
    const rdy = ob.y - rocket.y;
    const distR = Math.hypot(rdx, rdy);
    const R_BASE_VISION = 195;
    const t = Math.max(0, Math.min(1, rocketFogTransition));
    const ease = t * t * (3 - 2 * t);
    const curVisionR = R_BASE_VISION * (0.85 + 0.15 * ease);
    const obR = ob.r || 16;

    // Organic vision zone reveal around rocket with wide soft feathering
    if (distR <= curVisionR + obR + 40) {
      const circleFactor = (curVisionR + obR + 40 - distR) / 65;
      playerReveal = Math.max(playerReveal, Math.min(1.0, Math.max(0, circleFactor)) * ease);
    }
  }

  // 3. Final target alpha: outside/dissipated fog is 1.0; inside fog is smoothly revealed by vision bubble
  const targetAlpha = (1.0 - maxCloudFog) + maxCloudFog * playerReveal;

  // Smooth lerp to prevent abrupt visual popping
  if (ob.fogAlpha === undefined) {
    ob.fogAlpha = targetAlpha;
  } else {
    // Faster responsive lerp when cloud is dissipating so it tracks dissipation closely
    const lerpRate = maxCloudFog < 0.8 ? 0.35 : 0.22;
    ob.fogAlpha += (targetAlpha - ob.fogAlpha) * lerpRate;
  }

  return ob.fogAlpha;
}

function isObstacleVisibleInFog(ob) {
  return getObstacleFogAlpha(ob) > 0.02;
}

function spawnToxicBarrel(w, h) {
  const edge = Math.floor(Math.random() * 4);
  const margin = 28;
  let sx, sy;
  switch (edge) {
    case 0: sx = Math.random() * w; sy = -margin; break;
    case 1: sx = w + margin; sy = Math.random() * h; break;
    case 2: sx = Math.random() * w; sy = h + margin; break;
    case 3: sx = -margin; sy = Math.random() * h; break;
  }
  const tx = w * (0.15 + Math.random() * 0.70);
  const ty = h * (0.15 + Math.random() * 0.70);
  const dx = tx - sx, dy = ty - sy;
  const dist = Math.hypot(dx, dy) || 1;
  const speed = 45 + Math.random() * 35; // gentle space drift
  toxicBarrels.push({
    x: sx,
    y: sy,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    r: 16,
    angle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 1.5,
    pulsePhase: Math.random() * 10,
    alive: true,
  });
}

function detonateToxicBarrel(b) {
  if (!b.alive) return;
  b.alive = false;

  playSfxToxicBurst();

  const w = (canvas && canvas.width) ? canvas.width : window.innerWidth;
  // Radius R_cloud ≈ 30–35% of screen width (one third of map)
  const maxR = w * (0.30 + Math.random() * 0.05);
  // Lifetime: random 5 to 10 seconds, then smoothly dissipates
  const duration = 5 + Math.random() * 5;

  // Expanding shockwave ring
  addParticle({
    x: b.x, y: b.y,
    vx: 0, vy: 0,
    life: 0.5, maxLife: 0.5,
    size: b.r, maxSize: b.r * 5,
    color: '#22c55e',
    type: 'ring', grav: 0,
  });

  // Green chemical spark burst
  for (let i = 0; i < 20; i++) {
    const a = (Math.PI * 2 / 20) * i + Math.random() * 0.2;
    const spd = 60 + Math.random() * 110;
    const col = ['#22c55e', '#86efac', '#15803d', '#a7f3d0', '#ffffff'][i % 5];
    addParticle({
      x: b.x, y: b.y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      life: 0.35 + Math.random() * 0.35,
      maxLife: 0.7,
      size: 3.2, maxSize: 0.6,
      color: col,
      type: 'dot', grav: 0,
    });
  }

  // Floating text
  spawnFloatingText(b.x, b.y - 18, '☣ TOXIC BURST!', '#4ade80');

  // Spawn poisonous gas cloud
  spawnToxicCloud(b.x, b.y, maxR, duration);
}

function updateToxicBarrels(dt, w, h) {
  for (let i = toxicBarrels.length - 1; i >= 0; i--) {
    const b = toxicBarrels[i];
    
    // Black hole capture check
    if (typeof blackHoles !== 'undefined' && blackHoles.length > 0 && !b.capturedByBH) {
      for (let bh = 0; bh < blackHoles.length; bh++) {
        const bhObj = blackHoles[bh];
        const dx = bhObj.x - b.x;
        const dy = bhObj.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bhObj.pullR * 0.6) {
          b.capturedByBH = bhObj;
          b.orbitAngle = Math.atan2(dy, dx);
          b.orbitRadius = dist;
          b.orbitSpeed = 0.8;
          b.orbitDirection = 1;
          b.orbitTime = 0;
          break;
        }
      }
    }
    
    // If captured by black hole, orbit around it
    if (b.capturedByBH) {
      const bh = b.capturedByBH;
      b.orbitTime = (b.orbitTime || 0) + dt;
      b.orbitSpeed = (b.orbitSpeed || 0.8) + (0.3 + b.orbitTime * 0.1) * dt;
      b.orbitSpeed = Math.min(b.orbitSpeed, 3.5);
      b.orbitRadius = (b.orbitRadius || 0) + (8 + b.orbitSpeed * 2) * dt;
      b.orbitRadius = Math.min(b.orbitRadius, bh.pullR * 0.8);
      
      b.orbitAngle = (b.orbitAngle || 0) + b.orbitSpeed * (b.orbitDirection || 1) * dt;
      b.x = bh.x + Math.cos(b.orbitAngle) * b.orbitRadius;
      b.y = bh.y + Math.sin(b.orbitAngle) * b.orbitRadius;
      b.vx = 0;
      b.vy = 0;
      b.angle += b.orbitSpeed * dt * 1.5;
      
      // Check if barrel is pulled into singularity core
      const coreDist = Math.sqrt((b.x - bh.x) ** 2 + (b.y - bh.y) ** 2);
      if (coreDist < bh.r * 1.5) {
        // Barrel is consumed by black hole
        toxicBarrels.splice(i, 1);
        continue;
      }
      
      continue; // Skip normal movement
    }
    
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.angle += b.rotSpeed * dt;
    b.pulsePhase += dt * 3;

    // Remove if far out of bounds
    if (b.x < -120 || b.x > w + 120 || b.y < -120 || b.y > h + 120) {
      toxicBarrels.splice(i, 1);
      continue;
    }

    // Touch with player rocket
    if (rocket && rocket.alive) {
      const distR = Math.hypot(rocket.x - b.x, rocket.y - b.y);
      if (distR < b.r + 14) {
        detonateToxicBarrel(b);
        toxicBarrels.splice(i, 1);
        continue;
      }
    }

    // Touch with obstacles (asteroids or comets)
    let hitObstacle = false;
    for (let j = 0; j < obstacles.length; j++) {
      const ob = obstacles[j];
      const distOb = Math.hypot(ob.x - b.x, ob.y - b.y);
      if (distOb < b.r + ob.r) {
        detonateToxicBarrel(b);
        toxicBarrels.splice(i, 1);
        hitObstacle = true;
        break;
      }
    }
    if (hitObstacle) continue;

    // Touch with enemies (pirates)
    let hitPirate = false;
    for (let p = 0; p < pirates.length; p++) {
      const pr = pirates[p];
      if (!pr.alive) continue;
      const distP = Math.hypot(pr.x - b.x, pr.y - b.y);
      if (distP < b.r + pr.r) {
        detonateToxicBarrel(b);
        toxicBarrels.splice(i, 1);
        hitPirate = true;
        break;
      }
    }
    if (hitPirate) continue;

    // Touch with comet danger zones
    if (dangerZones.length > 0) {
      let hitZone = false;
      for (let z = 0; z < dangerZones.length; z++) {
        const dz = dangerZones[z];
        if (Math.hypot(dz.x - b.x, dz.y - b.y) < dz.r + b.r) {
          detonateToxicBarrel(b);
          toxicBarrels.splice(i, 1);
          hitZone = true;
          break;
        }
      }
      if (hitZone) continue;
    }

    // Touch with active firing Solar Flare beams
    if (typeof solarFlares !== 'undefined' && solarFlares.length > 0) {
      let hitFlare = false;
      for (let f = 0; f < solarFlares.length; f++) {
        const fl = solarFlares[f];
        if (fl.state !== 'FIRING') continue;
        const bPos = fl.axis === 'H' ? b.y : b.x;
        if (Math.abs(bPos - fl.pos) < fl.beamWidth * 0.5 + b.r * 0.8) {
          detonateToxicBarrel(b);
          toxicBarrels.splice(i, 1);
          hitFlare = true;
          break;
        }
      }
      if (hitFlare) continue;
    }

    // Touch with Pirate Mothership or its firing cannon beam
    if (typeof pirateMothership !== 'undefined' && pirateMothership) {
      const pm = pirateMothership;
      // Hull collision
      if (Math.hypot(pm.x - b.x, pm.y - b.y) < pm.r + b.r) {
        detonateToxicBarrel(b);
        toxicBarrels.splice(i, 1);
        continue;
      }
      // Firing laser beam collision
      if (pm.cannonState === 'FIRING') {
        const mdx = b.x - pm.cannonMuzzleX;
        const mdy = b.y - pm.cannonMuzzleY;
        const dot = mdx * Math.cos(pm.beamAngle) + mdy * Math.sin(pm.beamAngle);
        if (dot > 0 && dot < pm.beamLength) {
          const perp = Math.abs(-mdx * Math.sin(pm.beamAngle) + mdy * Math.cos(pm.beamAngle));
          if (perp < pm.beamWidth * 0.5 + b.r * 0.8) {
            detonateToxicBarrel(b);
            toxicBarrels.splice(i, 1);
            continue;
          }
        }
      }
    }

    // Occasional green radioactive drip wisp particle
    if (Math.random() < 0.10) {
      addParticle({
        x: b.x + (Math.random() - 0.5) * b.r,
        y: b.y + (Math.random() - 0.5) * b.r,
        vx: -b.vx * 0.2 + (Math.random() - 0.5) * 8,
        vy: -b.vy * 0.2 + (Math.random() - 0.5) * 8,
        life: 0.32, maxLife: 0.32,
        size: 2.2, maxSize: 0.5,
        color: '#4ade80',
        type: 'dot', grav: 0,
      });
    }
  }
}

function spawnToxicCloud(x, y, maxR, duration) {
  toxicClouds.push({
    x,
    y,
    r: 25,
    maxR: maxR,
    growthSpeed: (maxR - 25) / 0.75, // smooth natural expansion
    life: duration,
    maxLife: duration,
    alpha: 1.0,
    rotAngle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() < 0.5 ? 1 : -1) * (0.015 + Math.random() * 0.020),
  });
}

function updateToxicClouds(dt) {
  for (let i = toxicClouds.length - 1; i >= 0; i--) {
    const c = toxicClouds[i];
    c.life -= dt;
    if (c.life <= 0) {
      toxicClouds.splice(i, 1);
      continue;
    }

    // Expand to full size
    if (c.r < c.maxR) {
      c.r = Math.min(c.maxR, c.r + c.growthSpeed * dt);
    }

    // Swirling rotation
    c.rotAngle += c.rotSpeed * dt;

    // Smooth dissipation during the last 2 seconds
    const fadeDuration = 2.0;
    if (c.life < fadeDuration) {
      c.alpha = Math.max(0, c.life / fadeDuration);
    } else {
      c.alpha = 1.0;
    }
  }

  // Smooth rocket immersion transition into/out of toxic clouds
  let targetFog = 0;
  if (rocket && rocket.alive && toxicClouds.length > 0) {
    for (let i = 0; i < toxicClouds.length; i++) {
      const c = toxicClouds[i];
      if (c.alpha <= 0.01) continue;
      const dist = Math.hypot(rocket.x - c.x, rocket.y - c.y);
      const outerR = c.r + 65;
      const innerR = Math.max(10, c.r - 25);
      if (dist <= innerR) {
        targetFog = Math.max(targetFog, c.alpha);
      } else if (dist < outerR) {
        const norm = (outerR - dist) / (outerR - innerR);
        // Smooth cubic ease for spatial entry/exit
        const factor = norm * norm * (3 - 2 * norm);
        targetFog = Math.max(targetFog, factor * c.alpha);
      }
    }
  }

  // Entering: responsive ramp up (~0.25s). Exiting / dissipating: silky smooth gradual fade-out (~0.6s)
  const lerpSpeed = targetFog > rocketFogTransition ? 4.0 : 2.0;
  rocketFogTransition += (targetFog - rocketFogTransition) * Math.min(1, dt * lerpSpeed);
  if (targetFog === 0 && rocketFogTransition < 0.003) {
    rocketFogTransition = 0;
  }
}

function drawToxicBarrel(ctx, b) {
  const pulse = 0.8 + 0.2 * Math.sin(b.pulsePhase);

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle);

  // Toxic green neon aura
  const glow = ctx.createRadialGradient(0, 0, b.r * 0.4, 0, 0, b.r * 2.3);
  glow.addColorStop(0, `rgba(74, 222, 128, ${0.45 * pulse})`);
  glow.addColorStop(0.5, `rgba(34, 197, 94, ${0.18 * pulse})`);
  glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, b.r * 2.3, 0, Math.PI * 2);
  ctx.fill();

  const bw = b.r * 1.5; // ~24px width
  const bh = b.r * 2.1; // ~34px height

  // Metal barrel body
  const bodyGrd = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
  bodyGrd.addColorStop(0, '#0f291e');
  bodyGrd.addColorStop(0.25, '#166534');
  bodyGrd.addColorStop(0.5, '#22c55e');
  bodyGrd.addColorStop(0.75, '#15803d');
  bodyGrd.addColorStop(1, '#052e16');
  ctx.fillStyle = bodyGrd;
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 4);
  ctx.fill();

  // Dark metallic border
  ctx.strokeStyle = '#052e16';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // 3 Reinforcement ribs (top, middle, bottom)
  [-bh * 0.36, 0, bh * 0.36].forEach(yPos => {
    ctx.fillStyle = '#14532d';
    ctx.fillRect(-bw / 2 - 1, yPos - 1.5, bw + 2, 3);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-bw / 2 - 1, yPos - 1.5, bw + 2, 3);
  });

  // Yellow & black hazard stripes on top band
  const stripeH = 4;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-bw / 2 + 1, -bh / 2 + 2, bw - 2, stripeH);
  ctx.clip();
  for (let s = -bw; s < bw * 2; s += 6) {
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(s, -bh / 2 + 2);
    ctx.lineTo(s + 3, -bh / 2 + 2);
    ctx.lineTo(s + 3 - 3, -bh / 2 + 2 + stripeH);
    ctx.lineTo(s - 3, -bh / 2 + 2 + stripeH);
    ctx.fill();
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.moveTo(s + 3, -bh / 2 + 2);
    ctx.lineTo(s + 6, -bh / 2 + 2);
    ctx.lineTo(s + 6 - 3, -bh / 2 + 2 + stripeH);
    ctx.lineTo(s + 3 - 3, -bh / 2 + 2 + stripeH);
    ctx.fill();
  }
  ctx.restore();

  // Radioactive Trefoil Symbol ☣ in center
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#22c55e';
  ctx.shadowBlur = 8;
  ctx.font = `bold ${Math.round(b.r * 0.95)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☣', 0, 1);
  ctx.shadowBlur = 0;

  ctx.restore();
}

let toxicCloudSpriteCanvas = null;
let fogLayerCanvas = null;
let fogLayerCtx = null;

// Distinct, readable toxic gas cloud sprite generator (clean, billowy smoke - not galaxy, not liquid)
function initToxicCloudSprite() {
  const size = 512;
  toxicCloudSpriteCanvas = document.createElement('canvas');
  toxicCloudSpriteCanvas.width = size;
  toxicCloudSpriteCanvas.height = size;
  const sCtx = toxicCloudSpriteCanvas.getContext('2d');
  const cx = size / 2, cy = size / 2, maxR = size / 2 - 24;

  // 1. Soft toxic gas outer luminous halo (gives clear, visible contrast against dark space)
  const haloGrd = sCtx.createRadialGradient(cx, cy, maxR * 0.45, cx, cy, maxR);
  haloGrd.addColorStop(0,    'rgba(16, 185, 129, 0.32)');
  haloGrd.addColorStop(0.65, 'rgba(5, 150, 105, 0.18)');
  haloGrd.addColorStop(0.90, 'rgba(16, 185, 129, 0.06)');
  haloGrd.addColorStop(1,    'rgba(16, 185, 129, 0)');
  sCtx.fillStyle = haloGrd;
  sCtx.beginPath();
  sCtx.arc(cx, cy, maxR, 0, Math.PI * 2);
  sCtx.fill();

  // 2. Billowing toxic smoke puff clusters (gives clear, recognizable CLOUD silhouette)
  // 10 overlapping organic puffs arranged around center
  const smokePuffs = [
    // Outer perimeter puffs
    { dx:  0.00, dy: -0.42, r: 0.46, a: 0.58 },
    { dx:  0.36, dy: -0.25, r: 0.44, a: 0.55 },
    { dx:  0.44, dy:  0.15, r: 0.45, a: 0.56 },
    { dx:  0.18, dy:  0.42, r: 0.43, a: 0.52 },
    { dx: -0.22, dy:  0.44, r: 0.45, a: 0.55 },
    { dx: -0.45, dy:  0.14, r: 0.44, a: 0.53 },
    { dx: -0.38, dy: -0.26, r: 0.46, a: 0.58 },
    // Mid-inner volume puffs
    { dx: -0.15, dy: -0.12, r: 0.52, a: 0.68 },
    { dx:  0.16, dy: -0.08, r: 0.50, a: 0.65 },
    { dx:  0.02, dy:  0.16, r: 0.52, a: 0.67 },
  ];

  for (let i = 0; i < smokePuffs.length; i++) {
    const p = smokePuffs[i];
    const px = cx + p.dx * maxR;
    const py = cy + p.dy * maxR;
    const pr = p.r * maxR;

    const pGrd = sCtx.createRadialGradient(px, py, 0, px, py, pr);
    // Rich toxic emerald green with soft vapor edge
    pGrd.addColorStop(0,    `rgba(6, 95, 70, ${p.a})`);
    pGrd.addColorStop(0.40, `rgba(5, 150, 105, ${p.a * 0.85})`);
    pGrd.addColorStop(0.72, `rgba(16, 185, 129, ${p.a * 0.45})`);
    pGrd.addColorStop(0.92, `rgba(52, 211, 153, ${p.a * 0.15})`);
    pGrd.addColorStop(1,    'rgba(52, 211, 153, 0)');

    sCtx.fillStyle = pGrd;
    sCtx.beginPath();
    sCtx.arc(px, py, pr, 0, Math.PI * 2);
    sCtx.fill();
  }

  // 3. Central toxic gas density core
  const coreGrd = sCtx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.55);
  coreGrd.addColorStop(0,    'rgba(4, 120, 87, 0.75)');
  coreGrd.addColorStop(0.50, 'rgba(6, 95, 70, 0.50)');
  coreGrd.addColorStop(0.85, 'rgba(5, 150, 105, 0.18)');
  coreGrd.addColorStop(1,    'rgba(5, 150, 105, 0)');
  sCtx.fillStyle = coreGrd;
  sCtx.beginPath();
  sCtx.arc(cx, cy, maxR * 0.55, 0, Math.PI * 2);
  sCtx.fill();

  // 4. Iconic translucent Biohazard symbol ☣ in the center
  // Makes the cloud instantly recognizable as TOXIC GAS without doubt!
  sCtx.save();
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  sCtx.font = '900 100px "Segoe UI Symbol", "Apple Symbols", sans-serif';
  sCtx.fillStyle = 'rgba(167, 243, 208, 0.48)';
  sCtx.shadowColor = '#10b981';
  sCtx.shadowBlur = 18;
  sCtx.fillText('☣', cx, cy + 2);
  sCtx.restore();
}

function drawToxicClouds(ctx, scrW, scrH) {
  if (toxicClouds.length === 0) return;
  const w = scrW || (canvas ? canvas.width : window.innerWidth);
  const h = scrH || (canvas ? canvas.height : window.innerHeight);

  if (!toxicCloudSpriteCanvas) initToxicCloudSprite();

  if (!fogLayerCanvas) {
    fogLayerCanvas = document.createElement('canvas');
    fogLayerCtx = fogLayerCanvas.getContext('2d');
  }
  if (fogLayerCanvas.width !== w || fogLayerCanvas.height !== h) {
    fogLayerCanvas.width = w;
    fogLayerCanvas.height = h;
  }

  fogLayerCtx.clearRect(0, 0, w, h);
  const tNow = performance.now() / 1000;

  // 1. Draw each active toxic cloud onto fog buffer
  for (let i = 0; i < toxicClouds.length; i++) {
    const c = toxicClouds[i];
    if (!c || c.alpha <= 0.01 || c.r <= 0) continue;

    // Gentle breathing pulse
    const pulse = 0.96 + 0.04 * Math.sin(tNow * 2.2 + i);
    const drawR = c.r * pulse;

    fogLayerCtx.save();
    fogLayerCtx.translate(c.x, c.y);
    fogLayerCtx.rotate(c.rotAngle);
    // Clear, vibrant toxic gas opacity that clearly contrasts against dark space
    fogLayerCtx.globalAlpha = c.alpha * 0.88;
    fogLayerCtx.drawImage(toxicCloudSpriteCanvas, -drawR, -drawR, drawR * 2, drawR * 2);

    // Subtle drifting chemical micro-bubbles inside the cloud
    for (let b = 0; b < 5; b++) {
      const bSeed = b * 1.37 + i * 2.1;
      const bDist = c.r * (0.18 + 0.36 * Math.sin(bSeed * 3));
      const bAng = bSeed * 2.5 + tNow * 0.35;
      const bx = Math.cos(bAng) * bDist;
      const by = Math.sin(bAng) * bDist;
      const bRad = 3.2 + 1.2 * Math.sin(bSeed * 5);

      // Bubble green fill
      fogLayerCtx.fillStyle = 'rgba(110, 231, 183, 0.42)';
      fogLayerCtx.beginPath();
      fogLayerCtx.arc(bx, by, bRad, 0, Math.PI * 2);
      fogLayerCtx.fill();

      // Specular glint
      fogLayerCtx.fillStyle = 'rgba(255, 255, 255, 0.80)';
      fogLayerCtx.beginPath();
      fogLayerCtx.arc(bx - bRad * 0.3, by - bRad * 0.3, bRad * 0.35, 0, Math.PI * 2);
      fogLayerCtx.fill();
    }

    fogLayerCtx.restore();
  }

  // 2. Clear out smooth, clean vision dispersal zone around the rocket
  const R_BASE_VISION = 195; // Soft volumetric clearing radius
  if (rocket && rocket.alive && rocketFogTransition > 0.003) {
    const t = Math.max(0, Math.min(1, rocketFogTransition));
    const ease = t * t * (3 - 2 * t);
    const curVisionR = R_BASE_VISION * (0.85 + 0.15 * ease);
    const holeStrength = ease;

    fogLayerCtx.save();
    fogLayerCtx.globalCompositeOperation = 'destination-out';

    // A. Soft volumetric dissipation gradient (clean, smooth edge, no visual noise)
    const holeGrd = fogLayerCtx.createRadialGradient(rocket.x, rocket.y, 0, rocket.x, rocket.y, curVisionR);
    holeGrd.addColorStop(0,    `rgba(0, 0, 0, ${1.00 * holeStrength})`);
    holeGrd.addColorStop(0.35, `rgba(0, 0, 0, ${0.94 * holeStrength})`);
    holeGrd.addColorStop(0.65, `rgba(0, 0, 0, ${0.70 * holeStrength})`);
    holeGrd.addColorStop(0.85, `rgba(0, 0, 0, ${0.30 * holeStrength})`);
    holeGrd.addColorStop(1,    'rgba(0, 0, 0, 0)');
    fogLayerCtx.fillStyle = holeGrd;
    fogLayerCtx.beginPath();
    fogLayerCtx.arc(rocket.x, rocket.y, curVisionR, 0, Math.PI * 2);
    fogLayerCtx.fill();

    // B. Forward headlight fog displacement (clears deeper path ahead of rocket)
    const fwdDist = 55;
    const fwdX = rocket.x + Math.sin(rocketAngle) * fwdDist;
    const fwdY = rocket.y - Math.cos(rocketAngle) * fwdDist;
    const fwdR = curVisionR * 0.75;
    const fwdGrd = fogLayerCtx.createRadialGradient(fwdX, fwdY, 0, fwdX, fwdY, fwdR);
    fwdGrd.addColorStop(0,   `rgba(0, 0, 0, ${0.48 * holeStrength})`);
    fwdGrd.addColorStop(0.6, `rgba(0, 0, 0, ${0.20 * holeStrength})`);
    fwdGrd.addColorStop(1,   'rgba(0, 0, 0, 0)');
    fogLayerCtx.fillStyle = fwdGrd;
    fogLayerCtx.beginPath();
    fogLayerCtx.arc(fwdX, fwdY, fwdR, 0, Math.PI * 2);
    fogLayerCtx.fill();

    fogLayerCtx.restore();
  }

  // 3. Blit fog buffer to main screen
  ctx.drawImage(fogLayerCanvas, 0, 0);
}

// Atmospheric illumination & directional headlights rotating precisely with the rocket
function drawRocketFogVision(ctx, R_VISION = 195) {
  if (!rocket || !rocket.alive || !isRocketInFog()) return;
  const tTime = performance.now() / 1000;
  const pulse = 0.85 + 0.15 * Math.sin(tTime * 6);
  
  const t = Math.max(0, Math.min(1, rocketFogTransition));
  const ease = t * t * (3 - 2 * t);
  const curVisionR = R_VISION * (0.85 + 0.15 * ease);

  // 1. Soft 360-degree ambient cockpit glow in world coordinates
  ctx.save();
  ctx.globalAlpha = ease;
  const haloGrd = ctx.createRadialGradient(rocket.x, rocket.y, 8, rocket.x, rocket.y, curVisionR * 0.85);
  haloGrd.addColorStop(0,    `rgba(186, 230, 253, ${0.11 * pulse})`);
  haloGrd.addColorStop(0.40, `rgba(56, 189, 248, ${0.05 * pulse})`);
  haloGrd.addColorStop(0.75, `rgba(74, 222, 128, ${0.02 * pulse})`);
  haloGrd.addColorStop(1,    'rgba(74, 222, 128, 0)');
  ctx.fillStyle = haloGrd;
  ctx.beginPath();
  ctx.arc(rocket.x, rocket.y, curVisionR * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Headlights mounted directly on rocket chassis and rotating with rocketAngle
  ctx.save();
  ctx.globalAlpha = ease;
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(rocketAngle); // Headlights ALWAYS point in front of the rocket!

  const beamLength = curVisionR * 1.15; // ~225px beam throw distance
  const beamSpread = 68;

  // A. Main forward floodlight cone (emanates from rocket nose y = -18)
  const floodGrd = ctx.createLinearGradient(0, -18, 0, -beamLength);
  floodGrd.addColorStop(0,    `rgba(240, 253, 250, ${0.28 * pulse})`);
  floodGrd.addColorStop(0.18, `rgba(186, 230, 253, ${0.18 * pulse})`);
  floodGrd.addColorStop(0.55, `rgba(56, 189, 248, ${0.08 * pulse})`);
  floodGrd.addColorStop(0.85, `rgba(45, 212, 191, ${0.03 * pulse})`);
  floodGrd.addColorStop(1,    'rgba(45, 212, 191, 0)');

  ctx.fillStyle = floodGrd;
  ctx.beginPath();
  ctx.moveTo(-10, -16);
  ctx.lineTo(-beamSpread, -beamLength);
  ctx.lineTo(beamSpread, -beamLength);
  ctx.lineTo(10, -16);
  ctx.closePath();
  ctx.fill();

  // B. Left focused projector beam (from left wing tip / headlight socket: x = -9, y = -14)
  const leftGrd = ctx.createLinearGradient(-9, -14, -28, -beamLength);
  leftGrd.addColorStop(0,    `rgba(255, 255, 255, ${0.40 * pulse})`);
  leftGrd.addColorStop(0.20, `rgba(186, 230, 253, ${0.22 * pulse})`);
  leftGrd.addColorStop(0.70, `rgba(56, 189, 248, ${0.06 * pulse})`);
  leftGrd.addColorStop(1,    'rgba(56, 189, 248, 0)');
  ctx.fillStyle = leftGrd;
  ctx.beginPath();
  ctx.moveTo(-11, -14);
  ctx.lineTo(-42, -beamLength * 0.95);
  ctx.lineTo(-12, -beamLength * 0.95);
  ctx.lineTo(-7, -14);
  ctx.closePath();
  ctx.fill();

  // C. Right focused projector beam (from right wing tip / headlight socket: x = 9, y = -14)
  const rightGrd = ctx.createLinearGradient(9, -14, 28, -beamLength);
  rightGrd.addColorStop(0,    `rgba(255, 255, 255, ${0.40 * pulse})`);
  rightGrd.addColorStop(0.20, `rgba(186, 230, 253, ${0.22 * pulse})`);
  rightGrd.addColorStop(0.70, `rgba(56, 189, 248, ${0.06 * pulse})`);
  rightGrd.addColorStop(1,    'rgba(56, 189, 248, 0)');
  ctx.fillStyle = rightGrd;
  ctx.beginPath();
  ctx.moveTo(7, -14);
  ctx.lineTo(12, -beamLength * 0.95);
  ctx.lineTo(42, -beamLength * 0.95);
  ctx.lineTo(11, -14);
  ctx.closePath();
  ctx.fill();

  // D. Glowing lens flares on headlight emitters
  [-9, 9].forEach(hx => {
    const lensGrd = ctx.createRadialGradient(hx, -14, 0, hx, -14, 8);
    lensGrd.addColorStop(0,   `rgba(255, 255, 255, ${0.90 * pulse})`);
    lensGrd.addColorStop(0.4, `rgba(186, 230, 253, ${0.55 * pulse})`);
    lensGrd.addColorStop(1,   'rgba(56, 189, 248, 0)');
    ctx.fillStyle = lensGrd;
    ctx.beginPath();
    ctx.arc(hx, -14, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // E. Floating vapor dust specks caught in the forward beam
  for (let m = 0; m < 6; m++) {
    const mProgress = ((tTime * 35 + m * 38) % (beamLength * 0.85));
    const mY = -22 - mProgress;
    const mSpreadAtY = (mProgress / (beamLength * 0.85)) * (beamSpread * 0.7);
    const mX = Math.sin(m * 2.3 + tTime * 1.5) * mSpreadAtY;
    const mAlpha = 0.45 * Math.sin((mProgress / (beamLength * 0.85)) * Math.PI) * pulse;

    ctx.fillStyle = `rgba(224, 242, 254, ${mAlpha})`;
    ctx.beginPath();
    ctx.arc(mX, mY, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

