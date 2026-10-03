// ─── Difficulty ───────────────────────────────────────────────
// Returns a smooth difficulty multiplier (obstacle speed = base × (1 + scale)):
//   levels 1–6   → +0.16/lvl  (0 … 0.80)   — early game unchanged
//   levels 6–10  → +0.04/lvl  (0.80 … 0.96)
//   levels 10–15 → +0.02/lvl  (0.96 … 1.06)
//   levels 15+   → +0.01/lvl, capped at 1.20
// The old curve hit 1.12 by level 8, so obstacles flew at 2.1× base speed
// (well above the rocket's 320 px/s) and late levels became unplayable.
function getDiffScale(level) {
  if (level <= 6) return (level - 1) * 0.16;
  if (level <= 10) return 0.80 + (level - 6) * 0.04;
  if (level <= 15) return 0.96 + (level - 10) * 0.02;
  return Math.min(1.20, 1.06 + (level - 15) * 0.01);
}

// Rocket top speed: from level 7 the ship gets slightly faster (+2.5%/lvl, max +25%)
// so the player can keep up with the denser late-game field
function getRocketSpeed() {
  return ROCKET_SPEED * (1 + Math.min(0.25, Math.max(0, diffLevel - 6) * 0.025));
}

function getSpawnInterval() {
  const isPurple = isPurpleSpaceTheme();
  const isGreen = isGreenZoneTheme();
  const inSynthwave = typeof isSynthwaveTheme === 'function' && isSynthwaveTheme();
  const isCrimson = typeof isCrimsonTheme === 'function' && isCrimsonTheme();
  // Interval multipliers balance each biome's own hazard against obstacle density:
  // Purple Space: a bit fewer obstacles than normal — frequent black holes (pull + control inversion)
  // Green Zone: a bit fewer obstacles than normal — toxic fog hides what is coming
  // Synthwave Magenta: most spawns are splitting asteroids (a big one becomes 2–4
  //   fragments, a mega one up to ~8), so spawns are rarer — field ends up ~30% busier than normal
  // Crimson Pulsar: solar push waves are the main threat, so the field stays sparse
  // Neon Azure / Golden Supernova / Deep Ultramarine / Fiery Magma: their biome hazard
  //   (biomes.js) replaces part of the obstacle density
  const multiplier = isGreen ? 1.35 : (isPurple ? 1.3 : (inSynthwave ? 1.25 : (isCrimson ? 2.0 :
    (isBiomeHazardTheme() ? 1.3 : 1.0))));

  // Pirates event: slightly reduced obstacles so combat feels dynamic with obstacles colliding into mothership
  if (activeEvent && activeEvent.type === 'PIRATES') {
    return Math.max(1.8, 3.2 - getDiffScale(diffLevel) * 1.2) * multiplier;
  }
  // Normal: 2.25s at level 1 → floor 0.95s
  return Math.max(0.95, 2.25 - getDiffScale(diffLevel) * 1.2) * multiplier;
}

// ─── EVENT SYSTEM ─────────────────────────────────────────────
// An event starts every 3 levels (4, 7, 10, 13…) and ends at the next level-up.
// Rules: the same type never comes twice in a row, and at most twice per run.
// Only once every allowed type has been used up does a fresh cycle begin
// (5 types × 2 = 10 events, i.e. around level 31).
const EVENT_TYPES = ['CONSTRICTION', 'PIRATES', 'SOLAR_FLARE', 'AXIS_INVERSION', 'GRAVITY_SHIFT'];

// Solar flare state: array of beam objects
let solarFlares = [];

function pickEventForLevel(level) {
  if (!eventPlan[level]) {
    const planned = Object.keys(eventPlan).map(Number).sort((a, b) => a - b);
    const prev = planned.length ? eventPlan[planned[planned.length - 1]] : null;

    // Crimson Pulsar: no CONSTRICTION / GRAVITY_SHIFT — the solar waves would make them unwinnable
    const isCrimson = typeof isCrimsonTheme === 'function' && isCrimsonTheme();
    const allowed = EVENT_TYPES.filter(t => !isCrimson || (t !== 'CONSTRICTION' && t !== 'GRAVITY_SHIFT'));

    // Uses of each type in the current cycle
    const counts = {};
    EVENT_TYPES.forEach(t => { counts[t] = 0; });
    planned.forEach(lvl => { if (lvl >= eventCycleStartLevel) counts[eventPlan[lvl]]++; });

    let pool = allowed.filter(t => counts[t] < 2 && t !== prev);
    if (pool.length === 0) {
      // Everything allowed is used up: start a fresh cycle (still never repeat the previous one)
      eventCycleStartLevel = level;
      pool = allowed.filter(t => t !== prev);
    }

    eventPlan[level] = pool[Math.floor(Math.random() * pool.length)];
  }

  return eventPlan[level];
}

function startEvent(level, w, h) {
  const type = pickEventForLevel(level);
  const intensity = Math.min(1, (level - 1) / 20); // 0..1 based on level
  activeEvent = {
    type,
    level,
    timer: 0,
    bannerTimer: 4.0, // show banner for 4 seconds
    intensity,
  };

  if (type === 'CONSTRICTION') {
    // Zone = center 50% of screen
    const zoneW = w * (0.5 - intensity * 0.1); // shrinks more at higher levels
    const zoneH = h * (0.5 - intensity * 0.1);
    eventBounds = {
      active: true,
      cx: w / 2,
      cy: h / 2,
      zoneW,
      zoneH,
      graceTimer: 5.0, // 5 seconds grace period to reach the safe zone
      isDeadly: false,
      wallAlpha: 0,
    };
  } else if (type === 'PIRATES') {
    activeEvent.pirateSpawnTimer = 0;
    activeEvent.piratesSpawned = 0;
    activeEvent.maxPirates = 5 + Math.round(intensity * 5); // 5 to 10 pirates total from edges
    activeEvent.pirateSpawnInterval = Math.max(1.8, 2.6 - intensity * 0.8); // 1.8s - 2.6s between reinforcement waves
    // Keep existing pirates on the map so they don't vanish when flagship arrives
    pirates = pirates.filter(p => p.alive);
    spawnPirateMothership(w, h, intensity);

    // Immediately dispatch initial vanguard of 2 escort pirates from edges alongside the flagship
    const firstWave = Math.min(2, activeEvent.maxPirates);
    for (let k = 0; k < firstWave; k++) {
      spawnPirate(w, h);
      activeEvent.piratesSpawned++;
    }
    playSfxPirateAlert();
    spawnFloatingText(w / 2, 70, '☠ PIRATE FLEET ATTACKS! ☠', '#ef4444');
  } else if (type === 'SOLAR_FLARE') {
    solarFlares = [];
    activeEvent.flareTimer = 0;   // controls when next batch of flares spawns
    activeEvent.flaresDone = 0;   // how many flare waves have fired
    activeEvent.maxFlareWaves = 2 + Math.round(intensity * 2); // 2-4 waves total
    activeEvent.flareCooldown = 4.5 - intensity * 1.5; // 3-4.5s between waves
    // Trigger first wave immediately after banner
    activeEvent.flareTimer = 3.8; // will reach 4.0 just as banner fades
  } else if (type === 'AXIS_INVERSION') {
    // Random single-axis inversion as requested by user:
    // "Вариант А (Инверсия горизонтали): Лево/Право меняются местами, а Вверх/Вниз работают как обычно.
    //  Вариант Б (Инверсия вертикали): Вверх/Вниз меняются, а Лево/Право — нет."
    activeEvent.invertAxis = Math.random() < 0.5 ? 'X' : 'Y';
    playSfxPolarityWarp();
  } else if (type === 'GRAVITY_SHIFT') {
    const directions = [
      { id: 'DOWN',  x: 0,  y: 1,  label: 'DOWN',   icon: '\u25bc', arrow: '\u2193\u2193\u2193' },
      { id: 'UP',    x: 0,  y: -1, label: 'UP',  icon: '\u25b2', arrow: '\u2191\u2191\u2191' },
      { id: 'LEFT',  x: -1, y: 0,  label: 'LEFT',  icon: '\u25c0', arrow: '\u2190\u2190\u2190' },
      { id: 'RIGHT', x: 1,  y: 0,  label: 'RIGHT', icon: '\u25b6', arrow: '\u2192\u2192\u2192' },
    ];
    activeEvent.gravity = directions[Math.floor(Math.random() * directions.length)];
    // Noticeable but fair: an idle rocket drifts ~125 px/s, full thrust against it wins easily
    activeEvent.gravityPower = 450 + intensity * 100; // 450..550 px/s^2 acceleration
    activeEvent.driftSpeed = 65 + intensity * 25;     // 65..90 px/s position bias
    activeEvent.particles = [];
    for (let k = 0; k < 30; k++) {
      activeEvent.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 130 + Math.random() * 150,
        len: 16 + Math.random() * 22,
        alpha: 0.2 + Math.random() * 0.45,
        width: 1.0 + Math.random() * 1.5,
      });
    }
    playSfxPolarityWarp();
  }

  playSfxEventAlert();
}

function endEvent() {
  if (activeEvent && rocket && rocket.alive) {
    runStats.eventsSurvived++;
    if (!runStats.eventTypes.includes(activeEvent.type)) runStats.eventTypes.push(activeEvent.type);
  }
  if (pirateMothership && pirateMothership.state !== 'FLEEING') {
    pirateMothership.state = 'FLEEING';
    pirateMothership.cannonState = 'IDLE';
    spawnFloatingText(pirateMothership.x, pirateMothership.y - 30, 'FLAGSHIP RETREATING!', '#a855f7');
  }
  activeEvent = null;
  eventBounds = { active: false };
  if (rocket) rocket.eventInvertAxis = null;
  // Pirates intentionally NOT cleared — player must destroy remaining pirates ("пираты остаются его")
  pirateWarnings = [];
  solarFlares = [];
}

// ── Audio & particle effects for polarity inversion warp ────
function playSfxPolarityWarp() {
  if (muted || !audioCtx) return;
  try {
    const st = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(220, st);
    osc1.frequency.exponentialRampToValueAtTime(660, st + 0.45);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, st);
    osc2.frequency.exponentialRampToValueAtTime(220, st + 0.45);

    g.gain.setValueAtTime(0.18, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.45);

    osc1.connect(g);
    osc2.connect(g);
    g.connect(audioCtx.destination);

    osc1.start(st);
    osc2.start(st);
    osc1.stop(st + 0.45);
    osc2.stop(st + 0.45);
  } catch (e) { }
}

// ── Audio & particle effects for pirate armor breaking ──────
function playSfxShieldBreak() {
  if (muted || !audioCtx) return;
  try {
    const st = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, st);
    osc.frequency.exponentialRampToValueAtTime(140, st + 0.32);
    g.gain.setValueAtTime(0.25, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.32);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(st);
    osc.stop(st + 0.32);
  } catch (e) { }
}

function spawnShieldBreakEffect(x, y, r) {
  playSfxShieldBreak();
  // Cyan electrical shockwave ring
  addParticle({
    x, y, vx: 0, vy: 0,
    life: 0.42, maxLife: 0.42,
    size: r * 0.8, maxSize: r * 2.8,
    color: '#38bdf8',
    type: 'ring', grav: 0,
  });
  // Shattered armor chunks & bright blue energy fragments
  for (let i = 0; i < 15; i++) {
    const a = (Math.PI * 2 / 15) * i + Math.random() * 0.35;
    const spd = 70 + Math.random() * 130;
    addParticle({
      x, y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.6,
      size: 3.2, maxSize: 0.5,
      color: i % 2 === 0 ? '#38bdf8' : (i % 3 === 0 ? '#94a3b8' : '#ffffff'),
      type: 'dot', grav: 25,
    });
  }
}

// ── PIRATE MOTHERSHIP (DREADNOUGHT FLAGSHIP) ─────────────────
// The flagship cannon tracks the rocket only this long at the start of its charge,
// then the beam line is fixed — so the player sees where it will fire for ~1 second
const FLAGSHIP_AIM_TRACK_TIME = 0.1;

function spawnPirateMothership(w, h, intensity = 0) {
  pirateMothership = {
    x: w / 2,
    y: -150, // descends from beyond top edge
    targetY: Math.max(90, Math.min(145, h * 0.21)), // stationary hover anchor
    vx: 0,
    vy: 0,
    w: 164,
    height: 98,
    r: 54, // collision radius (multiple times larger than rocket)
    state: 'ENTERING', // 'ENTERING' -> 'STATIONARY' -> 'FLEEING'
    hoverTimer: 0,

    // Heavy Cannon Attack System
    cannonState: 'IDLE', // 'IDLE' -> 'CHARGING' (1.5s) -> 'FIRING' (0.55s)
    cannonTimer: 1.8, // initial pause after arrival before targeting
    chargeDuration: 1.0, // 1 second to react: the aim locks almost at once (see FLAGSHIP_AIM_TRACK_TIME)
    fireDuration: 1.0, // beam stays live for 1 second (aim is locked, so it does not chase)
    cooldownDuration: Math.max(2.4, 3.4 - intensity * 0.8), // pause between shots

    // Cannon targeting trajectory
    aimX: w / 2,
    aimY: h / 2,
    cannonMuzzleX: w / 2,
    cannonMuzzleY: -150,
    beamAngle: Math.PI / 2,
    beamLength: 2200,
    beamWidth: 46, // width of danger zone

    // Deflector shield when struck by obstacles
    shieldAlpha: 0,
    shieldHitAngle: 0,
    enginePhase: 0,
  };
}

