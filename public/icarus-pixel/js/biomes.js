// ─── Biome Hazards ────────────────────────────────────────────
// Unique hazards for the four biomes that had no mechanic of their own:
//   Neon Azure        → Ion Gates      (pylon pair with a pulsing electric arc)
//   Golden Supernova  → Supernova      (expanding shock ring with safe gaps)
//   Deep Ultramarine  → Minefield      (near-invisible mines, revealed by sonar)
//   Fiery Magma       → Lava Pools     (standing in lava fills an overheat meter)
//
// Event compatibility — a biome hazard must never make an event unwinnable.
// While a listed event is active, the hazard stops spawning and existing
// pieces fade out harmlessly:
//   Ion Gates   — CONSTRICTION (could wall off the safe zone), PIRATES (flagship salvos)
//   Supernova   — every event (dodging the ring needs free movement)
//   Minefield   — CONSTRICTION (no room to flee a mine inside the zone)
//   Lava Pools  — CONSTRICTION (a pool could cover the safe zone)

const BIOME_BLOCKING_EVENTS = {
  ion:  ['CONSTRICTION', 'PIRATES'],
  nova: ['CONSTRICTION', 'PIRATES', 'SOLAR_FLARE', 'AXIS_INVERSION', 'GRAVITY_SHIFT'],
  mine: ['CONSTRICTION'],
  lava: ['CONSTRICTION'],
};

let ionGates = [];
let supernova = null;     // one at a time
let stardust = [];
let mines = [];
let sonarPings = [];
let lavaPools = [];
let rocketHeat = 0;       // 0…1 — the rocket explodes at 1
const biomeTimers = { ion: 0, nova: 0, mine: 0, lava: 0, sonar: 0 };
const biomeNext = { ion: 0, nova: 0, mine: 0, lava: 0 };
let biomeHintShown = '';  // biome whose hint was shown since entering it

function resetBiomeHazards() {
  ionGates = [];
  supernova = null;
  stardust = [];
  mines = [];
  sonarPings = [];
  lavaPools = [];
  rocketHeat = 0;
  for (const k in biomeTimers) biomeTimers[k] = 0;
  biomeNext.ion = 5 + Math.random() * 3;
  biomeNext.nova = 6 + Math.random() * 3;
  biomeNext.mine = 2;
  biomeNext.lava = 3 + Math.random() * 2;
  biomeHintShown = '';
}

function isBiomeHazardBlocked(kind) {
  return !!(activeEvent && BIOME_BLOCKING_EVENTS[kind].includes(activeEvent.type));
}

// 0 at level 5 → 1 at level 20
function biomeIntensity() {
  return Math.min(1, Math.max(0, (diffLevel - 5) / 15));
}

function rocketHitR() {
  return Math.min(rocket.w, rocket.h) * 0.46;
}

function killRocket() {
  rocket.alive = false;
  playSfxExplosion();
  spawnExplosion(rocket.x, rocket.y, 48);
  setTimeout(showGameOver, 900);
}

function canHurtRocket() {
  return rocket && rocket.alive && rocket.invincible <= 0;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const cx = ax + dx * t, cy = ay + dy * t;
  return Math.hypot(px - cx, py - cy);
}

// Longer-lived floating hint, placed below the HUD
function showBiomeHint(text, color) {
  const w = canvas.width;
  floatingTexts.push({ x: w / 2, y: Math.max(90, topSafeY + 70), text, color, life: 3.2, maxLife: 3.2, vy: -10 });
}

function playSfxBeep(freq, dur = 0.08, vol = 0.08) {
  if (!audioCtx || muted) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch (e) { }
}

// ══════════════════════════════════════════════════════════════
//  NEON AZURE — ION GATES
// ══════════════════════════════════════════════════════════════
const ION_OFF_TIME = 1.7;      // safe window (last 0.6s flickers as a warning)
const ION_WARN_TIME = 0.6;
const ION_PYLON_R = 13;
const ION_ARC_HALF = 7;        // arc half-thickness for collision

