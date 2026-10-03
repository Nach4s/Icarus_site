// ─── Obstacle Drawing ─────────────────────────────────────────
function drawEnergyOrb(ctx, ob) {
  const { x, y, r } = ob;
  const t = performance.now() / 1000;

  // Use current sector theme color
  const [cr, cg, cb] = currentBgTheme ? currentBgTheme.circle : [147, 51, 234];
  const cBright = `rgb(${Math.min(255, cr + 90)}, ${Math.min(255, cg + 90)}, ${Math.min(255, cb + 90)})`;
  const cMid    = `rgb(${cr}, ${cg}, ${cb})`;
  const cDark   = `rgb(${Math.round(cr * 0.65)}, ${Math.round(cg * 0.65)}, ${Math.round(cb * 0.65)})`;
  const cDeep   = `rgba(${Math.round(cr * 0.2)}, ${Math.round(cg * 0.2)}, ${Math.round(cb * 0.2)}, 0.95)`;

  // Pulsating radius
  const pulse = 1 + 0.12 * Math.sin(t * 8 + (ob.orbitAngle || 0) * 4);
  const orbR = r * 1.35 * pulse;

  ctx.save();

  // 1. Wide diffuse plasma corona (glow)
  const coronaGrd = ctx.createRadialGradient(x, y, orbR * 0.3, x, y, orbR * 3.4);
  coronaGrd.addColorStop(0,    `rgba(${Math.min(255, cr + 60)}, ${Math.min(255, cg + 60)}, ${Math.min(255, cb + 60)}, 0.75)`);
  coronaGrd.addColorStop(0.35, `rgba(${cr}, ${cg}, ${cb}, 0.4)`);
  coronaGrd.addColorStop(0.7,  `rgba(${Math.round(cr * 0.5)}, ${Math.round(cg * 0.5)}, ${Math.round(cb * 0.5)}, 0.12)`);
  coronaGrd.addColorStop(1,    'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coronaGrd;
  ctx.beginPath();
  ctx.arc(x, y, orbR * 3.4, 0, Math.PI * 2);
  ctx.fill();

  // 2. Spinning containment rings (energy field)
  for (let ring = 0; ring < 2; ring++) {
    ctx.save();
    ctx.translate(x, y);
    const ringAngle = t * (ring === 0 ? 3.8 : -2.9) + ring * 1.5;
    ctx.rotate(ringAngle);
    ctx.scale(1, 0.42);
    ctx.strokeStyle = ring === 0
      ? 'rgba(255, 255, 255, 0.92)'
      : `rgba(${Math.min(255, cr + 90)}, ${Math.min(255, cg + 90)}, ${Math.min(255, cb + 90)}, 0.85)`;
    ctx.lineWidth = 1.8 + 0.5 * Math.sin(t * 10 + ring);
    ctx.shadowColor = cMid;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, orbR * 1.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Dense vibrant energy orb body
  const bodyGrd = ctx.createRadialGradient(
    x - orbR * 0.28, y - orbR * 0.28, 0,
    x, y, orbR
  );
  bodyGrd.addColorStop(0,    '#ffffff');
  bodyGrd.addColorStop(0.22, cBright);
  bodyGrd.addColorStop(0.6,  cMid);
  bodyGrd.addColorStop(0.88, cDark);
  bodyGrd.addColorStop(1,    cDeep);

  ctx.fillStyle = bodyGrd;
  ctx.shadowColor = cBright;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(x, y, orbR, 0, Math.PI * 2);
  ctx.fill();

  // 4. White-hot plasma core
  const coreGrd = ctx.createRadialGradient(
    x - orbR * 0.2, y - orbR * 0.2, 0,
    x - orbR * 0.2, y - orbR * 0.2, orbR * 0.48
  );
  coreGrd.addColorStop(0,   'rgba(255, 255, 255, 0.98)');
  coreGrd.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
  coreGrd.addColorStop(1,   'rgba(255, 255, 255, 0)');
  ctx.fillStyle = coreGrd;
  ctx.beginPath();
  ctx.arc(x - orbR * 0.2, y - orbR * 0.2, orbR * 0.48, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawComet(ctx, ob) {
  // If captured into a black hole: transform into a pure energy orb (no trail, no direction)
  if (ob.capturedByBH) {
    drawEnergyOrb(ctx, ob);
    return;
  }

  const { x, y, r, angle, speed } = ob;
  const tailLen = r * 5 + Math.min(speed * 0.25, 80);

  // Pull theme color (falls back to cyan if no theme yet)
  const [cr, cg, cb] = currentBgTheme ? currentBgTheme.circle : [6, 182, 212];
  const cDim  = `rgba(${cr}, ${cg}, ${cb}, 0.7)`;
  const cMid  = `rgba(${cr}, ${cg}, ${cb}, 0.3)`;
  const cFade = `rgba(${Math.round(cr*0.4)}, ${Math.round(cg*0.4)}, ${Math.round(cb*0.4)}, 0)`;
  const cSoft = `rgba(${Math.min(255,cr+80)}, ${Math.min(255,cg+80)}, ${Math.min(255,cb+80)}, 0.5)`;
  const cGlow = `rgba(${cr}, ${cg}, ${cb}, 0.3)`;

  const tx = Math.cos(angle + Math.PI) * tailLen;
  const ty = Math.sin(angle + Math.PI) * tailLen;

  // Main tail
  const tailGrd = ctx.createLinearGradient(x, y, x + tx, y + ty);
  tailGrd.addColorStop(0,   cDim);
  tailGrd.addColorStop(0.4, cMid);
  tailGrd.addColorStop(1,   cFade);
  ctx.strokeStyle = tailGrd;
  ctx.lineWidth = r * 0.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + tx, y + ty);
  ctx.stroke();

  // Secondary thinner tail
  const tailGrd2 = ctx.createLinearGradient(x, y, x + tx * 1.3, y + ty * 1.3);
  tailGrd2.addColorStop(0, cSoft);
  tailGrd2.addColorStop(1, cFade);
  ctx.lineWidth = r * 0.35;
  ctx.strokeStyle = tailGrd2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + tx * 1.3, y + ty * 1.3);
  ctx.stroke();

  // Coma (glow around nucleus)
  const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
  grd.addColorStop(0,   `rgba(${Math.min(255,cr+100)}, ${Math.min(255,cg+100)}, ${Math.min(255,cb+100)}, 0.6)`);
  grd.addColorStop(0.5, cGlow);
  grd.addColorStop(1,   cFade);
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Nucleus
  const nucGrd = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  nucGrd.addColorStop(0,   `rgb(${Math.min(255,cr+120)}, ${Math.min(255,cg+120)}, ${Math.min(255,cb+120)})`);
  nucGrd.addColorStop(0.4, `rgb(${Math.min(255,cr+60)}, ${Math.min(255,cg+60)}, ${Math.min(255,cb+60)})`);
  nucGrd.addColorStop(0.8, `rgb(${Math.round(cr*0.8)}, ${Math.round(cg*0.8)}, ${Math.round(cb*0.8)})`);
  nucGrd.addColorStop(1,   `rgb(${Math.round(cr*0.4)}, ${Math.round(cg*0.4)}, ${Math.round(cb*0.4)})`);
  ctx.fillStyle = nucGrd;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Specular highlight
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

function drawAsteroid(ctx, ob) {
  const { x, y, r, rotation, vertices } = ob;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const glw = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.8);
  glw.addColorStop(0, 'rgba(100, 80, 60, 0.3)');
  glw.addColorStop(1, 'rgba(60, 40, 30, 0)');
  ctx.fillStyle = glw;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  const bodyGrd = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
  bodyGrd.addColorStop(0, '#7a6a50');
  bodyGrd.addColorStop(0.4, '#5a4a36');
  bodyGrd.addColorStop(0.8, '#3a2e24');
  bodyGrd.addColorStop(1, '#1a1410');
  ctx.fillStyle = bodyGrd;
  ctx.beginPath();
  vertices.forEach((v, i) => {
    if (i === 0) ctx.moveTo(v.x, v.y);
    else ctx.lineTo(v.x, v.y);
  });
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ob.craters.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(180, 160, 120, 0.2)';
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.35, r * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Particle System ──────────────────────────────────────────
function addParticle(p) {
  if (particles.length >= MAX_PARTICLES) {
    // Remove oldest non-ring particle
    const idx = particles.findIndex(pt => pt.type !== 'ring');
    if (idx !== -1) particles.splice(idx, 1);
  }
  particles.push(p);
}

function spawnExplosion(x, y, count = 36) {
  const colors = ['#ff6b35', '#ff4400', '#ffcc00', '#ff8800', '#ffffff', '#ffdd88'];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
    const speed = 80 + Math.random() * 280;
    const life = 0.6 + Math.random() * 0.8;
    addParticle({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: 2 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: Math.random() > 0.5 ? 'square' : 'circle',
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 8,
      grav: 30 + Math.random() * 40,
    });
  }
  addParticle({
    x, y, vx: 0, vy: 0,
    life: 0.4, maxLife: 0.4,
    size: 4, maxSize: 80,
    color: '#ff6b35',
    type: 'ring',
    grav: 0,
  });
}

function spawnLevelUpRing(x, y) {
  // Expanding cyan ring at rocket position
  addParticle({
    x, y, vx: 0, vy: 0,
    life: 0.5, maxLife: 0.5,
    size: 4, maxSize: 120,
    color: '#00e5ff',
    type: 'ring',
    grav: 0,
  });
  // Sparks
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 / 16) * i;
    const speed = 60 + Math.random() * 100;
    const life = 0.3 + Math.random() * 0.3;
    addParticle({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: 1.5 + Math.random() * 2,
      color: Math.random() > 0.5 ? '#00e5ff' : '#ffffff',
      type: 'circle',
      rot: 0, rotV: 0, grav: 0,
    });
  }
}