function updatePirateMothership(dt, w, h) {
  if (!pirateMothership) return;
  const m = pirateMothership;
  m.enginePhase += dt * 8;
  if (m.shieldAlpha > 0) {
    m.shieldAlpha = Math.max(0, m.shieldAlpha - dt * 2.5);
  }

  // 1. Positioning & State Machine
  if (m.state === 'ENTERING') {
    m.x = w / 2;
    m.y += (m.targetY - m.y) * Math.min(1, dt * 2.6) + 40 * dt;
    if (m.y >= m.targetY - 2) {
      m.y = m.targetY;
      m.state = 'STATIONARY';
      m.cannonState = 'IDLE';
      m.cannonTimer = 1.6;
    }
  } else if (m.state === 'STATIONARY') {
    m.hoverTimer += dt;
    const hoverY = Math.sin(m.hoverTimer * 2.2) * 3.5;
    m.x = w / 2;
    m.cannonMuzzleX = m.x;
    m.cannonMuzzleY = m.y + hoverY + 44;

    if (rocket && rocket.alive) {
      if (m.cannonState === 'IDLE') {
        m.cannonTimer -= dt;
        if (m.cannonTimer <= 0) {
          // Lock on player position & begin 2-second charge-up
          m.cannonState = 'CHARGING';
          m.cannonTimer = m.chargeDuration;
          m.aimX = rocket.x;
          m.aimY = rocket.y;
          m.beamAngle = Math.atan2(m.aimY - m.cannonMuzzleY, m.aimX - m.cannonMuzzleX);
          playSfxMothershipCharge();
        }
      } else if (m.cannonState === 'CHARGING') {
        m.cannonTimer -= dt;
        // Minor initial target tracking during first 0.35s, then firmly locked for remaining 1.65s
        if (m.cannonTimer > m.chargeDuration - FLAGSHIP_AIM_TRACK_TIME) {
          const targetAngle = Math.atan2(rocket.y - m.cannonMuzzleY, rocket.x - m.cannonMuzzleX);
          let diff = targetAngle - m.beamAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          m.beamAngle += diff * Math.min(1, dt * 4.5);
          m.aimX = rocket.x;
          m.aimY = rocket.y;
        }

        // Plasma energy gathering particles converging into cannon muzzle
        if (Math.random() < 0.65) {
          const a = Math.random() * Math.PI * 2;
          const dist = 32 + Math.random() * 45;
          addParticle({
            x: m.cannonMuzzleX + Math.cos(a) * dist,
            y: m.cannonMuzzleY + Math.sin(a) * dist,
            vx: -Math.cos(a) * 85,
            vy: -Math.sin(a) * 85,
            life: 0.35, maxLife: 0.35,
            size: 3, maxSize: 1,
            color: Math.random() < 0.5 ? '#ef4444' : '#f43f5e',
            type: 'dot', grav: 0,
          });
        }

        if (m.cannonTimer <= 0) {
          // FIRE!
          m.cannonState = 'FIRING';
          m.cannonTimer = m.fireDuration;
          playSfxMothershipBlast();
          // High-speed directional plasma ejecta blasting along beam (no circles!)
          for (let k = 0; k < 14; k++) {
            const spd = 140 + Math.random() * 260;
            const pa = m.beamAngle + (Math.random() - 0.5) * 0.65;
            addParticle({
              x: m.cannonMuzzleX,
              y: m.cannonMuzzleY,
              vx: Math.cos(pa) * spd,
              vy: Math.sin(pa) * spd,
              life: 0.25 + Math.random() * 0.25,
              maxLife: 0.5,
              size: 3.5,
              maxSize: 0.5,
              color: Math.random() < 0.6 ? '#ffffff' : (Math.random() < 0.5 ? '#f43f5e' : '#fb7185'),
              type: 'dot',
              grav: 0,
            });
          }
        }
      } else if (m.cannonState === 'FIRING') {
        m.cannonTimer -= dt;
        if (Math.random() < 0.6) {
          const sparkDist = Math.random() * Math.min(m.beamLength, 650);
          const pa = m.beamAngle + (Math.random() - 0.5) * 0.15;
          addParticle({
            x: m.cannonMuzzleX + Math.cos(m.beamAngle) * sparkDist,
            y: m.cannonMuzzleY + Math.sin(m.beamAngle) * sparkDist,
            vx: Math.cos(pa) * 80,
            vy: Math.sin(pa) * 80,
            life: 0.2,
            maxLife: 0.2,
            size: 2.5,
            maxSize: 0.5,
            color: '#ffffff',
            type: 'dot',
            grav: 0,
          });
        }

        // Deadly hit check on player rocket
        if (rocket.alive && rocket.invincible <= 0) {
          const mdx = rocket.x - m.cannonMuzzleX;
          const mdy = rocket.y - m.cannonMuzzleY;
          const dot = mdx * Math.cos(m.beamAngle) + mdy * Math.sin(m.beamAngle);
          if (dot > 0 && dot < m.beamLength) {
            const perp = Math.abs(-mdx * Math.sin(m.beamAngle) + mdy * Math.cos(m.beamAngle));
            if (perp < m.beamWidth * 0.5 + 10) {
              rocket.alive = false;
              playSfxExplosion();
              spawnExplosion(rocket.x, rocket.y, 54);
              setTimeout(showGameOver, 900);
            }
          }
        }

        // Blast vaporizes obstacles caught in beam
        for (let j = obstacles.length - 1; j >= 0; j--) {
          const ob = obstacles[j];
          const mdx = ob.x - m.cannonMuzzleX;
          const mdy = ob.y - m.cannonMuzzleY;
          const dot = mdx * Math.cos(m.beamAngle) + mdy * Math.sin(m.beamAngle);
          if (dot > 0 && dot < m.beamLength) {
            const perp = Math.abs(-mdx * Math.sin(m.beamAngle) + mdy * Math.cos(m.beamAngle));
            if (perp < m.beamWidth * 0.5 + ob.r * 0.8) {
              spawnExplosion(ob.x, ob.y, ob.r * 1.3);
              obstacles.splice(j, 1);
            }
          }
        }

        // Blast detonates toxic barrels in mothership beam
        if (typeof toxicBarrels !== 'undefined' && toxicBarrels.length > 0) {
          for (let j = toxicBarrels.length - 1; j >= 0; j--) {
            const b = toxicBarrels[j];
            const mdx = b.x - m.cannonMuzzleX;
            const mdy = b.y - m.cannonMuzzleY;
            const dot = mdx * Math.cos(m.beamAngle) + mdy * Math.sin(m.beamAngle);
            if (dot > 0 && dot < m.beamLength) {
              const perp = Math.abs(-mdx * Math.sin(m.beamAngle) + mdy * Math.cos(m.beamAngle));
              if (perp < m.beamWidth * 0.5 + b.r * 0.8) {
                detonateToxicBarrel(b);
                toxicBarrels.splice(j, 1);
              }
            }
          }
        }

        if (m.cannonTimer <= 0) {
          m.cannonState = 'IDLE';
          m.cannonTimer = m.cooldownDuration;
        }
      }
    }
  } else if (m.state === 'FLEEING') {
    // Mothership retreats after event ends ("он улетает")
    m.vy -= 880 * dt;
    m.y += m.vy * dt;
    if (Math.random() < 0.75) {
      addParticle({
        x: m.x + (Math.random() - 0.5) * 65,
        y: m.y + 40,
        vx: (Math.random() - 0.5) * 35,
        vy: 180 + Math.random() * 120,
        life: 0.35, maxLife: 0.35,
        size: 3.8, maxSize: 0.8,
        color: '#c084fc',
        type: 'dot', grav: 0,
      });
    }
    if (m.y < -240) {
      pirateMothership = null;
      return;
    }
  }

  // 2. Comets & Asteroids detonate on Mothership, dealing ZERO damage!
  // "когда в него попадает снаряды комет и астероиды они взрываются но мозер шип не получает урона"
  const hoverY = m.state === 'STATIONARY' ? Math.sin(m.hoverTimer * 2.2) * 3.5 : 0;
  for (let j = obstacles.length - 1; j >= 0; j--) {
    const ob = obstacles[j];
    const dx = ob.x - m.x;
    const dy = ob.y - (m.y + hoverY);
    if (Math.hypot(dx, dy) < m.r + ob.r) {
      spawnExplosion(ob.x, ob.y, ob.r * 1.5 + 14);
      playSfxExplosion();
      obstacles.splice(j, 1);
      m.shieldAlpha = 1.0;
      m.shieldHitAngle = Math.atan2(dy, dx);
      spawnFloatingText(m.x, m.y + 45, 'DEFLECTED!', '#38bdf8');
    }
  }

  // 3. Collision with player rocket
  if (rocket && rocket.alive) {
    const rdx = rocket.x - m.x;
    const rdy = rocket.y - (m.y + hoverY);
    if (Math.hypot(rdx, rdy) < m.r + 14) {
      if (rocket.invincible <= 0) {
        rocket.alive = false;
        playSfxExplosion();
        spawnExplosion(rocket.x, rocket.y, 48);
        setTimeout(showGameOver, 900);
      } else {
        const pAng = Math.atan2(rdy, rdx);
        rocket.vx += Math.cos(pAng) * 350;
        rocket.vy += Math.sin(pAng) * 350;
      }
    }
  }
}