function spawnIonGate(w, h) {
  const horizontalSweep = Math.random() < 0.5; // pair stands vertically, moves left↔right
  const span = horizontalSweep ? h : w;
  const len = span * (0.55 + Math.random() * 0.15);
  const offset = Math.random() * (span - len);
  const sweepDim = horizontalSweep ? w : h;
  const speed = sweepDim / (13 + Math.random() * 3); // crosses the field in ~13–16s
  const forward = Math.random() < 0.5 ? 1 : -1;
  const start = forward > 0 ? -30 : sweepDim + 30;
  const gate = horizontalSweep
    ? { a: { x: start, y: offset }, b: { x: start, y: offset + len }, vx: speed * forward, vy: 0 }
    : { a: { x: offset, y: start }, b: { x: offset + len, y: start }, vx: 0, vy: speed * forward };
  const intensity = biomeIntensity();
  gate.onTime = 1.1 + intensity * 0.5;  // deadly window grows with level
  gate.cycle = Math.random() * ION_OFF_TIME; // start somewhere in the safe window
  gate.alpha = 0;
  gate.fading = false;
  ionGates.push(gate);
}

function isIonArcOn(g) {
  return g.cycle >= ION_OFF_TIME;
}

function updateIonGates(dt, w, h, active) {
  const blocked = isBiomeHazardBlocked('ion');
  if (active && !blocked) {
    biomeTimers.ion += dt;
    const maxGates = diffLevel >= 12 ? 2 : 1;
    if (biomeTimers.ion >= biomeNext.ion && ionGates.filter(g => !g.fading).length < maxGates) {
      biomeTimers.ion = 0;
      biomeNext.ion = 18 + Math.random() * 8;
      spawnIonGate(w, h);
      playSfxEventAlert();
      if (biomeHintShown !== 'ion') {
        biomeHintShown = 'ion';
        showBiomeHint('ION GATE: CROSS WHEN THE ARC IS OFF', '#22d3ee');
      }
    }
  } else if (!active) {
    biomeTimers.ion = 0;
    biomeNext.ion = 5 + Math.random() * 3;
  }

  for (let i = ionGates.length - 1; i >= 0; i--) {
    const g = ionGates[i];
    if (blocked || !active) g.fading = true;
    g.alpha = g.fading ? g.alpha - dt * 2 : Math.min(1, g.alpha + dt * 2);
    g.a.x += g.vx * dt; g.a.y += g.vy * dt;
    g.b.x += g.vx * dt; g.b.y += g.vy * dt;
    const off = g.a.x < -60 && g.vx < 0 || g.a.x > w + 60 && g.vx > 0 ||
                g.a.y < -60 && g.vy < 0 || g.a.y > h + 60 && g.vy > 0;
    if (off || (g.fading && g.alpha <= 0)) { ionGates.splice(i, 1); continue; }

    const prevOn = isIonArcOn(g);
    g.cycle += dt;
    if (g.cycle >= ION_OFF_TIME + g.onTime) g.cycle -= ION_OFF_TIME + g.onTime;
    const on = isIonArcOn(g) && !g.fading;
    if (on && !prevOn && typeof playSfxSolarBeam === 'function') playSfxSolarBeam();

    // Pylons are solid
    if (canHurtRocket() && !g.fading) {
      const rr = rocketHitR();
      if (Math.hypot(rocket.x - g.a.x, rocket.y - g.a.y) < ION_PYLON_R + rr ||
          Math.hypot(rocket.x - g.b.x, rocket.y - g.b.y) < ION_PYLON_R + rr) {
        killRocket();
      }
    }
    if (!on) continue;

    // Live arc: deadly to the rocket, zaps obstacles and pirates (lure them in!)
    if (canHurtRocket() && distToSegment(rocket.x, rocket.y, g.a.x, g.a.y, g.b.x, g.b.y) < ION_ARC_HALF + rocketHitR()) {
      killRocket();
    }
    for (let j = obstacles.length - 1; j >= 0; j--) {
      const ob = obstacles[j];
      if (distToSegment(ob.x, ob.y, g.a.x, g.a.y, g.b.x, g.b.y) < ob.r * 0.8 + ION_ARC_HALF) {
        spawnExplosion(ob.x, ob.y, 10);
        obstacles.splice(j, 1);
      }
    }
    for (const p of pirates) {
      if (!p.alive || !p.active) continue;
      if (distToSegment(p.x, p.y, g.a.x, g.a.y, g.b.x, g.b.y) < p.r * 0.8 + ION_ARC_HALF) {
        if (p.hasArmor) spawnShieldBreakEffect(p.x, p.y, p.r);
        p.alive = false;
        playSfxExplosion();
        spawnExplosion(p.x, p.y, p.r * 1.8 + 12);
        score += 3;
        EL.scoreVal.textContent = score;
        spawnFloatingText(p.x, p.y - 20, '+3 ION ZAP!', '#22d3ee');
      }
    }
  }
}