function spawnFireworks(w, h) {
  // Gold fireworks for new record
  const colors = ['#ffd700', '#ffaa00', '#fff200', '#ff8c00', '#ffffff'];
  for (let burst = 0; burst < 5; burst++) {
    const bx = w * (0.2 + Math.random() * 0.6);
    const by = h * (0.1 + Math.random() * 0.5);
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 160;
      const life = 0.8 + Math.random() * 0.8;
      addParticle({
        x: bx, y: by,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.random() > 0.5 ? 'square' : 'circle',
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 6,
        grav: 20 + Math.random() * 30,
      });
    }
  }
}

function spawnRocketTrail(x, y, vx, vy) {
  if (selectedSkin === 'icarus_wings') {
    // Shedding feathers trail (inspired directly by the artwork!)
    if (Math.random() < 0.65) {
      const life = 0.55 + Math.random() * 0.45;
      const isGold = Math.random() < 0.45;
      addParticle({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: vx * 0.05 + (Math.random() - 0.5) * 20,
        vy: vy * 0.05 + 12 + Math.random() * 22,
        life,
        maxLife: life,
        size: 3.5 + Math.random() * 3.5,
        color: isGold ? '#fde047' : '#ffffff',
        type: 'feather',
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 4.2,
        grav: 8,
      });
    }
    return;
  }

  if (selectedSkin === 'space_shuttle' || selectedSkin === 'solar_phoenix') {
    // Launch smoke billows + fiery SRB sparks
    if (Math.random() < 0.72) {
      const isSparks = Math.random() < 0.45;
      const life = isSparks ? (0.25 + Math.random() * 0.22) : (0.45 + Math.random() * 0.35);
      const smokeColor = Math.random() < 0.5 ? 'rgba(226, 232, 240, 0.75)' : 'rgba(203, 213, 225, 0.65)';
      const sparkColor = Math.random() < 0.5 ? '#f97316' : '#fde047';

      // Spawn from both SRB nozzles (scaled down with shuttle)
      const side = Math.random() < 0.5 ? -1 : 1;
      addParticle({
        x: x + side * 10.1 + (Math.random() - 0.5) * 4,
        y: y + 15.6 + (Math.random() - 0.5) * 4,
        vx: vx * 0.05 + side * 4 + (Math.random() - 0.5) * 16,
        vy: vy * 0.05 + 16 + Math.random() * 26,
        life,
        maxLife: life,
        size: isSparks ? (1.8 + Math.random() * 1.8) : (3.5 + Math.random() * 4),
        color: isSparks ? sparkColor : smokeColor,
        type: 'circle',
        rot: 0, rotV: 0,
        grav: isSparks ? 4 : -2,
      });
    }
    return;
  }

  if (selectedSkin === 'void_phantom') {
    if (Math.random() < 0.55) {
      const life = 0.35 + Math.random() * 0.3;
      addParticle({
        x: x + (Math.random() - 0.5) * 7,
        y: y + (Math.random() - 0.5) * 7,
        vx: vx * 0.06 + (Math.random() - 0.5) * 16,
        vy: vy * 0.06 + Math.random() * 26,
        life,
        maxLife: life,
        size: 1.9 + Math.random() * 2.2,
        color: Math.random() < 0.5 ? '#c084fc' : '#38bdf8',
        type: 'square',
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 8,
        grav: 0,
      });
    }
    return;
  }

  if (selectedSkin === 'venator' || selectedSkin === 'golden_aegis') {
    // Star Wars Venator Ion Trail (compacted)
    if (Math.random() < 0.55) {
      const life = 0.28 + Math.random() * 0.22;
      const isCore = Math.random() < 0.4;
      addParticle({
        x: x + (Math.random() - 0.5) * 10,
        y: y + 16 + (Math.random() - 0.5) * 3,
        vx: vx * 0.05 + (Math.random() - 0.5) * 12,
        vy: vy * 0.05 + 14 + Math.random() * 18,
        life,
        maxLife: life,
        size: isCore ? (1.5 + Math.random() * 1.5) : (2.4 + Math.random() * 2.4),
        color: isCore ? '#ffffff' : (Math.random() < 0.5 ? '#00e5ff' : '#38bdf8'),
        type: 'circle',
        rot: 0, rotV: 0, grav: 0,
      });
    }
    return;
  }

  if (selectedSkin === 'cyber_dreadnought') {
    // Cyber Dreadnought: Quantum Cyan Matrix particles & pulsating neon ion sparks
    if (Math.random() < 0.65) {
      const life = 0.32 + Math.random() * 0.28;
      const isPixel = Math.random() < 0.45;
      const col = Math.random() < 0.35 ? '#ffffff' : (Math.random() < 0.6 ? '#00f5ff' : '#06b6d4');
      addParticle({
        x: x + (Math.random() - 0.5) * 14,
        y: y + 16 + (Math.random() - 0.5) * 4,
        vx: vx * 0.05 + (Math.random() - 0.5) * 14,
        vy: vy * 0.05 + 16 + Math.random() * 22,
        life,
        maxLife: life,
        size: isPixel ? (2.0 + Math.random() * 2.0) : (1.6 + Math.random() * 1.8),
        color: col,
        type: isPixel ? 'square' : 'circle',
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 5,
        grav: 0,
      });
    }
    return;
  }

  // Classic rocket flame sparks
  if (Math.random() > 0.5) return;
  const life = 0.3 + Math.random() * 0.3;
  addParticle({
    x: x + (Math.random() - 0.5) * 4,
    y: y + (Math.random() - 0.5) * 4,
    vx: vx * 0.08 + (Math.random() - 0.5) * 18,
    vy: vy * 0.08 + Math.random() * 35,
    life,
    maxLife: life,
    size: 1.5 + Math.random() * 3.5,
    color: Math.random() > 0.6 ? '#ff8830' : (Math.random() > 0.5 ? '#ffdd50' : '#00c8ff'),
    type: 'circle',
    rot: 0, rotV: 0, grav: 0,
  });
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    if (p.type !== 'ring') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.grav * dt;
      p.rot += p.rotV * dt;
      p.vx *= (1 - dt * 2.5);
      p.vy *= (1 - dt * 1.5);
    }
  }
}

