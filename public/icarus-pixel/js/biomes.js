// ─── Biome Hazards ────────────────────────────────────────────
// Unique hazards for the four biomes that had no mechanic of their own:
//   Neon Azure        → Ion Gates      (pylon pair with a pulsing electric arc)
//   Golden Supernova  → Supernova      (expanding shock ring with safe gaps)
//   Deep Ultramarine  → Minefield      (invisible mines, revealed only by sonar)
//   Fiery Magma       → Eruptions      (fireballs arc up from the bottom edge and fall back)
//
// Event compatibility — a biome hazard must never make an event unwinnable.
// While a listed event is active, the hazard stops spawning and existing
// pieces fade out harmlessly:
//   Ion Gates   — CONSTRICTION (could wall off the safe zone), PIRATES (flagship salvos)
//   Supernova   — every event (dodging the ring needs free movement)
//   Minefield   — CONSTRICTION (no room to flee a mine inside the zone)
//   Eruptions   — CONSTRICTION (fireballs through the small safe zone leave no room to dodge)

const BIOME_BLOCKING_EVENTS = {
  ion:   ['CONSTRICTION', 'PIRATES'],
  nova:  ['CONSTRICTION', 'PIRATES', 'SOLAR_FLARE', 'AXIS_INVERSION', 'GRAVITY_SHIFT'],
  mine:  ['CONSTRICTION'],
  magma: ['CONSTRICTION'],
};

let ionGates = [];
let supernova = null;     // one at a time
let mines = [];
let sonarPings = [];
let magmaVents = [];      // telegraphed eruption points on the bottom edge
let fireballs = [];
const biomeTimers = { ion: 0, nova: 0, mine: 0, magma: 0, sonar: 0 };
const biomeNext = { ion: 0, nova: 0, mine: 0, magma: 0 };
let biomeHintShown = '';  // biome whose hint was shown since entering it