function drawIonGates(ctx) {
  const t = performance.now() / 1000;
  ionGates.forEach(g => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, g.alpha);
    const on = isIonArcOn(g) && !g.fading;
    const warning = !on && g.cycle >= ION_OFF_TIME - ION_WARN_TIME;

    if (on) {
      // Jagged electric arc
      const dx = g.b.x - g.a.x, dy = g.b.y - g.a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const segs = Math.max(8, Math.round(len / 28));
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        ctx.moveTo(g.a.x, g.a.y);
        for (let s = 1; s < segs; s++) {
          const k = s / segs;
          const jit = (Math.random() - 0.5) * (pass === 0 ? 16 : 8);
          ctx.lineTo(g.a.x + dx * k + nx * jit, g.a.y + dy * k + ny * jit);
        }
        ctx.lineTo(g.b.x, g.b.y);
        ctx.strokeStyle = pass === 0 ? 'rgba(34, 211, 238, 0.9)' : '#ffffff';
        ctx.lineWidth = pass === 0 ? 6 : 2;
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 18;
        ctx.stroke();
      }
    } else {
      // Safe: faint dashed line; flickers brighter just before switching on
      const flick = warning ? (Math.sin(t * 40) > 0 ? 0.9 : 0.3) : 0.4;
      ctx.setLineDash([10, 10]);
      ctx.lineDashOffset = -t * 30;
      ctx.strokeStyle = `rgba(34, 211, 238, ${flick})`;
      ctx.lineWidth = warning ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(g.a.x, g.a.y);
      ctx.lineTo(g.b.x, g.b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Pylons
    [g.a, g.b].forEach(pt => {
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = on ? 22 : 10;
      ctx.fillStyle = '#0b1f33';
      ctx.strokeStyle = on || warning ? '#67e8f9' : '#0e7490';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, ION_PYLON_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = on ? '#ffffff' : '#22d3ee';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  });
}

// ══════════════════════════════════════════════════════════════
//  GOLDEN SUPERNOVA — SUPERNOVA SHOCK RING
// ══════════════════════════════════════════════════════════════
const NOVA_WARN_TIME = 2.4;
const NOVA_RING_SPEED = 260;   // px/s
const NOVA_RING_HALF = 8;

function spawnSupernova(w, h) {
  // Keep the star away from the rocket so there is time to reach a gap
  let x, y, tries = 0;
  do {
    x = w * (0.15 + Math.random() * 0.7);
    y = h * (0.2 + Math.random() * 0.6);
    tries++;
  } while (rocket && Math.hypot(x - rocket.x, y - rocket.y) < Math.min(w, h) * 0.35 && tries < 20);

  const intensity = biomeIntensity();
  const gapCount = diffLevel >= 15 ? 1 : 2;
  const gapWidth = 0.62 - intensity * 0.14;        // radians (~35° → ~27°)
  const base = Math.random() * Math.PI * 2;
  const gaps = [];
  for (let i = 0; i < gapCount; i++) gaps.push(base + (Math.PI * 2 / gapCount) * i + (Math.random() - 0.5) * 0.6);
  const maxR = Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y)) + 20;
  supernova = { x, y, gaps, gapWidth, state: 'WARNING', timer: 0, radius: 0, maxR, alpha: 1 };
}