function drawParticles(ctx) {
  particles.forEach(p => {
    const t = p.life / p.maxLife;
    ctx.globalAlpha = Math.pow(t, 0.5);

    if (p.type === 'ring') {
      const expandT = 1 - t;
      const r = p.size + (p.maxSize || 80) * expandT;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3 * t;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === 'square') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    } else if (p.type === 'feather') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      const fw = p.size * 0.6;
      const fh = p.size * 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -fh / 2);
      ctx.quadraticCurveTo(fw, -fh * 0.1, 0, fh / 2);
      ctx.quadraticCurveTo(-fw * 0.65, -fh * 0.1, 0, -fh / 2);
      ctx.closePath();
      ctx.fill();

      // Delicate feather spine quill
      ctx.strokeStyle = 'rgba(255, 235, 160, 0.7)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, -fh / 2);
      ctx.lineTo(0, fh / 2);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

// ─── Obstacle Factory ─────────────────────────────────────────

// Build random asteroid shape vertices and craters for a given radius
function buildAsteroidShape(r) {
  const vCount = 7 + Math.floor(Math.random() * 4);
  const verts = [];
  for (let i = 0; i < vCount; i++) {
    const a = (Math.PI * 2 / vCount) * i + (Math.random() - 0.5) * 0.6;
    const rv = r * (0.65 + Math.random() * 0.45);
    verts.push({ x: Math.cos(a) * rv, y: Math.sin(a) * rv });
  }
  const craterCount = 1 + Math.floor(Math.random() * 3);
  const craters = [];
  for (let i = 0; i < craterCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const rd = Math.random() * r * 0.5;
    craters.push({
      x: Math.cos(a) * rd,
      y: Math.sin(a) * rd,
      r: r * (0.1 + Math.random() * 0.18),
    });
  }
  return { vertices: verts, craters };
}

function spawnObstacle(w, h) {
  // ── Synthwave Magenta biome: asteroids dominate, mega-asteroids exclusive here ──
  const inSynthwave = typeof isSynthwaveTheme === 'function' && isSynthwaveTheme();

  // Synthwave: 70% asteroids, 30% comets. Normal: 65% comets, 35% asteroids.
  const isComet = inSynthwave ? (Math.random() > 0.70) : (Math.random() > 0.35);

  let types;
  if (!isComet && inSynthwave) {
    types = SYNTHWAVE_ASTEROID_TYPES;  // includes mega (r=62)
  } else if (isComet) {
    types = COMET_TYPES;
  } else {
    types = ASTEROID_TYPES;
  }

  const totalW = types.reduce((s, t) => s + t.spawnW, 0);
  let rnd = Math.random() * totalW;
  let tDef = types[0];
  for (const t of types) { rnd -= t.spawnW; if (rnd <= 0) { tDef = t; break; } }

  const edge = Math.floor(Math.random() * 4);
  let sx, sy;
  const margin = tDef.r + 10;
  switch (edge) {
    case 0: sx = Math.random() * w; sy = -margin; break;
    case 1: sx = w + margin; sy = Math.random() * h; break;
    case 2: sx = Math.random() * w; sy = h + margin; break;
    case 3: sx = -margin; sy = Math.random() * h; break;
  }

  const tx = w * (0.1 + Math.random() * 0.8);
  const ty = h * (0.1 + Math.random() * 0.8);
  const dx = tx - sx, dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const speed = tDef.speed * (0.7 + Math.random() * 0.6) * (1 + getDiffScale(diffLevel));
  const angle = Math.atan2(dy, dx);

  const ob = {
    type: isComet ? 'comet' : 'asteroid',
    x: sx, y: sy,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    r: tDef.r,
    angle,
    speed,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 2.5,
    isFragment: false,
    isMega: tDef.isMega || false,   // mega-asteroid flag (Synthwave exclusive)
  };

  if (!isComet) {
    const shape = buildAsteroidShape(ob.r);
    ob.vertices = shape.vertices;
    ob.craters = shape.craters;

    // Large enough asteroids (and all mega-asteroids) will split at midpoint
    if (ob.r >= MIN_SPLIT_R) {
      ob.splitX = (sx + tx) / 2;
      ob.splitY = (sy + ty) / 2;
      ob.hasSplit = false;
    }
  }

  if (isComet && ob.r >= MIN_COMET_EXPLODE_R && Math.random() < 0.5) {
    const totalFlightTime = dist / speed;
    ob.explodeTimer = totalFlightTime * (0.25 + Math.random() * 0.5);
    ob.willExplode = true;
  }

  obstacles.push(ob);
}

// ─── Comet Blast (mid-path explosion) ───────────────────────────
function spawnCometBlast(comet) {
  const x = comet.x, y = comet.y, r = comet.r;
  const blastR = r * 5.5;   // danger zone radius

  // Duration scales with comet size: small comets 1.5s, large up to 2.5s
  const dzDuration = 1.5 + Math.min(1.0, (r - 10) / 25);
  const [dzR, dzG, dzB] = currentBgTheme ? currentBgTheme.circle : [96, 208, 255];
  dangerZones.push({
    x, y,
    r: blastR,
    life: dzDuration,
    maxLife: dzDuration,
    color: [dzR, dzG, dzB],   // store theme color for ring
  });

  // Theme color for this comet's explosion
  const [cr, cg, cb] = currentBgTheme ? currentBgTheme.circle : [96, 208, 255];
  const cHex    = `rgb(${cr},${cg},${cb})`;
  const cBright = `rgb(${Math.min(255,cr+80)},${Math.min(255,cg+80)},${Math.min(255,cb+80)})`;
  const cDark   = `rgb(${Math.round(cr*0.5)},${Math.round(cg*0.5)},${Math.round(cb*0.5)})`;
  const cMid    = `rgb(${Math.min(255,cr+30)},${Math.min(255,cg+30)},${Math.min(255,cb+30)})`;

  // Big themed flash ring
  addParticle({
    x, y, vx: 0, vy: 0,
    life: 0.5, maxLife: 0.5,
    size: r, maxSize: blastR * 1.8,
    color: cHex,
    type: 'ring',
    grav: 0,
  });
  // Second shockwave ring (white)
  addParticle({
    x, y, vx: 0, vy: 0,
    life: 0.6, maxLife: 0.6,
    size: r * 0.5, maxSize: blastR * 1.2,
    color: '#ffffff',
    type: 'ring',
    grav: 0,
  });

  // Themed comet debris sparks
  const cometColors = [cBright, cHex, cDark, '#ffffff', cMid];
  const count = 14 + Math.floor(r * 1.2);
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 80 + Math.random() * r * 7;
    const life = 0.5 + Math.random() * 0.7;
    addParticle({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life, maxLife: life,
      size: 1.5 + Math.random() * 4,
      color: cometColors[Math.floor(Math.random() * cometColors.length)],
      type: Math.random() > 0.5 ? 'circle' : 'square',
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 12,
      grav: 0,
    });
  }

  // Audio: mid-range boom
  if (audioCtx && !muted) {
    const bufLen = Math.floor(audioCtx.sampleRate * 0.25);
    const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 1.2) * 0.7;
    }
    const src = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const filt = audioCtx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 320;
    filt.Q.value = 0.5;
    gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    src.buffer = buf;
    src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
    src.start();
  }
}