function resetBiomeHazards() {
  ionGates = [];
  supernova = null;
  mines = [];
  sonarPings = [];
  magmaVents = [];
  fireballs = [];
  for (const k in biomeTimers) biomeTimers[k] = 0;
  biomeNext.ion = 5 + Math.random() * 3;
  biomeNext.nova = 6 + Math.random() * 3;
  biomeNext.mine = 2;
  biomeNext.magma = 3 + Math.random() * 2;
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
        runStats.ionKills++;
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
        spawnExplosion(n.x, n.y, 20);
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
      // The ring burns everything it sweeps over (anything inside a gap survives)
      const hitsRing = (x, y, r) =>
        Math.abs(Math.hypot(x - n.x, y - n.y) - n.radius) < NOVA_RING_HALF + r &&
        !angleInGap(n, Math.atan2(y - n.y, x - n.x));
      for (let j = obstacles.length - 1; j >= 0; j--) {
        const ob = obstacles[j];
        if (hitsRing(ob.x, ob.y, ob.r * 0.8)) {
          spawnExplosion(ob.x, ob.y, 8);
          obstacles.splice(j, 1);
        }
      }
      for (const p of pirates) {
        if (!p.alive || !p.active || !hitsRing(p.x, p.y, p.r * 0.8)) continue;
        if (p.hasArmor) spawnShieldBreakEffect(p.x, p.y, p.r);
        p.alive = false;
        playSfxExplosion();
        spawnExplosion(p.x, p.y, p.r * 1.8 + 12);
        score += 3;
        EL.scoreVal.textContent = score;
        spawnFloatingText(p.x, p.y - 20, '+3 SUPERNOVA!', '#fde047');
      }
      toxicBarrels.forEach(b => {
        if (b.alive && hitsRing(b.x, b.y, b.r)) detonateToxicBarrel(b);
      });
      if (n.radius >= n.maxR) {
        if (rocket && rocket.alive) runStats.novasSurvived++;
        supernova = null;
      }
    } else {
      n.alpha -= dt * 2.5;
      if (n.alpha <= 0) supernova = null;
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
      // Shock ring with gaps cut out. Glow is a wide translucent stroke instead
      // of shadowBlur — blurring a screen-sized ring every frame caused lag.
      const segStep = 0.04;
      ctx.beginPath();
      let drawing = false;
      for (let a = 0; a <= Math.PI * 2 + segStep; a += segStep) {
        const inGap = angleInGap(n, a);
        const px = n.x + Math.cos(a) * n.radius, py = n.y + Math.sin(a) * n.radius;
        if (inGap) { drawing = false; continue; }
        if (!drawing) { ctx.moveTo(px, py); drawing = true; } else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.lineWidth = NOVA_RING_HALF * 2 + 16;
      ctx.stroke();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = NOVA_RING_HALF * 2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ══════════════════════════════════════════════════════════════
//  DEEP ULTRAMARINE — MINEFIELD + SONAR
// ══════════════════════════════════════════════════════════════
const MINE_R = 13;
const MINE_TRIGGER_R = 120;    // rocket closer than this arms the mine
const MINE_BLAST_R = 150;
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
  const speed = 32 + Math.random() * 18;
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
      runStats.mineKills++;
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

    // Pirates crash into mines: the pirate blows up on contact and the mine arms
    for (const p of pirates) {
      if (!p.alive || !p.active) continue;
      if (Math.hypot(p.x - m.x, p.y - m.y) < p.r * 0.8 + MINE_R) {
        p.alive = false;
        playSfxExplosion();
        spawnExplosion(p.x, p.y, p.r * 1.8 + 12);
        score += 3;
        EL.scoreVal.textContent = score;
        spawnFloatingText(p.x, p.y - 20, '+3 MINE!', '#60a5fa');
        runStats.mineKills++;
        armMine(m);
      }
    }

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
    // Fully invisible until a sonar ping (or arming) lights it up
    const vis = armed ? 1 : Math.min(1, m.reveal / 0.8);
    if (vis <= 0.01) return;
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
    ctx.shadowBlur = armed ? 18 : (m.reveal > 0 ? 8 : 0);
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
//  FIERY MAGMA — ERUPTIONS
// ══════════════════════════════════════════════════════════════
// Each eruption opens two vents at once — one on the bottom edge, one on the top
// edge (its gravity is mirrored, so those fireballs shoot down and fall back up).
// A vent glows and shows the dotted arcs its fireballs will fly; then it fires
// 1–3 fireballs one after another like a cannon. They follow real ballistic arcs —
// one shared gravity, each ball with its own launch angle and power — so the
// volley fans out unpredictably, yet every arc is previewed.
// A fireball that hits a pirate bursts and takes nearby pirates with it.
const ERUPT_WARN = 1.3;        // seconds of vent glow + trajectory preview
const FIREBALL_R = 15;
const FIREBALL_BLAST_R = 75;   // burst radius when a fireball hits a pirate

// Position of a fireball s seconds after launch (shared by preview and flight)
function fireballPos(x0, y0, b, s) {
  return { x: x0 + b.vx * s, y: y0 + b.vy0 * s + 0.5 * b.g * s * s };
}

// side: 'bottom' (fires up, falls back down) or 'top' (fires down, falls back up)
function spawnMagmaVent(w, h, side, x) {
  const dir = side === 'top' ? 1 : -1;               // launch direction along y
  const edgeY = side === 'top' ? 0 : h;
  const y0 = edgeY - dir * 20;                       // just beyond the edge
  const count = diffLevel < 8 ? 1 : diffLevel < 14 ? 1 + (Math.random() < 0.5 ? 1 : 0) : 2 + (Math.random() < 0.5 ? 1 : 0);
  // One gravity per eruption: a 60%-height shot takes ~1.4s to reach its apex
  const gAbs = 2 * h * 0.6 / (1.4 * 1.4);
  const balls = [];
  for (let i = 0; i < count; i++) {
    const apex = h * (0.3 + Math.random() * 0.55);    // launch power
    const speedY = Math.sqrt(2 * gAbs * apex);
    const flight = 2 * speedY / gAbs;
    const tilt = (4 + Math.random() * 30) * Math.PI / 180 * (Math.random() < 0.5 ? -1 : 1);
    let vx = Math.tan(tilt) * speedY;
    // Keep the landing point on screen: flip the tilt, then tame it if still off
    let landX = x + vx * flight;
    if (landX < w * 0.03 || landX > w * 0.97) { vx = -vx; landX = x + vx * flight; }
    if (landX < w * 0.03 || landX > w * 0.97) vx *= 0.3;
    balls.push({ vx, vy0: dir * speedY, g: -dir * gAbs, delay: i * (0.18 + Math.random() * 0.3), r: FIREBALL_R + Math.random() * 5 });
  }
  magmaVents.push({ x, side, edgeY, y0, timer: 0, launched: 0, balls });
}

// Muzzle blast at the vent: flash ring + a cone of lava debris along the shot
function spawnVentBlast(x, edgeY, b) {
  const ang = Math.atan2(b.vy0, b.vx);
  addParticle({ x, y: edgeY, vx: 0, vy: 0, life: 0.35, maxLife: 0.35, size: 10, maxSize: 70,
    color: '#fdba74', type: 'ring', grav: 0 });
  for (let i = 0; i < 16; i++) {
    const a = ang + (Math.random() - 0.5) * 0.7;
    const spd = 180 + Math.random() * 380;
    const life = 0.35 + Math.random() * 0.4;
    addParticle({ x: x + (Math.random() - 0.5) * 16, y: edgeY, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      life, maxLife: life, size: 2 + Math.random() * 4,
      color: ['#fde047', '#fb923c', '#ef4444', '#fff7ed'][i % 4],
      type: Math.random() < 0.5 ? 'square' : 'circle', rot: Math.random() * 6, rotV: (Math.random() - 0.5) * 10,
      grav: Math.sign(b.g) * 500 });
  }
}

function burstFireball(f) {
  playSfxExplosion();
  spawnExplosion(f.x, f.y, 22);
  addParticle({ x: f.x, y: f.y, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, size: 8, maxSize: FIREBALL_BLAST_R,
    color: '#fb923c', type: 'ring', grav: 0 });
  for (const p of pirates) {
    if (!p.alive || !p.active) continue;
    if (Math.hypot(p.x - f.x, p.y - f.y) < FIREBALL_BLAST_R + p.r * 0.5) {
      if (p.hasArmor) spawnShieldBreakEffect(p.x, p.y, p.r);
      p.alive = false;
      spawnExplosion(p.x, p.y, p.r * 1.8 + 12);
      score += 3;
      EL.scoreVal.textContent = score;
      spawnFloatingText(p.x, p.y - 20, '+3 MAGMA!', '#fb923c');
      runStats.magmaKills++;
    }
  }
}

function updateEruptions(dt, w, h, active) {
  const blocked = isBiomeHazardBlocked('magma');
  if (active && !blocked) {
    biomeTimers.magma += dt;
    if (biomeTimers.magma >= biomeNext.magma) {
      biomeTimers.magma = 0;
      biomeNext.magma = 5.5 + Math.random() * 2.5;
      // Bottom and top vents erupt together, at clearly different x positions
      const xBottom = w * (0.08 + Math.random() * 0.84);
      let xTop = xBottom + w * (0.3 + Math.random() * 0.4) * (Math.random() < 0.5 ? -1 : 1);
      if (xTop < w * 0.08 || xTop > w * 0.92) xTop = w - xBottom;
      spawnMagmaVent(w, h, 'bottom', xBottom);
      spawnMagmaVent(w, h, 'top', xTop);
      if (biomeHintShown !== 'magma') {
        biomeHintShown = 'magma';
        showBiomeHint('ERUPTIONS: WATCH THE GLOWING EDGES', '#fb923c');
      }
    }
  } else {
    if (!active) {
      biomeTimers.magma = 0;
      biomeNext.magma = 3 + Math.random() * 2;
    }
    // Blocked by an event or biome left: cancel pending vents, fizzle airborne fireballs
    magmaVents = [];
    fireballs.forEach(f => spawnExplosion(f.x, f.y, 6));
    fireballs = [];
  }

  for (let i = magmaVents.length - 1; i >= 0; i--) {
    const v = magmaVents[i];
    v.timer += dt;
    while (v.launched < v.balls.length && v.timer >= ERUPT_WARN + v.balls[v.launched].delay) {
      const b = v.balls[v.launched++];
      playSfxExplosion();
      spawnVentBlast(v.x, v.edgeY, b);
      fireballs.push({ x0: v.x, y0: v.y0, x: v.x, y: v.y0, age: 0, b: { ...b }, spin: Math.random() * 6 });
    }
    if (v.launched >= v.balls.length) magmaVents.splice(i, 1);
  }

  for (let i = fireballs.length - 1; i >= 0; i--) {
    const f = fireballs[i];
    f.age += dt;
    const pos = fireballPos(f.x0, f.y0, f.b, f.age);
    f.x = pos.x;
    f.y = pos.y;
    f.spin += dt * 6;
    const vy = f.b.vy0 + f.b.g * f.age;
    // Gone once it is falling back (moving along its gravity) and past an edge
    if (Math.sign(vy) === Math.sign(f.b.g) && (f.y > h + 60 || f.y < -60)) { fireballs.splice(i, 1); continue; }
    // Ember trail streaming behind the ball
    if (Math.random() < dt * 40) {
      const life = 0.3 + Math.random() * 0.3;
      addParticle({ x: f.x + (Math.random() - 0.5) * f.b.r, y: f.y + (Math.random() - 0.5) * f.b.r,
        vx: -f.b.vx * 0.15 + (Math.random() - 0.5) * 30, vy: -vy * 0.15 + (Math.random() - 0.5) * 30,
        life, maxLife: life, size: 2 + Math.random() * 4,
        color: Math.random() < 0.5 ? '#fb923c' : '#fde047', type: 'circle', grav: Math.sign(f.b.g) * 60 });
    }

    if (canHurtRocket() && Math.hypot(rocket.x - f.x, rocket.y - f.y) < f.b.r * 0.85 + rocketHitR()) {
      killRocket();
    }
    const hitPirate = pirates.some(p => p.alive && p.active && Math.hypot(p.x - f.x, p.y - f.y) < f.b.r + p.r * 0.9);
    if (hitPirate) {
      burstFireball(f);
      fireballs.splice(i, 1);
    }
  }
}

function drawMagmaVents(ctx, w, h) {
  const t = performance.now() / 1000;
  magmaVents.forEach(v => {
    const k = Math.min(1, v.timer / ERUPT_WARN);
    const pulse = 0.5 + 0.5 * Math.sin(t * (10 + k * 25));
    ctx.save();
    // Glowing half-disc vent on its edge (bottom or top)
    const grd = ctx.createRadialGradient(v.x, v.edgeY, 0, v.x, v.edgeY, 70);
    grd.addColorStop(0, `rgba(254, 240, 138, ${0.5 + 0.4 * pulse})`);
    grd.addColorStop(0.4, `rgba(249, 115, 22, ${0.45 + 0.3 * pulse})`);
    grd.addColorStop(1, 'rgba(185, 28, 28, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    if (v.side === 'top') ctx.arc(v.x, v.edgeY, 70, 0, Math.PI);
    else ctx.arc(v.x, v.edgeY, 70, Math.PI, Math.PI * 2);
    ctx.fill();
    // Dotted preview of each fireball still to launch
    ctx.fillStyle = `rgba(251, 146, 60, ${0.35 + 0.45 * pulse})`;
    v.balls.slice(v.launched).forEach(b => {
      for (let s = 0.06; s < 6; s += 0.06) {
        const p = fireballPos(v.x, v.y0, b, s);
        if ((p.y - v.y0) * Math.sign(b.vy0) < 0) break;   // fell back past its edge
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  });
}

function drawFireballs(ctx) {
  fireballs.forEach(f => {
    const r = f.b.r;
    const vx = f.b.vx, vy = f.b.vy0 + f.b.g * f.age;
    const speed = Math.hypot(vx, vy);
    const stretch = 1 + Math.min(0.8, speed / 900);  // faster → longer streak
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(Math.atan2(vy, vx));
    // Flame tail behind the ball, pointing against the motion
    const tail = ctx.createLinearGradient(0, 0, -r * 4 * stretch, 0);
    tail.addColorStop(0, 'rgba(251, 146, 60, 0.75)');
    tail.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.quadraticCurveTo(-r * 2.5 * stretch, 0, 0, r * 0.9);
    ctx.lineTo(-r * 4 * stretch, 0);
    ctx.closePath();
    ctx.fill();
    // Outer heat haze
    ctx.fillStyle = 'rgba(249, 115, 22, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.8 * stretch, r * 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Molten core, slightly stretched along the flight path
    const core = ctx.createRadialGradient(r * 0.3, -r * 0.2, 0, 0, 0, r * stretch);
    core.addColorStop(0, '#fffbeb');
    core.addColorStop(0.35, '#fde047');
    core.addColorStop(0.7, '#f97316');
    core.addColorStop(1, '#991b1b');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * stretch, r, 0, 0, Math.PI * 2);
    ctx.fill();
    // Dark crust cracks tumbling on the surface
    ctx.strokeStyle = 'rgba(69, 10, 10, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, f.spin, f.spin + 1.2);
    ctx.stroke();
    ctx.restore();
  });
}

// ══════════════════════════════════════════════════════════════
//  Hooks called from the game loop
// ══════════════════════════════════════════════════════════════
function updateBiomeHazards(dt, w, h) {
  updateIonGates(dt, w, h, isNeonAzureTheme());
  updateSupernova(dt, w, h, isGoldenSupernovaTheme());
  updateMinefield(dt, w, h, isUltramarineTheme());
  updateEruptions(dt, w, h, isMagmaTheme());
}

// Ground-level layers (under obstacles)
function drawBiomeHazardsBelow(ctx) {
  if (magmaVents.length) drawMagmaVents(ctx, canvas.width, canvas.height);
}

// Layers drawn over obstacles
function drawBiomeHazardsAbove(ctx) {
  if (mines.length || sonarPings.length) drawMinefield(ctx);
  if (ionGates.length) drawIonGates(ctx);
  if (supernova) drawSupernova(ctx);
  if (fireballs.length) drawFireballs(ctx);
}

function scaleFireballPath(b, sx, sy) {
  b.vx *= sx;
  b.vy0 *= sy; b.g *= sy;
}

// Keep hazards in place when the playfield is resized (see input.js)
function rescaleBiomeHazards(sx, sy) {
  ionGates.forEach(g => { g.a.x *= sx; g.a.y *= sy; g.b.x *= sx; g.b.y *= sy; });
  if (supernova) { supernova.x *= sx; supernova.y *= sy; }
  [mines, sonarPings].forEach(list => list.forEach(e => { e.x *= sx; e.y *= sy; }));
  magmaVents.forEach(v => {
    v.x *= sx; v.edgeY *= sy; v.y0 *= sy;
    v.balls.forEach(b => scaleFireballPath(b, sx, sy));
  });
  fireballs.forEach(f => {
    f.x0 *= sx; f.x *= sx; f.y0 *= sy; f.y *= sy;
    scaleFireballPath(f.b, sx, sy);
  });
}