function angleInGap(nova, ang) {
  return nova.gaps.some(g => {
    let d = ang - g;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d) < nova.gapWidth / 2;
  });
}

function updateSupernova(dt, w, h, active) {
  const blocked = isBiomeHazardBlocked('nova');
  if (active && !blocked) {
    biomeTimers.nova += dt;
    if (!supernova && biomeTimers.nova >= biomeNext.nova) {
      biomeTimers.nova = 0;
      biomeNext.nova = 20 + Math.random() * 8;
      spawnSupernova(w, h);
      playSfxEventAlert();
      if (biomeHintShown !== 'nova') {
        biomeHintShown = 'nova';
        showBiomeHint('SUPERNOVA: FLY INTO A GAP!', '#fde047');
      }
    }
  } else {
    // Event or other biome: no new stars; reset so the next one comes a bit later
    biomeTimers.nova = 0;
    if (!active) biomeNext.nova = 6 + Math.random() * 3;
  }

  if (supernova) {
    const n = supernova;
    if ((blocked || !active) && n.state !== 'FADING') n.state = 'FADING';
    n.timer += dt;
    if (n.state === 'WARNING') {
      if (n.timer >= NOVA_WARN_TIME) {
        n.state = 'EXPANDING';
        n.timer = 0;
        playSfxExplosion();
        spawnExplosion(n.x, n.y, 30);
        // Stardust reward left at the core
        for (let i = 0; i < 4; i++) {
          const a = Math.random() * Math.PI * 2;
          stardust.push({ x: n.x + Math.cos(a) * 30, y: n.y + Math.sin(a) * 30,
            vx: Math.cos(a) * 25, vy: Math.sin(a) * 25, life: 7, phase: Math.random() * 6 });
        }
      }
    } else if (n.state === 'EXPANDING') {
      n.radius += NOVA_RING_SPEED * dt;
      if (canHurtRocket()) {
        const d = Math.hypot(rocket.x - n.x, rocket.y - n.y);
        if (Math.abs(d - n.radius) < NOVA_RING_HALF + rocketHitR() &&
            !angleInGap(n, Math.atan2(rocket.y - n.y, rocket.x - n.x))) {
          killRocket();
        }
      }
      if (n.radius >= n.maxR) supernova = null;
    } else {
      n.alpha -= dt * 2.5;
      if (n.alpha <= 0) supernova = null;
    }
  }

  for (let i = stardust.length - 1; i >= 0; i--) {
    const s = stardust[i];
    s.life -= dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.vx *= 0.98; s.vy *= 0.98;
    if (s.life <= 0) { stardust.splice(i, 1); continue; }
    if (rocket && rocket.alive && Math.hypot(rocket.x - s.x, rocket.y - s.y) < 26) {
      score += 2;
      EL.scoreVal.textContent = score;
      spawnFloatingText(s.x, s.y - 14, '+2 STARDUST', '#fde047');
      playSfxCoin();
      stardust.splice(i, 1);
    }
  }
}