// ─── Danger Zone Draw ─────────────────────────────────────────
function drawDangerZones(ctx) {
  const t = performance.now() / 1000;
  dangerZones.forEach(dz => {
    const progress = dz.life / dz.maxLife;   // 1 = fresh, 0 = expiring
    const pulse = 0.5 + 0.5 * Math.sin(t * 12);  // fast pulse

    // Danger zone theme color
    const [dr, dg, db] = dz.color || (currentBgTheme ? currentBgTheme.circle : [96, 208, 255]);

    // Filled warning zone using theme color
    const fillAlpha = progress * 0.18 * (0.7 + 0.3 * pulse);
    const grd = ctx.createRadialGradient(dz.x, dz.y, 0, dz.x, dz.y, dz.r);
    grd.addColorStop(0,   `rgba(${dr}, ${dg}, ${db}, ${fillAlpha * 0.9})`);
    grd.addColorStop(0.5, `rgba(${dr}, ${dg}, ${db}, ${fillAlpha * 0.5})`);
    grd.addColorStop(1,   `rgba(${dr}, ${dg}, ${db}, 0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(dz.x, dz.y, dz.r, 0, Math.PI * 2);
    ctx.fill();

    // Danger border ring — use stored theme color
    const strokeAlpha = progress * (0.55 + 0.45 * pulse);
    ctx.strokeStyle = `rgba(${dr}, ${dg}, ${db}, ${strokeAlpha})`;
    ctx.lineWidth = 2.5 + 1.5 * pulse;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -t * 40;
    ctx.beginPath();
    ctx.arc(dz.x, dz.y, dz.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // Inner hot glow core (fades out)
    if (progress > 0.4) {
      const coreAlpha = (progress - 0.4) * 1.66 * 0.35;
      const coreGrd = ctx.createRadialGradient(dz.x, dz.y, 0, dz.x, dz.y, dz.r * 0.45);
      coreGrd.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
      coreGrd.addColorStop(0.5, `rgba(${Math.min(255, dr + 60)}, ${Math.min(255, dg + 60)}, ${Math.min(255, db + 60)}, ${coreAlpha * 0.7})`);
      coreGrd.addColorStop(1, `rgba(${dr}, ${dg}, ${db}, 0)`);
      ctx.fillStyle = coreGrd;
      ctx.beginPath();
      ctx.arc(dz.x, dz.y, dz.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// ─── Asteroid Split Particles ─────────────────────────────────
function spawnSplitParticles(x, y, r) {
  // Crack flash ring
  addParticle({
    x, y, vx: 0, vy: 0,
    life: 0.35, maxLife: 0.35,
    size: r * 0.5, maxSize: r * 3.5,
    color: '#c8a060',
    type: 'ring',
    grav: 0,
  });
  // Rock debris sparks
  const debrisColors = ['#9a7a50', '#c8a060', '#7a6040', '#e0c080', '#604030'];
  const count = 8 + Math.floor(r * 0.6);
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 50 + Math.random() * r * 4;
    const life = 0.4 + Math.random() * 0.5;
    addParticle({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life, maxLife: life,
      size: 1.5 + Math.random() * 3,
      color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
      type: Math.random() > 0.4 ? 'square' : 'circle',
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 10,
      grav: 20,
    });
  }
}

// ─── Split an asteroid into fragments ────────────────────────────
// Mega-asteroid (r=62, Synthwave only) → 2–3 big fragments (r=28–40), each can split again
// Big asteroid (r=28)                 → 2–4 small fragments (r=5–16), isFragment=true (no more splits)
function splitAsteroid(parentOb, parentIdx) {
  const px = parentOb.x;
  const py = parentOb.y;
  const parentR = parentOb.r;
  const isMega = parentOb.isMega === true;

  const baseAngle = Math.atan2(parentOb.vy, parentOb.vx);
  const parentSpeed = Math.sqrt(parentOb.vx * parentOb.vx + parentOb.vy * parentOb.vy);

  if (isMega) {
    // ── Mega split: 2–3 big chunks (r = 28–40), each WILL split again ──────────
    const fragCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
    const bigR = 28 + Math.floor(Math.random() * 12);   // 28–39px each

    for (let i = 0; i < fragCount; i++) {
      const spreadAngle = baseAngle + (i - (fragCount - 1) / 2) * (Math.PI / (fragCount + 1)) + (Math.random() - 0.5) * 0.55;
      const fragSpeed = parentSpeed * (1.0 + Math.random() * 0.45);
      const fragR = bigR + (Math.random() - 0.5) * 8;  // slight variance
      const shape = buildAsteroidShape(fragR);

      // Calculate a split point mid-way for this fragment's travel
      const travelDist = fragR * 4 + Math.random() * 80;
      const frag = {
        type: 'asteroid',
        x: px + Math.cos(spreadAngle) * (parentR * 0.55),
        y: py + Math.sin(spreadAngle) * (parentR * 0.55),
        vx: Math.cos(spreadAngle) * fragSpeed,
        vy: Math.sin(spreadAngle) * fragSpeed,
        r: fragR,
        angle: spreadAngle,
        speed: fragSpeed,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 3.5,
        vertices: shape.vertices,
        craters: shape.craters,
        isFragment: false,   // big fragments CAN split again!
        isMega: false,
        // Set split point for this fragment
        splitX: px + Math.cos(spreadAngle) * travelDist,
        splitY: py + Math.sin(spreadAngle) * travelDist,
        hasSplit: false,
      };
      obstacles.push(frag);
    }

    // Bigger destruction effect for mega split
    spawnSplitParticles(px, py, parentR * 1.3);
    // Extra shockwave ring
    addParticle({
      x: px, y: py, vx: 0, vy: 0,
      life: 0.6, maxLife: 0.6,
      size: parentR, maxSize: parentR * 5,
      color: '#c8a060',
      type: 'ring',
      grav: 0,
    });

  } else {
    // ── Normal split: 2–4 small fragments, no more splitting ──────────────────
    const fragCount = 2 + Math.floor(Math.random() * 3);
    const rawRatios = [];
    let ratioSum = 0;
    for (let i = 0; i < fragCount; i++) {
      const v = 0.15 + Math.random() * 0.85;
      rawRatios.push(v);
      ratioSum += v;
    }
    const fragRadii = rawRatios.map(v => parentR * Math.sqrt(v / ratioSum));
    const MIN_FRAG_R = 5;

    for (let i = 0; i < fragCount; i++) {
      const fragR = Math.max(MIN_FRAG_R, fragRadii[i]);
      const spreadAngle = baseAngle + (i - (fragCount - 1) / 2) * (Math.PI / (fragCount + 1)) + (Math.random() - 0.5) * 0.4;
      const fragSpeed = parentSpeed * (0.8 + Math.random() * 0.5);
      const shape = buildAsteroidShape(fragR);
      const frag = {
        type: 'asteroid',
        x: px + Math.cos(spreadAngle) * (parentR * 0.5),
        y: py + Math.sin(spreadAngle) * (parentR * 0.5),
        vx: Math.cos(spreadAngle) * fragSpeed,
        vy: Math.sin(spreadAngle) * fragSpeed,
        r: fragR,
        angle: spreadAngle,
        speed: fragSpeed,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4.5,
        vertices: shape.vertices,
        craters: shape.craters,
        isFragment: true,   // small fragments don't split
        hasSplit: true,
      };
      obstacles.push(frag);
    }

    spawnSplitParticles(px, py, parentR);
  }

  // Remove parent
  obstacles.splice(parentIdx, 1);

  // Rocky crack sound (louder for mega)
  if (audioCtx && !muted) {
    const duration = isMega ? 0.28 : 0.15;
    const volume  = isMega ? 0.85 : 0.55;
    const freq    = isMega ? 480 : 900;
    const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * duration), audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.4) * volume;
    }
    const src = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const filt = audioCtx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = freq;
    filt.Q.value = 0.8;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    src.buffer = buf;
    src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
    src.start();
  }
}

// ─── Collision Detection ──────────────────────────────────────
function checkCollision(rkt, ob) {
  const rktR = Math.min(rkt.w, rkt.h) * 0.46; // slightly increased hitbox (~12.9px radius)
  const dx = rkt.x - ob.x;
  const dy = rkt.y - ob.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < (ob.r * 0.85) + rktR;
}