function drawMothershipCannonBeam(ctx, m) {
  if (!m || m.state === 'ENTERING') return;
  const t = performance.now() / 1000;
  const hoverY = m.state === 'STATIONARY' ? Math.sin(m.hoverTimer * 2.2) * 3.5 : 0;
  const muzzleX = m.x;
  const muzzleY = m.y + hoverY + 44;

  const beamAngle = m.beamAngle;
  const beamLength = m.beamLength || 2200;
  const endX = muzzleX + Math.cos(beamAngle) * beamLength;
  const endY = muzzleY + Math.sin(beamAngle) * beamLength;
  const normAngle = beamAngle + Math.PI / 2;
  const cosN = Math.cos(normAngle);
  const sinN = Math.sin(normAngle);

  if (m.cannonState === 'CHARGING') {
    // 2-second telegraph warning corridor ("секунды 2 чтобы уйти с зоны")
    const chargeProgress = 1 - Math.max(0, m.cannonTimer) / m.chargeDuration;
    const pulse = 0.65 + 0.35 * Math.sin(t * (14 + chargeProgress * 16));
    const halfW = (m.beamWidth * 0.5) * (0.85 + 0.15 * chargeProgress);

    const p1x = muzzleX + cosN * halfW, p1y = muzzleY + sinN * halfW;
    const p2x = muzzleX - cosN * halfW, p2y = muzzleY - sinN * halfW;
    const p3x = endX - cosN * (halfW * 1.3), p3y = endY - sinN * (halfW * 1.3);
    const p4x = endX + cosN * (halfW * 1.3), p4y = endY + sinN * (halfW * 1.3);

    ctx.save();

    // 1. Shaded danger corridor with smooth gradient
    const corridorGrd = ctx.createLinearGradient(muzzleX, muzzleY, muzzleX + Math.cos(beamAngle) * 600, muzzleY + Math.sin(beamAngle) * 600);
    corridorGrd.addColorStop(0, `rgba(239, 68, 68, ${0.16 + 0.22 * chargeProgress * pulse})`);
    corridorGrd.addColorStop(1, `rgba(220, 38, 38, ${0.06 + 0.12 * chargeProgress * pulse})`);
    ctx.fillStyle = corridorGrd;
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.lineTo(p3x, p3y);
    ctx.lineTo(p4x, p4y);
    ctx.closePath();
    ctx.fill();

    // 2. High-tech animated dashed hazard corridor borders
    ctx.strokeStyle = `rgba(248, 113, 113, ${0.5 + 0.5 * pulse})`;
    ctx.lineWidth = 2.0;
    ctx.setLineDash([14, 10]);
    ctx.lineDashOffset = -t * (100 + chargeProgress * 140);
    ctx.beginPath();
    ctx.moveTo(p1x, p1y); ctx.lineTo(p4x, p4y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p2x, p2y); ctx.lineTo(p3x, p3y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Central targeting laser line
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + 0.55 * chargeProgress})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(muzzleX, muzzleY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 4. Clean warning text alongside corridor (NO circles anywhere on rocket/aim)
    const remSec = Math.max(0, m.cannonTimer).toFixed(1);
    const textDist = 180;
    const tx = muzzleX + Math.cos(beamAngle) * textDist + cosN * (halfW + 24);
    const ty = muzzleY + Math.sin(beamAngle) * textDist + sinN * (halfW + 24);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 6;
    ctx.fillText(`⚠ VOLLEY: ${remSec}s`, tx, ty);

    // 5. Plasma energy singularity charging at cannon nozzle tip (anchors laser into ship)
    const muzzleCoreR = (8 + chargeProgress * 14) * (0.85 + 0.15 * Math.sin(t * 26));
    const muzzleGrd = ctx.createRadialGradient(muzzleX, muzzleY, 0, muzzleX, muzzleY, muzzleCoreR * 1.8);
    muzzleGrd.addColorStop(0, '#ffffff');
    muzzleGrd.addColorStop(0.35, '#f43f5e');
    muzzleGrd.addColorStop(0.7, '#e11d48');
    muzzleGrd.addColorStop(1, 'rgba(225, 29, 72, 0)');
    ctx.fillStyle = muzzleGrd;
    ctx.beginPath();
    ctx.arc(muzzleX, muzzleY, muzzleCoreR * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

  } else if (m.cannonState === 'FIRING') {
    // DEVILISH SUPER-LASER: Volumetric plasma beam with dynamic lightning and energy waves
    ctx.save();

    const wStart = 30; // Starts tightly focused at cannon nozzle
    const wEnd = 62;   // Expands outward across space
    const halfStart = wStart / 2;
    const halfEnd = wEnd / 2;

    const b1x = muzzleX + cosN * halfStart, b1y = muzzleY + sinN * halfStart;
    const b2x = muzzleX - cosN * halfStart, b2y = muzzleY - sinN * halfStart;
    const b3x = endX - cosN * halfEnd, b3y = endY - sinN * halfEnd;
    const b4x = endX + cosN * halfEnd, b4y = endY + sinN * halfEnd;

    // A. Outer atmospheric heat bloom
    const bloomHalfStart = halfStart * 2.6;
    const bloomHalfEnd = halfEnd * 2.6;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
    ctx.beginPath();
    ctx.moveTo(muzzleX + cosN * bloomHalfStart, muzzleY + sinN * bloomHalfStart);
    ctx.lineTo(muzzleX - cosN * bloomHalfStart, muzzleY - sinN * bloomHalfStart);
    ctx.lineTo(endX - cosN * bloomHalfEnd, endY - sinN * bloomHalfEnd);
    ctx.lineTo(endX + cosN * bloomHalfEnd, endY + sinN * bloomHalfEnd);
    ctx.closePath();
    ctx.fill();

    // B. Intense Magenta/Crimson Outer Plasma Sheath
    const plasmaGrd = ctx.createLinearGradient(b1x, b1y, b2x, b2y);
    plasmaGrd.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
    plasmaGrd.addColorStop(0.3, '#f43f5e');
    plasmaGrd.addColorStop(0.5, '#fda4af');
    plasmaGrd.addColorStop(0.7, '#f43f5e');
    plasmaGrd.addColorStop(1, 'rgba(244, 63, 94, 0.4)');
    ctx.fillStyle = plasmaGrd;
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.lineTo(b2x, b2y);
    ctx.lineTo(b3x, b3y);
    ctx.lineTo(b4x, b4y);
    ctx.closePath();
    ctx.fill();

    // C. Searing High-Energy Violet Core
    const coreHalfStart = halfStart * 0.65;
    const coreHalfEnd = halfEnd * 0.65;
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.moveTo(muzzleX + cosN * coreHalfStart, muzzleY + sinN * coreHalfStart);
    ctx.lineTo(muzzleX - cosN * coreHalfStart, muzzleY - sinN * coreHalfStart);
    ctx.lineTo(endX - cosN * coreHalfEnd, endY - sinN * coreHalfEnd);
    ctx.lineTo(endX + cosN * coreHalfEnd, endY + sinN * coreHalfEnd);
    ctx.closePath();
    ctx.fill();

    // D. Blinding White-Hot Supercritical Thread
    const whiteHalfStart = halfStart * 0.32;
    const whiteHalfEnd = halfEnd * 0.32;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(muzzleX + cosN * whiteHalfStart, muzzleY + sinN * whiteHalfStart);
    ctx.lineTo(muzzleX - cosN * whiteHalfStart, muzzleY - sinN * whiteHalfStart);
    ctx.lineTo(endX - cosN * whiteHalfEnd, endY - sinN * whiteHalfEnd);
    ctx.lineTo(endX + cosN * whiteHalfEnd, endY + sinN * whiteHalfEnd);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // E. Traveling Plasma Shockwave Pulses surging down the beam
    const pulseCount = 4;
    for (let p = 0; p < pulseCount; p++) {
      const pulsePhase = (t * 4.5 + p / pulseCount) % 1.0;
      const pd = pulsePhase * Math.min(beamLength, 1100);
      const px = muzzleX + Math.cos(beamAngle) * pd;
      const py = muzzleY + Math.sin(beamAngle) * pd;
      const pw = (halfStart + (halfEnd - halfStart) * pulsePhase) * 1.5;

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * (1 - pulsePhase)})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(px + cosN * pw, py + sinN * pw);
      ctx.lineTo(px + Math.cos(beamAngle) * 22, py + Math.sin(beamAngle) * 22);
      ctx.lineTo(px - cosN * pw, py - sinN * pw);
      ctx.stroke();
    }

    // F. Procedural Electric Arcs crackling inside the plasma channel
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    for (let arc = 0; arc < 2; arc++) {
      ctx.beginPath();
      ctx.moveTo(muzzleX, muzzleY);
      const steps = 14;
      for (let s = 1; s <= steps; s++) {
        const segDist = (s / steps) * Math.min(beamLength, 900);
        const perpOffset = (Math.sin(s * 2.8 + t * 45 + arc * 3) + Math.cos(s * 1.5 - t * 30)) * (halfStart * 0.45);
        const sx = muzzleX + Math.cos(beamAngle) * segDist + cosN * perpOffset;
        const sy = muzzleY + Math.sin(beamAngle) * segDist + sinN * perpOffset;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // G. Colossal Muzzle Blast Sunburst right at cannon tip (anchored into mothership)
    const muzzleFlareR = 48 + 12 * Math.sin(t * 35);
    const flareGrd = ctx.createRadialGradient(muzzleX, muzzleY, 0, muzzleX, muzzleY, muzzleFlareR);
    flareGrd.addColorStop(0, '#ffffff');
    flareGrd.addColorStop(0.25, '#ffe4e6');
    flareGrd.addColorStop(0.55, '#f43f5e');
    flareGrd.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = flareGrd;
    ctx.beginPath();
    ctx.arc(muzzleX, muzzleY, muzzleFlareR, 0, Math.PI * 2);
    ctx.fill();

    // Muzzle diffraction cross-spikes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(muzzleX - cosN * 45, muzzleY - sinN * 45);
    ctx.lineTo(muzzleX + cosN * 45, muzzleY + sinN * 45);
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(muzzleX - Math.cos(beamAngle) * 35, muzzleY - Math.sin(beamAngle) * 35);
    ctx.lineTo(muzzleX + Math.cos(beamAngle) * 65, muzzleY + Math.sin(beamAngle) * 65);
    ctx.stroke();

    ctx.restore();
  }
}

function drawPirateMothership(ctx, m) {
  if (!m) return;
  const t = performance.now() / 1000;
  const hoverY = m.state === 'STATIONARY' ? Math.sin(m.hoverTimer * 2.2) * 3.5 : 0;
  const posX = m.x;
  const posY = m.y + hoverY;

  ctx.save();
  ctx.translate(posX, posY);

  // 1. Triple Rear Thruster Plasma Exhausts
  const flLen = (m.state === 'FLEEING' ? 65 : 22) * (0.8 + 0.2 * Math.sin(t * 18));
  [-46, 0, 46].forEach(exX => {
    const plumeGrd = ctx.createLinearGradient(exX, -36, exX, -36 - flLen);
    plumeGrd.addColorStop(0, '#ffffff');
    plumeGrd.addColorStop(0.3, m.state === 'FLEEING' ? '#c084fc' : '#38bdf8');
    plumeGrd.addColorStop(0.7, '#7c3aed');
    plumeGrd.addColorStop(1, 'rgba(124, 58, 237, 0)');
    ctx.fillStyle = plumeGrd;
    ctx.beginPath();
    ctx.moveTo(exX - 10, -36);
    ctx.lineTo(exX + 10, -36);
    ctx.lineTo(exX, -36 - flLen);
    ctx.closePath();
    ctx.fill();
  });

  // 2. Heavy Armored Dreadnought Hull
  // Dark titanium stealth plating
  const hullGrd = ctx.createLinearGradient(-m.w / 2, 0, m.w / 2, 0);
  hullGrd.addColorStop(0, '#090915');
  hullGrd.addColorStop(0.25, '#1e1b4b');
  hullGrd.addColorStop(0.5, '#312e81');
  hullGrd.addColorStop(0.75, '#1e1b4b');
  hullGrd.addColorStop(1, '#090915');
  ctx.fillStyle = hullGrd;
  ctx.strokeStyle = '#4338ca';
  ctx.lineWidth = 2.0;

  // Dreadnought polygon
  ctx.beginPath();
  ctx.moveTo(0, 42);                  // Center prow (cannon housing)
  ctx.lineTo(36, 32);                 // Forward right bevel
  ctx.lineTo(m.w / 2, 8);             // Right wing tip
  ctx.lineTo(m.w / 2 - 12, -26);      // Right wing rear shoulder
  ctx.lineTo(38, -38);                // Right engine mount
  ctx.lineTo(-38, -38);               // Left engine mount
  ctx.lineTo(-m.w / 2 + 12, -26);     // Left wing rear shoulder
  ctx.lineTo(-m.w / 2, 8);            // Left wing tip
  ctx.lineTo(-36, 32);                // Forward left bevel
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Crimson Reinforced Armor Trim & Hazard Stripes
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  // Left wing armored strike plate
  ctx.moveTo(-m.w / 2, 8);
  ctx.lineTo(-m.w / 2 + 30, 2);
  ctx.lineTo(-m.w / 2 + 24, -14);
  ctx.lineTo(-m.w / 2 + 8, -18);
  ctx.closePath();
  ctx.fill();
  // Right wing armored strike plate
  ctx.beginPath();
  ctx.moveTo(m.w / 2, 8);
  ctx.lineTo(m.w / 2 - 30, 2);
  ctx.lineTo(m.w / 2 - 24, -14);
  ctx.lineTo(m.w / 2 - 8, -18);
  ctx.closePath();
  ctx.fill();

  // 4. Central Heavy Rail-Cannon Muzzle Assembly
  ctx.fillStyle = '#171717';
  ctx.strokeStyle = m.cannonState === 'CHARGING' ? '#ef4444' : (m.cannonState === 'FIRING' ? '#ffffff' : '#64748b');
  ctx.lineWidth = 1.8;
  ctx.fillRect(-12, 16, 24, 28);
  ctx.strokeRect(-12, 16, 24, 28);

  // Glowing energy coils along the cannon
  const chargeGlow = m.cannonState === 'CHARGING' ? 0.7 + 0.3 * Math.sin(t * 22) : (m.cannonState === 'FIRING' ? 1.0 : 0.25);
  ctx.fillStyle = m.cannonState === 'FIRING' ? '#ffffff' : `rgba(239, 68, 68, ${chargeGlow})`;
  ctx.fillRect(-8, 20, 16, 4);
  ctx.fillRect(-8, 28, 16, 4);
  ctx.fillRect(-8, 36, 16, 4);

  // Twin magnetic emitter guide rails framing the muzzle
  ctx.fillStyle = m.cannonState === 'FIRING' ? '#f43f5e' : (m.cannonState === 'CHARGING' ? '#ef4444' : '#475569');
  ctx.fillRect(-13, 34, 4, 12);
  ctx.fillRect(9, 34, 4, 12);

  // 5. Dual Wing Heavy Turret Pods
  [-52, 52].forEach(tx => {
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(tx, -4, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Dual mini gun barrels
    ctx.fillStyle = '#475569';
    ctx.fillRect(tx - 3, 8, 2.5, 9);
    ctx.fillRect(tx + 1, 8, 2.5, 9);
  });

  // 6. Command Citadel Bridge & Glowing Red Visor
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-22, -18);
  ctx.lineTo(22, -18);
  ctx.lineTo(16, 4);
  ctx.lineTo(-16, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Visor horizontal slit (glowing crimson bridge window)
  ctx.fillStyle = '#ff0055';
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur = 8;
  ctx.fillRect(-14, -8, 28, 3.5);
  ctx.shadowBlur = 0;

  // 7. Pirate Skull Insignia ☠ on Central Deck
  ctx.fillStyle = '#f8fafc';
  ctx.shadowColor = '#dc2626';
  ctx.shadowBlur = 6;
  ctx.font = 'bold 19px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☠', 0, -5);
  ctx.shadowBlur = 0;

  // 8. Wingtip Navigation Beacons
  const strobe = Math.sin(t * 10) > 0;
  if (strobe) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-m.w / 2 + 3, 8, 3.5, 0, Math.PI * 2);
    ctx.arc(m.w / 2 - 3, 8, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 9. Deflector Shield Envelope (when struck by comets/asteroids)
  // "когда в него попадает снаряды комет и астероиды они взрываются но мозер шип не получает урона"
  if (m.shieldAlpha > 0.02) {
    ctx.strokeStyle = `rgba(56, 189, 248, ${m.shieldAlpha * 0.9})`;
    ctx.fillStyle = `rgba(14, 165, 233, ${m.shieldAlpha * 0.18})`;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.ellipse(0, 4, m.r * 1.5, m.r * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Deflector impact ripple ring
    ctx.strokeStyle = `rgba(255, 255, 255, ${m.shieldAlpha})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 4, m.r * 1.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 10. HUD Nameplate Pill Tag Above Mothership
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.fillStyle = '#fecdd3';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#e11d48';
  ctx.shadowBlur = 8;
  ctx.fillText('☠ PIRATE FLAGSHIP ☠', 0, -52);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ── Periodic pirate spawns every 1-2 levels (1-2 pirates depending on level) ──
function triggerLevelPirates(w, h) {
  if (!rocket || !rocket.alive) return;
  // If PIRATES swarm event is already actively spawning, avoid double waves
  if (activeEvent && activeEvent.type === 'PIRATES') return;

  const livingPirates = pirates.filter(p => p.alive).length;
  const maxNormalPirates = 3;
  if (livingPirates >= maxNormalPirates) return;

  // 1-2 pirates depending on level:
  // Level 1-3: 1 pirate
  // Level 4-6: 1 or 2 pirates (50% chance of 2)
  // Level 7+: 2 pirates
  let count = 1;
  if (diffLevel >= 7) {
    count = 2;
  } else if (diffLevel >= 4) {
    count = Math.random() < 0.5 ? 2 : 1;
  }
  count = Math.min(count, maxNormalPirates - livingPirates);
  if (count <= 0) return;

  // Spawn first pirate immediately
  spawnPirate(w, h);
  playSfxPirateAlert();

  if (count === 1) {
    spawnFloatingText(w / 2, 70, '☠ ENEMY PIRATE! ☠', '#ef4444');
  } else {
    spawnFloatingText(w / 2, 70, '☠ PIRATE PATROL (x2)! ☠', '#ef4444');
    // Stagger second pirate by 0.8s so they enter distinctly
    setTimeout(() => {
      if (gameState === 'PLAYING' && rocket && rocket.alive) {
        spawnPirate(w, h);
        playSfxPirateAlert();
      }
    }, 800);
  }
}

// ── Spawn a pirate ship (AI that chases rocket) ─────────────
function spawnPirate(w, h) {
  if (!rocket) return;
  const intensity = activeEvent ? activeEvent.intensity : Math.min(1, Math.max(0, (diffLevel - 1) / 16));
  // Spawn from random screen edge
  const edge = Math.floor(Math.random() * 4);
  let sx, sy;
  const m = 40;
  switch (edge) {
    case 0: sx = Math.random() * w; sy = -m; break;
    case 1: sx = w + m; sy = Math.random() * h; break;
    case 2: sx = Math.random() * w; sy = h + m; break;
    default: sx = -m; sy = Math.random() * h;
  }

  // 2 Pirate variants (50/50 chance):
  // 1) Big armored pirate ('armored'): survives 1 collision (armor breaks)
  // 2) Fast berserk pirate ('berserk'): frantic agility, dies in 1 hit
  const isArmored = Math.random() < 0.5;
  const type = isArmored ? 'armored' : 'berserk';

  let r, speed, accel, turnSpeed, hasArmor;

  if (isArmored) {
    r = Math.round((16 + intensity * 8) * 1.22); // larger, sturdy profile
    speed = 130 + intensity * 125;
    accel = 210 + intensity * 140;
    turnSpeed = 2.4 + intensity * 1.4;
    hasArmor = true;
  } else {
    r = Math.max(10, Math.round(11 + intensity * 5)); // sleek, compact profile
    speed = 215 + intensity * 190; // frantic high speed
    accel = 390 + intensity * 260; // rapid acceleration
    turnSpeed = 4.3 + intensity * 2.2; // sharp, twitchy steering
    hasArmor = false;
  }

  pirates.push({
    type,
    x: sx, y: sy,
    vx: 0, vy: 0,
    r,
    speed,
    accel,
    turnSpeed,
    hasArmor,
    armor: hasArmor ? 1 : 0,
    hp: 1,                 // basic ship hp
    alive: true,
    angle: 0,              // facing angle
    thrusterPhase: 0,
    warnTimer: 0.6,        // warning flash duration before fully active
    active: false,         // starts inactive while warning flashes
    targetX: rocket.x,
    targetY: rocket.y,
    trailPoints: [],
    bhSlowFactor: 1,       // propulsion slowdown in black hole
    // Fog of War AI states (CHASE, BLIND_WANDER, ALERT)
    aiState: 'CHASE',
    miniRange: type === 'armored' ? 130 : 115,
    wanderTimer: 0,
    wanderAngle: 0,
    statusIcon: null,      // { type: '?' | '!', timer: 0.75, maxTimer: 0.75 }
    headlightPulse: 0,     // headlight illumination flare
  });
}

// ── Update pirates (AI chase + black hole gravity/drag + collision) ──
function updatePirates(dt, w, h) {
  if (!rocket) return;

  for (let i = 0; i < pirates.length; i++) {
    const p = pirates[i];
    if (!p.alive) continue;

    // Warning flash phase — not active yet
    if (p.warnTimer > 0) {
      p.warnTimer -= dt;
      if (p.warnTimer <= 0) p.active = true;
      continue;
    }
    if (!p.active) continue;

    p.thrusterPhase += dt;

    // ── Black Hole Gravity & Movement Sluggishness on Pirates ──
    // "если пираты попадают в черную дыру они также подвергаются влиянию его им становится трудно передвигатся в этой зоне управление тормозит и тд"
    p.bhSlowFactor = 1;
    let bhTurnPenalty = 1;

    if (blackHoles.length > 0) {
      for (let b = 0; b < blackHoles.length; b++) {
        const bh = blackHoles[b];
        const bhDx = bh.x - p.x;
        const bhDy = bh.y - p.y;
        const bhDist = Math.sqrt(bhDx * bhDx + bhDy * bhDy) || 1;

        if (bhDist < bh.pullR) {
          const falloff = Math.pow(1 - bhDist / bh.pullR, 1.15);
          // Gravitational pull toward black hole singularity
          const pullForce = falloff * bh.strength * 1.6 * dt;
          p.vx += (bhDx / bhDist) * pullForce;
          p.vy += (bhDy / bhDist) * pullForce;

          // Intense movement drag & braking in the gravity well
          const drag = Math.max(0.18, 1 - (falloff * 3.6 * dt));
          p.vx *= drag;
          p.vy *= drag;

          // Propulsion cap & steering sluggishness
          p.bhSlowFactor = Math.min(p.bhSlowFactor, Math.max(0.24, 1 - falloff * 0.76));
          bhTurnPenalty = Math.min(bhTurnPenalty, Math.max(0.22, 1 - falloff * 0.80));

          // Purple gravity distortion spark particles around struggling pirate ship
          if (Math.random() < 0.3) {
            addParticle({
              x: p.x + (Math.random() - 0.5) * p.r,
              y: p.y + (Math.random() - 0.5) * p.r,
              vx: (bhDx / bhDist) * 35 + (Math.random() - 0.5) * 20,
              vy: (bhDy / bhDist) * 35 + (Math.random() - 0.5) * 20,
              life: 0.28, maxLife: 0.28,
              size: 2.2, maxSize: 0.5,
              color: '#d946ef',
              type: 'dot', grav: 0,
            });
          }

          // If dragged into the core of the black hole: crushed by singularity!
          if (bhDist < bh.r * 1.35) {
            spawnExplosion(p.x, p.y, p.r * 1.6);
            playSfxExplosion();
            p.alive = false;
            score += 6;
            EL.scoreVal.textContent = score;
            spawnFloatingText(p.x, p.y - 20, '+6 SINGULARITY!', '#c084fc');
            break;
          }
        }
      }
    }
    if (!p.alive) continue;

    // ── Fog of War AI States (CHASE, BLIND_WANDER, ALERT) ──
    const inFog = isPointInToxicCloud(p.x, p.y);
    const distToPlayer = (rocket && rocket.alive) ? Math.hypot(rocket.x - p.x, rocket.y - p.y) : 99999;
    const miniRange = p.miniRange || (p.type === 'armored' ? 130 : 115);

    if (!inFog) {
      // ── Outside fog: CHASE ──
      if (p.aiState === 'BLIND_WANDER') {
        p.aiState = 'CHASE';
        p.statusIcon = { type: '!', timer: 0.65, maxTimer: 0.65 };
        p.headlightPulse = 1.0;
        playSfxPirateAlert();
      } else {
        p.aiState = 'CHASE';
      }
    } else {
      // ── Inside fog ──
      if (distToPlayer <= miniRange) {
        // Player is within mini detection range
        if (p.aiState === 'BLIND_WANDER') {
          // ALERT: spotted player while wandering blindly!
          p.aiState = 'CHASE';
          p.statusIcon = { type: '!', timer: 0.8, maxTimer: 0.8 };
          p.headlightPulse = 1.0;
          playSfxPirateAlert();
        } else {
          p.aiState = 'CHASE';
        }
      } else {
        // Player is farther than miniRange in fog: pirate loses target
        if (p.aiState === 'CHASE') {
          // LOST TARGET!
          p.aiState = 'BLIND_WANDER';
          p.statusIcon = { type: '?', timer: 0.75, maxTimer: 0.75 };
          p.wanderTimer = 0; // choose random direction immediately
        }
      }
    }

    // Decay floating status icon & headlight pulse
    if (p.statusIcon) {
      p.statusIcon.timer -= dt;
      if (p.statusIcon.timer <= 0) p.statusIcon = null;
    }
    if (p.headlightPulse > 0) {
      p.headlightPulse = Math.max(0, p.headlightPulse - dt * 2.5);
    }

    // ── Steering & Target Vectors by AI State ──
    let desiredAngle = p.angle;
    let targetSpeed = p.speed;
    let targetAccel = p.accel;

    if (p.aiState === 'CHASE') {
      if (rocket.alive) {
        const dx = rocket.x - p.x;
        const dy = rocket.y - p.y;
        desiredAngle = Math.atan2(dy, dx);
      }
    } else {
      // BLIND_WANDER: picks a random direction vector every 1–2 seconds
      p.wanderTimer -= dt;
      if (p.wanderTimer <= 0) {
        p.wanderTimer = 1.0 + Math.random() * 1.0; // 1 to 2 seconds
        p.wanderAngle = Math.random() * Math.PI * 2;
        // Steer back towards center if close to screen borders
        if (p.x < 120 || p.x > w - 120 || p.y < 120 || p.y > h - 120) {
          p.wanderAngle = Math.atan2(h / 2 - p.y, w / 2 - p.x) + (Math.random() - 0.5) * 0.8;
        }
      }
      desiredAngle = p.wanderAngle;
      targetSpeed *= 0.72; // reduced cruising speed while searching
      targetAccel *= 0.70;
    }

    // Smooth steering toward desired angle
    let angleDiff = desiredAngle - p.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const effectiveTurn = p.turnSpeed * (p.aiState === 'BLIND_WANDER' ? 0.75 : 1.0) * bhTurnPenalty;
    p.angle += angleDiff * Math.min(1, effectiveTurn * dt);

    // Accelerate in facing direction (engine power throttled by black hole)
    const effectiveAccel = targetAccel * p.bhSlowFactor;
    p.vx += Math.cos(p.angle) * effectiveAccel * dt;
    p.vy += Math.sin(p.angle) * effectiveAccel * dt;

    const maxAllowedSpd = targetSpeed * p.bhSlowFactor;
    const spd = Math.hypot(p.vx, p.vy);
    if (spd > maxAllowedSpd) {
      p.vx = (p.vx / spd) * maxAllowedSpd;
      p.vy = (p.vy / spd) * maxAllowedSpd;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Trail
    p.trailPoints.unshift({ x: p.x, y: p.y });
    if (p.trailPoints.length > 12) p.trailPoints.pop();

    // Out of bounds — mark dead
    if (p.x < -150 || p.x > w + 150 || p.y < -150 || p.y > h + 150) {
      p.alive = false;
      p.escaped = true; // flew away — not a kill
      continue;
    }

    // ── Pirate vs Danger Zone (comet blast zone with dashed ring) ──
    // "пираты должны умерать в зоне после взрывия комет который еще пунктиром отмечается тип туда нельзя"
    if (dangerZones.length > 0) {
      for (let z = 0; z < dangerZones.length; z++) {
        const dz = dangerZones[z];
        const dzDx = p.x - dz.x, dzDy = p.y - dz.y;
        if (Math.sqrt(dzDx * dzDx + dzDy * dzDy) < dz.r + p.r * 0.75) {
          if (p.hasArmor) spawnShieldBreakEffect(p.x, p.y, p.r);
          p.alive = false;
          spawnExplosion(p.x, p.y, p.r * 1.8 + 12);
          playSfxExplosion();
          score += 4;
          EL.scoreVal.textContent = score;
          spawnFloatingText(p.x, p.y - 20, '+4 BLAST ZONE!', '#ff5500');
          break;
        }
      }
    }
    if (!p.alive) continue;

    // ── Pirate hits rocket ───────────────────────────────────
    if (rocket.alive) {
      const ddx = p.x - rocket.x, ddy = p.y - rocket.y;
      if (Math.sqrt(ddx * ddx + ddy * ddy) < p.r * 0.8 + 13) {
        if (rocket.invincible <= 0) {
          p.alive = false;
          rocket.alive = false;
          playSfxExplosion();
          spawnExplosion(rocket.x, rocket.y, 48);
          setTimeout(showGameOver, 900);
          continue;
        } else {
          // Rocket is invincible: destroys pirate or removes armor
          if (p.hasArmor) {
            p.hasArmor = false;
            p.armor = 0;
            spawnShieldBreakEffect(p.x, p.y, p.r);
            const a = Math.atan2(p.y - rocket.y, p.x - rocket.x);
            p.vx += Math.cos(a) * 260;
            p.vy += Math.sin(a) * 260;
            spawnFloatingText(p.x, p.y - 20, 'ARMOR BROKEN!', '#38bdf8');
          } else {
            p.alive = false;
            playSfxExplosion();
            spawnExplosion(p.x, p.y, 36);
            score += 3;
            EL.scoreVal.textContent = score;
            spawnFloatingText(p.x, p.y - 20, '+3 RAM!', '#38bdf8');
            continue;
          }
        }
      }
    }

    // ── Pirate vs Obstacle collision ─────────────────────────
    // Armored pirate survives 1 collision, but loses its armor!
    for (let j = obstacles.length - 1; j >= 0; j--) {
      const ob = obstacles[j];
      const ddx = p.x - ob.x, ddy = p.y - ob.y;
      if (Math.sqrt(ddx * ddx + ddy * ddy) < ob.r * 0.9 + p.r * 0.8) {
        spawnExplosion(ob.x, ob.y, ob.r * 0.8);
        playSfxExplosion();
        obstacles.splice(j, 1);

        if (p.hasArmor) {
          // Armored pirate absorbs the hit: armor is stripped off, survives!
          p.hasArmor = false;
          p.armor = 0;
          spawnShieldBreakEffect(p.x, p.y, p.r);
          // Recoil pushback away from collision
          const hitAngle = Math.atan2(p.y - ob.y, p.x - ob.x);
          p.vx += Math.cos(hitAngle) * 220;
          p.vy += Math.sin(hitAngle) * 220;
          score += 2;
          EL.scoreVal.textContent = score;
          spawnFloatingText(p.x, p.y - 20, 'ARMOR BROKEN!', '#38bdf8');
        } else {
          // Unarmored pirate is destroyed
          spawnExplosion(p.x, p.y, 36);
          p.alive = false;
          score += 3;
          EL.scoreVal.textContent = score;
          spawnFloatingText(p.x, p.y - 20, '+3 CRASH!', '#ff9944');
        }
        break;
      }
    }
    if (!p.alive) continue;

    // ── Pirate vs Pirate collision ───────────────────────────
    for (let j = i + 1; j < pirates.length; j++) {
      const p2 = pirates[j];
      if (!p2.alive || !p2.active) continue;
      const ddx = p.x - p2.x, ddy = p.y - p2.y;
      if (Math.sqrt(ddx * ddx + ddy * ddy) < (p.r + p2.r) * 0.85) {
        const mx = (p.x + p2.x) / 2;
        const my = (p.y + p2.y) / 2;
        playSfxExplosion();

        // Handle p armor
        if (p.hasArmor) {
          p.hasArmor = false;
          p.armor = 0;
          spawnShieldBreakEffect(p.x, p.y, p.r);
          const a1 = Math.atan2(p.y - p2.y, p.x - p2.x);
          p.vx += Math.cos(a1) * 240;
          p.vy += Math.sin(a1) * 240;
          spawnFloatingText(p.x, p.y - 20, 'ARMOR BROKEN!', '#38bdf8');
        } else {
          spawnExplosion(p.x, p.y, 40);
          p.alive = false;
        }

        // Handle p2 armor
        if (p2.hasArmor) {
          p2.hasArmor = false;
          p2.armor = 0;
          spawnShieldBreakEffect(p2.x, p2.y, p2.r);
          const a2 = Math.atan2(p2.y - p.y, p2.x - p.x);
          p2.vx += Math.cos(a2) * 240;
          p2.vy += Math.sin(a2) * 240;
          spawnFloatingText(p2.x, p2.y - 20, 'ARMOR BROKEN!', '#38bdf8');
        } else {
          spawnExplosion(p2.x, p2.y, 40);
          p2.alive = false;
        }

        score += 5;
        EL.scoreVal.textContent = score;
        spawnFloatingText(mx, my - 20, '+5 CRASH!', '#ff4488');
        break;
      }
    }
  }

  // Sweep: remove all dead pirates in one pass (safe, no mid-loop index issues)
  for (let i = pirates.length - 1; i >= 0; i--) {
    if (!pirates[i].alive) {
      if (!pirates[i].escaped) runStats.pirateKills++;
      pirates.splice(i, 1);
    }
  }
}

// ── Spawn floating score text ────────────────────────────────
function spawnFloatingText(x, y, text, color) {
  floatingTexts.push({ x, y, text, color, life: 1.5, maxLife: 1.5, vy: -40 });
}

function updateFloatingTexts(dt) {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.life -= dt;
    ft.y += ft.vy * dt;
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }
}

function drawFloatingTexts(ctx) {
  floatingTexts.forEach(ft => {
    const alpha = ft.life / ft.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = ft.color;
    ctx.textAlign = 'center';
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });
}

// ── Draw a pirate ship (Armored vs Berserk) ───────────────────
function drawPirate(ctx, p) {
  const t = performance.now() / 1000;
  const S = p.r / 14; // scale factor
  const isArmored = p.type === 'armored';

  // Warning flash (before active)
  if (!p.active) {
    const pulse = 0.5 + 0.5 * Math.sin(t * (isArmored ? 10 : 16));
    ctx.save();
    ctx.globalAlpha = pulse * 0.75;
    ctx.strokeStyle = isArmored ? '#38bdf8' : '#ff2255';
    ctx.lineWidth = isArmored ? 3.0 : 2.0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 1.4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isArmored ? '#38bdf8' : '#ff2255';
    ctx.font = `${Math.round(p.r)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isArmored) drawShieldIcon(ctx, p.x, p.y, p.r, '#38bdf8');
    else ctx.fillText('☠', p.x, p.y);
    ctx.restore();
    return;
  }

  // Trail
  ctx.save();
  p.trailPoints.forEach((pt, idx) => {
    const alpha = (1 - idx / p.trailPoints.length) * (isArmored ? 0.22 : 0.32);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = isArmored ? '#a855f7' : (idx % 2 === 0 ? '#ef4444' : '#f97316');
    const ts2 = (1 - idx / p.trailPoints.length) * p.r * (isArmored ? 0.45 : 0.35);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, ts2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle + Math.PI / 2); // nose points along angle

  // In black hole gravity distortion: subtle jitter/struggle
  if (p.bhSlowFactor < 0.9) {
    const jitter = (1 - p.bhSlowFactor) * 2;
    ctx.translate((Math.random() - 0.5) * jitter, (Math.random() - 0.5) * jitter);
  }

  // Glow
  const glowCol = isArmored ? 'rgba(168, 85, 247, 0.28)' : 'rgba(239, 68, 68, 0.32)';
  const glw = ctx.createRadialGradient(0, 0, p.r * 0.3, 0, 0, p.r * 2.2);
  glw.addColorStop(0, glowCol);
  glw.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glw;
  ctx.beginPath();
  ctx.arc(0, 0, p.r * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Engine exhaust
  const flameFlicker = 0.7 + 0.3 * Math.sin(t * (isArmored ? 18 : 28) + p.x);
  if (isArmored) {
    // Single wide heavy exhaust
    const exhaust = ctx.createLinearGradient(0, p.r * 0.4, 0, p.r * 0.4 + 13 * S * flameFlicker);
    exhaust.addColorStop(0, 'rgba(192, 132, 252, 0.95)');
    exhaust.addColorStop(0.5, 'rgba(147, 51, 234, 0.65)');
    exhaust.addColorStop(1, 'rgba(88, 28, 135, 0)');
    ctx.fillStyle = exhaust;
    ctx.beginPath();
    ctx.ellipse(0, p.r * 0.4 + 7 * S * flameFlicker, 5 * S, 9 * S * flameFlicker, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Twin fierce needle afterburners for berserk
    [-p.r * 0.32, p.r * 0.32].forEach(exOff => {
      const exhaust = ctx.createLinearGradient(exOff, p.r * 0.5, exOff, p.r * 0.5 + 16 * S * flameFlicker);
      exhaust.addColorStop(0, 'rgba(255, 230, 80, 0.95)');
      exhaust.addColorStop(0.4, 'rgba(255, 80, 20, 0.75)');
      exhaust.addColorStop(1, 'rgba(200, 20, 0, 0)');
      ctx.fillStyle = exhaust;
      ctx.beginPath();
      ctx.ellipse(exOff, p.r * 0.5 + 8 * S * flameFlicker, 2.5 * S, 10 * S * flameFlicker, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Ship Hull
  if (isArmored) {
    // Heavy Armored Battlecruiser shape: wider, reinforced bevels
    const bodyGrd = ctx.createLinearGradient(-p.r, 0, p.r, 0);
    bodyGrd.addColorStop(0, '#1e112a');
    bodyGrd.addColorStop(0.25, '#3b1d54');
    bodyGrd.addColorStop(0.5, '#582b7d');
    bodyGrd.addColorStop(0.75, '#3b1d54');
    bodyGrd.addColorStop(1, '#1e112a');
    ctx.fillStyle = bodyGrd;

    ctx.beginPath();
    ctx.moveTo(0, -p.r * 1.15);            // nose tip
    ctx.lineTo(p.r * 0.45, -p.r * 0.4);
    ctx.lineTo(p.r * 0.95, p.r * 0.55);    // heavy wide wings
    ctx.lineTo(p.r * 0.5, p.r * 0.35);
    ctx.lineTo(0, p.r * 0.55);             // center back
    ctx.lineTo(-p.r * 0.5, p.r * 0.35);
    ctx.lineTo(-p.r * 0.95, p.r * 0.55);
    ctx.lineTo(-p.r * 0.45, -p.r * 0.4);
    ctx.closePath();
    ctx.fill();

    // Reinforced titanium armor plating borders
    ctx.strokeStyle = p.hasArmor ? 'rgba(56, 189, 248, 0.85)' : 'rgba(100, 116, 139, 0.5)';
    ctx.lineWidth = 1.6 * S;
    ctx.stroke();

    // Cockpit
    const cpGrd = ctx.createRadialGradient(0, -p.r * 0.25, 0, 0, -p.r * 0.25, p.r * 0.3);
    cpGrd.addColorStop(0, p.hasArmor ? '#67e8f9' : '#94a3b8');
    cpGrd.addColorStop(0.7, p.hasArmor ? '#0891b2' : '#475569');
    cpGrd.addColorStop(1, '#0f172a');
    ctx.fillStyle = cpGrd;
    ctx.beginPath();
    ctx.ellipse(0, -p.r * 0.25, p.r * 0.24, p.r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // If Armor is intact: draw active glowing forcefield shell around pirate
    if (p.hasArmor) {
      const shieldPulse = 0.75 + 0.25 * Math.sin(t * 8);
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.7 * shieldPulse})`;
      ctx.lineWidth = 2.0 * S;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 1.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Scorch mark / cracked armor decal
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.font = `${Math.round(p.r * 0.5)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☠', 0, p.r * 0.05);
    }
  } else {
    // Fast Berserk Interceptor shape: razor needle hull, swept wings
    const bodyGrd = ctx.createLinearGradient(-p.r, 0, p.r, 0);
    bodyGrd.addColorStop(0, '#450a0a');
    bodyGrd.addColorStop(0.3, '#7f1d1d');
    bodyGrd.addColorStop(0.5, '#b91c1c');
    bodyGrd.addColorStop(0.7, '#7f1d1d');
    bodyGrd.addColorStop(1, '#450a0a');
    ctx.fillStyle = bodyGrd;

    ctx.beginPath();
    ctx.moveTo(0, -p.r * 1.35);           // sharp spear nose
    ctx.lineTo(p.r * 0.25, -p.r * 0.2);
    ctx.lineTo(p.r * 0.9, p.r * 0.75);    // razor swept wing
    ctx.lineTo(p.r * 0.35, p.r * 0.45);
    ctx.lineTo(0, p.r * 0.6);
    ctx.lineTo(-p.r * 0.35, p.r * 0.45);
    ctx.lineTo(-p.r * 0.9, p.r * 0.75);
    ctx.lineTo(-p.r * 0.25, -p.r * 0.2);
    ctx.closePath();
    ctx.fill();

    // Blazing orange/red wing hazard trims
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.2 * S;
    ctx.stroke();

    // Aggressive glowing red visor cockpit
    const cpGrd = ctx.createRadialGradient(0, -p.r * 0.32, 0, 0, -p.r * 0.32, p.r * 0.25);
    cpGrd.addColorStop(0, '#ffffff');
    cpGrd.addColorStop(0.3, '#ff3344');
    cpGrd.addColorStop(1, '#990011');
    ctx.fillStyle = cpGrd;
    ctx.beginPath();
    ctx.ellipse(0, -p.r * 0.32, p.r * 0.18, p.r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fast Berserk Lightning / Skull Icon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `${Math.round(p.r * 0.55)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawBoltIcon(ctx, 0, 0, p.r * 0.55, 'rgba(255, 255, 255, 0.85)');
  }

  // Black hole gravitational suppression aura (sluggish indicator)
  if (p.bhSlowFactor < 0.85) {
    const slwAlpha = (1 - p.bhSlowFactor) * 0.7;
    ctx.strokeStyle = `rgba(217, 70, 239, ${slwAlpha})`;
    ctx.lineWidth = 1.8 * S;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();

  // ── Fog of War: Pirate Mini-Radius in Fog ──
  // "Вокруг корабля пирата внутри тумана можно нарисовать едва заметный красный пунктирный кружочек (miniRange)"
  const inFog = isPointInToxicCloud(p.x, p.y);
  if (inFog) {
    ctx.save();
    const pulse = 0.35 + 0.15 * Math.sin(t * 5);
    ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.miniRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Very faint warning tint
    ctx.fillStyle = `rgba(239, 68, 68, ${pulse * 0.06})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.miniRange, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Fog of War: Headlight Pulse (Alerted in fog) ──
  // "Когда ты подлетаешь впритирку в тумане и он тебя замечает, вылетает красный знак ! или пульсация фар."
  if (p.headlightPulse > 0) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    const hAlpha = p.headlightPulse * 0.65;
    const hGrd = ctx.createLinearGradient(0, 0, p.r * 5.5, 0);
    hGrd.addColorStop(0, `rgba(255, 60, 60, ${hAlpha})`);
    hGrd.addColorStop(0.5, `rgba(239, 68, 68, ${hAlpha * 0.4})`);
    hGrd.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = hGrd;
    ctx.beginPath();
    ctx.moveTo(p.r * 0.8, -3);
    ctx.lineTo(p.r * 5.5, -p.r * 2.2);
    ctx.lineTo(p.r * 5.5, p.r * 2.2);
    ctx.lineTo(p.r * 0.8, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ── Floating Status Icon (? Lost Target / ! Alert) ──
  // "Когда пират теряет тебя в тумане, над ним на полсекунды появляется знак ? (или надпись LOST TARGET)."
  // "Когда ты подлетаешь впритирку в тумане и он тебя замечает, вылетает красный знак ! или пульсация фар."
  if (p.statusIcon && p.statusIcon.timer > 0) {
    ctx.save();
    const progress = 1 - (p.statusIcon.timer / p.statusIcon.maxTimer);
    const floatY = p.y - p.r * 1.5 - 10 - progress * 14;
    const iconAlpha = Math.min(1, p.statusIcon.timer / 0.18);
    ctx.globalAlpha = iconAlpha;

    if (p.statusIcon.type === '?') {
      // LOST TARGET badge
      const bw = 86, bh = 20;
      ctx.fillStyle = 'rgba(20, 10, 5, 0.85)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(p.x - bw / 2, floatY - bh / 2, bw, bh, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;
      ctx.fillText('? LOST TARGET', p.x, floatY);
    } else if (p.statusIcon.type === '!') {
      // ALERT badge
      const bw = 64, bh = 22;
      const flash = Math.sin(t * 22) > 0 ? '#ef4444' : '#ffffff';
      ctx.fillStyle = 'rgba(40, 5, 5, 0.9)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(p.x - bw / 2, floatY - bh / 2, bw, bh, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = flash;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillText('! ALERT', p.x, floatY);
    }
    ctx.restore();
  }
}

// ── Draw CONSTRICTION zone border ────────────────────────────
function drawConstrictionZone(ctx, w, h) {
  if (!eventBounds.active) return;
  const t = performance.now() / 1000;
  const eb = eventBounds;
  const inGrace = (eb.graceTimer && eb.graceTimer > 0);
  const pulse = 0.6 + 0.4 * Math.sin(t * (inGrace ? 7 : 4));

  const x0 = eb.cx - eb.zoneW / 2;
  const y0 = eb.cy - eb.zoneH / 2;
  const x1 = eb.cx + eb.zoneW / 2;
  const y1 = eb.cy + eb.zoneH / 2;

  // Dark vignette outside the zone
  ctx.save();
  ctx.globalAlpha = inGrace ? 0.35 : 0.65;
  ctx.fillStyle = inGrace ? 'rgba(25, 15, 0, 0.55)' : 'rgba(30, 0, 10, 0.75)';
  // Top strip
  ctx.fillRect(0, 0, w, y0);
  // Bottom strip
  ctx.fillRect(0, y1, w, h - y1);
  // Left strip
  ctx.fillRect(0, y0, x0, eb.zoneH);
  // Right strip
  ctx.fillRect(x1, y0, w - x1, eb.zoneH);
  ctx.restore();

  // Animated danger border
  ctx.save();
  ctx.globalAlpha = 0.85 * pulse;
  ctx.strokeStyle = inGrace ? '#f59e0b' : '#ff2244';
  ctx.lineWidth = inGrace ? 3.0 : 4.0;
  ctx.setLineDash([inGrace ? 12 : 16, 8]);
  ctx.lineDashOffset = -t * (inGrace ? 45 : 70);
  ctx.strokeRect(x0, y0, eb.zoneW, eb.zoneH);
  ctx.setLineDash([]);

  // Corner warning marks
  const corners = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const len = inGrace ? 16 : 22;
  ctx.strokeStyle = inGrace ? `rgba(245, 158, 11, ${0.9 * pulse})` : `rgba(255, 34, 68, ${0.95 * pulse})`;
  ctx.lineWidth = inGrace ? 2.5 : 3.5;
  corners.forEach(([cx, cy], i) => {
    const sx = (i === 0 || i === 3) ? 1 : -1;
    const sy = (i === 0 || i === 1) ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx + sx * len, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * len);
    ctx.stroke();
  });

  // Countdown & status text
  ctx.font = '9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (inGrace) {
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.fillText(`ENTER THE ZONE: ${eb.graceTimer.toFixed(1)}s`, eb.cx, y0 - 16);
  } else {
    ctx.fillStyle = '#ff3355';
    ctx.shadowColor = '#ff1133';
    ctx.shadowBlur = 12;
    ctx.fillText('☠ DEATH BARRIER ☠', eb.cx, y0 - 16);
  }
  ctx.restore();
}

// ── Draw event banner ────────────────────────────────────────
function drawEventBanner(ctx, w, h) {
  if (!activeEvent || activeEvent.bannerTimer <= 0) return;
  const t = performance.now() / 1000;
  const raw = activeEvent.bannerTimer;
  const alpha = Math.min(1, raw * 1.5) * (raw < 1 ? raw : 1);

  // Banner centre line: below the DOM HUD and any top event pill on phones
  const bannerY = Math.max(h * 0.18, topSafeY ? topSafeY + 80 : 0);

  ctx.save();
  ctx.globalAlpha = alpha;

  const type = activeEvent.type;
  let bannerColor = '#ff4422';
  let bannerGlow = 'rgba(255,80,40,0.7)';
  let icon = '⚠';
  let line1 = '! CONSTRICTION ZONE !';
  let line2 = 'Enter the zone in 5 sec!';
  let borderColor = '255,70,40';

  if (type === 'PIRATES') {
    bannerColor = '#ff2288';
    bannerGlow = 'rgba(255,40,130,0.7)';
    icon = '☠';
    line1 = '! PIRATE FLAGSHIP !';
    line2 = 'Dodge the main cannon volley (1 sec)!';
    borderColor = '255,40,150';
  } else if (type === 'SOLAR_FLARE') {
    bannerColor = '#ff8800';
    bannerGlow = 'rgba(255,160,0,0.8)';
    icon = '☀';
    line1 = '! SOLAR FLARE !';
    line2 = 'Lure enemies into the beam!';
    borderColor = '255,140,0';
  } else if (type === 'AXIS_INVERSION') {
    if (activeEvent.invertAxis === 'X') {
      bannerColor = '#38bdf8';
      bannerGlow = 'rgba(56,189,248,0.85)';
      icon = '⇄';
      line1 = '! INVERSION: HORIZONTAL !';
      line2 = 'Left and Right are swapped!';
      borderColor = '56,189,248';
    } else {
      bannerColor = '#f43f5e';
      bannerGlow = 'rgba(244,63,94,0.85)';
      icon = '⇅';
      line1 = '! INVERSION: VERTICAL !';
      line2 = 'Up and Down are swapped!';
      borderColor = '244,63,94';
    }
  } else if (type === 'GRAVITY_SHIFT') {
    const grav = activeEvent.gravity || { label: 'DOWN', icon: '\u25bc', arrow: '\u2193\u2193\u2193' };
    bannerColor = '#c084fc';
    bannerGlow = 'rgba(192, 132, 252, 0.85)';
    icon = grav.icon;
    line1 = `! GRAVITY SHIFT: ${grav.label} !`;
    line2 = `Pull ${grav.arrow} • Counter the drift with your engines!`;
    borderColor = '192,132,252';
  }

  // Background bar
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, bannerY - 36, w, 80);

  // Border flash
  ctx.strokeStyle = `rgba(${borderColor},${0.6 * (0.5 + 0.5 * Math.sin(t * 8))})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, bannerY - 36, w, 80);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Big icon
  ctx.font = `22px serif`;
  ctx.fillStyle = bannerColor;
  ctx.shadowColor = bannerGlow;
  ctx.shadowBlur = 18;
  ctx.fillText(icon, w / 2, bannerY - 10);

  // Title
  ctx.font = `10px "Press Start 2P", monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = bannerGlow;
  ctx.shadowBlur = 12;
  ctx.fillText(line1, w / 2, bannerY + 10);

  // Subtitle
  ctx.font = `6px "Press Start 2P", monospace`;
  ctx.fillStyle = bannerColor;
  ctx.shadowBlur = 8;
  ctx.fillText(line2, w / 2, bannerY + 26);

  ctx.restore();
}

// ── Persistent HUD badge while AXIS_INVERSION is active ──────
function drawAxisInversionHud(ctx, w, h) {
  if (!activeEvent || activeEvent.type !== 'AXIS_INVERSION') return;
  const t = performance.now() / 1000;
  const axis = activeEvent.invertAxis || 'X';
  const isX = axis === 'X';

  const colPrimary = isX ? '#38bdf8' : '#f43f5e';
  const colGlow = isX ? 'rgba(56,189,248,0.45)' : 'rgba(244,63,94,0.45)';
  const icon = isX ? '⇄' : '⇅';
  const axisTitle = isX ? 'INVERSION: LEFT ↔ RIGHT' : 'INVERSION: UP ↕ DOWN';
  const normalText = isX ? 'Up/Down: normal' : 'Left/Right: normal';

  ctx.save();
  const hudY = Math.max(64, topSafeY);
  const pillW = Math.min(280, w * 0.82);
  const pillH = 34;
  const pillX = (w - pillW) / 2;

  // Background cyber pill
  ctx.fillStyle = 'rgba(8, 8, 24, 0.78)';
  ctx.strokeStyle = colPrimary;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = colGlow;
  ctx.shadowBlur = 8 + Math.sin(t * 6) * 4;

  ctx.beginPath();
  const r = 8;
  if (ctx.roundRect) ctx.roundRect(pillX, hudY, pillW, pillH, r);
  else ctx.rect(pillX, hudY, pillW, pillH);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '7px "Press Start 2P", monospace';
  ctx.fillStyle = colPrimary;
  ctx.shadowBlur = 6;
  ctx.fillText(`${icon} ${axisTitle}`, w / 2, hudY + 12);

  ctx.font = '5px "Press Start 2P", monospace';
  ctx.fillStyle = '#cbd5e1';
  ctx.shadowBlur = 0;
  ctx.fillText(normalText, w / 2, hudY + 24);

  ctx.restore();
}

// ── Gravity Shift Event Logic & Field Rendering ────────────────
function updateGravityShift(dt, w, h) {
  if (!activeEvent || activeEvent.type !== 'GRAVITY_SHIFT' || !activeEvent.gravity) return;
  const grav = activeEvent.gravity;
  const parts = activeEvent.particles;
  if (!parts) return;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    p.x += grav.x * p.speed * dt;
    p.y += grav.y * p.speed * dt;

    // Wrap around screen boundaries with margin
    if (grav.x > 0 && p.x > w + 20) { p.x = -20; p.y = Math.random() * h; }
    else if (grav.x < 0 && p.x < -20) { p.x = w + 20; p.y = Math.random() * h; }
    if (grav.y > 0 && p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
    else if (grav.y < 0 && p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
  }
}

function drawGravityShiftField(ctx, w, h) {
  if (!activeEvent || activeEvent.type !== 'GRAVITY_SHIFT' || !activeEvent.gravity) return;
  const grav = activeEvent.gravity;
  const t = performance.now() / 1000;
  const parts = activeEvent.particles || [];

  ctx.save();

  // 1. Edge Gravity Well Aura along the attracting boundary
  let edgeGrd = null;
  const pulse = 0.75 + 0.25 * Math.sin(t * 4);
  const auraDepth = 75;

  if (grav.id === 'DOWN') {
    edgeGrd = ctx.createLinearGradient(0, h - auraDepth, 0, h);
    edgeGrd.addColorStop(0, 'rgba(168, 85, 247, 0)');
    edgeGrd.addColorStop(1, `rgba(192, 132, 252, ${0.30 * pulse})`);
    ctx.fillStyle = edgeGrd;
    ctx.fillRect(0, h - auraDepth, w, auraDepth);

    ctx.strokeStyle = `rgba(216, 180, 254, ${0.5 * pulse})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, h - 2);
    ctx.lineTo(w, h - 2);
    ctx.stroke();

  } else if (grav.id === 'UP') {
    edgeGrd = ctx.createLinearGradient(0, auraDepth, 0, 0);
    edgeGrd.addColorStop(0, 'rgba(168, 85, 247, 0)');
    edgeGrd.addColorStop(1, `rgba(192, 132, 252, ${0.30 * pulse})`);
    ctx.fillStyle = edgeGrd;
    ctx.fillRect(0, 0, w, auraDepth);

    ctx.strokeStyle = `rgba(216, 180, 254, ${0.5 * pulse})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(w, 2);
    ctx.stroke();

  } else if (grav.id === 'LEFT') {
    edgeGrd = ctx.createLinearGradient(auraDepth, 0, 0, 0);
    edgeGrd.addColorStop(0, 'rgba(168, 85, 247, 0)');
    edgeGrd.addColorStop(1, `rgba(192, 132, 252, ${0.30 * pulse})`);
    ctx.fillStyle = edgeGrd;
    ctx.fillRect(0, 0, auraDepth, h);

    ctx.strokeStyle = `rgba(216, 180, 254, ${0.5 * pulse})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(2, h);
    ctx.stroke();

  } else if (grav.id === 'RIGHT') {
    edgeGrd = ctx.createLinearGradient(w - auraDepth, 0, w, 0);
    edgeGrd.addColorStop(0, 'rgba(168, 85, 247, 0)');
    edgeGrd.addColorStop(1, `rgba(192, 132, 252, ${0.30 * pulse})`);
    ctx.fillStyle = edgeGrd;
    ctx.fillRect(w - auraDepth, 0, auraDepth, h);

    ctx.strokeStyle = `rgba(216, 180, 254, ${0.5 * pulse})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(w - 2, 0);
    ctx.lineTo(w - 2, h);
    ctx.stroke();
  }

  // 2. Cosmic Vector Flux Stream Streaks
  ctx.lineCap = 'round';
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const tailX = p.x - grav.x * p.len;
    const tailY = p.y - grav.y * p.len;

    const streakGrd = ctx.createLinearGradient(tailX, tailY, p.x, p.y);
    streakGrd.addColorStop(0, 'rgba(168, 85, 247, 0)');
    streakGrd.addColorStop(0.7, `rgba(192, 132, 252, ${p.alpha * 0.7})`);
    streakGrd.addColorStop(1, `rgba(255, 255, 255, ${p.alpha})`);

    ctx.strokeStyle = streakGrd;
    ctx.lineWidth = p.width;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawGravityShiftHud(ctx, w, h) {
  if (!activeEvent || activeEvent.type !== 'GRAVITY_SHIFT' || !activeEvent.gravity) return;
  const t = performance.now() / 1000;
  const grav = activeEvent.gravity;

  const colPrimary = '#c084fc';
  const colGlow = 'rgba(192, 132, 252, 0.45)';
  const pulse = Math.sin(t * 6);

  ctx.save();
  const hudY = Math.max(64, topSafeY);
  const pillW = Math.min(290, w * 0.84);
  const pillH = 34;
  const pillX = (w - pillW) / 2;

  // Cyber glass container
  ctx.fillStyle = 'rgba(12, 6, 28, 0.82)';
  ctx.strokeStyle = colPrimary;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = colGlow;
  ctx.shadowBlur = 8 + pulse * 4;

  ctx.beginPath();
  const r = 8;
  if (ctx.roundRect) ctx.roundRect(pillX, hudY, pillW, pillH, r);
  else ctx.rect(pillX, hudY, pillW, pillH);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Header line: icon + direction
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.fillStyle = colPrimary;
  ctx.shadowBlur = 6;
  ctx.fillText(`${grav.icon} GRAVITY: ${grav.label} ${grav.arrow}`, w / 2, hudY + 12);

  // Subtitle line
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.fillStyle = '#e9d5ff';
  ctx.shadowBlur = 0;
  ctx.fillText('Objects drifting • Compensate!', w / 2, hudY + 24);

  ctx.restore();
}

// ── Constrain rocket to zone ─────────────────────────────────
function applyConstriction(dt, w, h) {
  if (!eventBounds.active || !rocket || !rocket.alive) return;
  const eb = eventBounds;
  const minX = eb.cx - eb.zoneW / 2 + 14;
  const maxX = eb.cx + eb.zoneW / 2 - 14;
  const minY = eb.cy - eb.zoneH / 2 + 14;
  const maxY = eb.cy + eb.zoneH / 2 - 14;

  // Handle 5-second grace period to reach the safe zone
  if (eb.graceTimer && eb.graceTimer > 0) {
    eb.graceTimer -= dt;
    if (eb.graceTimer <= 0) {
      eb.graceTimer = 0;
      eb.isDeadly = true;
      playSfxSolarBeam(); // Sound alert when barrier goes deadly!
    }
    // During grace period: safe to enter!
    return;
  }

  const outX = rocket.x < minX || rocket.x > maxX;
  const outY = rocket.y < minY || rocket.y > maxY;

  if (outX || outY) {
    // Kill player on wall contact after grace period expires
    if (rocket.invincible <= 0) {
      rocket.alive = false;
      playSfxExplosion();
      spawnExplosion(rocket.x, rocket.y, 48);
      setTimeout(showGameOver, 900);
      return;
    }
    // While invincible: bounce back
    if (rocket.x < minX) { rocket.x = minX; rocket.vx = Math.abs(rocket.vx) * 0.4; }
    if (rocket.x > maxX) { rocket.x = maxX; rocket.vx = -Math.abs(rocket.vx) * 0.4; }
    if (rocket.y < minY) { rocket.y = minY; rocket.vy = Math.abs(rocket.vy) * 0.4; }
    if (rocket.y > maxY) { rocket.y = maxY; rocket.vy = -Math.abs(rocket.vy) * 0.4; }
  }
}

// ─── SOLAR FLARE EVENT ────────────────────────────────────────
// Each flare: { axis:'H'|'V', pos, warnWidth, beamWidth, warnTimer, warnDuration,
//              beamTimer, beamDuration, state:'WARNING'|'FIRING'|'DONE' }

function spawnFlareWave(w, h, intensity) {
  const count = 2 + Math.round(intensity);  // 2-3 beams per wave
  const axes = ['H', 'V'];

  for (let i = 0; i < count; i++) {
    // Alternate or randomize axis; always at least one of each if count >= 2
    const axis = (count >= 2) ? axes[i % 2] : (Math.random() < 0.5 ? 'H' : 'V');
    let pos;
    if (axis === 'H') {
      // Avoid top/bottom 15% — give player room
      pos = h * 0.15 + Math.random() * h * 0.7;
    } else {
      pos = w * 0.1 + Math.random() * w * 0.8;
    }
    const beamWidth = 60 + intensity * 60;  // 60-120 px wide
    const warnDuration = 1.5;
    const beamDuration = 0.7 + intensity * 0.3; // 0.7-1.0s

    solarFlares.push({
      axis,
      pos,
      beamWidth,
      warnTimer: 0,
      warnDuration,
      beamTimer: 0,
      beamDuration,
      state: 'WARNING',
    });
  }

  playSfxEventAlert();
}

function updateSolarFlares(dt, w, h) {
  if (!rocket) return;

  for (let i = solarFlares.length - 1; i >= 0; i--) {
    const fl = solarFlares[i];

    if (fl.state === 'WARNING') {
      fl.warnTimer += dt;
      if (fl.warnTimer >= fl.warnDuration) {
        fl.state = 'FIRING';
        fl.beamTimer = 0;
        playSfxSolarBeam();
      }
    } else if (fl.state === 'FIRING') {
      fl.beamTimer += dt;

      // ── Kill rocket ──────────────────────────────────────
      if (rocket.alive && rocket.invincible <= 0) {
        const hit = fl.axis === 'H'
          ? Math.abs(rocket.y - fl.pos) < fl.beamWidth * 0.5 + 10
          : Math.abs(rocket.x - fl.pos) < fl.beamWidth * 0.5 + 10;
        if (hit) {
          rocket.alive = false;
          playSfxExplosion();
          spawnExplosion(rocket.x, rocket.y, 56);
          setTimeout(showGameOver, 900);
        }
      }

      // ── Destroy obstacles in beam path ───────────────────
      for (let j = obstacles.length - 1; j >= 0; j--) {
        const ob = obstacles[j];
        const obPos = fl.axis === 'H' ? ob.y : ob.x;
        if (Math.abs(obPos - fl.pos) < fl.beamWidth * 0.5 + ob.r * 0.7) {
          spawnExplosion(ob.x, ob.y, ob.r * 1.2);
          obstacles.splice(j, 1);
          score += 2;
          EL.scoreVal.textContent = score;
          spawnFloatingText(ob.x, ob.y - 20, '+2 BURN!', '#ffaa00');
        }
      }

      // ── Detonate toxic barrels in beam path ──────────────
      if (typeof toxicBarrels !== 'undefined' && toxicBarrels.length > 0) {
        for (let j = toxicBarrels.length - 1; j >= 0; j--) {
          const b = toxicBarrels[j];
          const bPos = fl.axis === 'H' ? b.y : b.x;
          if (Math.abs(bPos - fl.pos) < fl.beamWidth * 0.5 + b.r * 0.8) {
            detonateToxicBarrel(b);
            toxicBarrels.splice(j, 1);
            spawnFloatingText(b.x, b.y - 20, '☣ SOLAR DETONATION!', '#4ade80');
          }
        }
      }

      // ── Destroy pirates in beam path (vaporizes armored ships instantly!) ──
      for (let j = pirates.length - 1; j >= 0; j--) {
        const p = pirates[j];
        if (!p.active) continue;
        const pPos = fl.axis === 'H' ? p.y : p.x;
        if (Math.abs(pPos - fl.pos) < fl.beamWidth * 0.5 + p.r * 0.7) {
          spawnExplosion(p.x, p.y, 48);
          if (p.hasArmor) {
            spawnShieldBreakEffect(p.x, p.y, p.r);
          }
          playSfxExplosion();
          pirates.splice(j, 1);
          runStats.pirateKills++;
          score += 8;
          EL.scoreVal.textContent = score;
          spawnFloatingText(p.x, p.y - 28, '+8 VAPORIZED!', '#ff6600');
        }
      }

      if (fl.beamTimer >= fl.beamDuration) {
        fl.state = 'DONE';
      }
    } else if (fl.state === 'DONE') {
      solarFlares.splice(i, 1);
    }
  }
}

function drawSolarFlares(ctx, w, h) {
  const t = performance.now() / 1000;

  solarFlares.forEach(fl => {
    if (fl.state === 'WARNING') {
      // Pulsing red warning stripe
      const progress = fl.warnTimer / fl.warnDuration; // 0→1
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 9 + fl.pos));
      const alpha = Math.min(1, progress * 3) * pulse;

      ctx.save();
      ctx.globalAlpha = alpha * 0.55;

      if (fl.axis === 'H') {
        const grd = ctx.createLinearGradient(0, fl.pos - fl.beamWidth, 0, fl.pos + fl.beamWidth);
        grd.addColorStop(0, 'rgba(255,30,0,0)');
        grd.addColorStop(0.3, 'rgba(255,60,20,0.85)');
        grd.addColorStop(0.5, 'rgba(255,200,60,0.95)');
        grd.addColorStop(0.7, 'rgba(255,60,20,0.85)');
        grd.addColorStop(1, 'rgba(255,30,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, fl.pos - fl.beamWidth, w, fl.beamWidth * 2);
      } else {
        const grd = ctx.createLinearGradient(fl.pos - fl.beamWidth, 0, fl.pos + fl.beamWidth, 0);
        grd.addColorStop(0, 'rgba(255,30,0,0)');
        grd.addColorStop(0.3, 'rgba(255,60,20,0.85)');
        grd.addColorStop(0.5, 'rgba(255,200,60,0.95)');
        grd.addColorStop(0.7, 'rgba(255,60,20,0.85)');
        grd.addColorStop(1, 'rgba(255,30,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(fl.pos - fl.beamWidth, 0, fl.beamWidth * 2, h);
      }
      ctx.restore();

      // Warning dashed border lines
      ctx.save();
      ctx.globalAlpha = pulse * 0.9;
      ctx.strokeStyle = '#ff2200';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -t * 80;
      ctx.beginPath();
      if (fl.axis === 'H') {
        ctx.moveTo(0, fl.pos - fl.beamWidth * 0.5);
        ctx.lineTo(w, fl.pos - fl.beamWidth * 0.5);
        ctx.moveTo(0, fl.pos + fl.beamWidth * 0.5);
        ctx.lineTo(w, fl.pos + fl.beamWidth * 0.5);
      } else {
        ctx.moveTo(fl.pos - fl.beamWidth * 0.5, 0);
        ctx.lineTo(fl.pos - fl.beamWidth * 0.5, h);
        ctx.moveTo(fl.pos + fl.beamWidth * 0.5, 0);
        ctx.lineTo(fl.pos + fl.beamWidth * 0.5, h);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // "DANGER" text markers along the stripe
      ctx.save();
      ctx.globalAlpha = pulse * 0.75;
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.fillStyle = '#ff3300';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const markers = 5;
      for (let m = 0; m < markers; m++) {
        const mx = fl.axis === 'H' ? (w / (markers + 1)) * (m + 1) : fl.pos;
        const my = fl.axis === 'H' ? fl.pos : (h / (markers + 1)) * (m + 1);
        ctx.fillText('☀ DANGER', mx, my);
      }
      ctx.restore();

      // Countdown tick marks
      const secsLeft = fl.warnDuration - fl.warnTimer;
      if (secsLeft > 0) {
        ctx.save();
        ctx.globalAlpha = 0.85 * pulse;
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cx2 = fl.axis === 'H' ? w / 2 : fl.pos;
        const cy2 = fl.axis === 'H' ? fl.pos : h / 2;
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 12;
        ctx.fillText(secsLeft.toFixed(1) + 's', cx2, cy2);
        ctx.restore();
      }

    } else if (fl.state === 'FIRING') {
      // Blazing energy beam
      const progress = fl.beamTimer / fl.beamDuration; // 0→1
      const fade = 1 - Math.pow(progress, 1.5);
      const flickerT = performance.now() / 100;
      const flicker = 0.85 + 0.15 * Math.sin(flickerT);

      ctx.save();

      if (fl.axis === 'H') {
        // Outer glow
        const glowGrd = ctx.createLinearGradient(0, fl.pos - fl.beamWidth * 1.4, 0, fl.pos + fl.beamWidth * 1.4);
        glowGrd.addColorStop(0, 'rgba(255,80,0,0)');
        glowGrd.addColorStop(0.4, `rgba(255,140,0,${0.35 * fade * flicker})`);
        glowGrd.addColorStop(0.5, `rgba(255,220,80,${0.6 * fade * flicker})`);
        glowGrd.addColorStop(0.6, `rgba(255,140,0,${0.35 * fade * flicker})`);
        glowGrd.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = glowGrd;
        ctx.fillRect(0, fl.pos - fl.beamWidth * 1.4, w, fl.beamWidth * 2.8);

        // Core beam
        const coreGrd = ctx.createLinearGradient(0, fl.pos - fl.beamWidth * 0.45, 0, fl.pos + fl.beamWidth * 0.45);
        coreGrd.addColorStop(0, 'rgba(255,160,0,0)');
        coreGrd.addColorStop(0.3, `rgba(255,240,160,${0.7 * fade * flicker})`);
        coreGrd.addColorStop(0.5, `rgba(255,255,255,${0.95 * fade * flicker})`);
        coreGrd.addColorStop(0.7, `rgba(255,240,160,${0.7 * fade * flicker})`);
        coreGrd.addColorStop(1, 'rgba(255,160,0,0)');
        ctx.fillStyle = coreGrd;
        ctx.fillRect(0, fl.pos - fl.beamWidth * 0.45, w, fl.beamWidth * 0.9);
      } else {
        // Outer glow
        const glowGrd = ctx.createLinearGradient(fl.pos - fl.beamWidth * 1.4, 0, fl.pos + fl.beamWidth * 1.4, 0);
        glowGrd.addColorStop(0, 'rgba(255,80,0,0)');
        glowGrd.addColorStop(0.4, `rgba(255,140,0,${0.35 * fade * flicker})`);
        glowGrd.addColorStop(0.5, `rgba(255,220,80,${0.6 * fade * flicker})`);
        glowGrd.addColorStop(0.6, `rgba(255,140,0,${0.35 * fade * flicker})`);
        glowGrd.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = glowGrd;
        ctx.fillRect(fl.pos - fl.beamWidth * 1.4, 0, fl.beamWidth * 2.8, h);

        // Core beam
        const coreGrd = ctx.createLinearGradient(fl.pos - fl.beamWidth * 0.45, 0, fl.pos + fl.beamWidth * 0.45, 0);
        coreGrd.addColorStop(0, 'rgba(255,160,0,0)');
        coreGrd.addColorStop(0.3, `rgba(255,240,160,${0.7 * fade * flicker})`);
        coreGrd.addColorStop(0.5, `rgba(255,255,255,${0.95 * fade * flicker})`);
        coreGrd.addColorStop(0.7, `rgba(255,240,160,${0.7 * fade * flicker})`);
        coreGrd.addColorStop(1, 'rgba(255,160,0,0)');
        ctx.fillStyle = coreGrd;
        ctx.fillRect(fl.pos - fl.beamWidth * 0.45, 0, fl.beamWidth * 0.9, h);
      }

      ctx.restore();

      // Screen flash on first frame of beam
      if (fl.beamTimer < 0.06) {
        ctx.save();
        ctx.globalAlpha = 0.35 * (1 - fl.beamTimer / 0.06);
        ctx.fillStyle = '#fff8e0';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }
  });
}

function playSfxSolarBeam() {
  if (muted || !audioCtx) return;
  try {
    // Low rumble + high pitched zap
    const st = audioCtx.currentTime;
    [
      { freq: 60, type: 'sawtooth', gain: 0.18, dur: 0.6 },
      { freq: 220, type: 'sine', gain: 0.12, dur: 0.4 },
      { freq: 880, type: 'square', gain: 0.06, dur: 0.25 },
    ].forEach(({ freq, type, gain, dur }) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, st);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, st + dur);
      g.gain.setValueAtTime(gain, st);
      g.gain.exponentialRampToValueAtTime(0.001, st + dur);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(st); osc.stop(st + dur);
    });
  } catch (e) { }
}

// ─── BLACK HOLES ───────────────────────────────────────────────
let blackHoles = [];
let blackHoleTimer = 0;

function isPurpleSpaceTheme() {
  return currentBgTheme === SPACE_THEMES[0] ||
    (currentBgTheme && currentBgTheme.circle && currentBgTheme.circle[0] === 147 && currentBgTheme.circle[1] === 51);
}

function isGreenZoneTheme() {
  if (!currentBgTheme) return false;
  return currentBgTheme === SPACE_THEMES[1] ||
    currentBgTheme.name === 'Emerald Nebula' ||
    (currentBgTheme.circle && currentBgTheme.circle[0] === 16 && currentBgTheme.circle[1] === 185);
}

function getBlackHoleInterval(isPurple = isPurpleSpaceTheme()) {
  if (isPurple) {
    // In Purple Space theme: from 15 to 20 seconds
    return 15 + Math.random() * 5;
  }
  // Other themes: MUCH rarer ("намного реже", 45-75 seconds)
  return Math.max(45, 75 - diffLevel * 1.2);
}

function spawnBlackHole(w, h) {
  const margin = 160;
  let x, y, tries = 0;
  do {
    x = margin + Math.random() * (w - margin * 2);
    y = margin + Math.random() * (h - margin * 2);
    tries++;
  } while (rocket && tries < 12 &&
    Math.sqrt((x - rocket.x) ** 2 + (y - rocket.y) ** 2) < 220);

  const intensity = Math.min(1, (diffLevel - 1) / 14);
  const life = 10 + Math.random() * 6; // 10–16 seconds
  blackHoles.push({
    x, y,
    r: 28,                           // visual core radius (increased from 22)
    pullR: 220 + intensity * 90,     // gravity field radius (increased from 170)
    strength: 120 + intensity * 70,  // pull force (px/s²)
    life,
    maxLife: life,
    angle: 0,
    alpha: 0,
  });
}

function spawnEnergyOrbBurst(x, y, r) {
  const [cr, cg, cb] = currentBgTheme ? currentBgTheme.circle : [147, 51, 234];
  const cBright = `rgb(${Math.min(255, cr + 80)}, ${Math.min(255, cg + 80)}, ${Math.min(255, cb + 80)})`;
  // Flash ring matching theme color
  addParticle({
    x, y, vx: 0, vy: 0,
    life: 0.4, maxLife: 0.4,
    size: r * 0.8, maxSize: r * 3.5,
    color: cBright,
    type: 'ring', grav: 0,
  });
  // Plasma spark burst matching theme color
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 / 12) * i + Math.random() * 0.25;
    const spd = 40 + Math.random() * 70;
    const cChoice = [
      `rgb(${cr}, ${cg}, ${cb})`,
      cBright,
      '#ffffff'
    ][i % 3];
    addParticle({
      x, y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      size: 2.8, maxSize: 0.5,
      color: cChoice,
      type: 'dot', grav: 0,
    });
  }
}

function updateBlackHoles(dt) {
  for (let i = blackHoles.length - 1; i >= 0; i--) {
    const bh = blackHoles[i];
    bh.life -= dt;
    bh.angle += dt * 1.8;

    if (bh.life <= 0) {
      // ── Black Hole expires: scatter all captured debris outward from where they are situated at rupture ──
      // "сделай чтобы они в логичную сторону стреляли тип откуда где они стоят при разрыве а не просто в рандомную"
      for (let j = 0; j < obstacles.length; j++) {
        const ob = obstacles[j];
        if (ob.capturedByBH === bh) {
          // Outward vector from black hole center to where the obstacle currently sits
          const dx = ob.x - bh.x;
          const dy = bh.y - bh.y;
          const dist = Math.hypot(dx, dy);

          // Base outward radial angle away from singularity
          let ejectAngle = dist > 1 ? Math.atan2(dy, dx) : (ob.orbitAngle || Math.random() * Math.PI * 2);

          // Add realistic centrifugal sling in the direction of orbit rotation (~18 degrees)
          const orbitDir = ob.orbitDirection || 1;
          ejectAngle += orbitDir * 0.30 + (Math.random() - 0.5) * 0.12;

          const scatterSpd = 280 + Math.random() * 220 + (ob.orbitSpeed || 1) * 35;
          ob.vx = Math.cos(ejectAngle) * scatterSpd;
          ob.vy = Math.sin(ejectAngle) * scatterSpd;

          if (ob.type === 'comet') {
            // Update comet orientation to match outward ejection trajectory
            ob.angle = ejectAngle;
            ob.speed = scatterSpd;
          } else {
            // Asteroids tumble outward with spin preserved
            ob.rotSpeed = orbitDir * (2.2 + Math.random() * 3.8);
          }

          // Explosive debris scatter shockwave and energy orb burst
          spawnExplosion(ob.x, ob.y, ob.type === 'comet' ? 36 : 28);
          spawnEnergyOrbBurst(ob.x, ob.y, ob.r);

          delete ob.capturedByBH;
          delete ob.orbitAngle;
          delete ob.orbitRadius;
          delete ob.orbitSpeed;
          delete ob.orbitDirection;
          delete ob.orbitTime;
        }
      }

      // Handle toxic barrels captured by black hole - smaller explosion (2x smaller)
      if (typeof toxicBarrels !== 'undefined' && toxicBarrels.length > 0) {
        for (let tIdx = toxicBarrels.length - 1; tIdx >= 0; tIdx--) {
          const tb = toxicBarrels[tIdx];
          if (tb.capturedByBH === bh) {
            // Eject barrel outward with smaller explosion
            const dx = tb.x - bh.x;
            const dy = tb.y - bh.y;
            const dist = Math.hypot(dx, dy);
            const ejectAngle = dist > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
            const scatterSpd = 180 + Math.random() * 120;
            tb.vx = Math.cos(ejectAngle) * scatterSpd;
            tb.vy = Math.sin(ejectAngle) * scatterSpd;
            
            // Smaller explosion (2x smaller)
            spawnExplosion(tb.x, tb.y, tb.r * 0.5);
            
            delete tb.capturedByBH;
            delete tb.orbitAngle;
            delete tb.orbitRadius;
            delete tb.orbitSpeed;
            delete tb.orbitDirection;
            delete tb.orbitTime;
          }
        }
      }

      // Check if pirates are caught in the black hole collapse explosion
      if (pirates.length > 0) {
        for (let pIdx = 0; pIdx < pirates.length; pIdx++) {
          const p = pirates[pIdx];
          if (!p.alive || !p.active) continue;
          const pdx = p.x - bh.x, pdy = p.y - bh.y;
          const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pDist < bh.pullR * 0.75) {
            if (pDist < bh.r * 2.2) {
              if (p.hasArmor) spawnShieldBreakEffect(p.x, p.y, p.r);
              p.alive = false;
              spawnExplosion(p.x, p.y, 48);
              score += 5;
              EL.scoreVal.textContent = score;
              spawnFloatingText(p.x, p.y - 20, '+5 SINGULARITY!', '#c084fc');
            } else {
              // Blown outward away from the collapsing singularity
              const blastAngle = (pDist > 1 ? Math.atan2(pdy, pdx) : Math.random() * Math.PI * 2) + (Math.random() - 0.5) * 0.2;
              p.vx += Math.cos(blastAngle) * 360;
              p.vy += Math.sin(blastAngle) * 360;
            }
          }
        }
      }

      // Big cosmic collapse shockwave & sound
      spawnExplosion(bh.x, bh.y, 56);
      playSfxExplosion();
      
      // Death shockwave that kills player if caught (same radius as pull range)
      const shockwaveR = bh.pullR;
      const shockwaveDuration = 0.4;
      dangerZones.push({
        x: bh.x,
        y: bh.y,
        r: shockwaveR,
        life: shockwaveDuration,
        maxLife: shockwaveDuration,
        color: [217, 70, 239], // purple shockwave color
        isBlackHoleWave: true, // flag to distinguish from comet blasts
      });
      
      addParticle({
        x: bh.x, y: bh.y, vx: 0, vy: 0,
        life: 0.65, maxLife: 0.65,
        size: bh.r, maxSize: bh.pullR * 1.5,
        color: '#d946ef',
        type: 'ring', grav: 0,
      });
      if (rocket && rocket.alive) runStats.blackHolesSurvived++;
      blackHoles.splice(i, 1);
      continue;
    }

    // Smooth fade in / fade out
    const fadeIn = Math.min(1, (bh.maxLife - bh.life) * 1.5);
    const fadeOut = Math.min(1, bh.life * 1.2);
    bh.alpha = Math.min(fadeIn, fadeOut);

    // ── Gravity on rocket ──────────────────────────────────
    if (rocket && rocket.alive) {
      const dx = bh.x - rocket.x, dy = bh.y - rocket.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < bh.pullR) {
        // Stronger when closer, player can still fight it
        const falloff = Math.pow(1 - dist / bh.pullR, 1.3);
        const force = falloff * bh.strength * dt;
        rocket.vx += (dx / dist) * force;
        rocket.vy += (dy / dist) * force;
        // Allow a little over-speed but not unlimited
        const spd = Math.sqrt(rocket.vx ** 2 + rocket.vy ** 2);
        if (spd > ROCKET_SPEED * 1.3) {
          rocket.vx = (rocket.vx / spd) * ROCKET_SPEED * 1.3;
          rocket.vy = (rocket.vy / spd) * ROCKET_SPEED * 1.3;
        }
      }
    }

    // ── Gravity & orbital capture for obstacles ────────────
    const CAPTURE_R = bh.pullR * 0.58;

    for (const ob of obstacles) {
      const dx = bh.x - ob.x, dy = bh.y - ob.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      if (ob.capturedByBH === bh) {
        // Already orbiting: update dynamics
        ob.orbitTime = (ob.orbitTime || 0) + dt;
        // Spin up over time ("чем больше времени оно в зоне черной дыры стояло то сильнее раскручивается")
        ob.orbitSpeed = (ob.orbitSpeed || 0.8) + (0.55 + ob.orbitTime * 0.15) * dt;
        ob.orbitSpeed = Math.min(ob.orbitSpeed, 5.2);
        // Expand radius over time ("и радиус также увеличивается")
        ob.orbitRadius = (ob.orbitRadius || dist) + (14 + ob.orbitSpeed * 4) * dt;
        ob.orbitRadius = Math.min(ob.orbitRadius, bh.pullR * 0.86);

        ob.orbitAngle = (ob.orbitAngle || 0) + ob.orbitSpeed * (ob.orbitDirection || 1) * dt;
        ob.x = bh.x + Math.cos(ob.orbitAngle) * ob.orbitRadius;
        ob.y = bh.y + Math.sin(ob.orbitAngle) * ob.orbitRadius;
        ob.vx = 0;
        ob.vy = 0;
        ob.rotation = (ob.rotation || 0) + ob.orbitSpeed * dt * 2.2;

        // Particle trail while orbiting: if comet, emit sparkling plasma particles matching location theme!
        if (Math.random() < 0.35) {
          const isComet = ob.type === 'comet';
          const [tcr, tcg, tcb] = currentBgTheme ? currentBgTheme.circle : [147, 51, 234];
          let pColor;
          if (isComet) {
            // Strictly match theme color!
            const pick = Math.random();
            if (pick < 0.5) {
              pColor = `rgb(${tcr}, ${tcg}, ${tcb})`;
            } else if (pick < 0.82) {
              pColor = `rgb(${Math.min(255, tcr + 85)}, ${Math.min(255, tcg + 85)}, ${Math.min(255, tcb + 85)})`;
            } else {
              pColor = '#ffffff'; // white-hot energy spark
            }
          } else {
            pColor = `rgba(${Math.min(255, tcr + 30)}, ${Math.min(255, tcg + 30)}, ${Math.min(255, tcb + 30)}, 0.8)`;
          }

          addParticle({
            x: ob.x + (Math.random() - 0.5) * ob.r,
            y: ob.y + (Math.random() - 0.5) * ob.r,
            vx: -Math.sin(ob.orbitAngle) * ob.orbitSpeed * (isComet ? 32 : 25) + (Math.random() - 0.5) * 15,
            vy: Math.cos(ob.orbitAngle) * ob.orbitSpeed * (isComet ? 32 : 25) + (Math.random() - 0.5) * 15,
            life: isComet ? 0.38 : 0.25,
            maxLife: isComet ? 0.38 : 0.25,
            size: isComet ? 3.2 : 2.2,
            maxSize: 0.5,
            color: pColor,
            type: 'dot',
            grav: 0,
          });
        }
      } else if (!ob.capturedByBH && dist < CAPTURE_R) {
        // Enters orbit around the black hole ("по началу слабо")
        ob.capturedByBH = bh;
        ob.orbitAngle = Math.atan2(ob.y - bh.y, ob.x - bh.x);
        ob.orbitRadius = Math.max(bh.r * 2.2, dist);
        ob.orbitSpeed = 0.8 + Math.random() * 0.4;
        ob.orbitDirection = 1;
        ob.orbitTime = 0;
        if (ob.type === 'comet') {
          spawnEnergyOrbBurst(ob.x, ob.y, ob.r);
        }
      } else if (!ob.capturedByBH && dist < bh.pullR) {
        // In gravity zone: pull toward BH
        const falloff = Math.pow(1 - dist / bh.pullR, 1.2);
        const force = falloff * bh.strength * 1.2 * dt;
        ob.vx += (dx / dist) * force;
        ob.vy += (dy / dist) * force;
      }
    }
  }
}

function drawBlackHole(ctx, bh) {
  const t = performance.now() / 1000;
  const a = bh.alpha;
  ctx.save();

  // Pull-field hint (very subtle purple wash)
  const fieldGrd = ctx.createRadialGradient(bh.x, bh.y, bh.r, bh.x, bh.y, bh.pullR);
  fieldGrd.addColorStop(0, `rgba(80, 0, 160, ${0.10 * a})`);
  fieldGrd.addColorStop(0.5, `rgba(40, 0, 100, ${0.05 * a})`);
  fieldGrd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = fieldGrd;
  ctx.beginPath();
  ctx.arc(bh.x, bh.y, bh.pullR, 0, Math.PI * 2);
  ctx.fill();

  // Accretion disk (3 squished rotating rings)
  const diskColors = [
    `hsl(${290 + t * 25 % 60}, 100%, 65%)`,
    `hsl(${260 + t * 18 % 50}, 90%,  50%)`,
    `hsl(${230 + t * 12 % 40}, 80%,  40%)`,
  ];
  for (let ring = 2; ring >= 0; ring--) {
    const rr = bh.r * (1.8 + ring * 1.0);
    const dir = ring % 2 === 0 ? 1 : -1;
    const speed = 0.9 - ring * 0.2;
    ctx.save();
    ctx.translate(bh.x, bh.y);
    ctx.rotate(bh.angle * dir * speed);
    ctx.scale(1, 0.28 + ring * 0.06);
    ctx.globalAlpha = (0.55 - ring * 0.12) * a;
    const dg = ctx.createRadialGradient(0, 0, rr * 0.55, 0, 0, rr);
    dg.addColorStop(0, diskColors[ring]);
    dg.addColorStop(0.6, diskColors[(ring + 1) % 3]);
    dg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Outer purple glow halo
  ctx.globalAlpha = 0.35 * a;
  const halo = ctx.createRadialGradient(bh.x, bh.y, bh.r * 0.5, bh.x, bh.y, bh.r * 3.5);
  halo.addColorStop(0, 'rgba(140, 40, 255, 0.7)');
  halo.addColorStop(0.5, 'rgba(80,  10, 180, 0.25)');
  halo.addColorStop(1, 'rgba(0,   0,   0,  0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(bh.x, bh.y, bh.r * 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Solid black core
  ctx.globalAlpha = a;
  const core = ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, bh.r * 1.3);
  core.addColorStop(0, '#000000');
  core.addColorStop(0.75, '#050008');
  core.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(bh.x, bh.y, bh.r * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Event-horizon shimmer ring
  ctx.globalAlpha = (0.7 + 0.3 * Math.sin(t * 5)) * a;
  ctx.strokeStyle = `hsl(${280 + Math.sin(t * 3) * 20}, 100%, 70%)`;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#cc55ff';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(bh.x, bh.y, bh.r, 0, Math.PI * 2);
  ctx.stroke();

  // Control inversion danger perimeter ring (dashed shimmering magenta-cyan anomaly ring)
  const invertR = Math.max(bh.r * 3.5, bh.pullR * 0.52);
  ctx.save();
  ctx.globalAlpha = (0.35 + 0.18 * Math.sin(t * 5)) * a;
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 6]);
  ctx.lineDashOffset = -t * 26;
  ctx.beginPath();
  ctx.arc(bh.x, bh.y, invertR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.restore();
}

// ─── Control Inversion HUD Warning Pill ───────────────────────
function drawControlInversionHUD(ctx, w, h) {
  const t = performance.now() / 1000;
  const pulse = 0.78 + 0.22 * Math.sin(t * 12);
  ctx.save();
  ctx.globalAlpha = pulse;

  const bw = 240;
  const bh = 24;
  const bx = (w - bw) / 2;
  const by = Math.max(48, topSafeY);

  // Background capsule
  ctx.fillStyle = 'rgba(24, 6, 36, 0.88)';
  ctx.strokeStyle = '#d946ef';
  ctx.lineWidth = 1.6;
  ctx.shadowColor = '#d946ef';
  ctx.shadowBlur = 12;

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, bw, bh, 6);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.fill();
  ctx.stroke();

  // Warning text
  ctx.font = '7.5px "Press Start 2P", monospace';
  ctx.fillStyle = '#fdf4ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur = 7;
  ctx.fillText('⚠ CONTROLS INVERTED ⚠', w / 2, by + bh / 2 + 1);

  ctx.restore();
}


// ===============================================================
//  CRIMSON PULSAR � SOLAR PUSH WAVE
// ===============================================================
// A wall of solar plasma sweeps the ENTIRE screen every 15-25s.
// Direction: randomly LEFT->RIGHT, RIGHT->LEFT, TOP->BOTTOM, BOTTOM->TOP.
// Physics:
//   * While the wave front overlaps an entity, apply a strong push force.
//   * Rocket must fight back at max speed; weaker push still carries toward edge.
//   * Obstacles & pirates get velocity-blended toward wave direction.
//   * If rocket exits screen -> die.
// Phases:
//   WARNING  (2.5s): Pulsing red glow from source edge + HUD arrow/countdown.
//   SWEEPING : Wave body crosses the screen at PUSH_WAVE_SPEED px/s.
//   DONE: pushWave = null, interval resets to 15-25s.
// ---------------------------------------------------------------

const PUSH_WAVE_SPEED    = 600;  // px/s wave front travel speed (fast but survivable)
// At 800 the wave out-pushed a rocket thrusting fully against it and carried it
// off-screen; at 650 a player who counters survives, a passive one still doesn't
const PUSH_DRIFT_SPEED   = 650;  // px/s direct position displacement on rocket (strong but counterable)
const PUSH_IMPULSE       = 400;  // px/s velocity bias added to rocket (strong but counterable)
const PUSH_OBSTACLE_SPD  = 700;  // px/s displacement & target speed for obstacles
const PUSH_PIRATE_SPD    = 750;  // px/s displacement on pirates
const PUSH_WARN_DURATION = 2.5;  // seconds of warning before wave launches

function spawnPushWave(w, h) {
  const edge = Math.floor(Math.random() * 4);
  let dir, totalDist;
  switch (edge) {
    case 0: dir = { dx: 1,  dy: 0 }; totalDist = w; break;
    case 1: dir = { dx:-1,  dy: 0 }; totalDist = w; break;
    case 2: dir = { dx: 0,  dy: 1 }; totalDist = h; break;
    case 3: dir = { dx: 0, dy:-1  }; totalDist = h; break;
  }
  pushWave = {
    edge,
    dir,
    totalDist,
    frontPos: 0,
    warnTimer: 0,
    state: 'WARNING',
    dissipateTimer: 0,
    dissipateDuration: 0.8
  };
  playSfxEventAlert();
}

function spawnPushWaveSparks(x, y, dir) {
  if (typeof addParticle !== 'function') return;
  const colors = ['#ffffff', '#fde047', '#ff8800', '#ef4444'];
  const col = colors[Math.floor(Math.random() * colors.length)];
  addParticle({
    x: x + (Math.random() - 0.5) * 16,
    y: y + (Math.random() - 0.5) * 16,
    vx: dir.dx * 120 + (Math.random() - 0.5) * 90,
    vy: dir.dy * 120 + (Math.random() - 0.5) * 90,
    life: 0.2 + Math.random() * 0.35,
    maxLife: 0.5,
    r: 1.5 + Math.random() * 2,
    color: col,
    trail: false
  });
}

function updatePushWave(dt, w, h) {
  if (!pushWave) return;
  const pw = pushWave;

  function getEntityPos(ent) {
    switch (pw.edge) {
      case 0: return ent.x;
      case 1: return w - ent.x;
      case 2: return ent.y;
      case 3: return h - ent.y;
    }
  }

  if (pw.state === 'WARNING') {
    pw.warnTimer += dt;
    if (pw.warnTimer >= PUSH_WARN_DURATION) {
      pw.state = 'SWEEPING';
      pw.frontPos = 0;
      if (audioCtx && !muted) {
        try {
          const st = audioCtx.currentTime;
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(95, st);
          osc.frequency.exponentialRampToValueAtTime(32, st + 1.2);
          g.gain.setValueAtTime(0.35, st);
          g.gain.exponentialRampToValueAtTime(0.001, st + 1.2);
          osc.connect(g);
          g.connect(audioCtx.destination);
          osc.start(st);
          osc.stop(st + 1.2);
        } catch (e) { }
      }
    }
    return;
  }

  if (pw.state === 'SWEEPING') {
    const waveTravelSpeed = Math.max(PUSH_WAVE_SPEED, pw.totalDist / 2.3);
    pw.frontPos += waveTravelSpeed * dt;

    // Rocket interaction:
    if (rocket && rocket.alive) {
      const rPos = getEntityPos(rocket);
      // Once the wave front reaches or passes the rocket, the rocket is engulfed in the storm
      if (rPos <= pw.frontPos + 40) {
        rocket.x += pw.dir.dx * PUSH_DRIFT_SPEED * dt;
        rocket.y += pw.dir.dy * PUSH_DRIFT_SPEED * dt;
        rocket.vx += pw.dir.dx * PUSH_IMPULSE * dt;
        rocket.vy += pw.dir.dy * PUSH_IMPULSE * dt;
        if (typeof screenShake !== 'undefined') screenShake = Math.max(screenShake, 3.2);
        if (Math.random() < 0.45) {
          spawnPushWaveSparks(rocket.x, rocket.y, pw.dir);
        }
      }
    }

    // Obstacles interaction: blown and redirected in the wave's direction
    // Comets in Crimson Pulsar transform into energy orbs when hit by solar wave
    for (let i = 0; i < obstacles.length; i++) {
      const ob = obstacles[i];
      const oPos = getEntityPos(ob);
      if (oPos <= pw.frontPos + 40) {
        // Transform comets into energy orbs in Crimson Pulsar
        if (ob.type === 'comet' && typeof isCrimsonTheme === 'function' && isCrimsonTheme() && !ob.capturedByBH) {
          ob.capturedByBH = true; // reuse this flag to mark as energy orb
          ob.wasComet = true; // mark that it was originally a comet
        }
        
        ob.x += pw.dir.dx * PUSH_OBSTACLE_SPD * dt;
        ob.y += pw.dir.dy * PUSH_OBSTACLE_SPD * dt;
        const blend = Math.min(1, dt * 3.5);
        ob.vx = ob.vx * (1 - blend) + pw.dir.dx * PUSH_OBSTACLE_SPD * blend;
        ob.vy = ob.vy * (1 - blend) + pw.dir.dy * PUSH_OBSTACLE_SPD * blend;
      }
    }

    // Pirates interaction: the storm strips shields and blows pirates along. Any
    // pirate that leaves the map after being hit explodes; one that somehow still
    // has a shield braces at the edge. (Pirates flying in from off-screen are not affected.)
    for (let i = 0; i < pirates.length; i++) {
      const p = pirates[i];
      if (!p.alive || !p.active) continue;
      const pPos = getEntityPos(p);
      if (pPos <= pw.frontPos + 40) {
        if (p.hasArmor) {
          p.hasArmor = false;
          p.armor = 0;
          spawnShieldBreakEffect(p.x, p.y, p.r);
          spawnFloatingText(p.x, p.y - 20, 'SHIELD BURNED!', '#38bdf8');
        }
        if (p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h) p.stormBlown = true;
        p.x += pw.dir.dx * PUSH_PIRATE_SPD * dt;
        p.y += pw.dir.dy * PUSH_PIRATE_SPD * dt;
        const pBlend = Math.min(1, dt * 2.8);
        p.vx = (p.vx || 0) * (1 - pBlend) + pw.dir.dx * 280 * pBlend;
        p.vy = (p.vy || 0) * (1 - pBlend) + pw.dir.dy * 280 * pBlend;
      }

      if (p.stormBlown && (p.x < 0 || p.x > w || p.y < 0 || p.y > h)) {
        if (p.hasArmor) {
          p.x = Math.max(p.r, Math.min(w - p.r, p.x));
          p.y = Math.max(p.r, Math.min(h - p.r, p.y));
        } else {
          p.alive = false;
          playSfxExplosion();
          spawnExplosion(Math.max(0, Math.min(w, p.x)), Math.max(0, Math.min(h, p.y)), p.r * 2);
          score += 3;
          EL.scoreVal.textContent = score;
          spawnFloatingText(Math.max(20, Math.min(w - 20, p.x)), Math.max(20, Math.min(h - 20, p.y)), '+3 SOLAR BLAST!', '#ef4444');
        }
      }
    }

    // Front crossed the entire field -> transition to dissipating
    if (pw.frontPos >= pw.totalDist) {
      pw.state = 'DISSIPATING';
      if (rocket && rocket.alive) runStats.wavesSurvived++;
      pw.dissipateTimer = 0;
    }
    return;
  }

  if (pw.state === 'DISSIPATING') {
    pw.dissipateTimer += dt;
    const remAlpha = Math.max(0, 1 - pw.dissipateTimer / pw.dissipateDuration);

    if (rocket && rocket.alive) {
      rocket.x += pw.dir.dx * (PUSH_DRIFT_SPEED * 0.3 * remAlpha) * dt;
      rocket.y += pw.dir.dy * (PUSH_DRIFT_SPEED * 0.3 * remAlpha) * dt;
    }

    if (pw.dissipateTimer >= pw.dissipateDuration) {
      pushWave = null;
      pushWaveTimer = 0;
      pushWaveInterval = 15 + Math.random() * 10;
    }
  }
}

function drawPushWave(ctx, w, h) {
  if (!pushWave) return;
  const pw = pushWave;
  const t = performance.now() / 1000;

  if (pw.state === 'WARNING') {
    const progress = pw.warnTimer / PUSH_WARN_DURATION;
    const pulse = 0.5 + 0.5 * Math.abs(Math.sin(t * 7));
    const alpha = Math.min(1, progress * 2.5) * pulse;
    const warnDepth = 110 + 70 * progress;

    ctx.save();
    let grd;
    switch (pw.edge) {
      case 0: grd = ctx.createLinearGradient(0, 0, warnDepth, 0); break;
      case 1: grd = ctx.createLinearGradient(w, 0, w - warnDepth, 0); break;
      case 2: grd = ctx.createLinearGradient(0, 0, 0, warnDepth); break;
      case 3: grd = ctx.createLinearGradient(0, h, 0, h - warnDepth); break;
    }
    grd.addColorStop(0, 'rgba(239,68,68,0.95)');
    grd.addColorStop(0.45, 'rgba(251,146,60,0.55)');
    grd.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = grd;
    switch (pw.edge) {
      case 0: ctx.fillRect(0, 0, warnDepth, h); break;
      case 1: ctx.fillRect(w - warnDepth, 0, warnDepth, h); break;
      case 2: ctx.fillRect(0, 0, w, warnDepth); break;
      case 3: ctx.fillRect(0, h - warnDepth, w, warnDepth); break;
    }

    // Glowing dashed laser boundary
    ctx.globalAlpha = pulse * 0.95;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 18;
    ctx.setLineDash([14, 8]);
    ctx.lineDashOffset = -t * 75;
    ctx.beginPath();
    switch (pw.edge) {
      case 0: ctx.moveTo(4, 0); ctx.lineTo(4, h); break;
      case 1: ctx.moveTo(w - 4, 0); ctx.lineTo(w - 4, h); break;
      case 2: ctx.moveTo(0, 4); ctx.lineTo(w, 4); break;
      case 3: ctx.moveTo(0, h - 4); ctx.lineTo(w, h - 4); break;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  if (pw.state === 'SWEEPING' || pw.state === 'DISSIPATING') {
    const isDiss = pw.state === 'DISSIPATING';
    const baseAlpha = isDiss ? Math.max(0, 1 - pw.dissipateTimer / pw.dissipateDuration) : 1;
    const fp = isDiss ? pw.totalDist : Math.min(pw.totalDist, pw.frontPos);
    const flicker = 0.88 + 0.12 * Math.sin(t * 30);

    ctx.save();
    // 1. Engulfed field overlay
    let grd;
    switch (pw.edge) {
      case 0: grd = ctx.createLinearGradient(0, 0, fp, 0); break;
      case 1: grd = ctx.createLinearGradient(w, 0, w - fp, 0); break;
      case 2: grd = ctx.createLinearGradient(0, 0, 0, fp); break;
      case 3: grd = ctx.createLinearGradient(0, h, 0, h - fp); break;
    }
    const stormAlpha = 0.32 * baseAlpha * flicker;
    grd.addColorStop(0, 'rgba(239,68,68,' + (stormAlpha * 0.6) + ')');
    grd.addColorStop(0.5, 'rgba(251,146,60,' + (stormAlpha * 0.8) + ')');
    grd.addColorStop(0.9, 'rgba(254,240,138,' + stormAlpha + ')');
    grd.addColorStop(1, 'rgba(255,255,255,' + (stormAlpha * 1.2) + ')');
    ctx.fillStyle = grd;
    switch (pw.edge) {
      case 0: ctx.fillRect(0, 0, fp, h); break;
      case 1: ctx.fillRect(w - fp, 0, fp, h); break;
      case 2: ctx.fillRect(0, 0, w, fp); break;
      case 3: ctx.fillRect(0, h - fp, w, fp); break;
    }

    // 2. Solar wind streaks inside the engulfed field
    ctx.save();
    ctx.globalAlpha = 0.45 * baseAlpha * flicker;
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    const streakCount = 14;
    for (let k = 0; k < streakCount; k++) {
      const offset = (t * 700 + k * 137) % (fp + 100);
      if (offset > fp) continue;
      ctx.beginPath();
      if (pw.edge === 0 || pw.edge === 1) {
        const sy = ((k * 97) % h);
        const sx = pw.edge === 0 ? offset : w - offset;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + pw.dir.dx * 35, sy);
      } else {
        const sx = ((k * 97) % w);
        const sy = pw.edge === 2 ? offset : h - offset;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy + pw.dir.dy * 35);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 3. Shockwave Front Crest (only while sweeping)
    if (!isDiss) {
      ctx.globalAlpha = 0.95 * flicker;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4.5;
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 32;
      ctx.beginPath();
      switch (pw.edge) {
        case 0: ctx.moveTo(fp, 0); ctx.lineTo(fp, h); break;
        case 1: ctx.moveTo(w - fp, 0); ctx.lineTo(w - fp, h); break;
        case 2: ctx.moveTo(0, fp); ctx.lineTo(w, fp); break;
        case 3: ctx.moveTo(0, h - fp); ctx.lineTo(w, h - fp); break;
      }
      ctx.stroke();

      // Outer crimson shock aura
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 9;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 24;
      ctx.globalAlpha = 0.55 * flicker;
      ctx.beginPath();
      switch (pw.edge) {
        case 0: ctx.moveTo(fp, 0); ctx.lineTo(fp, h); break;
        case 1: ctx.moveTo(w - fp, 0); ctx.lineTo(w - fp, h); break;
        case 2: ctx.moveTo(0, fp); ctx.lineTo(w, fp); break;
        case 3: ctx.moveTo(0, h - fp); ctx.lineTo(w, h - fp); break;
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawPushWaveHUD(ctx, w, h) {
  if (!pushWave) return;
  const pw = pushWave;
  const t = performance.now() / 1000;
  const pulse = 0.65 + 0.35 * Math.abs(Math.sin(t * 6));

  const escapeLabels = [
    '← FULL THRUST LEFT!',
    'FULL THRUST RIGHT! →',
    '↑ FULL THRUST UP!',
    'FULL THRUST DOWN! ↓'
  ];
  const dirLabels = [
    'SOLAR WAVE FROM THE LEFT →',
    '← SOLAR WAVE FROM THE RIGHT',
    'SOLAR WAVE FROM ABOVE ↓',
    '↑ SOLAR WAVE FROM BELOW'
  ];

  const escapeLabel = escapeLabels[pw.edge];
  const dirLabel = dirLabels[pw.edge];

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const boxW = Math.min(420, w - 24);
  const boxH = 50;
  const boxX = (w - boxW) / 2;
  // Below the SCORE/LEVEL HUD (it used to cover the level value), and below an
  // active event pill if there is one
  const pillActive = activeEvent && (activeEvent.type === 'AXIS_INVERSION' || activeEvent.type === 'GRAVITY_SHIFT');
  const pillBottom = Math.max(64, topSafeY) + 34;
  const boxY = pillActive ? pillBottom + 8 : hudBottomY + 4;

  ctx.fillStyle = 'rgba(20, 5, 8, 0.88)';
  ctx.strokeStyle = pw.state === 'SWEEPING' ? 'rgba(254, 240, 138, ' + pulse + ')' : 'rgba(239, 68, 68, ' + pulse + ')';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, 8);
  else ctx.rect(boxX, boxY, boxW, boxH);
  ctx.fill();
  ctx.stroke();

  if (pw.state === 'WARNING') {
    const secsLeft = Math.max(0, PUSH_WARN_DURATION - pw.warnTimer).toFixed(1);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(255, 120, 100, ' + pulse + ')';
    ctx.fillText('\u26a0 ' + dirLabel + ' \u26a0', w / 2, boxY + 16);

    ctx.font = '7.5px "Press Start 2P", monospace';
    ctx.shadowColor = '#f59e0b';
    ctx.fillStyle = 'rgba(254, 240, 138, ' + pulse + ')';
    ctx.fillText(escapeLabel, w / 2, boxY + 34);

    // Countdown badge
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#f43f5e';
    ctx.fillText(secsLeft + 's', boxX + boxW - 28, boxY + 16);
  } else if (pw.state === 'SWEEPING' || pw.state === 'DISSIPATING') {
    ctx.font = '8.5px "Press Start 2P", monospace';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(254, 240, 138, ' + pulse + ')';
    ctx.fillText('⚡ SOLAR STORM! ⚡', w / 2, boxY + 16);

    ctx.font = '7.5px "Press Start 2P", monospace';
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = 'rgba(255, 150, 130, ' + pulse + ')';
    ctx.fillText(escapeLabel, w / 2, boxY + 34);
  }

  ctx.restore();
}