function drawSupernova(ctx) {
  const t = performance.now() / 1000;
  const n = supernova;
  if (n) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, n.alpha);
    if (n.state === 'WARNING' || n.state === 'FADING') {
      const k = Math.min(1, n.timer / NOVA_WARN_TIME);
      const pulse = 0.5 + 0.5 * Math.sin(t * (8 + k * 20));
      // Safe corridors: glowing rays along each gap
      n.gaps.forEach(g => {
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(g);
        const grd = ctx.createLinearGradient(0, 0, n.maxR, 0);
        grd.addColorStop(0, 'rgba(134, 239, 172, 0.35)');
        grd.addColorStop(1, 'rgba(134, 239, 172, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, n.maxR, -n.gapWidth / 2, n.gapWidth / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      // Collapsing star
      const coreR = 26 - k * 12;
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 30 * pulse + 10;
      ctx.fillStyle = `rgba(255, 240, 160, ${0.7 + 0.3 * pulse})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, coreR + 14 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (n.state === 'EXPANDING') {
      // Shock ring with gaps cut out
      const segStep = 0.04;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = NOVA_RING_HALF * 2;
      ctx.beginPath();
      let drawing = false;
      for (let a = 0; a <= Math.PI * 2 + segStep; a += segStep) {
        const inGap = angleInGap(n, a);
        const px = n.x + Math.cos(a) * n.radius, py = n.y + Math.sin(a) * n.radius;
        if (inGap) { drawing = false; continue; }
        if (!drawing) { ctx.moveTo(px, py); drawing = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  stardust.forEach(s => {
    const tw = 0.6 + 0.4 * Math.sin(t * 6 + s.phase);
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.life);
    ctx.translate(s.x, s.y);
    ctx.rotate(t * 2 + s.phase);
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 14;
    ctx.fillStyle = `rgba(253, 224, 71, ${tw})`;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 9 : 3.5;
      const a = (Math.PI / 4) * i;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

// ══════════════════════════════════════════════════════════════
//  DEEP ULTRAMARINE — MINEFIELD + SONAR
// ══════════════════════════════════════════════════════════════
const MINE_R = 13;
const MINE_TRIGGER_R = 100;    // rocket closer than this arms the mine
const MINE_BLAST_R = 95;
const MINE_FUSE = 1.0;         // seconds from arming to blast
const SONAR_PERIOD = 4;
const SONAR_SPEED = 700;

function spawnMine(w, h) {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  switch (edge) {
    case 0: x = Math.random() * w; y = -20; break;
    case 1: x = w + 20; y = Math.random() * h; break;
    case 2: x = Math.random() * w; y = h + 20; break;
    default: x = -20; y = Math.random() * h;
  }
  const tx = w * (0.2 + Math.random() * 0.6), ty = h * (0.2 + Math.random() * 0.6);
  const d = Math.hypot(tx - x, ty - y) || 1;
  const speed = 22 + Math.random() * 14;
  mines.push({ x, y, vx: (tx - x) / d * speed, vy: (ty - y) / d * speed,
    state: 'IDLE', fuse: 0, reveal: 0, alpha: 1, spin: Math.random() * 6, beepT: 0 });
}

function armMine(m) {
  if (m.state !== 'IDLE') return;
  m.state = 'ARMED';
  m.fuse = MINE_FUSE;
  m.reveal = 2;
}

function detonateMine(m) {
  playSfxExplosion();
  spawnExplosion(m.x, m.y, 30);
  if (canHurtRocket() && Math.hypot(rocket.x - m.x, rocket.y - m.y) < MINE_BLAST_R + rocketHitR() * 0.5) {
    killRocket();
  }
  for (let j = obstacles.length - 1; j >= 0; j--) {
    if (Math.hypot(obstacles[j].x - m.x, obstacles[j].y - m.y) < MINE_BLAST_R) {
      spawnExplosion(obstacles[j].x, obstacles[j].y, 8);
      obstacles.splice(j, 1);
    }
  }
  for (const p of pirates) {
    if (!p.alive || !p.active) continue;
    if (Math.hypot(p.x - m.x, p.y - m.y) < MINE_BLAST_R + p.r * 0.5) {
      p.alive = false;
      spawnExplosion(p.x, p.y, p.r * 1.8 + 12);
      score += 3;
      EL.scoreVal.textContent = score;
      spawnFloatingText(p.x, p.y - 20, '+3 MINE!', '#60a5fa');
    }
  }
  // Chain reaction: nearby mines arm themselves
  mines.forEach(o => {
    if (o !== m && Math.hypot(o.x - m.x, o.y - m.y) < MINE_BLAST_R * 1.2) armMine(o);
  });
}

function updateMinefield(dt, w, h, active) {
  const blocked = isBiomeHazardBlocked('mine');
  if (active && !blocked) {
    biomeTimers.mine += dt;
    const maxMines = diffLevel >= 15 ? 4 : diffLevel >= 10 ? 3 : 2;
    if (biomeTimers.mine >= biomeNext.mine && mines.filter(m => m.state !== 'FADING').length < maxMines) {
      biomeTimers.mine = 0;
      biomeNext.mine = 6 + Math.random() * 3;
      spawnMine(w, h);
      if (biomeHintShown !== 'mine') {
        biomeHintShown = 'mine';
        showBiomeHint('MINEFIELD: WATCH THE SONAR', '#60a5fa');
      }
    }
    // Ship sonar: a ping from the rocket that lights up mines it passes
    biomeTimers.sonar += dt;
    if (biomeTimers.sonar >= SONAR_PERIOD && rocket && rocket.alive) {
      biomeTimers.sonar = 0;
      sonarPings.push({ x: rocket.x, y: rocket.y, r: 0, maxR: Math.hypot(w, h) });
      playSfxBeep(1320, 0.12, 0.05);
    }
  } else if (!active) {
    biomeTimers.mine = 0;
    biomeNext.mine = 2;
    biomeTimers.sonar = 0;
  }

  for (let i = sonarPings.length - 1; i >= 0; i--) {
    const s = sonarPings[i];
    const prevR = s.r;
    s.r += SONAR_SPEED * dt;
    mines.forEach(m => {
      const d = Math.hypot(m.x - s.x, m.y - s.y);
      if (d >= prevR && d < s.r) m.reveal = 1.6;
    });
    if (s.r > s.maxR) sonarPings.splice(i, 1);
  }

  for (let i = mines.length - 1; i >= 0; i--) {
    const m = mines[i];
    if ((blocked || !active) && m.state === 'IDLE') m.state = 'FADING';
    m.x += m.vx * dt; m.y += m.vy * dt;
    m.spin += dt;
    m.reveal = Math.max(0, m.reveal - dt);

    if (m.state === 'FADING') {
      m.alpha -= dt * 1.5;
      if (m.alpha <= 0) mines.splice(i, 1);
      continue;
    }
    if (m.x < -80 || m.x > w + 80 || m.y < -80 || m.y > h + 80) { mines.splice(i, 1); continue; }

    if (m.state === 'IDLE') {
      if (rocket && rocket.alive && Math.hypot(rocket.x - m.x, rocket.y - m.y) < MINE_TRIGGER_R) armMine(m);
      // Obstacles bumping into a mine also arm it (same fuse — never an unannounced blast)
      for (const ob of obstacles) {
        if (Math.hypot(ob.x - m.x, ob.y - m.y) < ob.r + MINE_R) { armMine(m); break; }
      }
    } else if (m.state === 'ARMED') {
      m.fuse -= dt;
      m.reveal = 2;
      m.beepT -= dt;
      if (m.beepT <= 0) { m.beepT = 0.18; playSfxBeep(980, 0.05, 0.06); }
      if (m.fuse <= 0) {
        detonateMine(m);
        mines.splice(i, 1);
        continue;
      }
    }
    // Touching the mine body is instant
    if (canHurtRocket() && Math.hypot(rocket.x - m.x, rocket.y - m.y) < MINE_R + rocketHitR()) {
      detonateMine(m);
      mines.splice(i, 1);
    }
  }
}

function drawMinefield(ctx) {
  const t = performance.now() / 1000;
  sonarPings.forEach(s => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.35 * (1 - s.r / s.maxR));
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  mines.forEach(m => {
    const armed = m.state === 'ARMED';
    const vis = armed ? 1 : 0.22 + 0.78 * Math.min(1, m.reveal / 0.8);
    ctx.save();
    ctx.globalAlpha = Math.max(0, vis * m.alpha);

    if (armed) {
      // Blast radius warning
      const blink = Math.sin(t * 30) > 0 ? 0.35 : 0.15;
      ctx.fillStyle = `rgba(239, 68, 68, ${blink})`;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m.x, m.y, MINE_BLAST_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.translate(m.x, m.y);
    ctx.rotate(m.spin);
    // Spikes
    ctx.strokeStyle = armed ? '#f87171' : '#93c5fd';
    ctx.lineWidth = 3;
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI / 4) * k;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * MINE_R * 0.7, Math.sin(a) * MINE_R * 0.7);
      ctx.lineTo(Math.cos(a) * (MINE_R + 6), Math.sin(a) * (MINE_R + 6));
      ctx.stroke();
    }
    // Body
    ctx.shadowColor = armed ? '#ef4444' : '#3b82f6';
    ctx.shadowBlur = armed ? 18 : 8;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = armed ? '#ef4444' : '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, MINE_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = armed ? (Math.sin(t * 30) > 0 ? '#ff4444' : '#7f1d1d') : '#60a5fa';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ══════════════════════════════════════════════════════════════
//  FIERY MAGMA — LAVA POOLS + OVERHEAT
// ══════════════════════════════════════════════════════════════
const LAVA_WARM_TIME = 1.6;    // cracks glow, no heat yet
const LAVA_COOL_TIME = 1.5;
const HEAT_GAIN = 0.5;         // per second inside lava → 2s to overheat
const HEAT_LOSS = 0.4;         // per second outside

function spawnLavaPool(w, h) {
  const intensity = biomeIntensity();
  const maxR = 90 + Math.random() * 40 + intensity * 30;
  let x, y, tries = 0;
  do {
    x = w * (0.12 + Math.random() * 0.76);
    y = h * (0.15 + Math.random() * 0.7);
    tries++;
  } while (rocket && Math.hypot(x - rocket.x, y - rocket.y) < maxR + 90 && tries < 20);
  lavaPools.push({ x, y, maxR, r: 0, state: 'WARMING', timer: 0,
    hotTime: 7 + Math.random() * 3, seed: Math.random() * 10 });
}

function updateLavaPools(dt, w, h, active) {
  const blocked = isBiomeHazardBlocked('lava');
  if (active && !blocked) {
    biomeTimers.lava += dt;
    const maxPools = diffLevel >= 12 ? 3 : 2;
    if (biomeTimers.lava >= biomeNext.lava && lavaPools.filter(p => p.state !== 'COOLING').length < maxPools) {
      biomeTimers.lava = 0;
      biomeNext.lava = 7 + Math.random() * 4;
      spawnLavaPool(w, h);
      if (biomeHintShown !== 'lava') {
        biomeHintShown = 'lava';
        showBiomeHint("LAVA: DON'T OVERHEAT!", '#fb923c');
      }
    }
  } else if (!active) {
    biomeTimers.lava = 0;
    biomeNext.lava = 3 + Math.random() * 2;
  }

  let inLava = false;
  for (let i = lavaPools.length - 1; i >= 0; i--) {
    const p = lavaPools[i];
    if ((blocked || !active) && p.state !== 'COOLING') { p.state = 'COOLING'; p.timer = 0; }
    p.timer += dt;
    if (p.state === 'WARMING') {
      p.r = p.maxR * Math.min(1, p.timer / LAVA_WARM_TIME);
      if (p.timer >= LAVA_WARM_TIME) { p.state = 'HOT'; p.timer = 0; }
    } else if (p.state === 'HOT') {
      p.r = p.maxR;
      if (p.timer >= p.hotTime) { p.state = 'COOLING'; p.timer = 0; }
      if (rocket && rocket.alive && Math.hypot(rocket.x - p.x, rocket.y - p.y) < p.r) inLava = true;
      if (Math.random() < dt * 6) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * p.r * 0.8;
        addParticle({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, vx: 0, vy: -30 - Math.random() * 30,
          life: 0.8, maxLife: 0.8, size: 2 + Math.random() * 3, color: Math.random() < 0.5 ? '#fb923c' : '#fde047',
          type: 'circle', grav: -10 });
      }
    } else {
      if (p.timer >= LAVA_COOL_TIME) { lavaPools.splice(i, 1); continue; }
    }
  }

  if (rocket && rocket.alive) {
    if (inLava && rocket.invincible <= 0) rocketHeat = Math.min(1, rocketHeat + HEAT_GAIN * dt);
    else rocketHeat = Math.max(0, rocketHeat - HEAT_LOSS * dt);
    if (rocketHeat >= 1 && canHurtRocket()) {
      spawnFloatingText(rocket.x, rocket.y - 30, 'OVERHEATED!', '#ef4444');
      killRocket();
    }
  }
}

function drawLavaPools(ctx) {
  const t = performance.now() / 1000;
  lavaPools.forEach(p => {
    if (p.r <= 1) return;
    const cooling = p.state === 'COOLING';
    const warming = p.state === 'WARMING';
    const fade = cooling ? Math.max(0, 1 - p.timer / LAVA_COOL_TIME) : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    const wob = 1 + Math.sin(t * 3 + p.seed) * 0.03;
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * wob);
    if (warming) {
      grd.addColorStop(0, 'rgba(251, 146, 60, 0.35)');
      grd.addColorStop(1, 'rgba(120, 30, 0, 0.15)');
    } else {
      grd.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      grd.addColorStop(0.45, 'rgba(249, 115, 22, 0.85)');
      grd.addColorStop(0.85, 'rgba(185, 28, 28, 0.75)');
      grd.addColorStop(1, 'rgba(60, 10, 0, 0.6)');
    }
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * wob, 0, Math.PI * 2);
    ctx.fill();
    // Crust edge — dashed while warming so it reads as "about to be hot"
    if (warming) ctx.setLineDash([10, 8]);
    ctx.strokeStyle = warming ? 'rgba(251, 146, 60, 0.9)' : 'rgba(255, 200, 120, 0.9)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();
  });
}

// Heat ring around the rocket (only while warm)
function drawRocketHeat(ctx) {
  if (!rocket || !rocket.alive || rocketHeat <= 0.01) return;
  const t = performance.now() / 1000;
  const danger = rocketHeat > 0.7;
  ctx.save();
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.arc(rocket.x, rocket.y, 34, 0, Math.PI * 2);
  ctx.stroke();
  const r = Math.round(253 - rocketHeat * 14), g = Math.round(224 - rocketHeat * 180);
  ctx.strokeStyle = danger && Math.sin(t * 25) > 0 ? '#ffffff' : `rgb(${r}, ${g}, 40)`;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(rocket.x, rocket.y, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rocketHeat);
  ctx.stroke();
  ctx.restore();
}

// ══════════════════════════════════════════════════════════════
//  Hooks called from the game loop
// ══════════════════════════════════════════════════════════════
function updateBiomeHazards(dt, w, h) {
  updateIonGates(dt, w, h, isNeonAzureTheme());
  updateSupernova(dt, w, h, isGoldenSupernovaTheme());
  updateMinefield(dt, w, h, isUltramarineTheme());
  updateLavaPools(dt, w, h, isMagmaTheme());
}

// Ground-level layers (under obstacles)
function drawBiomeHazardsBelow(ctx) {
  if (lavaPools.length) drawLavaPools(ctx);
}

// Layers drawn over obstacles
function drawBiomeHazardsAbove(ctx) {
  if (mines.length || sonarPings.length) drawMinefield(ctx);
  if (ionGates.length) drawIonGates(ctx);
  if (supernova || stardust.length) drawSupernova(ctx);
  drawRocketHeat(ctx);
}

// Keep hazards in place when the playfield is resized (see input.js)
function rescaleBiomeHazards(sx, sy) {
  ionGates.forEach(g => { g.a.x *= sx; g.a.y *= sy; g.b.x *= sx; g.b.y *= sy; });
  if (supernova) { supernova.x *= sx; supernova.y *= sy; }
  [stardust, mines, sonarPings, lavaPools].forEach(list => list.forEach(e => { e.x *= sx; e.y *= sy; }));
}
